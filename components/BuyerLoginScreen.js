// components/BuyerLoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const dummyCredentials = {
  Buyer: { username: 'buyer123', pin: '123456' },
};

const BuyerLoginScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    const credentials = dummyCredentials.Buyer;
    if (name === credentials.username && pin === credentials.pin) {
      navigation.replace('BuyerTabs');
    } else {
      Alert.alert('Error', 'Invalid username or PIN');
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
      />
      <TextInput
        style={styles.input}
        placeholder="6-digit PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
        placeholderTextColor="#aaa"
      />
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} color="#3A5A40" />
      </View>
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
