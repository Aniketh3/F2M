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

// 🔧 CONFIG
const BACKEND_URL = 'http://10.140.10.251:3000'; // Replace with your IP

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

const SellerHomeScreen = () => {
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
        await axios.post(`${BACKEND_URL}/sellerSale?username=${sellerName}`, {
          SellItem: sellItem,
          SellQuantity: Number(sellQuantity),
          SaleAmount: Number(saleAmount),
        });
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
            <Text style={styles.cardTitle}>{item.SellItem}</Text>
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
          <Text style={styles.statLabel}>Qty</Text>
          <Text style={styles.statValue}>{item.SellQuantity} kg</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Price</Text>
          <Text style={styles.statValue}>₹{item.SaleAmount}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, { color: item.isTransactionComplete ? COLORS.success : '#F59E0B' }]}>
            {item.isTransactionComplete ? 'Sold' : 'Active'}
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
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.sellerName}>{sellerName || 'Farmer'}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Feather name="plus" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{mySales.length}</Text>
            <Text style={styles.summaryLabel}>Total Items</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{mySales.filter(i => !i.isTransactionComplete).length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>
      </LinearGradient>

      {/* LIST */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>My Inventory</Text>
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
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Listing' : 'New Listing'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.textSec} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {!isEditing && (
                <>
                  <Text style={styles.inputLabel}>Verification Photo</Text>
                  <TouchableOpacity style={styles.cameraBox} onPress={openCamera}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.imagePreview} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Feather name="camera" size={32} color={COLORS.primary} />
                        <Text style={styles.cameraText}>Tap to capture</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.inputLabel}>Crop Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Potatoes" value={sellItem} onChangeText={setSellItem} />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.inputLabel}>Quantity (kg)</Text>
                  <TextInput style={styles.input} placeholder="0" value={sellQuantity} onChangeText={setSellQuantity} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price (₹)</Text>
                  <TextInput style={styles.input} placeholder="0" value={saleAmount} onChangeText={setSaleAmount} keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? 'Update Listing' : 'Post Listing'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
});

export default SellerHomeScreen;