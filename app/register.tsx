import DateTimePicker from "@react-native-community/datetimepicker";
import { Href, useRouter } from "expo-router";
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

export default function Register() {
  const router = useRouter();

  const API_BASE = "https://my-mobile-app-backend.onrender.com";

  const [form, setForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 40 : isSmallPhone ? 32 : 44;

  const update = (key: keyof typeof form) => (text: string) =>
    setForm((prev) => ({ ...prev, [key]: text }));

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  };

  const isAtLeast18 = (birthDate: Date | null) => {
    if (!birthDate) return false;

    const today = new Date();

    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );

    return birthDate <= eighteenYearsAgo;
  };

  const handleRegister = async () => {
    setError(null);

    if (
      !form.username.trim() ||
      !form.password ||
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !birthday
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(form.username.trim().toLowerCase())) {
      setError("Please enter a correct email address.");
      return;
    }

    if (!isValidPassword(form.password)) {
      setError(
        "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, and 1 special character.",
      );
      return;
    }

    if (form.firstName.trim().length < 3) {
      setError("First name must be at least 3 characters.");
      return;
    }

    if (form.lastName.trim().length < 3) {
      setError("Last name must be at least 3 characters.");
      return;
    }

    if (!isAtLeast18(birthday)) {
      setError("You must be at least 18 years old.");
      return;
    }

    const digitsOnlyPhone = form.phone.replace(/\D/g, "");
    if (digitsOnlyPhone.length < 8) {
      setError("Phone number must be at least 8 digits.");
      return;
    }

    if (form.address.trim().length < 8) {
      setError("Address must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.username.trim().toLowerCase(),
          password: form.password,
          role: "patient",
          birthday: formatDate(birthday),
          phone: digitsOnlyPhone,
          address: form.address.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.message || "Registration failed");
        return;
      }

      router.replace("/login" as Href);
    } catch (e) {
      setError("Your backend is not working.");
    } finally {
      setLoading(false);
    }
  };

  const maxBirthday = new Date();
  maxBirthday.setFullYear(maxBirthday.getFullYear() - 18);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.phone, { paddingHorizontal: horizontalPad }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.replace("/userChoice" as Href)}
          >
            <Text style={styles.backText}>Go back</Text>
          </Pressable>

          <Text style={[styles.title, { fontSize: titleSize }]}>
            Registration
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Field
              label="EMAIL"
              placeholder="Type in your email"
              value={form.username}
              onChangeText={update("username")}
              keyboard="email-address"
            />

            <Field
              label="PASSWORD"
              placeholder="Type in your password"
              value={form.password}
              onChangeText={update("password")}
              secure
            />

            <Field
              label="FIRST NAME"
              placeholder="Type in your first name"
              value={form.firstName}
              onChangeText={update("firstName")}
            />

            <Field
              label="LAST NAME"
              placeholder="Type in your last name"
              value={form.lastName}
              onChangeText={update("lastName")}
            />

            <View style={styles.field}>
              <Text style={styles.label}>BIRTHDAY</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowBirthdayPicker(true)}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    !birthday && styles.placeholderText,
                  ]}
                >
                  {birthday ? formatDate(birthday) : "Choose your birthday"}
                </Text>
              </Pressable>
            </View>

            {showBirthdayPicker && (
              <DateTimePicker
                value={birthday || maxBirthday}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={maxBirthday}
                onChange={(event, selectedDate) => {
                  setShowBirthdayPicker(false);
                  if (selectedDate) {
                    setBirthday(selectedDate);
                  }
                }}
              />
            )}

            <Field
              label="PHONE"
              placeholder="Type in your phone number"
              value={form.phone}
              onChangeText={update("phone")}
              keyboard="phone-pad"
            />

            <Field
              label="ADDRESS"
              placeholder="Type in your address"
              value={form.address}
              onChangeText={update("address")}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={styles.confirmBtn}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.confirmText}>
                {loading ? "PLEASE WAIT..." : "CONFIRM"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secure,
  keyboard,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  keyboard?: "default" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboard ?? "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efeff2",
  },

  phone: {
    width: "100%",
    maxWidth: 500,
    flex: 1,
    alignSelf: "center",
    paddingTop: 30,
  },

  scroll: {
    flex: 1,
  },

  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#0b5ed7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  backText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  title: {
    fontWeight: "800",
    color: "#111",
    marginTop: 24,
    marginBottom: 20,
  },

  form: {
    paddingBottom: 80,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontSize: 10,
    letterSpacing: 1,
    color: "#333",
    marginBottom: 6,
  },

  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
  },

  dateButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  dateButtonText: {
    fontSize: 12,
    color: "#111",
  },

  placeholderText: {
    color: "#777",
  },

  errorText: {
    color: "crimson",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },

  confirmBtn: {
    marginTop: 22,
    width: "72%",
    alignSelf: "center",
    backgroundColor: "#0b5ed7",
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: "center",
  },

  confirmText: {
    color: "white",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
