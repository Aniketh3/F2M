import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

const BuyerHomeScreen = () => {
  const [market, setMarket] = useState([]);
  const [predictions, setPredictions] = useState({});
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

  // Capitalize first letter of each word
  const capitalizeWords = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

  // Fetch AI prediction for a given variety (sellItem)
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
        date: dateStr
      });
      setPredictions(prev => ({ ...prev, [orderId]: res.data }));
    } catch (e) {
      setPredictions(prev => ({ ...prev, [orderId]: { error: 'Prediction unavailable' } }));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadMarketAndPredictions = async () => {
      await fetchMarket();
    };
    loadMarketAndPredictions();
    return () => { isMounted = false; };
  }, []);

  // Fetch predictions for all items after market is loaded
  useEffect(() => {
    // For each seller, for each sell item, fetch prediction
    const fetchAllPredictions = async () => {
      for (const seller of market) {
        if (seller.MySellList && seller.MySellList.length > 0) {
          for (const sell of seller.MySellList) {
            // Avoid duplicate requests
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const renderMarket = ({ item }) => (
    <View style={styles.marketCard}>
      <Text style={styles.sellerName}>Seller: {item.Name}</Text>
      {(item.MySellList && item.MySellList.length > 0) ? (
        item.MySellList.map((sell, idx) => (
          <View key={sell.OrderID || idx} style={styles.sellItemBox}>
            <Text style={styles.itemName}>{sell.SellItem}</Text>
            <Text style={styles.itemDetail}>Qty: {sell.SellQuantity} kg</Text>
            <Text style={styles.itemDetail}>Price: ₹{sell.SaleAmount}</Text>
            {/* AI Prediction Box */}
            <View style={styles.aiPredictionBox}>
              <Text style={styles.aiPredictionTitle}>AI Prediction</Text>
              {predictions[sell.OrderID] ? (
                predictions[sell.OrderID].error ? (
                  <Text style={styles.aiPredictionError}>{predictions[sell.OrderID].error}</Text>
                ) : (
                  <>
                    <Text style={styles.aiPredictionPrice}>
                      ₹{predictions[sell.OrderID].predicted_price_per_quintal ? predictions[sell.OrderID].predicted_price_per_quintal.toFixed(2) : '-'}
                      <Text style={styles.aiPredictionUnit}> per quintal</Text>
                    </Text>
                    <View style={styles.aiPredictionDetailsRow}>
                      <Text style={styles.aiPredictionSubText}>
                        Weather: Temp {predictions[sell.OrderID].weather?.temperature ?? '-'}°C, Humidity {predictions[sell.OrderID].weather?.humidity ?? '-'}%, Rainfall {predictions[sell.OrderID].weather?.rainfall ?? '-'}mm
                      </Text>
                      <Text style={styles.aiPredictionSubText}>
                        Date: {predictions[sell.OrderID].date}
                      </Text>
                    </View>
                  </>
                )
              ) : (
                <Text style={styles.aiPredictionLoading}>Loading prediction...</Text>
              )}
            </View>
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
            data={market.filter(seller => seller.MySellList && seller.MySellList.length > 0)}
            renderItem={renderMarket}
            keyExtractor={item => item.Name + Math.random().toString()}
            refreshing={refreshing}
            onRefresh={fetchMarket}
            ListEmptyComponent={<Text style={{color:'#888',marginTop:20}}>No market data available.</Text>}
            contentContainerStyle={{paddingBottom: 40}}
            style={{flex: 1}}
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
  aiPredictionBox: {
    backgroundColor: '#fffbe7',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#ffe082',
    alignItems: 'center',
    shadowColor: '#ffecb3',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  aiPredictionTitle: {
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 4,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  aiPredictionPrice: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 2,
    textAlign: 'center',
  },
  aiPredictionUnit: {
    color: '#666',
    fontWeight: 'normal',
    fontSize: 13,
  },
  aiPredictionDetailsRow: {
    marginTop: 2,
    width: '100%',
    alignItems: 'center',
  },
  aiPredictionSubText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 1,
  },
  aiPredictionLoading: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  aiPredictionError: {
    color: '#d32f2f',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
