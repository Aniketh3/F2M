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
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🔧 CONFIGURATION: Check your IP!
const BACKEND_URL = 'http://10.140.10.251:3000'; // Replace with your laptop IP

const COLORS = {
  primary: '#F59E0B',    
  primaryDark: '#D97706', 
  background: '#F8FAFC', 
  surface: '#FFFFFF',
  textMain: '#1E293B',   
  textSec: '#64748B',    
  inputBg: '#F1F5F9',    
  border: '#E2E8F0',     
};

const BuyerLoginScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async () => {
    // 1. Validation
    if (!name.trim() || pin.length === 0) {
      Alert.alert('Missing Information', 'Please enter both your Name and PIN.');
      return;
    }

    setLoading(true);

    try {
      const payload = { 
        Name: name.trim(), // Remove accidental spaces
        PIN: Number(pin)   // Ensure Number type
      };
      
      const response = await axios.post(`${BACKEND_URL}/buyer/login`, payload);

      if (response.data && response.data.token) {
        // 2. SAVE TOKEN TO STORAGE (CRITICAL STEP)
        await AsyncStorage.setItem('buyerInfo', JSON.stringify({
            token: response.data.token,
            Name: name.trim()
        }));

        // 3. Navigate to Tabs
        navigation.replace('BuyerTabs');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (error) {
      console.log(error);
      const msg = error.response?.data?.message || 'Check your network connection or IP address.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* BACKGROUND */}
      <View style={styles.backgroundLayer}>
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />
      </View>

      {/* HEADER */}
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
          keyboardShouldPersistTaps="handled"
        >
          {/* TITLE */}
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="basket" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to access fresh produce.</Text>
          </View>

          {/* FORM */}
          <View style={styles.formContainer}>
            
            {/* NAME INPUT */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputField}>
                <Feather name="user" size={20} color={COLORS.textSec} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Name or Organization"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none" // IMPORTANT: Prevents 'ramesh' -> 'Ramesh'
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* PIN INPUT */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Access PIN</Text>
              <View style={styles.inputField}>
                <Feather name="lock" size={20} color={COLORS.textSec} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit PIN"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry={!showPin}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
                  <Feather name={showPin ? "eye" : "eye-off"} size={20} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('BuyerRegister')}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  blobTop: { position: 'absolute', top: -width * 0.4, right: -width * 0.2, width: width * 0.9, height: width * 0.9, borderRadius: width, backgroundColor: COLORS.primary, opacity: 0.08 },
  blobBottom: { position: 'absolute', bottom: -width * 0.4, left: -width * 0.3, width: width * 1, height: width * 1, borderRadius: width, backgroundColor: COLORS.primaryDark, opacity: 0.05 },
  header: { marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, paddingHorizontal: 20, marginBottom: 10 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  titleContainer: { marginBottom: 40, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 5 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textSec },
  formContainer: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 2 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, marginBottom: 8, marginLeft: 4 },
  inputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'transparent' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  eyeIcon: { padding: 8 },
  loginButton: { backgroundColor: COLORS.primary, borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8, marginTop: 10 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: COLORS.textSec, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});

export default BuyerLoginScreen;