import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

const BuyerHomeScreen = () => {
  const [market, setMarket] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const backend = 'http://192.168.0.101:3000';

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

  useEffect(() => {
    fetchMarket();
  }, []);

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

  const renderMarket = ({ item }) => (
    <View style={styles.marketCard}>
      <Text style={styles.sellerName}>Seller: {item.Name}</Text>
      {(item.MySellList && item.MySellList.length > 0) ? (
        item.MySellList.map((sell, idx) => (
          <View key={sell.OrderID || idx} style={styles.sellItemBox}>
            <Text style={styles.itemName}>{sell.SellItem}</Text>
            <Text style={styles.itemDetail}>Qty: {sell.SellQuantity} kg</Text>
            <Text style={styles.itemDetail}>Price: ₹{sell.SaleAmount}</Text>
            <Text style={[styles.itemStatus, {color: sell.isTransactionComplete ? '#388e3c' : '#fbc02d'}]}>
              {sell.isTransactionComplete ? 'Completed' : 'Pending'}
            </Text>
            <Text style={styles.orderId}>Order ID: {sell.OrderID}</Text>
          </View>
        ))
      ) : (
        <Text style={{color:'#888'}}>No items for sale.</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.header}>Market View</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search for an item..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
            <Text style={styles.searchButtonText}>{searching ? 'Searching...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#3A5A40" style={{marginVertical: 20}} />
        ) : (
          <FlatList
            data={market}
            renderItem={renderMarket}
            keyExtractor={item => item.Name + Math.random().toString()}
            refreshing={refreshing}
            onRefresh={fetchMarket}
            ListEmptyComponent={<Text style={{color:'#888',marginTop:20}}>No market data available.</Text>}
            contentContainerStyle={{paddingBottom: 40}}
            style={{width: '100%'}}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default BuyerHomeScreen;

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
  searchRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: '#3A5A40',
    borderWidth: 1.5,
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    elevation: 2,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  marketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 6,
  },
  sellItemBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    marginTop: 2,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 15,
    color: '#333',
    marginBottom: 1,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  orderId: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
