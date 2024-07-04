import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BiddingScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Bidding Screen</Text>
    </View>
  );
};

export default BiddingScreen;

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
