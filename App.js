import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, Text, Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the Icon component

// Importing Components
import SellerRegisterScreen from './components/SellerRegisterScreen';
import BuyerRegisterScreen from './components/BuyerRegisterScreen';
import SellerLoginScreen from './components/SellerLoginScreen';
import BuyerLoginScreen from './components/BuyerLoginScreen';
import SellerHomeScreen from './components/SellerHomeScreen';
import BuyerHomeScreen from './components/BuyerHomeScreen';
import OrdersScreen from './components/OrdersScreen';
import BiddingScreen from './components/BiddingScreen';
import ProfileScreen from './components/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LogoTitle = () => (
  <Image
    style={styles.logo}
    source={require('./assets/logo.jpeg')} // Replace with your actual logo path
  />
);

function FarmerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Orders') {
            iconName = 'list';
          } else if (route.name === 'Bidding') {
            iconName = 'gavel';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: '#3A5A40',
        inactiveTintColor: 'gray',
        labelStyle: {
          fontSize: 16, // Increase font size for tab labels
        },
        // style: {
        //   height: 70, // Increase height for tab bar to accommodate larger icons
        // },
      }}
    >
      <Tab.Screen name="Home" component={SellerHomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Bidding" component={BiddingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Orders') {
            iconName = 'list';
          } else if (route.name === 'Bidding') {
            iconName = 'gavel';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: '#3A5A40',
        inactiveTintColor: 'gray',
        labelStyle: {
          fontSize: 16, // Increase font size for tab labels
        },
        // style: {
        //   height: 70, // Increase height for tab bar to accommodate larger icons
        // },
      }}
    >
      <Tab.Screen name="Home" component={BuyerHomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Bidding" component={BiddingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

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
    <Button
      title="Login as Seller"
      onPress={() => navigation.navigate('SellerLogin')}
    />
    <Button
      title="Login as Buyer"
      onPress={() => navigation.navigate('BuyerLogin')}
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
      <Stack.Screen
        name="SellerLogin"
        component={SellerLoginScreen}
        options={{ title: 'Seller Login' }}
      />
      <Stack.Screen
        name="BuyerLogin"
        component={BuyerLoginScreen}
        options={{ title: 'Buyer Login' }}
      />
      <Stack.Screen
        name="SellerTabs"
        component={FarmerTabs} // Use FarmerTabs for Seller
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BuyerTabs"
        component={BuyerTabs}
        options={{ headerShown: false }}
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
