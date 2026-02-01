import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#F59E0B',     // Amber 500 
  primaryDark: '#B45309', 
  background: '#F8FAFC',  
  surface: '#FFFFFF',     
  textMain: '#0F172A',    
  textSec: '#64748B',     
  border: '#E2E8F0',      
  inputBg: '#FFFFFF',     
  success: '#10B981',     
};

// 🛠 REUSABLE COMPONENTS (MOVED OUTSIDE)
const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIcon}>
      <Feather name={icon} size={16} color={COLORS.primary} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const ModernInput = ({ label, value, onChange, placeholder, icon, keyboard = 'default', secure = false, toggleSecure = null }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, value.length > 0 && styles.inputWrapperActive]}>
      <Feather name={icon} size={18} color={value.length > 0 ? COLORS.textMain : COLORS.textSec} style={{ marginRight: 10 }} />
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboard}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {toggleSecure && (
        <TouchableOpacity onPress={toggleSecure}>
          <Feather name={secure ? "eye-off" : "eye"} size={18} color={COLORS.textSec} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const BuyerRegisterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pin: '',
    aadhar: '',
    gst: '',
  });

  const [location, setLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setInitialRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setLocation({ latitude: coords.latitude, longitude: coords.longitude });
    })();
  }, []);

  const handleRegister = async () => {
    const { name, pin, phone, email, aadhar, gst } = formData;

    if (!name || !pin || !phone || !email || !aadhar || !gst) {
      Alert.alert('Incomplete Application', 'Please complete all fields to proceed.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        Name: name,
        PIN: Number(pin),
        PhoneNumber: phone,
        Email: email,
        Address: location ? `${location.latitude},${location.longitude}` : 'Unknown',
        AadharNumber: aadhar,
        GSTNumber: gst,
      };

      await axios.post('http://10.140.10.251:3000/buyer/register', payload);
      
      Alert.alert('Application Approved', 'Welcome to the network.', [
        { text: 'Login Now', onPress: () => navigation.replace('BuyerLogin') }
      ]);
      
    } catch (error) {
      const msg = error.response?.data?.message || 'Please verify your network connection.';
      Alert.alert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e) => setLocation(e.nativeEvent.coordinate);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Create Profile</Text>
        <View style={{ width: 42 }} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Unlock Freshness.</Text>
            <Text style={styles.heroSubtitle}>
              Join the premium network of buyers and source directly from the harvest.
            </Text>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Business Identity" icon="briefcase" />
            <ModernInput 
              label="Full Name / Business Name" 
              placeholder="Name or Organization" 
              icon="user" 
              value={formData.name} 
              onChange={(t) => updateField('name', t)} 
            />
            <ModernInput 
              label="Email Address" 
              placeholder="name@business.com" 
              icon="mail" 
              value={formData.email} 
              onChange={(t) => updateField('email', t)} 
              keyboard="email-address"
            />
            <ModernInput 
              label="Phone Number" 
              placeholder="10-digit mobile" 
              icon="smartphone" 
              value={formData.phone} 
              onChange={(t) => updateField('phone', t)} 
              keyboard="phone-pad"
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Compliance & Security" icon="shield" />
            
            <View style={styles.row}>
               <View style={styles.col}>
                  <ModernInput 
                    label="Aadhar Number" 
                    placeholder="12 Digits" 
                    icon="credit-card" 
                    value={formData.aadhar} 
                    onChange={(t) => updateField('aadhar', t)} 
                    keyboard="numeric"
                  />
               </View>
               <View style={{ width: 15 }} />
               <View style={styles.col}>
                  <ModernInput 
                    label="GSTIN" 
                    placeholder="Optional" 
                    icon="file-text" 
                    value={formData.gst} 
                    onChange={(t) => updateField('gst', t)} 
                  />
               </View>
            </View>

            <ModernInput 
              label="Set Access PIN" 
              placeholder="6 Digits" 
              icon="lock" 
              value={formData.pin} 
              onChange={(t) => updateField('pin', t)} 
              keyboard="numeric"
              secure={!showPin}
              toggleSecure={() => setShowPin(!showPin)}
            />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Delivery Point" icon="map-pin" />
            <View style={styles.mapContainer}>
              {initialRegion ? (
                <MapView
                  style={styles.map}
                  initialRegion={initialRegion}
                  onPress={handleMapPress}
                >
                  {location && <Marker coordinate={location} pinColor={COLORS.primary} />}
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={styles.mapLoadingText}>Acquiring location...</Text>
                </View>
              )}
              <View style={styles.mapBadge}>
                <Text style={styles.mapBadgeText}>Tap to pinpoint location</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleRegister}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Create Account</Text>
                  <Feather name="arrow-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('BuyerLogin')}>
               <Text style={styles.loginLinkText}>Already a member? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Log In</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, paddingBottom: 10, backgroundColor: COLORS.background },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  navTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
  scrollContent: { paddingHorizontal: 20 },
  heroSection: { marginVertical: 25 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textMain, letterSpacing: -0.5, marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: COLORS.textSec, lineHeight: 24, width: '90%' },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMain, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMain, marginBottom: 6, marginLeft: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, height: 50 },
  inputWrapperActive: { backgroundColor: '#FFF', borderColor: COLORS.textSec },
  textInput: { flex: 1, fontSize: 15, color: COLORS.textMain, fontWeight: '500' },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  mapContainer: { height: 180, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: COLORS.border },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  mapLoadingText: { marginTop: 8, fontSize: 12, color: COLORS.textSec },
  mapBadge: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(245, 158, 11, 0.9)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  mapBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  actionSection: { marginTop: 10 },
  submitBtn: { backgroundColor: COLORS.primary, height: 58, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  loginLink: { alignItems: 'center', marginTop: 20, padding: 10 },
  loginLinkText: { color: COLORS.textSec, fontSize: 14, fontWeight: '500' },
});

export default BuyerRegisterScreen;