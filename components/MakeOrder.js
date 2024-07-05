import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const MakeOrderScreen = ({ navigation }) => {
  // Handler for confirming the order and proceeding to payment
  const handleConfirmOrder = () => {
    // Here, you would typically handle order confirmation logic

    // Navigate to the payment screen
    // navigation.navigate('PaymentScreen'); // Ensure you have a 'PaymentScreen' in your navigation setup
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Option</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Selected Option', 'Option 1')}>
          <Text style={styles.buttonText}>Option 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Selected Option', 'Option 2')}>
          <Text style={styles.buttonText}>Option 2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Selected Option', 'Option 3')}>
          <Text style={styles.buttonText}>Option 3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Selected Option', 'Option 4')}>
          <Text style={styles.buttonText}>Option 4</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
        <Text style={styles.confirmButtonText}>Confirm Order and Proceed to Pay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MakeOrderScreen;