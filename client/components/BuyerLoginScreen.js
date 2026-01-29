// components/BuyerLoginScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

const BuyerLoginScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name || pin.length === 0) {
      Alert.alert('Error', 'Please enter both Name and PIN');
      return;
    }
    setLoading(true);
    try {
      const backendUrl = 'http://192.168.0.101:3000/buyer/login';
      const payload = { Name: name, PIN: Number(pin) };
      const response = await axios.post(backendUrl, payload);
      if (response.data && response.data.token) {
        Alert.alert('Success', 'Login Successful');
        setTimeout(() => navigation.replace('BuyerTabs'), 500);
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data?.message || 'Login failed');
      } else if (error.request) {
        Alert.alert('Error', 'No response from server. Check your network or backend.');
      } else {
        Alert.alert('Error', error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login as Buyer</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
        placeholderTextColor="#aaa"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#3A5A40" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={handleLogin} color="#3A5A40" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default BuyerLoginScreen;
