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
    backgroundColor: '#fff',
  },
  text: {
    color: '#000',
    fontSize: 20,
  },
});
