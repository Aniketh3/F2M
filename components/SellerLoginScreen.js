// components/SellerLoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const dummyCredentials = {
  Seller: { username: 'seller123', pin: '123456' },
};

const SellerLoginScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    const credentials = dummyCredentials.Seller;
    if (name === credentials.username && pin === credentials.pin) {
      navigation.replace('SellerTabs');
    } else {
      Alert.alert('Error', 'Invalid username or PIN');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login as Seller</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="6-digit PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
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
});

export default SellerLoginScreen;
