import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

const ChatListScreen = ({ route, navigation }) => {
  const { t } = useLanguage();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ Name: '', role: '' });

  const fetchConnections = async () => {
    try {
      // 1. Safely extract params from navigation first
      let uName = route?.params?.userName;
      let uRole = route?.params?.role;

      // Fallback to storage if params are missing
      if (!uName || !uRole) {
        const sInfo = await AsyncStorage.getItem('sellerInfo');
        const bInfo = await AsyncStorage.getItem('buyerInfo');
        if (sInfo) { uName = JSON.parse(sInfo).Name; uRole = 'seller'; }
        else if (bInfo) { uName = JSON.parse(bInfo).Name; uRole = 'buyer'; }
      }

      if (!uName) {
        setLoading(false);
        return;
      }

      setUser({ Name: uName, role: uRole });

      // 2. Fetch data (no more 404 errors!)
      const url = `${BACKEND_URL}/chat-connections?username=${encodeURIComponent(uName)}&role=${uRole}`;
      const res = await axios.get(url);
      setConnections(res.data.connections || []);

    } catch (e) {
      console.log('Error fetching chat connections', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConnections();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PrivateChat', {
        recipientName: item.name,
        recipientRole: item.role,
        userName: user.Name, // Guaranteed to be passed now
        userRole: user.role
      })}
    >
      <View style={styles.avatar}>
        <MaterialCommunityIcons name={item.role === 'seller' ? 'storefront-outline' : 'account-outline'} size={24} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.roleText}>{item.role === 'seller' ? 'Seller' : 'Buyer'}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  const COLORS = user?.role === 'seller' ? { primary: '#10B981', secondary: '#059669' } : { primary: '#F59E0B', secondary: '#D97706' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.primary || '#10B981', COLORS.secondary || '#059669']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('messages') || 'Messages'}</Text>
            <Text style={styles.headerSub}>1-on-1 Conversations</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary || '#10B981'} />
        </View>
      ) : (
        <FlatList
          data={connections}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="message-off-outline" size={64} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptySub}>Chats appear here once a purchase request is accepted.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 60, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTextContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  backButton: { padding: 5 },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#64748B', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  roleText: { fontSize: 12, color: '#64748B', marginTop: 2, textTransform: 'capitalize' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#475569', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 20 }
});

export default ChatListScreen;