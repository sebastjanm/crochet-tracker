import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Oops!</Text>
        <Text style={styles.subtitle}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.charcoal,
    opacity: 0.7,
    marginBottom: 32,
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.sage,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: "600",
  },
});
