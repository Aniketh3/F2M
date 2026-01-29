
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

const SellerHomeScreen = () => {

  const [sellItem, setSellItem] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [mySales, setMySales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sellerName, setSellerName] = useState('');

  const backend = 'http://192.168.0.101:3000';

  // Get seller info from AsyncStorage
  const getSellerInfo = async () => {
    const info = await AsyncStorage.getItem('sellerInfo');
    if (info) {
      const parsed = JSON.parse(info);
      setSellerName(parsed.Name);
      return parsed.Name;
    }
    return '';
  };

  const fetchSales = async () => {
    setRefreshing(true);
    try {
      const name = await getSellerInfo();
      if (!name) return;
      const res = await axios.get(`${backend}/sellerSaleList?username=${name}`);
      setMySales(res.data.seller || []);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch your sales list.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getSellerInfo();
    fetchSales();
  }, []);

  // Ensure fetchSales is called when refreshing is triggered by FlatList
  useEffect(() => {
    if (refreshing) {
      fetchSales();
    }
  }, [refreshing]);

  const handleAddSale = async () => {
    if (!sellItem || !sellQuantity || !saleAmount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const name = await getSellerInfo();
      if (!name) throw new Error('No seller info');
      const res = await axios.post(`${backend}/sellerSale?username=${name}`, {
        SellItem: sellItem,
        SellQuantity: sellQuantity,
        SaleAmount: saleAmount,
      });
      Alert.alert('Success', res.data.message || 'Sale added!');
      setSellItem(''); setSellQuantity(''); setSaleAmount('');
      fetchSales();
    } catch (e) {
      Alert.alert('Error', 'Could not add sale.');
    } finally {
      setLoading(false);
    }
  };

  const renderSale = ({ item }) => (
    <View style={styles.saleCard}>
      <Text style={styles.saleTitle}>{item.SellItem}</Text>
      <Text style={styles.saleDetail}>Qty: {item.SellQuantity} kg</Text>
      <Text style={styles.saleDetail}>Price: ₹{item.SaleAmount}</Text>
      <Text style={[styles.saleStatus, {color: item.isTransactionComplete ? '#388e3c' : '#fbc02d'}]}>
        {item.isTransactionComplete ? 'Completed' : 'Pending'}
      </Text>
      <Text style={styles.saleOrderId}>Order ID: {item.OrderID}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.header}>Welcome, {sellerName || 'Seller'}!</Text>
        <Text style={styles.subHeader}>Add New Sale</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Item Name"
            value={sellItem}
            onChangeText={setSellItem}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.input}
            placeholder="Quantity (kg)"
            value={sellQuantity}
            onChangeText={setSellQuantity}
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.input}
            placeholder="Price (₹)"
            value={saleAmount}
            onChangeText={setSaleAmount}
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#3A5A40" style={{marginVertical: 10}} />
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={handleAddSale}>
            <Text style={styles.addButtonText}>Add Sale</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.subHeader}>My Sales</Text>
        <FlatList
          data={mySales}
          renderItem={renderSale}
          keyExtractor={item => item.OrderID || Math.random().toString()}
          refreshing={refreshing}
          onRefresh={fetchSales}
          ListEmptyComponent={<Text style={{color:'#888',marginTop:20}}>No sales yet.</Text>}
          contentContainerStyle={{paddingBottom: 40}}
          style={{flex: 1}}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default SellerHomeScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginTop: 20,
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2196F3',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: '#3A5A40',
    borderWidth: 1.5,
    borderRadius: 8,
    marginHorizontal: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#3A5A40',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  saleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 4,
  },
  saleDetail: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  saleStatus: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  saleOrderId: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
