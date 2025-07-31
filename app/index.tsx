import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";

export default function Index() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/Contxtra logo-13 copy.png")}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.welcomeText}>Welcome to Contxtra</Text>
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
  },
});
