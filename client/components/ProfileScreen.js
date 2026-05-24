import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, StatusBar, Switch, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useLanguage, TranslatedText } from '../context/LanguageContext';

// 🎨 DYNAMIC THEME ENGINE
const THEMES = {
  seller: {
    primary: '#10B981', // Emerald
    gradient: ['#10B981', '#064E3B'],
    accent: '#34D399',
  },
  buyer: {
    primary: '#F59E0B', // Amber
    gradient: ['#F59E0B', '#B45309'],
    accent: '#FBBF24',
  }
};

const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
};

const ProfileScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('seller');
  const [userData, setUserData] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  // Custom Modal State for Android-compatible Wallet Editor
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [tempWalletAddress, setTempWalletAddress] = useState('');

  // 🔄 Fetch Data every time screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Retrieve Token from Storage
      const sellerInfo = await AsyncStorage.getItem('sellerInfo');
      const buyerInfo = await AsyncStorage.getItem('buyerInfo');

      let token = null;

      if (sellerInfo) {
        token = JSON.parse(sellerInfo).token;
      } else if (buyerInfo) {
        token = JSON.parse(buyerInfo).token;
      }

      if (!token) {
        // No token found, redirect to Home
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }

      // 2. Call API
      // REPLACE WITH YOUR COMPUTER'S IP ADDRESS
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        const userRole = response.data.role;

        setRole(userRole);
        setUserData({
          name: apiData.Name,
          phone: apiData.PhoneNumber,
          email: apiData.Email || 'No Email Linked',
          location: apiData.Address || 'India',
          aadhar: apiData.AadharNumber,
          walletAddress: apiData.WalletAddress || null,
          // Stats
          orders: apiData.stats.orders,
          earnings: userRole === 'seller' ? apiData.stats.earnings : null,
          spent: userRole === 'buyer' ? apiData.stats.spent : null,
        });

        // Calculate Completion Score
        let score = 0;
        if (apiData.Name) score++;
        if (apiData.PhoneNumber) score++;
        if (apiData.Email) score++;
        if (apiData.Address) score++;
        if (apiData.AadharNumber) score++;
        setCompletion((score / 5) * 100);

        // Load profile image
        const storedImage = await AsyncStorage.getItem(`${userRole}ProfileImage`);
        if (storedImage) {
          setProfileImage(storedImage);
        }
      }

    } catch (error) {
      console.error("Profile Fetch Error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert("Session Expired", "Please login again.");
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPress = () => {
    setTempWalletAddress(userData?.walletAddress || "");
    setWalletModalVisible(true);
  };

  const handleAutoFill = () => {
    const testAccounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Backend
      '0x70997970C51812e339D9B73b0245ad59cc793a05', // Farmer
      '0x3C44CdDdB6a900c6671B73F3d36ade6d1fF63Af7'  // Buyer
    ];
    const randomAccount = testAccounts[Math.floor(Math.random() * testAccounts.length)];
    setTempWalletAddress(randomAccount);
  };

  const saveWalletAddress = async () => {
    const address = tempWalletAddress.trim();
    if (!address.startsWith('0x') || address.length !== 42) {
      Alert.alert("Invalid Address", "Wallet address must be a valid 42-character hex string starting with 0x.");
      return;
    }
    try {
      setLoading(true);
      setWalletModalVisible(false);
      const sellerInfo = await AsyncStorage.getItem('sellerInfo');
      const buyerInfo = await AsyncStorage.getItem('buyerInfo');
      let token = sellerInfo ? JSON.parse(sellerInfo).token : (buyerInfo ? JSON.parse(buyerInfo).token : null);
      
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/profile/update`, 
        { WalletAddress: address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Wallet address updated successfully!");
      fetchProfileData();
    } catch (err) {
      Alert.alert("Error", "Failed to update wallet address.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), t('logging_out'), [
      { text: t('back'), style: "cancel" },
      {
        text: t('logout'), style: "destructive", onPress: async () => {
          await AsyncStorage.clear();
          const loginScreen = role === 'seller' ? 'SellerLogin' : 'BuyerLogin';
          navigation.reset({
            index: 1,
            routes: [{ name: 'Home' }, { name: loginScreen }],
          });
        }
      }
    ]);
  };

  const handleAvatarPress = () => {
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Remove Photo", onPress: removePhoto, style: profileImage ? "destructive" : "cancel" },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await AsyncStorage.setItem(`${role}ProfileImage`, uri);
      setProfileImage(uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await AsyncStorage.setItem(`${role}ProfileImage`, uri);
      setProfileImage(uri);
    }
  };

  const removePhoto = async () => {
    await AsyncStorage.removeItem(`${role}ProfileImage`);
    setProfileImage(null);
  };

  // 🎨 GET CURRENT THEME COLORS
  const theme = THEMES[role] || THEMES.seller;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 15, color: COLORS.textSec }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* 1. DYNAMIC GRADIENT HEADER */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <View style={styles.headerTopBar}>
              <Text style={styles.headerTitle}>{t('profile')}</Text>
              <TouchableOpacity style={styles.settingsBtn}>
                <Feather name="settings" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* FLOATING CARD */}
          <View style={styles.profileCard}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarPlaceholder}
                >
                  <MaterialCommunityIcons 
                    name="account-circle" 
                    size={48} 
                    color="#fff" 
                  />
                </LinearGradient>
              )}
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={22} color={theme.primary} />
              </View>
            </TouchableOpacity>

            <TranslatedText text={userData?.name} style={styles.userName} />
            <Text style={styles.userRole}>
              {role === 'seller' ? t('sellers') : t('market')} • {userData?.location || 'India'}
            </Text>

            {/* STATUS TOGGLE */}
            <View style={styles.statusContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.dot, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                <Text style={styles.statusText}>
                  {isOnline ? (role === 'seller' ? t('active') : t('active')) : t('pending')}
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#E2E8F0", true: theme.accent }}
                thumbColor={isOnline ? theme.primary : "#f4f3f4"}
                onValueChange={setIsOnline}
                value={isOnline}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
        </View>

        <View style={styles.bodyContainer}>

          {/* 2. COMPLETION CARD (Gamified) */}
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <View>
                <Text style={styles.completionTitle}>{t('profile_settings')}</Text>
                <Text style={styles.completionSub}>
                  {completion === 100 ? t('success') : t('personal_info')}
                </Text>
              </View>
              <Text style={[styles.completionPercent, { color: theme.primary }]}>{completion}%</Text>
            </View>

            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${completion}%` }]}
              />
            </View>

            {completion < 100 && (
              <TouchableOpacity style={styles.completeNowBtn}>
                <Text style={[styles.completeNowText, { color: theme.primary }]}>{t('continue')}</Text>
                <Feather name="arrow-right" size={14} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* 3. DYNAMIC STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData?.orders}</Text>
              <Text style={styles.statLabel}>{t('orders')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {role === 'seller' ? userData?.earnings : userData?.spent}
              </Text>
              <Text style={styles.statLabel}>
                {role === 'seller' ? 'Earnings' : 'Spent'}
              </Text>
            </View>
          </View>

          {/* 4. MENU SECTIONS */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>{t('personal_info')}</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon="smartphone" title={t('phone_number')} subtitle={userData?.phone || t('add')} color={theme.primary} />
              <MenuItem icon="mail" title="Email" subtitle={userData?.email || t('add')} color={theme.primary} />
              <MenuItem icon="credit-card" title="Aadhar / KYC" subtitle={userData?.aadhar ? t('success') : t('pending')} color={theme.primary} />
              <MenuItem icon="lock" title="Ethereum Wallet" subtitle={userData?.walletAddress || 'Tap to set dummy wallet'} color={theme.primary} isLast onPress={handleWalletPress} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>App Settings</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon="map-pin" title="Saved Addresses" color={COLORS.textMain} />
              <MenuItem icon="bell" title="Notifications" color={COLORS.textMain} />
              <MenuItem icon="share-2" title="Refer a Friend" color={COLORS.textMain} isLast />
            </View>
          </View>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={18} color={COLORS.danger} />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Farm2Market v1.0 • Secure</Text>

        </View>
      </ScrollView>

      {/* Wallet Edit Modal */}
      <Modal animationType="slide" transparent={true} visible={walletModalVisible} onRequestClose={() => setWalletModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.walletModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Ethereum Wallet</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.textSec} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Mock/Dummy Ethereum Address (0x...)</Text>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              value={tempWalletAddress}
              onChangeText={setTempWalletAddress}
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={handleAutoFill} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600', textDecorationLine: 'underline' }}>
                💡 Tap here to auto-fill a valid test account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={saveWalletAddress}>
              <Text style={styles.submitBtnText}>Link Wallet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// 🛠 MINI COMPONENT: MENU ITEM
const MenuItem = ({ icon, title, subtitle, color, isLast, onPress }) => (
  <TouchableOpacity style={[styles.menuItem, isLast && styles.menuItemLast]} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
      <Feather name={icon} size={18} color={color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Feather name="chevron-right" size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // HEADER
  headerContainer: {
    marginBottom: 70, // Overlap space
  },
  gradientHeader: {
    height: 220, // Slightly taller for more premium feel
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 48, // Smoother curves
    borderBottomRightRadius: 48,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24, // Larger title
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  settingsBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
  },

  // FLOATING CARD
  profileCard: {
    position: 'absolute',
    top: 120,
    left: 24,
    right: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 32, // Softer radius
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8, // Softer shadow
  },
  avatarContainer: {
    marginTop: -60, // Pull up
    marginBottom: 16,
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 100, // Larger avatar
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  avatarText: {
    fontSize: 36, // Larger text
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 24,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20, // Softer
    width: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },

  // BODY
  bodyContainer: {
    paddingHorizontal: 24,
  },

  // COMPLETION
  completionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24, // Softer
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4, // Subtle elevation
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  completionSub: {
    fontSize: 13,
    color: COLORS.textSec,
    maxWidth: 220,
  },
  completionPercent: {
    fontSize: 22,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 10, // Thicker bar
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  completeNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeNowText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // STATS
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSec,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },

  // MENUS
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMain,
  },
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.textSec,
    marginTop: 2,
  },

  // LOGOUT
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
    marginBottom: 40,
  },
  walletModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.textMain,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;