import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

const BuyerRegisterScreen = () => {
  const [name, setName] = useState('');
  const [pin,setPIN] = useState(0)
  const [phone, setPhone] = useState('');
  const [email,setEmail] = useState('')
  const [aadhar, setAadhar] = useState('');
  const [location, setLocation] = useState(null);
  const [gst, setGst] = useState('');
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

  const handleRegister = async() => {
    // Handle buyer registration logic here
    const response = await axios.post("https://f2m-backend.onrender.com/buyer/register",{
      Name:name,
      PIN:Number(pin),
      PhoneNumber:phone,
      Email:email,
      Address:"Banglore",
      AadharNumber:aadhar,
      GSTNumber:gst
    })
    Alert.alert(response.data.message)
    console.log('Buyer registered:', { name, phone, aadhar, location, gst });
  };

  const handleMapPress = (e) => {
    setLocation(e.nativeEvent.coordinate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Buyer Registration</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="PIN"
        value={pin}
        onChangeText={setPIN}
        keyboardType="number-pad"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Aadhar Number"
        value={aadhar}
        onChangeText={setAadhar}
        keyboardType="number-pad"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="GST Number"
        value={gst}
        onChangeText={setGst}
        placeholderTextColor="#aaa"
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
      <View style={styles.buttonContainer}>
        <Button title="Register" onPress={handleRegister} color="#3A5A40" />
      </View>
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
  map: {
    width: Dimensions.get('window').width * 0.9,
    height: 250,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '90%',
    marginTop: 20,
  },
});

export default BuyerRegisterScreen;
