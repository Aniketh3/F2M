import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

// Importing Components
import SellerRegisterScreen from './components/SellerRegisterScreen';
import BuyerRegisterScreen from './components/BuyerRegisterScreen';
import SellerLoginScreen from './components/SellerLoginScreen';
import BuyerLoginScreen from './components/BuyerLoginScreen';
import SellerHomeScreen from './components/SellerHomeScreen';
import BuyerHomeScreen from './components/BuyerHomeScreen';
import OrdersScreen from './components/OrdersScreen';
import ProfileScreen from './components/ProfileScreen';
import BidsScreen from './components/BidsScreen'; // Importing the BidsScreen

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
          } else if (route.name === 'Bids') {
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
        style: {
          height: 70, // Increase height for tab bar to accommodate larger icons
        },
      }}
    >
      <Tab.Screen name="Home" component={SellerHomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Bids" component={BidsScreen} />
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
          } else if (route.name === 'Bids') {
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
        style: {
          height: 70, // Increase height for tab bar to accommodate larger icons
        },
      }}
    >
      <Tab.Screen name="Home" component={BuyerHomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Bids" component={BidsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const HomeScreen = ({ navigation }) => (
  <ImageBackground
    source={require('./assets/background.jpeg')} // Replace with your actual background image path
    style={styles.background}
  >
    <View style={styles.overlay}>
      <LogoTitle />
      <Text style={styles.title}>Welcome to Farm2Market</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate('SellerRegister')}
        >
          <Text style={styles.buttonText}>Register as Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate('SellerLogin')}
        >
          <Text style={styles.buttonText}>Login as Seller</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate('BuyerRegister')}
        >
          <Text style={styles.buttonText}>Register as Buyer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate('BuyerLogin')}
        >
          <Text style={styles.buttonText}>Login as Buyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ImageBackground>
);

const App = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown:false}}
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
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white overlay
    padding: 16,
    width: '100%',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius:80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 16,
    // color: '#3A5A40',
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
    width: '45%',
    elevation: 5, // Add shadow effect for buttons
  },
  registerButton: {
    backgroundColor: '#4CAF50',
  },
  loginButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
