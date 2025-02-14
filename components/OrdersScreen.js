import axios from 'axios';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const OrdersScreen = ({navigation}) => {
  const [sellItems, setSellItems] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const handleBid = () => {
    const total = parseFloat(sellQuantity) * parseFloat(saleAmount);
    setTotalAmount(total.toString());
    Alert.alert('Bid Submitted', 'Your bid has been submitted successfully!');
  };
  const handleOrder = async() => {
    // Calculate total amount
    const total = parseFloat(sellQuantity) * parseFloat(saleAmount);
    setTotalAmount(total.toString());

    
    const response = await axios.post(`https://f2m-backend.onrender.com/sellerSale?username=Aravind`,{
      SellItem:sellItems,
      SellQuantity:sellQuantity,
      SaleAmount:totalAmount
    })
    console.log(response.data)
    // Show alert after setting total amount
    Alert.alert('Order Submitted', 'Your order has been submitted successfully You will be redirected to HomeScreen!');
    navigation.navigate("SHome")
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <TextInput
        style={styles.input}
        placeholder="Sell Items"
        value={sellItems}
        onChangeText={setSellItems}
      />
      <TextInput
        style={styles.input}
        placeholder="Sell Quantity(in kgs)"
        value={sellQuantity}
        onChangeText={setSellQuantity}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Sale Amount(in Rs) "
        value={saleAmount}
        onChangeText={setSaleAmount}
        keyboardType="numeric"
      />
      <Button title="Submit Order" onPress={handleOrder} />
      {totalAmount !== '' && (
        <Text style={styles.totalAmountText}>Total Amount: ₹{totalAmount}</Text>
      )}
        <Button title="Submit Bid" onPress={handleBid} color="#3A5A40" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
});

export default OrdersScreen;