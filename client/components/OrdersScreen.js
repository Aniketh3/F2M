import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const OrdersScreen = () => {
  const { t } = useLanguage();
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
      <Text style={styles.title}>{t('orders')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('search')}
        value={sellItems}
        onChangeText={setSellItems}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder={`${t('qty')} (kg)`}
        value={sellQuantity}
        onChangeText={setSellQuantity}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder={`${t('price')} (Rs)`}
        value={saleAmount}
        onChangeText={setSaleAmount}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />
      <View style={styles.buttonContainer}>
        <Button title={t('post_listing')} onPress={handleOrder} color="#3A5A40" />
      </View>
      {totalAmount !== '' && (
        <Text style={styles.totalAmountText}>{t('price')}: ₹{totalAmount}</Text>
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
