import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// SCREENS (Keep your existing file imports here)
import SellerRegisterScreen from './components/SellerRegisterScreen';
import BuyerRegisterScreen from './components/BuyerRegisterScreen';
import SellerLoginScreen from './components/SellerLoginScreen';
import BuyerLoginScreen from './components/BuyerLoginScreen';
import SellerHomeScreen from './components/SellerHomeScreen';
import BuyerHomeScreen from './components/BuyerHomeScreen';
import OrdersScreen from './components/OrdersScreen';
import ProfileScreen from './components/ProfileScreen';
import BidsScreen from './components/BidsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const { width, height } = Dimensions.get('window');

/* ===========================
   🎨 PREMIUM DESIGN SYSTEM
=========================== */
const COLORS = {
  primary: '#10B981',    // Emerald Green (Seller)
  secondary: '#F59E0B',  // Amber Orange (Buyer)
  background: '#F8FAFC', // Premium Off-White
  textMain: '#111827',   
  textSec: '#64748B',    
  white: '#FFFFFF',
};

const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  button: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  }
};

/* ===========================
   🍎 CONTINUOUS FLOATING ANIMATION (FIXED)
=========================== */

const floatingItems = [
  require('./assets/fruits/apple.png'),
  require('./assets/fruits/carrot.png'),
  require('./assets/fruits/corn.png'),
  require('./assets/fruits/grapes.png'),
  require('./assets/fruits/almond.png'),
  require('./assets/fruits/banana.png'),
  require('./assets/fruits/onion.png'),
  require('./assets/fruits/lettuce.png'),
  require('./assets/fruits/tomato.png'),
  require('./assets/fruits/pineapple.png'),
  require('./assets/fruits/orange.png'),
  require('./assets/fruits/mango.png'),
];

const FloatingItem = ({ source, duration, startY, scale }) => {
  // 1. Start Randomly on screen so user sees fruits immediately
  const initialX = Math.random() * width;
  const translateX = useRef(new Animated.Value(initialX)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Calculate speed so the first run matches the loop speed
    const totalDistance = width + 200; // -100 to width + 100
    const velocity = totalDistance / duration; 
    const remainingDistance = width + 100 - initialX;
    const firstRunDuration = remainingDistance / velocity;

    // MOVEMENT SEQUENCE
    const floatSequence = Animated.sequence([
      // Step 1: Finish current path (from random spot to right edge)
      Animated.timing(translateX, {
        toValue: width + 100,
        duration: firstRunDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      // Step 2: Loop forever from Left Edge (-100) -> Right Edge
      Animated.loop(
        Animated.sequence([
          // Instant reset to left
          Animated.timing(translateX, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
          // Full float across
          Animated.timing(translateX, {
            toValue: width + 100,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ),
    ]);

    floatSequence.start();

    // ROTATION LOOP
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 15000 + Math.random() * 5000, // Randomize spin speed
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Image
      source={source}
      style={[
        styles.floatingItem,
        {
          top: startY,
          transform: [
            { translateX }, 
            { rotate: spin },
            { scale: scale }
          ],
        },
      ]}
    />
  );
};

/* ===========================
   🏠 HOME SCREEN
=========================== */

const HomeScreen = ({ navigation }) => {
  const [role, setRole] = useState('seller');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleRoleSwitch = (newRole) => {
    if (role === newRole) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setRole(newRole);
  };

  const handleAuth = (type) => {
    const target = role === 'seller' 
      ? (type === 'login' ? 'SellerLogin' : 'SellerRegister') 
      : (type === 'login' ? 'BuyerLogin' : 'BuyerRegister');
    navigation.navigate(target);
  };

  const isSeller = role === 'seller';
  const activeColor = isSeller ? COLORS.primary : COLORS.secondary;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* BACKGROUND BLOBS */}
      <View style={styles.backgroundLayer}>
        <View style={[styles.blob, styles.blobGreen]} />
        <View style={[styles.blob, styles.blobOrange]} />
      </View>

      {/* ANIMATION LAYER */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {floatingItems.map((item, index) => (
          <FloatingItem 
            key={index} 
            source={item} 
            // Slower, smoother speeds (15s to 30s)
            duration={15000 + (index * 2000)} 
            // FIXED: Distribute evenly within screen height
            startY={(index * (height / floatingItems.length)) - 50} 
            // Random scales
            scale={0.6 + (index % 4) * 0.1}
          />
        ))}
      </View>

      {/* CONTENT LAYER */}
      <View style={styles.contentContainer}>
        
        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoContainer}>
             <Image source={require('./assets/logo.jpeg')} style={styles.logo} />
          </View>
          <Text style={styles.appName}>Farm2Market</Text>
          <Text style={styles.tagline}>Future of Fresh Trade</Text>
        </View>

        {/* Glass Card */}
        <Animated.View style={[styles.glassCard, { transform: [{ scale: fadeAnim }] }]}>
          
          <Text style={styles.welcomeTitle}>
            I am a <Text style={{ color: activeColor }}>{isSeller ? 'Seller' : 'Buyer'}</Text>
          </Text>
          
          <Text style={styles.subText}>
            {isSeller 
              ? 'List crops, access markets, and grow your business.' 
              : 'Buy fresh, organic produce directly from farmers.'}
          </Text>

          {/* Role Switcher */}
          <View style={styles.selectorContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              style={[styles.selectorBtn, isSeller && styles.selectorBtnActive]}
              onPress={() => handleRoleSwitch('seller')}
            >
              <MaterialCommunityIcons 
                name="sprout" 
                size={20} 
                color={isSeller ? COLORS.primary : '#94A3B8'} 
              />
              <Text style={[styles.selectorText, isSeller && styles.selectorTextActive]}>Seller</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9}
              style={[styles.selectorBtn, !isSeller && styles.selectorBtnActive]}
              onPress={() => handleRoleSwitch('buyer')}
            >
              <MaterialCommunityIcons 
                name="basket-outline" 
                size={20} 
                color={!isSeller ? COLORS.secondary : '#94A3B8'} 
              />
              <Text style={[styles.selectorText, !isSeller && styles.selectorTextActive]}>Buyer</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: activeColor }]} 
            onPress={() => handleAuth('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.mainButtonText}>Login</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => handleAuth('register')}
          >
            <Text style={styles.secondaryButtonText}>
              New here? <Text style={{ color: activeColor, fontWeight: '700' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>

        <Text style={styles.footer}>
          Fair Price • Direct Trade • Trusted
        </Text>

      </View>
    </View>
  );
};

/* ===========================
   📱 TABS (Unchanged)
=========================== */

const TabIcon = ({ name, color, focused, label }) => (
  <View style={[styles.tabItem, focused && { backgroundColor: color + '15' }]}>
    <MaterialCommunityIcons name={name} size={24} color={color} />
    <Text style={[styles.tabLabel, { color }]}>{label}</Text>
  </View>
);

function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.floatingTabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen name="Home" component={SellerHomeScreen} options={{ tabBarIcon: (p) => <TabIcon name="home-variant-outline" label="Home" {...p} /> }}/>
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: (p) => <TabIcon name="clipboard-text-outline" label="Orders" {...p} /> }}/>
      <Tab.Screen name="Bids" component={BidsScreen} options={{ tabBarIcon: (p) => <TabIcon name="gavel" label="Bids" {...p} /> }}/>
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: (p) => <TabIcon name="account-circle-outline" label="Profile" {...p} /> }}/>
    </Tab.Navigator>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.floatingTabBar,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen name="Home" component={BuyerHomeScreen} options={{ tabBarIcon: (p) => <TabIcon name="storefront-outline" label="Market" {...p} /> }}/>
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: (p) => <TabIcon name="shopping-outline" label="Orders" {...p} /> }}/>
      <Tab.Screen name="Bids" component={BidsScreen} options={{ tabBarIcon: (p) => <TabIcon name="ticket-percent-outline" label="Bids" {...p} /> }}/>
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: (p) => <TabIcon name="account-circle-outline" label="Profile" {...p} /> }}/>
    </Tab.Navigator>
  );
}

