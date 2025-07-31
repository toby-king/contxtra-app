import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { Send, LogOut } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const [link, setLink] = useState("");
  const [showSent, setShowSent] = useState(false);
  const { signOut, user } = useAuth();

  const handleSubmit = () => {
    if (link.trim()) {
      setShowSent(true);
      // Hide the message after 3 seconds
      setTimeout(() => {
        setShowSent(false);
        setLink("");
      }, 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <LogOut size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Image
            source={require("../../assets/images/Contxtra logo-13 copy.png")}
            style={styles.logo}
            contentFit="contain"
          />
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Paste your link here..."
                placeholderTextColor="#666"
                value={link}
                onChangeText={setLink}
                multiline={false}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !link.trim() && styles.sendButtonDisabled]} 
                onPress={handleSubmit}
                disabled={!link.trim()}
              >
                <Send 
                  size={20} 
                  color={!link.trim() ? "#ccc" : "#333"} 
                />
              </TouchableOpacity>
            </View>
            
            {showSent && (
              <Text style={styles.sentMessage}>SENT</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f7fa",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  topSection: {
    alignItems: "center",
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logo: {
    width: "75%",
    height: 150,
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 20,
    paddingVertical: 15,
    width: "100%",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingRight: 10,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fad976",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#f0f0f0",
  },
  sentMessage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 15,
  },
});