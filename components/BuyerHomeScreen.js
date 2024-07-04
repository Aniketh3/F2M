import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BuyerHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Buyer Home Screen</Text>
    </View>
  );
};

export default BuyerHomeScreen;

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
