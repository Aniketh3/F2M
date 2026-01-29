import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';

const OrdersScreen = () => {
  const [sellItems, setSellItems] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const handleOrder = () => {
    const total = parseFloat(sellQuantity) * parseFloat(saleAmount);
    setTotalAmount(total.toString());
    Alert.alert('Order Submitted', 'Your order has been submitted successfully!');
  };

  const handleBid = () => {
    const total = parseFloat(sellQuantity) * parseFloat(saleAmount);
    setTotalAmount(total.toString());
    Alert.alert('Bid Submitted', 'Your bid has been submitted successfully!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <TextInput
        style={styles.input}
        placeholder="Sell Items"
        value={sellItems}
        onChangeText={setSellItems}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Sell Quantity (in kgs)"
        value={sellQuantity}
        onChangeText={setSellQuantity}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Sale Amount (in Rs)"
        value={saleAmount}
        onChangeText={setSaleAmount}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />
      <View style={styles.buttonContainer}>
        <Button title="Submit Order" onPress={handleOrder} color="#3A5A40" />
      </View>
      {totalAmount !== '' && (
        <Text style={styles.totalAmountText}>Total Amount: ₹{totalAmount}</Text>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Submit Bid" onPress={handleBid} color="#3A5A40" />
      </View>
      {totalAmount !== '' && (
        <Text style={styles.totalAmountText}>Total Amount: ₹{totalAmount}</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    height: 50,
    borderColor: '#3A5A40',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#FFF',
    color: '#333',
  },
  buttonContainer: {
    width: '90%',
    marginTop: 20,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3A5A40',
    marginVertical: 20,
  },
});

export default OrdersScreen;
