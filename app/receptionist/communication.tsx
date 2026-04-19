import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Patient = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

export default function Communication() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 36 : isSmallPhone ? 26 : 32;
  const navHeight = isTablet ? 72 : 60;
  const navIconSize = isTablet ? 22 : 18;

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No token found.");
        setPatients([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/patients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Failed to load patients.");
        setPatients([]);
        return;
      }

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", "Could not load patients.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPatient) {
      Alert.alert("Error", "Please select a patient.");
      return;
    }

    if (!messageText.trim()) {
      Alert.alert("Error", "Please type a message.");
      return;
    }

    try {
      setSending(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No token found.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedPatient._id,
          text: messageText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Failed to send message.");
        return;
      }

      Alert.alert("Success", "Message sent successfully.");
      setMessageText("");
    } catch (error) {
      Alert.alert("Error", "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const fullName =
      `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
    const email = (patient.email || "").toLowerCase();
    const query = search.toLowerCase();

    return fullName.includes(query) || email.includes(query);
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.screen, { paddingHorizontal: horizontalPad }]}>
        <View style={styles.phone}>
          <Text style={[styles.title, { fontSize: titleSize }]}>
            Communication
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search patient..."
            value={search}
            onChangeText={setSearch}
          />

          <ScrollView
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: navHeight + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <Text style={styles.emptyText}>Loading patients...</Text>
            ) : filteredPatients.length === 0 ? (
              <Text style={styles.emptyText}>No patients found.</Text>
            ) : (
              filteredPatients.map((patient) => {
                const selected = selectedPatient?._id === patient._id;

                return (
                  <Pressable
                    key={patient._id}
                    style={[styles.patient, selected && styles.selectedPatient]}
                    onPress={() => setSelectedPatient(patient)}
                  >
                    <Text style={styles.patientText}>
                      {patient.firstName || "No"} {patient.lastName || "Name"}
                    </Text>
                    <Text style={styles.patientSubText}>
                      {patient.email || "No email"}
                    </Text>
                  </Pressable>
                );
              })
            )}

            {selectedPatient ? (
              <View style={styles.messageBox}>
                <Text style={styles.selectedLabel}>
                  Messaging: {selectedPatient.firstName}{" "}
                  {selectedPatient.lastName}
                </Text>

                <TextInput
                  style={styles.messageInput}
                  placeholder="Type your message..."
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  textAlignVertical="top"
                />

                <Pressable
                  style={[styles.sendBtn, sending && styles.disabledBtn]}
                  onPress={handleSendMessage}
                  disabled={sending}
                >
                  <Text style={styles.sendText}>
                    {sending ? "Sending..." : "Send Message"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#fff" }}>
        <View style={[styles.bottomBar, { height: navHeight }]}>
          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/receptionist/createApp")}
          >
            <Text style={[styles.navIcon, { fontSize: navIconSize }]}>＋</Text>
          </Pressable>

          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/receptionist")}
          >
            <Text style={[styles.navIcon, { fontSize: navIconSize }]}>🏠</Text>
          </Pressable>

          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/receptionist/communication")}
          >
            <Text style={[styles.navIcon, { fontSize: navIconSize }]}>💬</Text>
          </Pressable>

          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/receptionist/seeAppointments")}
          >
            <Text style={[styles.navIcon, { fontSize: navIconSize }]}>📋</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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

  phone: {
    flex: 1,
    paddingTop: 40,
  },

  title: {
    marginTop: 20,
    marginBottom: 20,
    color: "#111",
    fontWeight: "500",
  },

  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 42,
    marginBottom: 14,
    width: "100%",
  },

  list: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 10,
    flex: 1,
    marginBottom: 10,
  },

  listContent: {
    paddingVertical: 10,
  },

  patient: {
    backgroundColor: "#eef0f3",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    width: "100%",
  },

  selectedPatient: {
    borderWidth: 2,
    borderColor: "#0b5ed7",
  },

  patientText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  patientSubText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    flexShrink: 1,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },

  messageBox: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    width: "100%",
  },

  selectedLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },

  messageInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fafafa",
  },

  sendBtn: {
    marginTop: 12,
    backgroundColor: "#0b5ed7",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  disabledBtn: {
    opacity: 0.6,
  },

  sendText: {
    color: "#fff",
    fontWeight: "700",
  },

  bottomBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },

  navIcon: {
    color: "#fff",
  },
});
