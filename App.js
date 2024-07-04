import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import SellerRegisterScreen from './components/SellerRegisterScreen';
import BuyerRegisterScreen from './components/BuyerRegisterScreen';

const Stack = createStackNavigator();

const LogoTitle = () => (
  <Image
    style={styles.logo}
    source={require('./assets/icon.png')} // Replace with your actual logo path
  />
);

const HomeScreen = ({ navigation }) => (
  <View style={styles.container}>
    <LogoTitle />
    <Text style={styles.title}>Welcome to Farm2Market</Text>
    <Button
      title="Register as Seller"
      onPress={() => navigation.navigate('SellerRegister')}
    />
    <Button
      title="Register as Buyer"
      onPress={() => navigation.navigate('BuyerRegister')}
    />
  </View>
);

const App = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: props => <LogoTitle {...props} /> }}
      />
      <Stack.Screen
        name="SellerRegister"
        component={SellerRegisterScreen}
        options={{ title: 'Seller Register' }}
      />
      <Stack.Screen
        name="BuyerRegister"
        component={BuyerRegisterScreen}
        options={{ title: 'Buyer Register' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
  },
});

export default App;