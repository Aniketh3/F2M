import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useLanguage, TranslatedText } from '../context/LanguageContext';

// 🔧 CONFIG
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

const COLORS = {
  primary: '#10B981',     
  primaryDark: '#047857', 
  background: '#F8FAFC',  
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  success: '#34D399',
  danger: '#EF4444',
  edit: '#3B82F6' // Blue for edit
};

const SellerHomeScreen = ({ navigation }) => {
  const { t, language, changeLanguage } = useLanguage();
  const [mySales, setMySales] = useState([]);
  const [sellerName, setSellerName] = useState('');
  
  // Form State
  const [sellItem, setSellItem] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [image, setImage] = useState(null);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Custom states added for QR and Notifs
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdQRData, setCreatedQRData] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);
  const [manualOrderID, setManualOrderID] = useState('');
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchData(); }, [])
  );

  const fetchData = async () => {
    const info = await AsyncStorage.getItem('sellerInfo');
    if (info) {
      const parsed = JSON.parse(info);
      setSellerName(parsed.Name);
      fetchSales(parsed.Name);
    }
  };

  const fetchSales = async (name) => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/sellerSaleList?username=${name}`);
      setMySales((res.data.seller || []).reverse());
      setNotifications((res.data.notifications || []).reverse());
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

  // 📸 Camera
  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Access Denied", "Camera permission is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Notification Response
  const handleNotifResponse = async (notif, status) => {
    try {
        await axios.post(`${BACKEND_URL}/respondBuyRequest`, {
            sellerName: sellerName,
            buyerName: notif.buyerName,
            orderID: notif.orderID,
            itemName: notif.itemName,
            status: status
        });
        Alert.alert("Success", `Request ${status}!`);
        fetchSales(sellerName);
    } catch(e) {
        Alert.alert("Error", "Action failed.");
    }
  }

  // ✏️ OPEN EDIT MODAL
  const openEditModal = (item) => {
    setSellItem(item.SellItem);
    setSellQuantity(String(item.SellQuantity));
    setSaleAmount(String(item.SaleAmount));
    setEditingId(item.OrderID);
    setIsEditing(true);
    setModalVisible(true);
  };

  // ➕ OPEN ADD MODAL
  const openAddModal = () => {
    setSellItem('');
    setSellQuantity('');
    setSaleAmount('');
    setImage(null);
    setIsEditing(false);
    setEditingId(null);
    setModalVisible(true);
  };

  // 🗑 DELETE ITEM
  const handleDelete = (orderId) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to remove this listing?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/sellerSale/${orderId}?username=${sellerName}`);
              fetchSales(sellerName); // Refresh list
            } catch (e) {
              Alert.alert("Error", "Could not delete item.");
            }
          }
        }
      ]
    );
  };

  // 📷 SCAN QR FROM GALLERY OR MANUAL OVERRIDE
  const handleOpenScan = () => {
    setManualOrderID('');
    setShowScanModal(true);
  };

  const handleManualTransit = async () => {
     if (!manualOrderID.trim()) return;
     try {
        setLoading(true);
        await axios.post(`${BACKEND_URL}/sellerSale/transitStatus`, {
            orderID: manualOrderID.trim(),
            sellerName: sellerName,
            status: "In Transit"
        });
        Alert.alert("Transit Started", "Status updated successfully.");
        setShowScanModal(false);
        fetchSales(sellerName);
     } catch (e) {
        Alert.alert("Error", "Could not mark as Transit. Check Order ID.");
     } finally { setLoading(false); }
  }

  const handleScanQR = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Access Denied", "Gallery permission is required to scan QR.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0].base64) {
      try {
        setLoading(true);
        const res = await axios.post(`${BACKEND_URL}/decode-qr`, { imageBase64: result.assets[0].base64 });
        const qrData = JSON.parse(res.data.data);
        
        await axios.post(`${BACKEND_URL}/sellerSale/transitStatus`, {
            orderID: qrData.orderID,
            sellerName: qrData.sellerName || sellerName,
            status: "In Transit"
        });
        
        Alert.alert("Transit Started", "Status updated to 'In Transit'.");
        setShowScanModal(false);
        fetchSales(sellerName);
      } catch (err) {
        Alert.alert("Scan Failed", err.response?.data?.message || "Invalid QR Code or Request.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 🚀 SUBMIT (ADD OR UPDATE)
  const handleSubmit = async () => {
    if (!sellItem || !sellQuantity || !saleAmount) {
      Alert.alert('Missing Details', 'Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        // UPDATE EXISTING
        await axios.put(`${BACKEND_URL}/sellerSale/${editingId}?username=${sellerName}`, {
          SellItem: sellItem,
          SellQuantity: Number(sellQuantity),
          SaleAmount: Number(saleAmount),
        });
        Alert.alert('Success', 'Listing updated successfully!');
      } else {
        // CREATE NEW
        const res = await axios.post(`${BACKEND_URL}/sellerSale?username=${sellerName}`, {
          SellItem: sellItem,
          SellQuantity: Number(sellQuantity),
          SaleAmount: Number(saleAmount),
        });
        const newOrderID = res.data.orderID;
        if (newOrderID) {
            setCreatedQRData(JSON.stringify({ orderID: newOrderID, sellerName }));
            setShowQRModal(true);
        }
        Alert.alert('Success', 'New produce listed!');
      }
      
      setModalVisible(false);
      fetchSales(sellerName);

    } catch (e) {
        Alert.alert('Error', 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSaleItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="corn" size={24} color={COLORS.primary} />
          </View>
          <View>
            <TranslatedText style={styles.cardTitle} text={item.SellItem} />
            <Text style={styles.cardId}>#{item.OrderID?.substring(0, 6)}</Text>
          </View>
        </View>
        
        {/* ACTION BUTTONS */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.actionBtn, styles.editBtn]}>
            <Feather name="edit-2" size={16} color={COLORS.edit} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.OrderID)} style={[styles.actionBtn, styles.deleteBtn]}>
            <Feather name="trash-2" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('qty')}</Text>
          <Text style={styles.statValue}>{item.SellQuantity} kg</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('price')}</Text>
          <Text style={styles.statValue}>₹{item.SaleAmount}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('status')}</Text>
          <Text style={[styles.statValue, { color: item.isTransactionComplete ? COLORS.success : (item.TransactionStatus === 'In Transit' ? COLORS.primary : '#F59E0B') }]}>
            {item.isTransactionComplete ? t('sold') : (item.TransactionStatus || t('pending'))}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{t('welcome_back')}</Text>
            <Text style={styles.sellerName}>{sellerName || 'Farmer'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SellerChat')}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowNotifModal(true)}>
              <MaterialCommunityIcons name="bell" size={20} color="#fff" />
              {notifications.length > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenScan}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{t('scan')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{mySales.length}</Text>
            <Text style={styles.summaryLabel}>{t('total_items')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{mySales.filter(i => !i.isTransactionComplete).length}</Text>
            <Text style={styles.summaryLabel}>{t('active')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* LIST */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>{t('my_inventory')}</Text>
        <FlatList
          data={mySales}
          renderItem={renderSaleItem}
          keyExtractor={(item) => item.OrderID || Math.random().toString()}
          refreshing={refreshing}
          onRefresh={() => fetchSales(sellerName)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="leaf-off" size={48} color={COLORS.textSec} />
              <Text style={styles.emptyText}>No items listed.</Text>
            </View>
          }
        />
      </View>

      {/* MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? t('edit_listing') : t('new_listing')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.textSec} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {!isEditing && (
                <>
                  <Text style={styles.inputLabel}>{t('compliance_security')}</Text>
                  <TouchableOpacity style={styles.cameraBox} onPress={openCamera}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.imagePreview} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Feather name="camera" size={32} color={COLORS.primary} />
                        <Text style={styles.cameraText}>{t('add')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.inputLabel}>{t('crop_name')}</Text>
              <TextInput style={styles.input} placeholder={t('price')} value={sellItem} onChangeText={setSellItem} />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.inputLabel}>{t('qty')} (kg)</Text>
                  <TextInput style={styles.input} placeholder="0" value={sellQuantity} onChangeText={setSellQuantity} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t('price')} (₹)</Text>
                  <TextInput style={styles.input} placeholder="0" value={saleAmount} onChangeText={setSaleAmount} keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? t('update_listing') : t('post_listing')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transit Mark/Scan Modal */}
      <Modal animationType="slide" transparent={true} visible={showScanModal} onRequestClose={() => setShowScanModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>{t('in_transit')}</Text>
               <TouchableOpacity onPress={() => setShowScanModal(false)}>
                 <Feather name="x" size={24} color={COLORS.textSec} />
               </TouchableOpacity>
             </View>
             
             <Text style={styles.inputLabel}>{t('track_status')}</Text>
             <TextInput style={styles.input} placeholder="e.g. A3B8X" value={manualOrderID} onChangeText={setManualOrderID} autoCapitalize="none" />
             <TouchableOpacity style={styles.submitBtn} onPress={handleManualTransit} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('update_listing')}</Text>}
             </TouchableOpacity>

             <View style={{ marginVertical: 20, alignItems: 'center' }}><Text style={{ color: COLORS.textSec }}>- OR -</Text></View>

             <TouchableOpacity style={[styles.submitBtn, {backgroundColor: '#1E293B'}]} onPress={handleScanQR} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Scan QR from Gallery</Text>}
             </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notifications Modal */}
      <Modal animationType="slide" transparent={true} visible={showNotifModal} onRequestClose={() => setShowNotifModal(false)}>
          <View style={styles.modalOverlay}>
             <View style={[styles.modalContent, {height: '70%'}]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('chat')}</Text>
                  <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                    <Feather name="x" size={24} color={COLORS.textSec} />
                  </TouchableOpacity>
                </View>
                <FlatList
                   data={notifications}
                   keyExtractor={(item) => item._id || Math.random().toString()}
                   renderItem={({item}) => (
                       <View style={styles.notifCard}>
                          <Text style={styles.notifMsg}>{item.message}</Text>
                          {item.type === 'BuyRequest' && <Text style={styles.notifPhone}>Buyer Info: {item.buyerName} | {item.buyerPhone}</Text>}
                          
                          <View style={{marginTop: 10}}>
                             {item.type === 'BuyRequest' && item.status === 'Pending' ? (
                                <View style={{flexDirection: 'row', gap: 10}}>
                                   <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.success, flex: 1, alignItems: 'center'}]} onPress={() => handleNotifResponse(item, 'Accepted')}>
                                      <Text style={{color: '#fff', fontWeight: 'bold'}}>Accept</Text>
                                   </TouchableOpacity>
                                   <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.danger, flex: 1, alignItems: 'center'}]} onPress={() => handleNotifResponse(item, 'Rejected')}>
                                      <Text style={{color: '#fff', fontWeight: 'bold'}}>Reject</Text>
                                   </TouchableOpacity>
                                </View>
                             ) : (
                                <Text style={{fontWeight: 'bold', color: item.status === 'Accepted' ? COLORS.success : COLORS.textSec}}>
                                   Status: {item.status || 'Resolved'}
                                </Text>
                             )}
                          </View>
                       </View>
                   )}
                   ListEmptyComponent={<Text style={{ textAlign:'center', marginTop: 20}}>{t('no_orders')}</Text>}
                />
             </View>
          </View>
      </Modal>

      {/* QR Display Modal */}
      <Modal animationType="fade" transparent={true} visible={showQRModal} onRequestClose={() => setShowQRModal(false)}>
        <View style={styles.qrOverlay}>
          <View style={styles.qrContent}>
             <Text style={styles.modalTitle}>Produce QR Code</Text>
             <Text style={{ textAlign: 'center', marginBottom: 20, color: COLORS.textSec }}>Screenshot and save this QR. Use the Scanner later to mark this produce as 'In Transit'.</Text>
             {createdQRData ? (
                 <QRCode value={createdQRData} size={200} />
             ) : null}
             <TouchableOpacity style={[styles.submitBtn, {marginTop: 30, width: '100%'}]} onPress={() => setShowQRModal(false)}>
                <Text style={styles.submitBtnText}>Done</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: Platform.OS === 'android' ? 60 : 50, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: '#D1FAE5', fontSize: 14, fontWeight: '600' },
  sellerName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  summaryContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 15, justifyContent: 'space-around' },
  summaryBox: { alignItems: 'center' },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { color: '#D1FAE5', fontSize: 12 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  listContainer: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 15 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, backgroundColor: '#ECFDF5', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  cardId: { fontSize: 12, color: COLORS.textSec },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  editBtn: { backgroundColor: '#EFF6FF' },
  deleteBtn: { backgroundColor: '#FEF2F2' },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 11, color: COLORS.textSec, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  verticalDivider: { width: 1, backgroundColor: COLORS.border },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textMain, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },
  formScroll: { paddingBottom: 40 },
  cameraBox: { height: 150, backgroundColor: '#F1F5F9', borderRadius: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  cameraText: { color: COLORS.primary, fontWeight: '600', marginTop: 8 },
  imagePreview: { width: '100%', height: '100%' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 16, fontSize: 16, color: COLORS.textMain },
  row: { flexDirection: 'row' },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  qrContent: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 30, width: '85%', alignItems: 'center', elevation: 10 },
  notifBadge: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  notifCard: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, marginBottom: 10 },
  notifMsg: { fontSize: 15, fontWeight: '700', color: COLORS.textMain, marginBottom: 5 },
  notifPhone: { fontSize: 13, color: COLORS.textSec }
});

export default SellerHomeScreen;