/* ===========================
   🚀 APP ROOT
=========================== */

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SellerRegister" component={SellerRegisterScreen} />
        <Stack.Screen name="BuyerRegister" component={BuyerRegisterScreen} />
        <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />
        <Stack.Screen name="BuyerLogin" component={BuyerLoginScreen} />
        <Stack.Screen name="SellerTabs" component={SellerTabs} />
        <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ===========================
   ✨ STYLES (Clean & Corporate)
=========================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // BACKGROUND MESH BLOBS
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: -1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    opacity: 0.12,
  },
  blobGreen: {
    top: -width * 0.5,
    left: -width * 0.5,
    backgroundColor: COLORS.primary,
  },
  blobOrange: {
    bottom: -width * 0.4,
    right: -width * 0.5,
    backgroundColor: COLORS.secondary,
  },

  // FLOATING ITEMS
  floatingItem: {
    position: 'absolute',
    width: 60,
    height: 60,
    resizeMode: 'contain',
    opacity: 0.65, 
    zIndex: 1,
  },

  // CONTENT
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },

  // HEADER
  headerBox: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoContainer: {
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 24,
    ...SHADOWS.card,
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSec,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // GLASS CARD
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    ...SHADOWS.card,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // SWITCHER PILL
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 5,
    width: '100%',
    marginBottom: 24,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  selectorBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  selectorTextActive: {
    color: COLORS.textMain,
    fontWeight: '700',
  },

  // BUTTONS
  mainButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    ...SHADOWS.button,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 20,
    paddingVertical: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.textSec,
  },

  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // TABS
  floatingTabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 70,
    borderTopWidth: 0,
    ...SHADOWS.card,
    paddingHorizontal: 8, // Added padding for better spacing
    borderWidth: 0.5,
    borderColor: '#E2E8F0', // Subtle border for professionalism
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});