import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlatList ,ActivityIndicator,RefreshControl} from 'react-native-gesture-handler';

const SellerHomeScreen = () => {
const [sellerview,setSellerView] = useState(0)
const [refreshing, setRefreshing] = useState(false);

const fun = async()=>{
  const response = await axios.get("https://f2m-backend.onrender.com/sellerSaleList?username=Aravind")
  console.log("res123",response.data)
  setSellerView(response.data.seller)
}
useEffect(()=>{
    fun()
},[])
const onRefresh = async () => {
  setRefreshing(true);
  await fun();
  setRefreshing(false);
};

  return (
    <View style={styles.container}>
<FlatList
        data={sellerview}
        keyExtractor={(item) => item.OrderID}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.SellItem}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemText}>Quantity: {item.SellQuantity} kg</Text>
              <Text style={styles.itemText}>Amount: ₹{item.SaleAmount}</Text>
            </View>
          </View>
        )}  
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />   
       </View>
  );
};

export default SellerHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    color: '#000',
    fontSize: 20,
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  itemContainer: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  itemDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});
