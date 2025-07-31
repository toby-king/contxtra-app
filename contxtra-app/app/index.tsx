import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';

export default function Index() {
  const [link, setLink] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const handleSubmit = () => {
    if (link.trim()) {
      setShowMessage(true);
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    } else {
      Alert.alert('Please enter a link');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image 
        source={require('../assets/images/Contxtra logo-13.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Input Box */}
      <TextInput
        style={styles.input}
        placeholder="Paste your link here..."
        value={link}
        onChangeText={setLink}
        multiline={false}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      
      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      
      {/* Success Message */}
      {showMessage && (
        <Text style={styles.successMessage}>SENT!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
});