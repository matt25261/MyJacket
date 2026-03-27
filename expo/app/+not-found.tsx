import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { XCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View style={styles.container}>
        <XCircle size={64} color={Colors.dark.error} />
        <Text style={styles.title}>Page introuvable</Text>
        <Text style={styles.subtitle}>Cette page n&apos;existe pas.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour au dashboard</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.dark.background,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.dark.text,
  },
});
