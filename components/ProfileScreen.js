import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const ProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('A R Muthudhanush');
  const [email, setEmail] = useState('dhanush26@example.com');

  const handleEditPress = () => {
    navigation.navigate('EditProfile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.avatar}/>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
          <Icon name="edit" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option}>
          <Icon name="user" size={20} color="#3A5A40" style={styles.optionIcon} />
          <Text style={styles.optionText}>My Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Icon name="sign-out" size={20} color="#3A5A40" style={styles.optionIcon} />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Icon name="question-circle" size={20} color="#3A5A40" style={styles.optionIcon} />
          <Text style={styles.optionText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Icon name="info-circle" size={20} color="#3A5A40" style={styles.optionIcon} />
          <Text style={styles.optionText}>About App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A5A40',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  email: {
    fontSize: 16,
    color: '#FFF',
  },
  editButton: {
    padding: 10,
    backgroundColor: '#588157',
    borderRadius: 20,
  },
  optionsContainer: {
    marginTop: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#3A5A40',
  },
});

export default ProfileScreen;