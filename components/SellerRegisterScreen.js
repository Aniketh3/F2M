import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const SellerRegisterScreen = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [location, setLocation] = useState(null);
  const [fruitsId, setFruitsId] = useState('');
  const [initialRegion, setInitialRegion] = useState(null);

  useEffect(() => {
    (async () => {
      // Request permission and get the current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to set your current location.');
        return;
      }
      
      let { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setInitialRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    })();
  }, []);

  const handleRegister = () => {
    // Handle seller registration logic here
    console.log('Seller registered:', { name, phone, aadhar, location, fruitsId });
  };

  const handleMapPress = (e) => {
    setLocation(e.nativeEvent.coordinate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seller Registration</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Aadhar Number"
        value={aadhar}
        onChangeText={setAadhar}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Fruits ID"
        value={fruitsId}
        onChangeText={setFruitsId}
      />
      {initialRegion && (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
        >
          {location && <Marker coordinate={location} draggable />}
        </MapView>
      )}
      <Button title="Register" onPress={handleRegister} />
    </ScrollView>
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
    margin: 16,
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
  map: {
    width: Dimensions.get('window').width * 0.8,
    height: 200,
    marginBottom: 12,
  },
});

export default SellerRegisterScreen;