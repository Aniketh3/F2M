import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

const BuyerHomeScreen = () => {

  const [marketview,setMarketview] = useState(0)
  const handleTransaction=(name,quantity,amount,produce)=>{
    navigation.navigate("MakeOrder")
  }

  useEffect(()=>{
    const view = async()=>{
      const response = await axios.get("https://f2m-backend.onrender.com/market-view")
      console.log(response.data)
      const flattenedData = response.data.map(seller => {
        return seller.MySellList.map(sell => ({
          name: seller.Name,
          quantity: sell.SellQuantity,
          produce:sell.SellItem,
          amount: sell.SaleAmount
        }));
      }).flat();
      setMarketview(flattenedData)
      console.log(flattenedData)
    }
    view()
  },[])
  return (
    <View style={styles.container}>
      <FlatList
              data={marketview}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.itemContainer} onPress={()=>{handleTransaction(item.name,item.quantity,item.amount,item.produce)}}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemDetails}>
                  <Text style={styles.itemText}>Quantity: {item.quantity} kg</Text>
                  <Text style={styles.itemText}>Amount: ₹{item.amount}</Text>
                  <Text style={styles.itemText}>Item: {item.produce}</Text>
            </View>
          </View>
              )}
            />
          </View>
  );
};

export default BuyerHomeScreen;

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
