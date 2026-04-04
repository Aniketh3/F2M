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
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { storage } from '../services/firebaseConfig';
import axios from 'axios';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage, TranslatedText } from '../context/LanguageContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

const PrivateChatScreen = ({ route, navigation }) => {
  const { recipientName, recipientRole, userName, userRole } = route.params;
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Dynamic Theme
  const COLORS = userRole === 'seller' ? {
    primary: '#10B981',     
    primaryDark: '#047857', 
    background: '#F8FAFC',
    textMain: '#0F172A',
    textSec: '#64748B',
    border: '#E2E8F0',
  } : {
    primary: '#F59E0B',      
    primaryDark: '#B45309',  
    background: '#F8FAFC',
    textMain: '#0F172A',
    textSec: '#64748B',
    border: '#E2E8F0',
  };

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
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => {
       clearInterval(interval);
       if (sound) sound.unloadAsync();
       if (recording) recording.stopAndUnloadAsync();
       if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [sound, recording]);

  const fetchMessages = async () => {
    try {
      const url = `${BACKEND_URL}/private-messages?user1=${encodeURIComponent(userName)}&user2=${encodeURIComponent(recipientName)}`;
      console.log('PrivateChatScreen: Fetching from:', url);
      const response = await axios.get(url);
      setMessages(response.data);
    } catch (e) {
      console.log('PrivateChatScreen: Error fetching messages', e);
    } finally {
      setLoading(false);
    }
  };

  // 📸 PICK IMAGE
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied', 'We need permissions to access your photos.');
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  // 📸 TAKE PHOTO
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied', 'We need permissions to access your camera.');
    let result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  // 📍 LOCATION
  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'We need your permission to access location.');
      setSending(true);
      const location = await Location.getCurrentPositionAsync({});
      await handleSendMessage(null, null, { latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch (e) {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setSending(false);
    }
  };

  // 🎙️ AUDIO RECORDING
  const startRecording = async () => {
    try {
      if (recording) await recording.stopAndUnloadAsync();
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => setRecordingDuration(status.durationMillis || 0)
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
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
    } catch (err) {}
  };

  const cancelRecording = async () => {
    if (recording) await recording.stopAndUnloadAsync();
    setRecording(null);
    setIsRecording(false);
    setRecordingUri(null);
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const uploadFile = async (uri, type) => {
    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new TypeError("Network request failed"));
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });
      const storageRef = ref(storage, `private_chat/${Date.now()}_${type}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      if (blob.close) blob.close();
      return url;
    } catch (e) {
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

      if (imgUri || selectedImage) imageUrl = await uploadFile(imgUri || selectedImage, 'image');
      if (finalAudUri) audioUrl = await uploadFile(finalAudUri, 'audio');

      const payload = {
        sender: userName,
        recipient: recipientName,
        chatType: 'private',
        content: textMsg,
        imageUrl,
        audioUrl,
        location: loc,
        role: userRole
      };

      await axios.post(`${BACKEND_URL}/messages`, payload);
      setNewMessage('');
      setSelectedImage(null);
      setRecordingUri(null);
      fetchMessages();
    } catch (e) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    Alert.alert(t('delete'), t('delete_message_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${BACKEND_URL}/messages/${id}`);
            fetchMessages();
          } catch (e) {}
        }
      }
    ]);
  };

  const playSound = async (url, messageId) => {
    try {
      if (playingMessageId === messageId) {
        if (isPlaybackPaused) { await sound.playAsync(); setIsPlaybackPaused(false); }
        else { await sound.pauseAsync(); setIsPlaybackPaused(true); }
        return;
      }
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }, 
        s => s.didJustFinish && (setPlayingMessageId(null), setIsPlaybackPaused(false)));
      setSound(newSound);
      setPlayingMessageId(messageId);
      setIsPlaybackPaused(false);
    } catch (e) {}
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender === userName;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => isMe && handleDeleteMessage(item._id)}
          style={[styles.messageBubble, isMe ? { backgroundColor: COLORS.primary } : styles.otherBubble]}
        >
          {item.imageUrl && (
            <TouchableOpacity onPress={() => setViewingImage(item.imageUrl)} onLongPress={() => isMe && handleDeleteMessage(item._id)}>
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
            </TouchableOpacity>
          )}

          {item.location && item.location.latitude && (
            <TouchableOpacity style={styles.mediaRow} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`)}>
              <MaterialCommunityIcons name="map-marker" size={24} color={isMe ? "#fff" : COLORS.primary} />
              <Text style={{ color: isMe ? "#fff" : COLORS.textMain }}>Location Shared</Text>
            </TouchableOpacity>
          )}
          
          {item.audioUrl && (
            <TouchableOpacity style={styles.mediaRow} onPress={() => playSound(item.audioUrl, item._id)}>
              <MaterialCommunityIcons name={playingMessageId === item._id && !isPlaybackPaused ? "pause" : "play"} size={24} color={isMe ? "#fff" : COLORS.primary} />
              <Text style={{ color: isMe ? "#fff" : COLORS.textMain }}>Voice Message</Text>
            </TouchableOpacity>
          )}

          {item.content ? <Text style={[styles.messageText, { color: isMe ? "#fff" : COLORS.textMain }]}>{item.content}</Text> : null}
          <Text style={[styles.timestamp, { color: isMe ? "#D1FAE5" : COLORS.textSec }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="chevron-left" size={28} color="#fff" /></TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.headerTitle}>{recipientName}</Text>
              <Text style={styles.headerSub}>Private Conversation</Text>
            </View>
            <View style={{ width: 28 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {selectedImage && (
          <View style={styles.preview}>
            <Image source={{ uri: selectedImage }} style={styles.imgPreview} />
            <TouchableOpacity onPress={() => setSelectedImage(null)}><Feather name="x-circle" size={24} color="red" /></TouchableOpacity>
          </View>
        )}
        
        {isRecording ? (
          <View style={styles.inputContainer}>
            <Text style={{ color: 'red', flex: 1 }}>Recording... {formatDuration(recordingDuration)}</Text>
            <TouchableOpacity onPress={cancelRecording} style={{ marginRight: 20 }}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={stopRecording}><MaterialCommunityIcons name="stop" size={30} color="red" /></TouchableOpacity>
          </View>
        ) : recordingUri ? (
          <View style={styles.inputContainer}>
            <Text style={{ flex: 1 }}>Voice message ready</Text>
            <TouchableOpacity onPress={() => setRecordingUri(null)}><Feather name="trash-2" size={24} color="gray" /></TouchableOpacity>
            <TouchableOpacity onPress={() => handleSendMessage()}><Feather name="send" size={24} color={COLORS.primary} /></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={pickImage}><Feather name="image" size={24} color="gray" /></TouchableOpacity>
            <TouchableOpacity onPress={takePhoto}><Feather name="camera" size={24} color="gray" /></TouchableOpacity>
            <TouchableOpacity onPress={sendLocation}><Feather name="map-pin" size={24} color="gray" /></TouchableOpacity>
            <TextInput style={styles.input} value={newMessage} onChangeText={setNewMessage} placeholder="Type a message..." multiline />
            {newMessage.trim() || selectedImage ? (
              <TouchableOpacity onPress={() => handleSendMessage()}><MaterialCommunityIcons name="send" size={28} color={COLORS.primary} /></TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={startRecording}><MaterialCommunityIcons name="microphone" size={28} color={COLORS.primary} /></TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={!!viewingImage} transparent={true}><View style={styles.modal}><TouchableOpacity onPress={() => setViewingImage(null)} style={styles.closeModal}><Feather name="x" size={32} color="#fff" /></TouchableOpacity><Image source={{ uri: viewingImage }} style={styles.fullImg} resizeMode="contain" /></View></Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingBottom: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#eee', fontSize: 12 },
  messageList: { padding: 15 },
  messageWrapper: { marginBottom: 12, maxWidth: '80%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  otherMessageWrapper: { alignSelf: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 16 },
  otherBubble: { backgroundColor: '#fff', elevation: 1 },
  messageText: { fontSize: 15, marginVertical: 4 },
  timestamp: { fontSize: 10, alignSelf: 'flex-end' },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 5 },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 80 },
  preview: { padding: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10 },
  imgPreview: { width: 50, height: 50, borderRadius: 8 },
  modal: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  fullImg: { width: '100%', height: '80%' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 1 }
});

export default PrivateChatScreen;
