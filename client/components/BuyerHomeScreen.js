import React, { useEffect, useState, useRef } from 'react';
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
  StatusBar,
  Dimensions,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// 🎨 BUYER THEME (Amber/Orange)
const COLORS = {
  primary: '#F59E0B',      // Amber 500
  primaryDark: '#B45309',  // Amber 700
  background: '#F8FAFC',   // Slate 50
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444'
};

const BuyerHomeScreen = () => {
  // Data State
  const [market, setMarket] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [search, setSearch] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State (Drill Down)
  const [selectedProduce, setSelectedProduce] = useState(null); // The item clicked (e.g. 'Tomato')
  const [produceSellers, setProduceSellers] = useState([]); // List of sellers for that item
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const backend = 'http://10.140.10.251:3000';

  // 🔄 FETCH MARKET DATA
  const fetchMarket = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backend}/market-view`);
      const rawData = res.data || [];
      setMarket(rawData);
      groupDataByProduce(rawData);
    } catch (e) {
      console.log(e);
      Alert.alert('Connection Error', 'Could not load the market.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  // 🧱 LOGIC: GROUP BY PRODUCE
  // Transforms: [Seller -> [Items]]  TO  [Item -> [Sellers]]
  const groupDataByProduce = (data, searchQuery = '') => {
    const groups = {};

    data.forEach(seller => {
      if (seller.MySellList) {
        seller.MySellList.forEach(item => {
          // Search Filter
          if (searchQuery && !item.SellItem.toLowerCase().includes(searchQuery.toLowerCase())) {
            return;
          }

          // Normalize Item Name (e.g., "Tomato " -> "Tomato")
          const itemName = item.SellItem.trim();
          
          if (!groups[itemName]) {
            groups[itemName] = {
              name: itemName,
              totalQty: 0,
              minPrice: Infinity,
              maxPrice: 0,
              sellers: []
            };
          }

          // Add seller details to this produce group
          groups[itemName].sellers.push({
            ...item,
            sellerName: seller.Name,
            sellerPhone: seller.PhoneNumber
          });

          // Update aggregates
          groups[itemName].totalQty += item.SellQuantity;
          groups[itemName].minPrice = Math.min(groups[itemName].minPrice, item.SaleAmount);
          groups[itemName].maxPrice = Math.max(groups[itemName].maxPrice, item.SaleAmount);
        });
      }
    });

    // Convert object to array for FlatList
    const groupedArray = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    setGroupedItems(groupedArray);
  };

  // 🔍 SEARCH HANDLER
  const handleSearch = (text) => {
    setSearch(text);
    groupDataByProduce(market, text);
  };

  // 🤖 AI PREDICTION FETCH
  const fetchPrediction = async (variety) => {
    setLoadingPrediction(true);
    setAiPrediction(null);
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    try {
      const res = await axios.post('https://farm2market-ai-predictor.onrender.com/predict-price', {
        produce: 'Vegetables', // Generic category for API
        variety: variety, // e.g. "Tomato"
        date: dateStr
      });
      setAiPrediction(res.data);
    } catch (e) {
      setAiPrediction({ error: 'Prediction data unavailable for this crop.' });
    } finally {
      setLoadingPrediction(false);
    }
  };

  // 🖱 OPEN DETAIL MODAL
  const openProduceDetails = (item) => {
    setSelectedProduce(item);
    setProduceSellers(item.sellers.sort((a, b) => a.SaleAmount - b.SaleAmount)); // Sort by price asc
    fetchPrediction(item.name);
  };

  // 🎨 HELPER: Get Icon based on name
  const getProduceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('tomato')) return { icon: 'food-apple', color: '#EF4444' }; // Red
    if (n.includes('potato')) return { icon: 'seed', color: '#D97706' }; // Brown
    if (n.includes('onion')) return { icon: 'food-onion', color: '#A855F7' }; // Purple
    if (n.includes('corn') || n.includes('maize')) return { icon: 'corn', color: '#F59E0B' }; // Yellow
    if (n.includes('carrot')) return { icon: 'carrot', color: '#F97316' }; // Orange
    if (n.includes('spinach') || n.includes('leaf')) return { icon: 'leaf', color: '#10B981' }; // Green
    return { icon: 'sprout', color: COLORS.primary }; // Default
  };

  // 🃏 RENDER: PRODUCE CARD (GRID ITEM)
  const renderProduceCard = ({ item }) => {
    const { icon, color } = getProduceIcon(item.name);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => openProduceDetails(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon} size={32} color={color} />
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSub}>
            {item.sellers.length} {item.sellers.length === 1 ? 'Seller' : 'Sellers'}
          </Text>
          
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              Starts ₹{item.minPrice}
            </Text>
          </View>
        </View>
        
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{item.totalQty}kg Vol</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 🃏 RENDER: SELLER LIST ITEM (INSIDE MODAL)
  const renderSellerRow = ({ item }) => (
    <View style={styles.sellerRow}>
      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName}>{item.sellerName}</Text>
        <View style={styles.sellerMeta}>
          <MaterialCommunityIcons name="weight-kilogram" size={14} color={COLORS.textSec} />
          <Text style={styles.sellerMetaText}>{item.SellQuantity} kg available</Text>
        </View>
        <View style={styles.sellerMeta}>
          <MaterialCommunityIcons name="star" size={14} color={COLORS.primary} />
          <Text style={styles.sellerMetaText}>4.8 Rating</Text>
        </View>
      </View>
      
      <View style={styles.priceAction}>
        <Text style={styles.sellerPrice}>₹{item.SaleAmount/item.SellQuantity}<Text style={{fontSize:12, fontWeight:'400'}}>/kg</Text></Text>
        <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buyBtnText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. HEADER */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Fresh Market</Text>
        <Text style={styles.subWelcome}>Source directly from farms</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={COLORS.textSec} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search produce (e.g. Tomato)..."
            value={search}
            onChangeText={handleSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </LinearGradient>

      {/* 2. BODY CONTENT */}
      <View style={styles.body}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <TouchableOpacity onPress={fetchMarket}>
             <MaterialCommunityIcons name="refresh" size={22} color={COLORS.textSec} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={groupedItems}
            renderItem={renderProduceCard}
            keyExtractor={item => item.name}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="basket-off-outline" size={48} color={COLORS.textSec} />
                <Text style={styles.emptyText}>No produce available right now.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* 3. DETAIL MODAL (DRILL DOWN) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedProduce}
        onRequestClose={() => setSelectedProduce(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedProduce?.name}</Text>
                <Text style={styles.modalSub}>{selectedProduce?.sellers.length} sellers available</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProduce(null)} style={styles.closeBtn}>
                <Feather name="x" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            {/* AI Insight Card */}
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                <Text style={styles.aiTitle}>AI Price Insight</Text>
              </View>
              
              {loadingPrediction ? (
                <ActivityIndicator color="#fff" style={{ padding: 10 }} />
              ) : aiPrediction?.error ? (
                 <Text style={styles.aiText}>Prediction unavailable for {selectedProduce?.name}</Text>
              ) : (
                <View style={styles.aiBody}>
                   <View style={{flex:1}}>
                      <Text style={styles.aiLabel}>Predicted Fair Price</Text>
                      <Text style={styles.aiPrice}>
                        ₹{aiPrediction?.predicted_price_per_quintal ? (aiPrediction.predicted_price_per_quintal / 100).toFixed(2) : '--'}
                        <Text style={{fontSize:14, fontWeight:'400'}}>/kg</Text>
                      </Text>
                   </View>
                   <View style={styles.weatherBox}>
                      <MaterialCommunityIcons name="weather-cloudy" size={18} color="#fff" />
                      <Text style={styles.weatherText}>{aiPrediction?.weather?.temperature || 24}°C</Text>
                   </View>
                </View>
              )}
            </View>

            {/* Sellers List */}
            <Text style={styles.listLabel}>Available Sellers</Text>
            <FlatList
              data={produceSellers}
              renderItem={renderSellerRow}
              keyExtractor={(item) => item.OrderID || Math.random().toString()}
              contentContainerStyle={{ paddingBottom: 30 }}
            />

          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  subWelcome: {
    fontSize: 14,
    color: '#FEF3C7', // Light Amber
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.textMain,
  },

  // BODY
  body: {
    flex: 1,
    paddingHorizontal: 15,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: 100,
  },

  // PRODUCE CARD (GRID)
  card: {
    backgroundColor: '#FFF',
    width: (width / 2) - 24, // 2 columns with spacing
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSec,
    marginBottom: 8,
  },
  priceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  priceText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  qtyBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  qtyText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSec,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: COLORS.textSec,
    marginTop: 10,
    fontSize: 16,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    textTransform: 'capitalize',
  },
  modalSub: {
    fontSize: 14,
    color: COLORS.textSec,
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },

  // AI CARD
  aiCard: {
    backgroundColor: '#8B5CF6', // Violent/Indigo for AI feel
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    opacity: 0.9,
  },
  aiTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  aiBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiLabel: {
    color: '#DDD6FE',
    fontSize: 12,
    marginBottom: 2,
  },
  aiPrice: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  aiText: {
    color: '#FFF',
    fontSize: 13,
    fontStyle: 'italic',
  },
  weatherBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  weatherText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  // SELLER LIST ROW
  listLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSec,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sellerMetaText: {
    fontSize: 12,
    color: COLORS.textSec,
    marginLeft: 4,
  },
  priceAction: {
    alignItems: 'flex-end',
  },
  sellerPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  buyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default BuyerHomeScreen;