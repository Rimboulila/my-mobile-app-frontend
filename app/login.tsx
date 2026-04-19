import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 48 : isSmallPhone ? 34 : 44;
  const lineHeight = isTablet ? 50 : isSmallPhone ? 36 : 46;

  const API_BASE = "https://my-mobile-app-backend.onrender.com";

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Username or password has been typed wrong");
      return;
    }

    setLoading(true);
    try {
      console.log("CALLING:", `${API_BASE}/api/auth/login`);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Login has failed, probably a backend issue");
        return;
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      router.replace("/patient");
    } catch (e) {
      alert("Backend is not running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPad },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.phone}>
            <Text
              style={[
                styles.title,
                { fontSize: titleSize, lineHeight: lineHeight },
              ]}
            >
              Appointment{"\n"}Booking{"\n"}System
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Type in your Username (email)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Type in your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              style={styles.btn}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? "Signing in... Please wait" : "Sign In"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.btn}
              onPress={() => router.push("/userChoice")}
            >
              <Text style={styles.btnText}>Register</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efeff2",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 70,
  },

  phone: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  title: {
    fontWeight: "500",
    color: "#111",
    marginBottom: 50,
  },

  field: {
    marginBottom: 22,
  },

  label: {
    fontSize: 11,
    letterSpacing: 1,
    color: "#333",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  btn: {
    marginTop: 18,
    backgroundColor: "#0b5ed7",
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },

  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});
