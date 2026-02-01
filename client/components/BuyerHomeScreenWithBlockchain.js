import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import blockchainService from '../services/blockchainService';

const BuyerHomeScreenWithBlockchain = () => {
  const [market, setMarket] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Blockchain state
  const [blockchainReady, setBlockchainReady] = useState(false);
  const [creatingEscrow, setCreatingEscrow] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [escrowForm, setEscrowForm] = useState({
    quantity: '',
    priceInEther: '',
    deliveryDeadlineDays: '7',
    penaltyPercent: '10',
  });

  const backend = 'http://10.140.10.251:3000';
  
  // Buyer's wallet address (should come from login/auth context in real app)
  const buyerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Hardhat test account

  // Check blockchain connection on mount
  useEffect(() => {
    checkBlockchainStatus();
    fetchMarket();
  }, []);

  const checkBlockchainStatus = async () => {
    try {
      const status = await blockchainService.getBlockchainStatus();
      console.log('Blockchain Status:', status);
      setBlockchainReady(true);
    } catch (error) {
      console.warn('Blockchain not available:', error.message);
      setBlockchainReady(false);
    }
  };

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backend}/market-view`);
      setMarket(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch market data.');
    } finally {
      setLoading(false);
    }
  };

  const capitalizeWords = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

  const fetchPrediction = async (variety, orderId) => {
    if (!variety) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    try {
      const res = await axios.post('https://farm2market-ai-predictor.onrender.com/predict-price', {
        produce: 'Vegetables',
        variety: capitalizeWords(variety),
        date: dateStr,
      });
      setPredictions(prev => ({ ...prev, [orderId]: res.data }));
    } catch (e) {
      setPredictions(prev => ({ ...prev, [orderId]: { error: 'Prediction unavailable' } }));
    }
  };

  useEffect(() => {
    const fetchAllPredictions = async () => {
      for (const seller of market) {
        if (seller.MySellList && seller.MySellList.length > 0) {
          for (const sell of seller.MySellList) {
            if (!predictions[sell.OrderID]) {
              await fetchPrediction(sell.SellItem, sell.OrderID);
            }
          }
        }
      }
    };
    if (market.length > 0) {
      fetchAllPredictions();
    }
  }, [market]);

  const handleSearch = async () => {
    if (!search) {
      fetchMarket();
      return;
    }
    setSearching(true);
    try {
      const res = await axios.post(`${backend}/market-search`, { item: search });
      setMarket(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Could not search market.');
    } finally {
      setSearching(false);
    }
  };

  // Create escrow agreement with farmer
  const handleCreateEscrow = async (sellerName, produceType) => {
    if (!blockchainReady) {
      Alert.alert('Error', 'Blockchain is not connected. Please try again later.');
      return;
    }

    if (!escrowForm.quantity || !escrowForm.priceInEther || !escrowForm.deliveryDeadlineDays) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setCreatingEscrow(true);
    try {
      // In a real app, get farmer address from seller data or contract
      const farmerAddress = '0x70997970C51812e339D9B73b0245ad59cc793a05'; // Hardhat test account
      
      const escrowData = {
        farmerAddress,
        quantity: parseInt(escrowForm.quantity),
        produceType,
        priceInEther: parseFloat(escrowForm.priceInEther),
        deliveryDeadlineDays: parseInt(escrowForm.deliveryDeadlineDays),
        penaltyPercent: parseInt(escrowForm.penaltyPercent),
      };

      const result = await blockchainService.createEscrow(escrowData);

      Alert.alert('Success', `Escrow created!\nAddress: ${result.escrowAddress}\nTx: ${result.txHash.substring(0, 10)}...`);
      
      // Reset form
      setEscrowForm({
        quantity: '',
        priceInEther: '',
        deliveryDeadlineDays: '7',
        penaltyPercent: '10',
      });
      setSelectedSeller(null);

      // Optionally, save escrow address to database or context
      console.log('Escrow created:', result);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCreatingEscrow(false);
    }
  };

  const renderMarket = ({ item }) => (
    <View style={styles.marketCard}>
      <Text style={styles.sellerName}>Seller: {item.Name}</Text>
      {item.MySellList && item.MySellList.length > 0 ? (
        item.MySellList.map((sell, idx) => (
          <View key={idx} style={styles.sellItemContainer}>
            <Text style={styles.itemText}>Item: {sell.SellItem}</Text>
            <Text style={styles.itemText}>Quantity: {sell.SellQuantity} kg</Text>
            <Text style={styles.priceText}>Amount: ₹{sell.SaleAmount}</Text>
            
            {/* Blockchain: Create Escrow Button */}
            <TouchableOpacity
              style={[
                styles.createEscrowBtn,
                selectedSeller === item.Name && escrowForm.quantity ? styles.activeBtn : {},
              ]}
              onPress={() => setSelectedSeller(item.Name)}
            >
              <Text style={styles.btnText}>Create Escrow Agreement</Text>
            </TouchableOpacity>

            {/* Escrow Form */}
            {selectedSeller === item.Name && (
              <View style={styles.escrowForm}>
                <Text style={styles.formTitle}>Create Escrow Agreement</Text>
                
                <TextInput
                  style={styles.formInput}
                  placeholder="Quantity (kg)"
                  value={escrowForm.quantity}
                  onChangeText={text => setEscrowForm({ ...escrowForm, quantity: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />

                <TextInput
                  style={styles.formInput}
                  placeholder="Price (ETH)"
                  value={escrowForm.priceInEther}
                  onChangeText={text => setEscrowForm({ ...escrowForm, priceInEther: text })}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#aaa"
                />

                <TextInput
                  style={styles.formInput}
                  placeholder="Delivery Deadline (days)"
                  value={escrowForm.deliveryDeadlineDays}
                  onChangeText={text => setEscrowForm({ ...escrowForm, deliveryDeadlineDays: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />

                <TextInput
                  style={styles.formInput}
                  placeholder="Penalty % (default 10)"
                  value={escrowForm.penaltyPercent}
                  onChangeText={text => setEscrowForm({ ...escrowForm, penaltyPercent: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#aaa"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, creatingEscrow && styles.disabledBtn]}
                  onPress={() => handleCreateEscrow(item.Name, sell.SellItem)}
                  disabled={creatingEscrow}
                >
                  {creatingEscrow ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Confirm Escrow Creation</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelectedSeller(null)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noItemsText}>No items listed</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Farm Market</Text>

        {/* Blockchain Status Indicator */}
        <View style={[styles.statusBar, blockchainReady ? styles.statusReady : styles.statusError]}>
          <Text style={styles.statusText}>
            {blockchainReady ? '✓ Blockchain Ready' : '⚠ Blockchain Offline'}
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search produce..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={searching}
          >
            <Text style={styles.searchBtnText}>{searching ? 'Searching...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && <ActivityIndicator size="large" color="#3A5A40" style={styles.loader} />}

        {/* Market List */}
        {!loading && market.length > 0 && (
          <FlatList
            data={market}
            renderItem={renderMarket}
            keyExtractor={(item, idx) => idx.toString()}
            scrollEnabled={false}
          />
        )}

        {!loading && market.length === 0 && (
          <Text style={styles.noDataText}>No items available</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  scrollContent: {
    padding: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 10,
  },
  statusBar: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderColor: '#3A5A40',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  searchBtn: {
    marginLeft: 10,
    paddingHorizontal: 15,
    backgroundColor: '#3A5A40',
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  marketCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3A5A40',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 10,
  },
  sellItemContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D7A3E',
    marginBottom: 10,
  },
  createEscrowBtn: {
    backgroundColor: '#3A5A40',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 10,
  },
  activeBtn: {
    backgroundColor: '#2D7A3E',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 13,
  },
  escrowForm: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3A5A40',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3A5A40',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#2D7A3E',
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  cancelBtn: {
    backgroundColor: '#999',
    paddingVertical: 12,
    borderRadius: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  noItemsText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default BuyerHomeScreenWithBlockchain;
