import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import blockchainService from '../services/blockchainService';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const THEMES = {
  seller: {
    primary: '#10B981', // Emerald
    gradient: ['#10B981', '#064E3B'],
    accent: '#34D399',
  },
  buyer: {
    primary: '#F59E0B', // Amber
    gradient: ['#F59E0B', '#B45309'],
    accent: '#FBBF24',
  }
};

const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
};

const OrdersScreen = () => {
  const { t } = useLanguage();
  const [role, setRole] = useState('buyer');
  const [username, setUsername] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockchainReady, setBlockchainReady] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [escrowDetails, setEscrowDetails] = useState({});

  const backend = process.env.EXPO_PUBLIC_API_URL;
  const theme = THEMES[role] || THEMES.buyer;
  const isSeller = role === 'seller';

  useFocusEffect(
    useCallback(() => {
      checkBlockchainStatus();
      fetchOrders();
    }, [role])
  );

  const checkBlockchainStatus = async () => {
    try {
      const res = await axios.get(`${backend}/escrow/status`);
      if (res.data.factoryAddress) {
        setBlockchainReady(true);
      } else {
        setBlockchainReady(false);
      }
    } catch (e) {
      setBlockchainReady(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const sellerInfo = await AsyncStorage.getItem('sellerInfo');
      const buyerInfo = await AsyncStorage.getItem('buyerInfo');
      
      let token = null;
      let userRole = 'buyer';
      let uName = '';

      if (sellerInfo) {
        userRole = 'seller';
        const parsed = JSON.parse(sellerInfo);
        uName = parsed.Name;
        token = parsed.token;
      } else if (buyerInfo) {
        userRole = 'buyer';
        const parsed = JSON.parse(buyerInfo);
        uName = parsed.Name;
        token = parsed.token;
      }

      setRole(userRole);
      setUsername(uName);

      const response = await axios.get(`${backend}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const orderList = userRole === 'buyer' 
          ? (response.data.data.MyOrders || []) 
          : (response.data.data.MySellList || []);
        
        // Reverse lists to show newest first
        setOrders([...orderList].reverse());

        // Fetch on-chain details for escrow orders in parallel
        orderList.forEach(order => {
          if (order.isEscrow && order.escrowAddress) {
            fetchOnChainDetails(order.escrowAddress);
          }
        });
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    checkBlockchainStatus();
    fetchOrders();
  };

  const fetchOnChainDetails = async (address) => {
    try {
      const details = await blockchainService.getEscrowStatus(address);
      setEscrowDetails(prev => ({
        ...prev,
        [address]: {
          status: details.status,
          balance: details.balanceEther,
          totalPrice: details.totalPriceEther,
        }
      }));
    } catch (e) {
      console.warn(`Failed to fetch escrow status for ${address}:`, e.message);
    }
  };

  // Farmer Actions
  const handleAcceptAgreement = async (address) => {
    Alert.alert('Confirm', 'Accept this escrow agreement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await blockchainService.acceptAgreement(address);
            Alert.alert('Success', 'Agreement Accepted!');
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessingAction(false);
          }
        }
      }
    ]);
  };

  const handleMarkDelivered = async (address) => {
    Alert.alert('Confirm', 'Mark this order as delivered?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Delivered',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await blockchainService.markAsDelivered(address);
            Alert.alert('Success', 'Order marked as delivered!');
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessingAction(false);
          }
        }
      }
    ]);
  };

  // Buyer Actions
  const handleDepositFunds = async (address, amount) => {
    Alert.alert('Confirm Deposit', `Deposit ${amount} ETH into escrow?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deposit',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await blockchainService.depositFunds(address, parseFloat(amount));
            Alert.alert('Success', 'Funds deposited successfully!');
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessingAction(false);
          }
        }
      }
    ]);
  };

  const handleConfirmDelivery = async (address) => {
    Alert.alert('Confirm Release', 'Confirm delivery and release funds to the farmer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await blockchainService.confirmDelivery(address);
            Alert.alert('Success', 'Delivery confirmed. Funds released!');
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessingAction(false);
          }
        }
      }
    ]);
  };

  const handleRejectDelivery = async (address) => {
    Alert.alert('Confirm Rejection', 'Are you sure you want to reject this delivery and request a refund?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: async () => {
          setProcessingAction(true);
          try {
            await blockchainService.rejectDelivery(address, 'Delivery did not meet quality requirements');
            Alert.alert('Success', 'Delivery rejected and refund processed.');
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessingAction(false);
          }
        }
      }
    ]);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: '#ECFDF5', text: '#059669' };
      case 'Delivered':
        return { bg: '#EFF6FF', text: '#2563EB' };
      case 'Active':
      case 'Funded':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'Rejected':
        return { bg: '#FEF2F2', text: '#DC2626' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const renderOrderCard = ({ item }) => {
    const isEscrow = item.isEscrow;
    const address = item.escrowAddress;
    const dbStatus = item.escrowStatus || 'Created';
    
    // Fetch live blockchain status if loaded
    const liveDetails = address ? escrowDetails[address] : null;
    const status = liveDetails?.status || dbStatus;
    const balance = liveDetails?.balance ? parseFloat(liveDetails.balance) : 0;
    
    const statusStyle = getStatusStyle(isEscrow ? status : (item.TransactionStatus || 'Pending'));

    // Step index for tracker pipeline
    let stepIndex = 0;
    if (status === 'Active' && balance > 0) stepIndex = 2; // Funded
    else if (status === 'Active') stepIndex = 1; // Accepted
    else if (status === 'Delivered') stepIndex = 3;
    else if (status === 'Completed' || status === 'Rejected') stepIndex = 4;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemName}>{isSeller ? item.SellItem : item.OrderItem}</Text>
            <Text style={styles.orderId}>ID: #{item.OrderID || item.OrderId}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {isEscrow ? status : (item.TransactionStatus || 'Pending')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailVal}>{isSeller ? item.SellQuantity : item.OrderQuantity} kg</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailVal}>
              {isEscrow ? `${item.TotalPrice || item.SaleAmount} ETH` : `₹${item.SaleAmount || item.TotalPrice}`}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Method</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons 
                name={isEscrow ? "shield-check-outline" : "cash-multiple"} 
                size={14} 
                color={isEscrow ? COLORS.info : COLORS.success} 
              />
              <Text style={[styles.detailVal, { color: isEscrow ? COLORS.info : COLORS.success }]}>
                {isEscrow ? 'Escrow' : 'Direct'}
              </Text>
            </View>
          </View>
        </View>

        {isEscrow && (
          <View style={styles.escrowContainer}>
            <Text style={styles.escrowTitle}>Escrow Progress Pipeline</Text>
            
            {/* Visual Step Pipeline */}
            <View style={styles.pipeline}>
              {['Created', 'Accepted', 'Funded', 'Delivered', 'Finished'].map((step, idx) => {
                const isActive = idx <= stepIndex;
                const isCurrent = idx === stepIndex;
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <View style={[styles.pipeLine, isActive && { backgroundColor: theme.primary }]} />}
                    <View style={styles.stepCol}>
                      <View style={[
                        styles.stepDot, 
                        isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                        isCurrent && { borderWidth: 4, borderColor: '#fff', scale: 1.2 }
                      ]}>
                        {isActive && <Feather name="check" size={10} color="#fff" />}
                      </View>
                      <Text style={[styles.stepText, isActive && { color: theme.primary, fontWeight: '700' }]}>{step}</Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {isSeller ? (
                // Farmer Actions
                <>
                  {status === 'Created' && (
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleAcceptAgreement(address)}
                      disabled={processingAction}
                    >
                      <Text style={styles.actionBtnText}>Accept Escrow Agreement</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'Active' && balance > 0 && (
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleMarkDelivered(address)}
                      disabled={processingAction}
                    >
                      <Text style={styles.actionBtnText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'Active' && balance === 0 && (
                    <Text style={styles.waitingText}>Waiting for Buyer to deposit funds...</Text>
                  )}
                </>
              ) : (
                // Buyer Actions
                <>
                  {status === 'Active' && balance === 0 && (
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleDepositFunds(address, item.TotalPrice || item.SaleAmount)}
                      disabled={processingAction}
                    >
                      <Text style={styles.actionBtnText}>Deposit Escrow Funds</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'Created' && (
                    <Text style={styles.waitingText}>Waiting for Farmer to accept agreement...</Text>
                  )}
                  {status === 'Active' && balance > 0 && (
                    <Text style={styles.waitingText}>Payment secured. Waiting for farmer delivery...</Text>
                  )}
                  {status === 'Delivered' && (
                    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { flex: 1 }]} 
                        onPress={() => handleConfirmDelivery(address)}
                        disabled={processingAction}
                      >
                        <Text style={styles.actionBtnText}>Confirm Delivery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton, { flex: 1 }]} 
                        onPress={() => handleRejectDelivery(address)}
                        disabled={processingAction}
                      >
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* DYNAMIC HEADER */}
      <LinearGradient colors={theme.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{isSeller ? 'My Sales' : t('orders')}</Text>
          {blockchainReady ? (
            <View style={styles.blockchainIndicatorReady}>
              <View style={styles.greenDot} />
              <Text style={styles.indicatorText}>Blockchain Online</Text>
            </View>
          ) : (
            <View style={styles.blockchainIndicatorOffline}>
              <View style={styles.redDot} />
              <Text style={styles.indicatorText}>Blockchain Offline</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ORDERS LIST */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loaderText}>Loading Orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => (item.OrderID || item.OrderId || Math.random().toString())}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-play-outline" size={48} color={COLORS.textSec} />
              <Text style={styles.emptyText}>No orders or listed items found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  blockchainIndicatorReady: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  blockchainIndicatorOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.textSec,
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    textTransform: 'capitalize',
  },
  orderId: {
    fontSize: 12,
    color: COLORS.textSec,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  detailCol: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textSec,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  escrowContainer: {
    marginTop: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  escrowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 18,
  },
  stepCol: {
    alignItems: 'center',
    zIndex: 10,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginTop: -10, // align with dots
    marginHorizontal: -5,
  },
  stepText: {
    fontSize: 9,
    color: COLORS.textSec,
    marginTop: 4,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  waitingText: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textSec,
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSec,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default OrdersScreen;
