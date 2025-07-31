import { Text, View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";

export default function Index() {
  const [link, setLink] = useState("");
  const [showSent, setShowSent] = useState(false);

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

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Contxtra logo-13 copy.png")}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.welcomeText}>Welcome to Contxtra</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Paste your link here..."
          value={link}
          onChangeText={setLink}
          multiline={false}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={!link.trim()}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
      
      {showSent && (
        <Text style={styles.sentMessage}>SENT</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: "#fad976",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  sentMessage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 10,
  },
});
