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
  Image,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { storage } from '../services/firebaseConfig';
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
  
  // Media State
  const [selectedImage, setSelectedImage] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sound, setSound] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  
  // Advanced Recording & Playback State
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const recordingTimer = useRef(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchMessages();
    clearChatNotifications();

    // Use polling for real-time feel without Socket.io
    const interval = setInterval(fetchMessages, 3000);
    return () => {
       clearInterval(interval);
       if (sound) sound.unloadAsync();
       if (recording) recording.stopAndUnloadAsync();
       if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [sound, recording]);

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

  // 📸 PICK IMAGE
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need permissions to access your photos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 📸 TAKE PHOTO WITH CAMERA
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need permissions to access your camera.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 📍 LOCATION SHARING
  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need your permission to access location.');
        return;
      }

      setSending(true);
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      await handleSendMessage(null, null, { latitude, longitude });
    } catch (e) {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setSending(false);
    }
  };


  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => setRecordingDuration(status.durationMillis || 0)
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingUri(null);
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordingUri(uri);
    } catch (err) {
      console.error('Stop error', err);
    }
  };

  const cancelRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setIsRecording(false);
      setRecordingUri(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Cancel error', err);
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // ☁️ FIREBASE UPLOAD
  const uploadFile = async (uri, type) => {
    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.log(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const filename = `${Date.now()}_${type}`;
      const storageRef = ref(storage, `chat/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Close blob to free memory
      if (blob.close) blob.close();
      
      return downloadUrl;
    } catch (e) {
      console.error('Upload error', e);
      return null;
    }
  };

  const handleSendMessage = async (imgUri = null, audUri = null, loc = null) => {
    const finalAudUri = audUri || recordingUri;
    const textMsg = newMessage.trim();
    
    if (!textMsg && !imgUri && !finalAudUri && !selectedImage && !loc) return;

    setSending(true);
    try {
      let imageUrl = null;
      let audioUrl = null;

      if (imgUri || selectedImage) {
        imageUrl = await uploadFile(imgUri || selectedImage, 'image');
      }

      if (finalAudUri) {
        audioUrl = await uploadFile(finalAudUri, 'audio');
      }

      const payload = {
        sender: senderName || 'Anonymous Seller',
        content: textMsg,
        imageUrl,
        audioUrl,
        location: loc,
        role: 'seller'
      };

      await axios.post(`${BACKEND_URL}/messages`, payload);
      setNewMessage('');
      setSelectedImage(null);
      setRecordingUri(null);
      setRecordingDuration(0);
      fetchMessages();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    Alert.alert(
      t('delete_message_title') || 'Delete Message',
      t('delete_message_confirm') || 'Are you sure you want to delete this message?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/messages/${id}`);
              fetchMessages();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete message.');
            }
          }
        }
      ]
    );
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      setPlayingMessageId(null);
      setIsPlaybackPaused(false);
    }
  };

  const playSound = async (url, messageId = 'preview') => {
    try {
      // If tapping the same message that's currently playing
      if (playingMessageId === messageId) {
        if (isPlaybackPaused) {
          await sound.playAsync();
          setIsPlaybackPaused(false);
        } else {
          await sound.pauseAsync();
          setIsPlaybackPaused(true);
        }
        return;
      }

      // If a different sound was playing, unload it first
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setPlayingMessageId(messageId);
      setIsPlaybackPaused(false);
    } catch (e) {
      console.error('Playback error', e);
      Alert.alert('Error', 'Could not play audio.');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender === senderName;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        {!isMe && <Text style={styles.senderName}>{item.sender}</Text>}
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => isMe && handleDeleteMessage(item._id)}
          style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}
        >
          {item.imageUrl && (
            <TouchableOpacity 
              onPress={() => setViewingImage(item.imageUrl)}
              onLongPress={() => isMe && handleDeleteMessage(item._id)}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
            </TouchableOpacity>
          )}

          {item.location && item.location.latitude && (
            <TouchableOpacity 
              style={styles.locationContainer} 
              onPress={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`;
                Linking.openURL(url);
              }}
              onLongPress={() => isMe && handleDeleteMessage(item._id)}
            >
              <MaterialCommunityIcons name="map-marker-radius" size={32} color={isMe ? "#fff" : COLORS.primary} />
              <View>
                <Text style={[styles.locationText, { color: isMe ? "#fff" : COLORS.textMain }]}>Current Location</Text>
                <Text style={[styles.locationSub, { color: isMe ? "#D1FAE5" : COLORS.textSec }]}>Tap to view on map</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {item.audioUrl && (
            <TouchableOpacity 
              style={styles.audioPlayer} 
              onPress={() => playSound(item.audioUrl, item._id)}
              onLongPress={() => isMe && handleDeleteMessage(item._id)}
            >
              <MaterialCommunityIcons 
                name={playingMessageId === item._id && !isPlaybackPaused ? "pause-circle" : "play-circle"} 
                size={34} 
                color={isMe ? "#fff" : COLORS.primary} 
              />
              <View>
                <Text style={[styles.audioText, { color: isMe ? "#fff" : COLORS.textMain }]}>Voice Message</Text>
                {playingMessageId === item._id && (
                  <Text style={[styles.playingStatus, { color: isMe ? "#D1FAE5" : COLORS.primary }]}>
                    {isPlaybackPaused ? 'Paused' : 'Playing...'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {item.content ? (
            <TranslatedText 
              style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}
              text={item.content}
            />
          ) : null}
          
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.otherTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
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
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedImage(null)}>
              <Feather name="x-circle" size={24} color={'#EF4444'} />
            </TouchableOpacity>
          </View>
        )}

        {isRecording ? (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecording}>
                <Text style={styles.cancelText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopActionBtn} onPress={stopRecording}>
                <MaterialCommunityIcons name="stop" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : recordingUri ? (
          <View style={styles.previewContainer}>
            <View style={styles.audioPreviewInfo}>
              <MaterialCommunityIcons name="microphone-outline" size={24} color={COLORS.primary} />
              <Text style={styles.audioPreviewText}>Voice Message ({formatDuration(recordingDuration)})</Text>
            </View>
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={[styles.previewPlayBtn, playingMessageId === 'preview' && !isPlaybackPaused && styles.playingPreviewBtn]} 
                onPress={() => playSound(recordingUri, 'preview')}
              >
                <Feather 
                  name={playingMessageId === 'preview' && !isPlaybackPaused ? "pause" : "play"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.previewDiscardBtn} onPress={() => setRecordingUri(null)}>
                <Feather name="trash-2" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.previewSendBtn} 
                onPress={() => handleSendMessage()}
                disabled={sending}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <Feather name="image" size={22} color={COLORS.textSec} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
              <Feather name="camera" size={22} color={COLORS.textSec} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton} onPress={sendLocation}>
              <Feather name="map-pin" size={22} color={COLORS.textSec} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder={t('type_message')}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />

            {newMessage.trim() || selectedImage ? (
              <TouchableOpacity 
                style={[styles.sendButton, styles.mainSendBtn]} 
                onPress={() => handleSendMessage()}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialCommunityIcons name="send" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.sendButton, styles.micBtn]} 
                onPress={startRecording}
              >
                <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* FULL SCREEN IMAGE MODAL */}
      <Modal visible={!!viewingImage} transparent={true} onRequestClose={() => setViewingImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeModal} onPress={() => setViewingImage(null)}>
            <Feather name="x" size={32} color="#fff" />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
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
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mainSendBtn: { backgroundColor: COLORS.primary },
  micBtn: { backgroundColor: '#6366F1' }, // Indigo for mic
  recordingBtn: { backgroundColor: '#EF4444' }, // Red for recording
  sendButtonDisabled: { backgroundColor: '#CBD5E1' },
  mediaButton: { padding: 8, marginRight: 2 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 5 },
  locationText: { fontSize: 15, fontWeight: '600' },
  locationSub: { fontSize: 11 },
  messageImage: { 
    width: Dimensions.get('window').width * 0.65, 
    height: undefined, 
    aspectRatio: 1.3, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  audioPlayer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  audioText: { fontSize: 14, fontWeight: '600' },
  previewContainer: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', alignItems: 'flex-end' },
  imagePreview: { width: 60, height: 60, borderRadius: 8 },
  removePreview: { position: 'absolute', top: 5, left: 55, backgroundColor: '#fff', borderRadius: 12 },
  recordingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center' },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 10 },
  recordingTimer: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },
  recordingActions: { flexDirection: 'row', alignItems: 'center' },
  cancelBtn: { marginRight: 20 },
  cancelText: { color: COLORS.textSec, fontSize: 16 },
  stopActionBtn: { backgroundColor: '#EF4444', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  audioPreviewInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  audioPreviewText: { marginLeft: 10, fontSize: 15, color: COLORS.textMain },
  previewActions: { flexDirection: 'row', gap: 10 },
  previewPlayBtn: { backgroundColor: COLORS.primary, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  previewDiscardBtn: { backgroundColor: '#64748B', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  previewSendBtn: { backgroundColor: '#6366F1', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  playingStatus: { fontSize: 10, fontWeight: 'bold' },
  playingPreviewBtn: { backgroundColor: '#EF4444' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '80%' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10 }
});

export default SellerChatScreen;
