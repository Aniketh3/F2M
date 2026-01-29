import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import blockchainService from '../services/blockchainService';

const OrdersScreenWithBlockchain = ({ userType = 'buyer' }) => {
  // Local form state
  const [sellItems, setSellItems] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  // Blockchain state
  const [blockchainReady, setBlockchainReady] = useState(false);
  const [escrows, setEscrows] = useState([]);
  const [loadingEscrows, setLoadingEscrows] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // User's wallet address (should come from auth context)
  const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Hardhat test account

  useEffect(() => {
    checkBlockchainStatus();
  }, []);

  const checkBlockchainStatus = async () => {
    try {
      await blockchainService.getBlockchainStatus();
      setBlockchainReady(true);
    } catch (error) {
      console.warn('Blockchain not available:', error.message);
      setBlockchainReady(false);
    }
  };

  // Example: Load escrows from backend (in real app, would fetch from database)
  const loadEscrowsFromBackend = async () => {
    setLoadingEscrows(true);
    try {
      // This is a mock - in real app, you'd fetch from your backend database
      // const response = await axios.get(`${backend}/escrows?user=${userAddress}`);
      // setEscrows(response.data);
      console.log('Escrows would be loaded from backend');
    } catch (error) {
      Alert.alert('Error', 'Failed to load escrows');
    } finally {
      setLoadingEscrows(false);
    }
  };

  // Fetch escrow status from blockchain
  const fetchEscrowStatus = async (escrowAddress) => {
    try {
      setProcessingAction(true);
      const status = await blockchainService.getEscrowStatus(escrowAddress);
      Alert.alert('Escrow Status', `Status: ${status.status}\nBalance: ${status.balanceEther} ETH`);
      return status;
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle accept agreement (farmer only)
  const handleAcceptAgreement = async (escrowAddress) => {
    if (!blockchainReady) {
      Alert.alert('Error', 'Blockchain is not connected');
      return;
    }

    Alert.alert('Confirm', 'Accept this agreement?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            setProcessingAction(true);
            const result = await blockchainService.acceptAgreement(escrowAddress);
            Alert.alert('Success', `Agreement accepted!\nTx: ${result.txHash.substring(0, 10)}...`);
            setSelectedEscrow(null);
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  // Handle deposit funds (buyer only)
  const handleDepositFunds = async (escrowAddress, amountEther) => {
    if (!blockchainReady) {
      Alert.alert('Error', 'Blockchain is not connected');
      return;
    }

    if (!amountEther) {
      Alert.alert('Error', 'Please enter amount to deposit');
      return;
    }

    Alert.alert('Confirm', `Deposit ${amountEther} ETH?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Deposit',
        onPress: async () => {
          try {
            setProcessingAction(true);
            const result = await blockchainService.depositFunds(escrowAddress, parseFloat(amountEther));
            Alert.alert('Success', `Funds deposited!\nTx: ${result.txHash.substring(0, 10)}...`);
            setSelectedEscrow(null);
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  // Handle mark as delivered (farmer only)
  const handleMarkDelivered = async (escrowAddress) => {
    if (!blockchainReady) {
      Alert.alert('Error', 'Blockchain is not connected');
      return;
    }

    Alert.alert('Confirm', 'Mark order as delivered?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setProcessingAction(true);
            const result = await blockchainService.markAsDelivered(escrowAddress);
            Alert.alert('Success', `Marked as delivered!\nTx: ${result.txHash.substring(0, 10)}...`);
            setSelectedEscrow(null);
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  // Handle confirm delivery (buyer only)
  const handleConfirmDelivery = async (escrowAddress) => {
    if (!blockchainReady) {
      Alert.alert('Error', 'Blockchain is not connected');
      return;
    }

    Alert.alert('Confirm', 'Confirm delivery and release funds?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setProcessingAction(true);
            const result = await blockchainService.confirmDelivery(escrowAddress);
            Alert.alert('Success', `Delivery confirmed!\nTx: ${result.txHash.substring(0, 10)}...`);
            setSelectedEscrow(null);
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  // Handle reject delivery (buyer only)
  const handleRejectDelivery = async (escrowAddress) => {
    if (!blockchainReady) {
      Alert.alert('Error', 'Blockchain is not connected');
      return;
    }

    Alert.prompt('Rejection Reason', 'Why are you rejecting this delivery?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Reject',
        onPress: async reason => {
          if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason');
            return;
          }
          try {
            setProcessingAction(true);
            const result = await blockchainService.rejectDelivery(escrowAddress, reason);
            Alert.alert('Success', `Delivery rejected!\nTx: ${result.txHash.substring(0, 10)}...`);
            setSelectedEscrow(null);
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  // Handle regular order submission
  const handleOrder = () => {
    const total = parseFloat(sellQuantity) * parseFloat(saleAmount);
    setTotalAmount(total.toString());
    Alert.alert('Order Submitted', 'Your order has been submitted successfully!');
    // Clear form
    setSellItems('');
    setSellQuantity('');
    setSaleAmount('');
  };

  // Mock render for escrow actions based on user type
  const renderEscrowActions = () => {
    if (!selectedEscrow) return null;

    return (
      <View style={styles.actionPanel}>
        <Text style={styles.actionTitle}>Available Actions</Text>

        {/* Farmer Actions */}
        {userType === 'farmer' && (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAcceptAgreement(selectedEscrow.address)}
              disabled={processingAction || selectedEscrow.status !== 'Created'}
            >
              <Text style={styles.actionBtnText}>Accept Agreement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleMarkDelivered(selectedEscrow.address)}
              disabled={processingAction || selectedEscrow.status !== 'Active'}
            >
              <Text style={styles.actionBtnText}>Mark as Delivered</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Buyer Actions */}
        {userType === 'buyer' && (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                // Would open deposit amount input
                Alert.prompt('Deposit Amount', 'Enter amount in ETH', [
                  { text: 'Cancel' },
                  {
                    text: 'Deposit',
                    onPress: amount => handleDepositFunds(selectedEscrow.address, amount),
                  },
                ]);
              }}
              disabled={processingAction || selectedEscrow.status !== 'Active'}
            >
              <Text style={styles.actionBtnText}>Deposit Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleConfirmDelivery(selectedEscrow.address)}
              disabled={processingAction || selectedEscrow.status !== 'Delivered'}
            >
              <Text style={styles.actionBtnText}>Confirm Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleRejectDelivery(selectedEscrow.address)}
              disabled={processingAction || selectedEscrow.status !== 'Delivered'}
            >
              <Text style={styles.actionBtnText}>Reject Delivery</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Common Actions */}
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => fetchEscrowStatus(selectedEscrow.address)}
          disabled={processingAction}
        >
          {processingAction ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionBtnText}>Check Status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => setSelectedEscrow(null)}
        >
          <Text style={styles.actionBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Orders</Text>

      {/* Blockchain Status */}
      <View style={[styles.statusBar, blockchainReady ? styles.statusReady : styles.statusError]}>
        <Text style={styles.statusText}>
          {blockchainReady ? '✓ Blockchain Ready' : '⚠ Blockchain Offline'}
        </Text>
      </View>

      {/* Traditional Order Form (Original Functionality) */}
      <Text style={styles.sectionTitle}>Submit New Order</Text>
      <TextInput
        style={styles.input}
        placeholder="Sell Items"
        value={sellItems}
        onChangeText={setSellItems}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Sell Quantity (in kgs)"
        value={sellQuantity}
        onChangeText={setSellQuantity}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Sale Amount (in Rs)"
        value={saleAmount}
        onChangeText={setSaleAmount}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleOrder}>
          <Text style={styles.submitButtonText}>Submit Order</Text>
        </TouchableOpacity>
      </View>
      {totalAmount !== '' && (
        <Text style={styles.totalAmountText}>Total Amount: ₹{totalAmount}</Text>
      )}

      {/* Blockchain Escrows Section */}
      <Text style={styles.sectionTitle}>Escrow Agreements (Blockchain)</Text>

      {loadingEscrows && <ActivityIndicator size="large" color="#3A5A40" />}

      {!loadingEscrows && escrows.length === 0 && (
        <Text style={styles.emptyText}>
          No active escrow agreements yet. Create one from the marketplace!
        </Text>
      )}

      {/* Sample Escrow Display (in real app, would list actual escrows) */}
      <View style={styles.sampleEscrow}>
        <Text style={styles.sampleText}>
          Escrow agreements created from the marketplace will appear here with blockchain
          integration.
        </Text>
      </View>

      {/* Escrow Actions Panel */}
      {renderEscrowActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 15,
  },
  statusBar: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusReady: {
    backgroundColor: '#D4EDDA',
  },
  statusError: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A5A40',
    marginTop: 20,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#3A5A40',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#FFF',
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#3A5A40',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginVertical: 20,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  sampleEscrow: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3A5A40',
  },
  sampleText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  actionPanel: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#3A5A40',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#3A5A40',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectBtn: {
    backgroundColor: '#D32F2F',
  },
  statusBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  closeBtn: {
    backgroundColor: '#999',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default OrdersScreenWithBlockchain;
