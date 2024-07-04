import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SellerHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Farmer Home Screen</Text>
    </View>
  );
};

export default SellerHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A5A40',
  },
  text: {
    color: '#FFF',
    fontSize: 20,
  },
});
