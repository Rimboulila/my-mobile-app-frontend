import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

export default function Admin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;

  const handleAdminLogin = async () => {
    if (!adminPassword) {
      Alert.alert("Error", "Please enter admin password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPassword }),
      });

      const data = await response.json();
      console.log("ADMIN LOGIN RESPONSE:", data);

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Admin login failed.");
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      router.replace("/receptionist");
    } catch (error) {
      console.log("ADMIN LOGIN ERROR:", error);
      Alert.alert("Error", "Could not log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.screen, { paddingHorizontal: horizontalPad }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.phone}>
              <Pressable
                style={styles.backBtn}
                onPress={() => router.replace("/userChoice")}
              >
                <Text style={styles.backText}>Go back</Text>
              </Pressable>

              <View style={styles.centerBlock}>
                <Text style={styles.label}>TYPE IN ADMIN PASSWORD</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Type in Admin Password"
                  secureTextEntry
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                />

                <Pressable style={styles.confirmBtn} onPress={handleAdminLogin}>
                  <Text style={styles.confirmText}>
                    {loading ? "LOADING..." : "CONFIRM"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#efeff2",
  },

  screen: {
    flex: 1,
    backgroundColor: "#efeff2",
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 30,
  },

  phone: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#0b5ed7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    shadowColor: "#ffffff",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },

  backText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  centerBlock: {
    marginTop: 140,
    alignItems: "center",
    width: "100%",
  },

  label: {
    fontSize: 10,
    letterSpacing: 1,
    color: "#333",
    marginBottom: 6,
    alignSelf: "flex-start",
    width: "100%",
    maxWidth: 320,
  },

  input: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  confirmBtn: {
    marginTop: 40,
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0b5ed7",
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },

  confirmText: {
    color: "white",
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
