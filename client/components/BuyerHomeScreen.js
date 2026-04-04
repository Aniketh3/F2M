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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLanguage, TranslatedText } from '../context/LanguageContext';

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
  const navigation = useNavigation();
  const { t, language, changeLanguage } = useLanguage();
  // Data State
  const [market, setMarket] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom states added for Notifs
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Buyer Info
  const [buyerName, setBuyerName] = useState('');
  
  // Modal State (Drill Down)
  const [selectedProduce, setSelectedProduce] = useState(null); // The item clicked (e.g. 'Tomato')
  const [produceSellers, setProduceSellers] = useState([]); // List of sellers for that item
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const backend = process.env.EXPO_PUBLIC_API_URL;

  const fetchMarket = async (bName = buyerName) => {
    setLoading(true);
    try {
      const res = await axios.get(`${backend}/market-view`);
      const rawData = res.data || [];
      setMarket(rawData);
      groupDataByProduce(rawData);
      
      if (bName) {
         try {
            const res2 = await axios.get(`${backend}/buyerNotifications?username=${bName}`);
            setNotifications((res2.data.notifications || []).reverse());
         } catch(e) {}
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Connection Error', 'Could not load the market.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('buyerInfo').then(data => {
        if (data) {
           const parsed = JSON.parse(data);
           setBuyerName(parsed.Name);
           fetchMarket(parsed.Name);
        } else {
           fetchMarket();
        }
    });
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

  // 🛒 HANDLE BUY
  const handleBuy = async (item) => {
      try {
          await axios.post(`${backend}/buyProduce`, {
              sellerName: item.sellerName,
              buyerName: buyerName,
              buyerPhone: "Registered Phone", 
              orderID: item.OrderID,
              itemName: item.SellItem
          });
          Alert.alert(t('success'), `Request sent to ${item.sellerName}! They have been notified.`);
      } catch (err) {
          Alert.alert(t('error'), "Could not send buy request.");
      }
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
          <TranslatedText style={styles.cardTitle} text={item.name} numberOfLines={1} />
          <Text style={styles.cardSub}>
            {item.sellers.length} {item.sellers.length === 1 ? t('sellers').slice(0,-1) : t('sellers')}
          </Text>
          
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {t('starts')} ₹{item.minPrice}
            </Text>
          </View>
        </View>
        
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{item.totalQty}kg {t('market')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 🃏 RENDER: SELLER LIST ITEM (INSIDE MODAL)
  const renderSellerRow = ({ item }) => (
    <View style={styles.sellerRow}>
      <View style={styles.sellerInfo}>
        <TranslatedText style={styles.sellerName} text={item.sellerName} />
        <View style={styles.sellerMeta}>
          <MaterialCommunityIcons name="weight-kilogram" size={14} color={COLORS.textSec} />
          <Text style={styles.sellerMetaText}>{item.SellQuantity} {t('kg_available')}</Text>
        </View>
        <View style={styles.sellerMeta}>
          <MaterialCommunityIcons name="star" size={14} color={COLORS.primary} />
          <Text style={styles.sellerMetaText}>4.8 {t('rating')}</Text>
        </View>
      </View>
      
      <View style={styles.priceAction}>
        <Text style={styles.sellerPrice}>₹{item.SaleAmount/item.SellQuantity}<Text style={{fontSize:12, fontWeight:'400'}}>/kg</Text></Text>
        <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(item)}>
          <Text style={styles.buyBtnText}>{t('buy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
           style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }} 
           onPress={() => Alert.alert(t('status'), `The current status of this produce is: ${item.TransactionStatus || t('pending')}`)}>
           <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.primary} />
           <Text style={{ fontSize: 12, color: COLORS.primary, marginLeft: 4 }}>{t('track_status')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // -------------------------
  // RENDER MAIN SCREEN
  // -------------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Notifications Modal */}
      <Modal animationType="slide" transparent={true} visible={showNotifModal} onRequestClose={() => setShowNotifModal(false)}>
          <View style={styles.modalOverlay}>
             <View style={[styles.modalContent, {height: '70%', backgroundColor: '#F8FAFC'}]}>
                <View style={[styles.modalHeader, {marginBottom: 10}]}>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.closeBtn}>
                    <Feather name="x" size={24} color={COLORS.textMain} />
                  </TouchableOpacity>
                </View>
                <FlatList
                   data={notifications}
                   keyExtractor={(item) => item._id || Math.random().toString()}
                   showsVerticalScrollIndicator={false}
                   renderItem={({item}) => (
                       <View style={styles.notifCard}>
                          <Text style={styles.notifMsg}>{item.message}</Text>
                          <Text style={styles.notifPhone}>Status: <Text style={{fontWeight: 'bold', color: item.status === 'Accepted' ? COLORS.success : (item.status === 'Rejected' ? COLORS.error : COLORS.textMain)}}>{item.status}</Text></Text>
                       </View>
                   )}
                   ListEmptyComponent={<Text style={{ textAlign:'center', marginTop: 20, color: COLORS.textSec }}>{t('no_notifs')}</Text>}
                />
             </View>
          </View>
      </Modal>
      
      {/* 1. HEADER */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity 
            style={styles.menuIcon} 
            onPress={() => setSideMenuVisible(true)}
          >
            <Feather name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <View>
             <Text style={styles.welcomeText}>{t('fresh_market')}</Text>
             <Text style={styles.subWelcome}>{t('source_direct')}</Text>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={COLORS.textSec} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search')}
            value={search}
            onChangeText={handleSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </LinearGradient>

      {/* 2. BODY CONTENT */}
      <View style={styles.body}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>{t('browse_categories')}</Text>
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
                <TranslatedText style={styles.modalTitle} text={selectedProduce?.name || ""} />
                <Text style={styles.modalSub}>{selectedProduce?.sellers.length} {t('sellers')} {t('active')}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProduce(null)} style={styles.closeBtn}>
                <Feather name="x" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            {/* AI Insight Card */}
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                <Text style={styles.aiTitle}>{t('ai_price_insight')}</Text>
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
            <Text style={styles.listLabel}>{t('sellers')}</Text>
            <FlatList
              data={produceSellers}
              renderItem={renderSellerRow}
              keyExtractor={(item) => item.OrderID || Math.random().toString()}
              contentContainerStyle={{ paddingBottom: 30 }}
            />

          </View>
        </View>
      </Modal>

      {/* 🍔 SIDE HAMBURGER MENU (BUYER) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sideMenuVisible}
        onRequestClose={() => setSideMenuVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerCloseArea} 
            onPress={() => setSideMenuVisible(false)} 
          />
          <View style={styles.drawerContent}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Farm2Market</Text>
              <Text style={styles.drawerSub}>{buyerName || 'Buyer'}</Text>
            </LinearGradient>

            <View style={styles.drawerItems}>
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => { setSideMenuVisible(false); setShowNotifModal(true); }}
              >
                <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Notifications</Text>
              </TouchableOpacity>

              <View style={styles.drawerDivider} />

              {/* Language Section */}
              <TouchableOpacity 
                style={styles.drawerItem} 
                onPress={() => setShowLangDropdown(!showLangDropdown)}
              >
                <MaterialCommunityIcons name="translate" size={24} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Change Language</Text>
                <Feather 
                  name={showLangDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={COLORS.textSec} 
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {showLangDropdown && (
                <View style={styles.langList}>
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'Hindi' },
                    { id: 'kn', label: 'Kannada' },
                    { id: 'ta', label: 'Tamil' },
                    { id: 'te', label: 'Telugu' },
                    { id: 'ml', label: 'Malayalam' },
                  ].map((langObj) => (
                    <TouchableOpacity 
                      key={langObj.id} 
                      style={[styles.langOption, language === langObj.id && styles.activeLang]} 
                      onPress={() => {
                        changeLanguage(langObj.id);
                        setSideMenuVisible(false);
                      }}
                    >
                      <Text style={[styles.langLabel, language === langObj.id && styles.activeLangLabel]}>
                        {langObj.label}
                      </Text>
                      {language === langObj.id && <Feather name="check" size={16} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={async () => {
                await AsyncStorage.clear();
                navigation.replace('BuyerLogin');
              }}
            >
              <Feather name="log-out" size={20} color={COLORS.error} />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
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
  notifBadge: { position: 'absolute', top: 5, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.error, borderWidth: 2, borderColor: COLORS.primary },
  notifCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  notifMsg: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginBottom: 5 },
  notifPhone: { fontSize: 13, color: COLORS.textSec },
  menuIcon: { marginRight: 15, padding: 5 },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  drawerCloseArea: { flex: 1 },
  drawerContent: { width: '80%', backgroundColor: '#fff', height: '100%', shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  drawerHeader: { padding: 40, paddingTop: 60 },
  drawerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  drawerSub: { color: '#FEF3C7', fontSize: 14, marginTop: 5 },
  drawerItems: { padding: 20 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drawerItemText: { marginLeft: 15, fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  drawerDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  langList: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, marginTop: 5 },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8 },
  activeLang: { backgroundColor: '#FEF3C7' },
  langLabel: { fontSize: 15, color: COLORS.textMain },
  activeLangLabel: { color: COLORS.primaryDark, fontWeight: 'bold' },
  logoutBtn: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWeight: 1, borderColor: '#FEF2F2', backgroundColor: '#FEF2F2' },
  logoutText: { marginLeft: 10, color: COLORS.error, fontWeight: 'bold', fontSize: 16 }
});

export default BuyerHomeScreen;