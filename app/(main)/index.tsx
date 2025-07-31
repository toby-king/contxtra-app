import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { useState, useCallback } from "react";
import { Send, LogOut } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

export default function Index() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signOut, user } = useAuth();

  const isValidLink = useCallback((url: string) => {
    const trimmedUrl = url.trim();
    // Check for X (Twitter) links
    const xPatterns = [
      /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/,
    ];
    // Check for Bluesky links
    const blueskyPatterns = [
      /^https?:\/\/bsky\.app\/profile\/[\w.-]+\/post\/[\w]+/,
    ];
    
    return xPatterns.some(pattern => pattern.test(trimmedUrl)) || 
           blueskyPatterns.some(pattern => pattern.test(trimmedUrl));
  }, []);

  const handleSubmit = async () => {
    const trimmedLink = link.trim();
    
    if (!trimmedLink) {
      setError("Please enter a link");
      return;
    }

    if (!isValidLink(trimmedLink)) {
      setError("Please enter a valid X (Twitter) or Bluesky post link");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://contxtra-api-267101235988.us-central1.run.app/find-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedLink }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.text();
      setResult(data);
      setLink(""); // Clear the input after successful submission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
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
            style={styles.logo}
            contentFit="contain"
          />
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Paste X or Bluesky post link here..."
                value={link}
                placeholderTextColor="#666"
                onChangeText={setLink}
                multiline={false}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!link.trim() || loading) && styles.sendButtonDisabled]} 
                onPress={handleSubmit}
                disabled={!link.trim() || loading}
              >
                <Send 
                  size={20} 
                  color={(!link.trim() || loading) ? "#ccc" : "#333"} 
                />
              </TouchableOpacity>
            </View>
            
          {loading && (
            <Text style={styles.loadingMessage}>Processing...</Text>
          )}
          
          {error && (
            <Text style={styles.errorMessage}>{error}</Text>
          )}
          
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )
          }
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
  loadingMessage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: "#ff4444",
    marginTop: 15,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
    maxWidth: 400,
  },
  resultText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginTop: 15,
  },
});