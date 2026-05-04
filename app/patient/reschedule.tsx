import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Appointment = {
  _id: string;
  date: string;
  time: string;
  type: string;
  hospital: string;
  doctor?: string;
  status: string;
};

export default function Reschedule() {
  const API_BASE = "https://my-mobile-app-backend.onrender.com";
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 36 : isSmallPhone ? 28 : 38;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const parseAppointmentDateTime = (date: string, time: string) => {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return new Date(`${date}T${normalizedTime}`);
  };

  const visibleAppointments = useMemo(() => {
    const now = new Date();

    return appointments.filter((appointment) => {
      const appointmentDateTime = parseAppointmentDateTime(
        appointment.date,
        appointment.time,
      );

      return !isNaN(appointmentDateTime.getTime()) && appointmentDateTime > now;
    });
  }, [appointments]);

  useEffect(() => {
    if (!selectedId) return;

    const stillVisible = visibleAppointments.some((a) => a._id === selectedId);

    if (!stillVisible) {
      setSelectedId("");
      setReason("");
      setAgree(false);
    }
  }, [selectedId, visibleAppointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No token found. Please log in again.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/appointments/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("AVAILABLE APPOINTMENTS:", data);

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Could not load appointments.");
        return;
      }

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("LOAD APPOINTMENTS ERROR:", err);
      Alert.alert("Error", "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedId) {
      Alert.alert("Error", "Please select a new appointment.");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Error", "Please enter a reason.");
      return;
    }

    if (!agree) {
      Alert.alert("Error", "Please confirm the checkbox first.");
      return;
    }

    try {
      setRescheduling(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No token found. Please log in again.");
        return;
      }

      const res = await fetch(
        `${API_BASE}/api/appointments/reschedule/${selectedId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        },
      );

      const data = await res.json();
      console.log("RESCHEDULE RESPONSE:", data);

      if (!res.ok) {
        Alert.alert(
          "Error",
          data?.message || "Could not reschedule appointment.",
        );
        return;
      }

      Alert.alert("Success", "Appointment rescheduled successfully.");
      router.replace("/patient");
    } catch (err) {
      console.log("RESCHEDULE ERROR:", err);
      Alert.alert("Error", "Network error.");
    } finally {
      setRescheduling(false);
    }
  };

  const selectedAppointment = visibleAppointments.find(
    (a) => a._id === selectedId,
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.screen, { paddingHorizontal: horizontalPad }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace("/patient")}
        >
          <Text style={styles.backText}>Go back</Text>
        </Pressable>

        <Text style={[styles.title, { fontSize: titleSize }]}>
          Reschedule{"\n"}appointment
        </Text>

        <View style={styles.listWrapper}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={visibleAppointments}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item._id === selectedId;

                return (
                  <Pressable
                    style={[styles.card, selected && styles.selectedCard]}
                    onPress={() => {
                      setSelectedId(item._id);
                      setReason("");
                    }}
                  >
                    <Text style={styles.cardTitle}>
                      {item.doctor || "Doctor not assigned"}
                    </Text>
                    <Text style={styles.cardText}>Date: {item.date}</Text>
                    <Text style={styles.cardText}>Time: {item.time}</Text>
                    <Text style={styles.cardText}>
                      Hospital: {item.hospital}
                    </Text>
                    <Text style={styles.cardText}>Type: {item.type}</Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No available appointments.</Text>
              }
              ListFooterComponent={
                <View>
                  {selectedAppointment ? (
                    <View style={styles.selectedBox}>
                      <Text style={styles.selectedText}>
                        Selected:{" "}
                        {selectedAppointment.doctor || "Doctor not assigned"} on{" "}
                        {selectedAppointment.date} at {selectedAppointment.time}
                      </Text>
                      <Text style={styles.selectedSubText}>
                        {selectedAppointment.hospital} •{" "}
                        {selectedAppointment.type}
                      </Text>

                      <Text style={styles.reasonLabel}>Reason:</Text>
                      <TextInput
                        style={styles.reasonInput}
                        placeholder="Enter reason for appointment"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  ) : null}

                  <Pressable
                    style={styles.noteRow}
                    onPress={() => setAgree((v) => !v)}
                  >
                    <View style={styles.checkbox}>
                      {agree ? <Text style={styles.tick}>✓</Text> : null}
                    </View>

                    <Text style={styles.noteText}>
                      By confirming, your current appointment will be cancelled
                      and replaced with the new one.
                    </Text>
                  </Pressable>

                  <View style={styles.btnRow}>
                    <Pressable
                      style={[
                        styles.actionBtn,
                        styles.confirmBtn,
                        (!agree ||
                          !selectedId ||
                          !reason.trim() ||
                          rescheduling) &&
                          styles.disabledBtn,
                      ]}
                      onPress={handleReschedule}
                      disabled={
                        !agree || !selectedId || !reason.trim() || rescheduling
                      }
                    >
                      <Text style={styles.actionText}>
                        {rescheduling ? "Rescheduling..." : "Confirm"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => router.replace("/patient")}
                      disabled={rescheduling}
                    >
                      <Text style={styles.actionText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              }
            />
          )}
        </View>
      </View>
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
    paddingTop: 24,
    paddingBottom: 24,
  },

  listWrapper: {
    flex: 1,
  },

  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#0b5ed7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
    marginBottom: 12,
  },

  backText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  title: {
    fontWeight: "500",
    color: "#111",
    marginTop: 10,
    marginBottom: 20,
  },

  list: {
    paddingBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
  },

  selectedCard: {
    borderColor: "#0b5ed7",
    borderWidth: 2,
  },

  cardTitle: {
    fontWeight: "800",
    fontSize: 14,
    color: "#111",
    marginBottom: 6,
  },

  cardText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#666",
  },

  selectedBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  selectedText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "600",
  },

  selectedSubText: {
    color: "#555",
    fontSize: 12,
    marginTop: 4,
  },

  reasonLabel: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  reasonInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    backgroundColor: "#fff",
  },

  noteRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  tick: {
    fontSize: 14,
    fontWeight: "900",
  },

  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#222",
  },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 12,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },

  confirmBtn: {
    backgroundColor: "#0b5ed7",
  },

  cancelBtn: {
    backgroundColor: "#ff2f2f",
  },

  disabledBtn: {
    opacity: 0.5,
  },

  actionText: {
    color: "white",
    fontWeight: "800",
    textAlign: "center",
  },
});
