import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppointmentSlot = {
  _id: string;
  date: string;
  time: string;
  type: string;
  hospital: string;
  doctor?: string;
  status: string;
};

export default function BookAppointment() {
  const router = useRouter();
  const BASE = "https://my-mobile-app-backend.onrender.com";
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 36 : isSmallPhone ? 26 : 32;
  const cardTitleSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const navHeight = isTablet ? 72 : 64;
  const navIconSize = isTablet ? 26 : 22;

  const [appointments, setAppointments] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentSlot | null>(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadAvailableAppointments();
  }, []);

  // Converts your date + time strings into a JS Date.
  // Assumes date is something like "2026-04-19"
  // and time is something like "14:30" or "14:30:00"
  const parseAppointmentDateTime = (date: string, time: string) => {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const dateTime = new Date(`${date}T${normalizedTime}`);
    return dateTime;
  };

  // Keep only appointments that have not passed yet
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

  const loadAvailableAppointments = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please log in again.");
        return;
      }

      const res = await fetch(`${BASE}/api/appointments/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Could not load appointments.");
        return;
      }

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const openReasonModal = (appointment: AppointmentSlot) => {
    setSelectedAppointment(appointment);
    setReason("");
    setModalVisible(true);
  };

  const closeModal = () => {
    if (booking) return;
    setModalVisible(false);
    setSelectedAppointment(null);
    setReason("");
  };

  const handleConfirmBooking = async () => {
    if (!selectedAppointment) return;

    if (!reason.trim()) {
      Alert.alert("Missing reason", "Please enter a reason.");
      return;
    }

    try {
      setBooking(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please log in again.");
        return;
      }

      const res = await fetch(
        `${BASE}/api/appointments/book/${selectedAppointment._id}`,
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

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Could not book.");
        return;
      }

      closeModal();
      Alert.alert("Success", "Appointment booked successfully.");
      router.replace("/patient");
    } catch (err) {
      Alert.alert("Error", "Network error.");
    } finally {
      setBooking(false);
    }
  };

  const renderAppointment = ({ item }: { item: AppointmentSlot }) => (
    <Pressable
      style={styles.card}
      onPress={() => openReasonModal(item)}
      disabled={booking}
    >
      <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]}>
        {item.doctor || "Doctor not assigned"}
      </Text>
      <Text style={styles.cardText}>Date: {item.date}</Text>
      <Text style={styles.cardText}>Time: {item.time}</Text>
      <Text style={styles.cardText}>Hospital: {item.hospital}</Text>
      <Text style={styles.cardText}>Type: {item.type}</Text>
      <Text style={styles.link}>Tap to book</Text>
    </Pressable>
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
          Book appointment
        </Text>

        <View style={styles.listWrapper}>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <FlatList
              data={visibleAppointments}
              keyExtractor={(item) => item._id}
              renderItem={renderAppointment}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: navHeight + 24 },
              ]}
              ListEmptyComponent={<Text>No available appointments.</Text>}
            />
          )}
        </View>

        <Modal visible={modalVisible} transparent animationType="fade">
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add reason</Text>

              {selectedAppointment && (
                <View>
                  <Text>
                    Doctor:{" "}
                    {selectedAppointment.doctor || "Doctor not assigned"}
                  </Text>
                  <Text>Date: {selectedAppointment.date}</Text>
                  <Text>Time: {selectedAppointment.time}</Text>
                  <Text>Hospital: {selectedAppointment.hospital}</Text>
                  <Text>Type: {selectedAppointment.type}</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Reason for appointment"
                value={reason}
                onChangeText={setReason}
                multiline
                editable={!booking}
                textAlignVertical="top"
              />

              <View style={styles.row}>
                <Pressable
                  style={styles.confirmBtn}
                  onPress={handleConfirmBooking}
                  disabled={booking}
                >
                  <Text style={styles.confirmText}>
                    {booking ? "Booking..." : "Confirm"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelBtn}
                  onPress={closeModal}
                  disabled={booking}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#f7f7f7" }}>
        <View style={[styles.bottomNav, { height: navHeight }]}>
          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/patient/personalInfo")}
          >
            <Text style={[styles.navText, { fontSize: navIconSize }]}>👤</Text>
          </Pressable>

          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/patient")}
          >
            <Text style={[styles.navText, { fontSize: navIconSize }]}>⌂</Text>
          </Pressable>

          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/patient/communication")}
          >
            <Text style={[styles.navText, { fontSize: navIconSize }]}>💬</Text>
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
    paddingTop: 12,
  },

  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#0b5ed7",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 12,
  },

  backText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  title: {
    fontWeight: "600",
    marginBottom: 16,
    color: "#111",
  },

  listWrapper: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
  },

  cardTitle: {
    fontWeight: "700",
    color: "#111",
  },

  cardText: {
    marginTop: 2,
    color: "#111",
  },

  link: {
    color: "#2f6bd7",
    marginTop: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 10,
    padding: 10,
    minHeight: 100,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },

  confirmBtn: {
    backgroundColor: "#0b5ed7",
    padding: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },

  confirmText: {
    color: "white",
    fontWeight: "700",
  },

  cancelBtn: {
    backgroundColor: "#ff3b30",
    padding: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },

  cancelText: {
    color: "white",
    fontWeight: "700",
  },

  bottomNav: {
    backgroundColor: "#f7f7f7",
    borderTopWidth: 1,
    borderTopColor: "#d9d9d9",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  navBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  navText: {
    fontSize: 22,
  },
});
