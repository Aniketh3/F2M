import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage, TranslatedText } from '../context/LanguageContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

const COLORS = {
  primary: '#10B981',     
  primaryDark: '#047857', 
  background: '#F8FAFC',  
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
};

const SellerChatScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchMessages();
    clearChatNotifications();

    // Use polling for real-time feel without Socket.io
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const clearChatNotifications = async () => {
    try {
      const info = await AsyncStorage.getItem('sellerInfo');
      if (info) {
        const username = JSON.parse(info).Name;
        await axios.post(`${BACKEND_URL}/clearChatNotifications?username=${username}`);
      }
    } catch (e) {
      console.log('Error clearing notifications', e);
    }
  };

  const fetchUserData = async () => {
    try {
      const info = await AsyncStorage.getItem('sellerInfo');
      if (info) {
        setSenderName(JSON.parse(info).Name);
      }
    } catch (e) {
      console.log('Error fetching user info', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/messages`);
      setMessages(response.data);
    } catch (e) {
      console.log('Error fetching messages', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const payload = {
        sender: senderName || 'Anonymous Seller',
        content: newMessage.trim(),
        role: 'seller'
      };
      await axios.post(`${BACKEND_URL}/messages`, payload);
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender === senderName;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        {!isMe && <Text style={styles.senderName}>{item.sender}</Text>}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <TranslatedText 
            style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}
            text={item.content}
          />
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('community_chat')}</Text>
            <Text style={styles.headerSub}>{t('connect_farmers')}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('type_message')}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 5 },
  headerTextContainer: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#D1FAE5', fontSize: 12 },
  messageList: { padding: 20, paddingBottom: 30 },
  messageWrapper: { marginBottom: 15, maxWidth: '80%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  otherMessageWrapper: { alignSelf: 'flex-start' },
  senderName: { fontSize: 12, color: COLORS.textSec, marginBottom: 4, marginLeft: 10 },
  messageBubble: { padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#fff' },
  otherMessageText: { color: COLORS.textMain },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimestamp: { color: '#D1FAE5' },
  otherTimestamp: { color: COLORS.textSec },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border,
    alignItems: 'center',
    paddingBottom: 20
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: { 
    backgroundColor: COLORS.primary, 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: { backgroundColor: '#CBD5E1' }
});

export default SellerChatScreen;
