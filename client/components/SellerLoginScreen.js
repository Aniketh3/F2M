// components/SellerLoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/* ===========================
   🎨 SELLER THEME (Emerald)
=========================== */
const COLORS = {
  primary: '#10B981',     // Emerald 500
  primaryDark: '#047857', // Emerald 700
  background: '#F8FAFC',  // Slate 50
  surface: '#FFFFFF',
  textMain: '#0F172A',    // Slate 900
  textSec: '#64748B',     // Slate 500
  inputBg: '#F1F5F9',     // Slate 100
  border: '#E2E8F0',
};

const SellerLoginScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async () => {
    if (!name || pin.length === 0) {
      Alert.alert('Missing Credentials', 'Please enter your Name and PIN to continue.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use your actual IP address here
      const backendUrl = 'http://10.140.10.251:3000/seller/login';
      const payload = { Name: name, PIN: Number(pin) };
      
      const response = await axios.post(backendUrl, payload);
      
      if (response.data && response.data.token) {
        // Persist Data
        await AsyncStorage.setItem('sellerInfo', JSON.stringify({
          Name: name,
          token: response.data.token,
          hash: response.data.hash,
        }));
        
        // Success Transition
        setTimeout(() => navigation.replace('SellerTabs'), 500);
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to connect to server.';
      Alert.alert('Connection Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* BACKGROUND ELEMENTS (Green Blobs) */}
      <View style={styles.backgroundLayer}>
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />
      </View>

      {/* NAVIGATION HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* BRANDING / TITLE */}
          <View style={styles.titleSection}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="sprout" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.welcomeText}>Partner Login</Text>
            <Text style={styles.subtitleText}>Manage your harvest and orders.</Text>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.card}>
            
            {/* NAME INPUT */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Seller Name</Text>
              <View style={[styles.inputWrapper, name.length > 0 && styles.inputActive]}>
                <Feather name="user" size={20} color={COLORS.textSec} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* PIN INPUT */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Security PIN</Text>
              <View style={[styles.inputWrapper, pin.length > 0 && styles.inputActive]}>
                <Feather name="lock" size={20} color={COLORS.textSec} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="6-Digit PIN"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry={!showPin}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                  <Feather name={showPin ? "eye" : "eye-off"} size={20} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ACTION BUTTON */}
            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Access Dashboard</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            {/* HELP LINKS */}
            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>Forgot your PIN?</Text>
            </TouchableOpacity>

          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New Seller? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SellerRegister')}>
              <Text style={styles.registerLink}>Register Farm</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // BACKGROUND
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
  },
  blobTop: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.3,
    width: width * 1,
    height: width * 1,
    borderRadius: width,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -width * 0.4,
    left: -width * 0.3,
    width: width * 1,
    height: width * 1,
    borderRadius: width,
    backgroundColor: '#059669', // Darker Green
    opacity: 0.06,
  },

  // HEADER
  header: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // TITLE / BRANDING
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ECFDF5', // Very light green
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    color: COLORS.textSec,
  },

  // CARD
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  // INPUTS
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputActive: {
    backgroundColor: '#fff',
    borderColor: COLORS.primary, // Green border when active/filled
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMain,
  },
  eyeBtn: {
    padding: 8,
  },

  // BUTTONS
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    gap: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotLinkText: {
    color: COLORS.textSec,
    fontSize: 13,
    fontWeight: '500',
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 35,
  },
  footerText: {
    color: COLORS.textSec,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default SellerLoginScreen;