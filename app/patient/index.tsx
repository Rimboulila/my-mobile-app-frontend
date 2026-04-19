import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  reason: string;
  status: string;
};

export default function Dashboard() {
  const router = useRouter();
  const BASE = "https://my-mobile-app-backend.onrender.com";
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 40 : isSmallPhone ? 30 : 44;
  const navHeight = isTablet ? 72 : 64;
  const navIconSize = isTablet ? 26 : 22;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [openingCalendar, setOpeningCalendar] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/test`)
      .then((res) => res.json())
      .then((data) => console.log("API IS WORKING:", data))
      .catch((err) => console.log("API IS ERROR", err.message));

    loadMyAppointment();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      router.replace("/login");
    } catch (err) {
      console.log("LOGOUT ERROR:", err);
      Alert.alert("Error", "Could not log out.");
    }
  };

  const loadMyAppointment = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No token found. Please log in again.");
        return;
      }

      const res = await fetch(`${BASE}/api/appointments/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("MY APPOINTMENTS:", data);

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Could not load appointment.");
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        setAppointment(data[0]);
      } else {
        setAppointment(null);
      }
    } catch (err) {
      console.log("LOAD MY APPOINTMENT ERROR:", err);
      Alert.alert("Error", "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) {
      Alert.alert("Error", "No booked appointment found.");
      return;
    }

    Alert.alert(
      "Cancel appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                Alert.alert("Error", "No token found. Please log in again.");
                return;
              }

              const res = await fetch(
                `${BASE}/api/appointments/cancel/${appointment._id}`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              const data = await res.json();
              console.log("CANCEL RESPONSE:", data);

              if (!res.ok) {
                Alert.alert(
                  "Error",
                  data?.message || "Could not cancel appointment.",
                );
                return;
              }

              Alert.alert("Success", "Appointment cancelled successfully.");
              await loadMyAppointment();
            } catch (err) {
              console.log("CANCEL APPOINTMENT ERROR:", err);
              Alert.alert("Error", "Network error.");
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const getAppointmentDates = (appt: Appointment) => {
    const [year, month, day] = appt.date.split("-").map(Number);
    const [hours, minutes] = appt.time.split(":").map(Number);

    const startDate = new Date(year, month - 1, day, hours, minutes, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    return { startDate, endDate };
  };

  const handleViewInCalendar = async () => {
    if (!appointment) {
      Alert.alert("Error", "No booked appointment found.");
      return;
    }

    try {
      setOpeningCalendar(true);

      const permission = await Calendar.requestCalendarPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Calendar permission is required to open your phone calendar.",
        );
        return;
      }

      const { startDate, endDate } = getAppointmentDates(appointment);

      await Calendar.createEventInCalendarAsync({
        title: appointment.type || "Appointment",
        startDate,
        endDate,
        location: appointment.hospital || "",
        notes: `Doctor: ${appointment.doctor || "-"}\nReason: ${
          appointment.reason || "-"
        }`,
      });
    } catch (err) {
      console.log("OPEN CALENDAR ERROR:", err);
      Alert.alert("Error", "Could not open calendar.");
    } finally {
      setOpeningCalendar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.screen, { paddingHorizontal: horizontalPad }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: navHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>

          <Text style={[styles.title, { fontSize: titleSize }]}>Dashboard</Text>

          <View style={styles.card}>
            <Text style={styles.bold}>Upcoming appointment:</Text>
            <Text style={styles.text}>
              {loading
                ? "Loading..."
                : appointment
                  ? `${appointment.date}\n${appointment.time}`
                  : "No booked appointment"}
            </Text>

            <Text style={styles.bold}>Appointment type:</Text>
            <Text style={styles.text}>
              {appointment ? appointment.type : "-"}
            </Text>

            <Text style={styles.bold}>Location:</Text>
            <Text style={styles.text}>
              {appointment ? appointment.hospital : "-"}
            </Text>

            <Text style={styles.bold}>Doctor:</Text>
            <Text style={styles.text}>
              {appointment ? appointment.doctor || "-" : "-"}
            </Text>

            <Text style={styles.bold}>Reason:</Text>
            <Text style={styles.text}>
              {appointment ? appointment.reason || "-" : "-"}
            </Text>

            <View style={styles.cardRow}>
              <Pressable
                onPress={handleViewInCalendar}
                disabled={!appointment || openingCalendar}
              >
                <Text style={styles.link}>
                  {openingCalendar ? "Opening calendar..." : "View in calendar"}
                </Text>
              </Pressable>

              {appointment ? (
                <Pressable
                  style={[styles.cancelBtn, cancelling && styles.disabledBtn]}
                  onPress={handleCancelAppointment}
                  disabled={cancelling}
                >
                  <Text style={styles.cancelText}>
                    {cancelling ? "Cancelling..." : "Cancel"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.stack}>
            <Pressable
              style={[
                styles.bigBtn,
                appointment ? styles.disabledBigBtn : null,
              ]}
              onPress={() => {
                if (!appointment) {
                  router.push("/patient/bookAppointment");
                }
              }}
              disabled={!!appointment}
            >
              <Text style={styles.btnText}>
                {appointment
                  ? "Appointment already booked"
                  : "Book appointment"}
              </Text>
            </Pressable>

            {appointment ? (
              <Pressable
                style={styles.bigBtn}
                onPress={() => router.push("/patient/reschedule")}
              >
                <Text style={styles.btnText}>Reschedule appointment</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
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
  },

  scrollContent: {
    paddingTop: 20,
  },

  title: {
    fontWeight: "500",
    marginBottom: 12,
    color: "#111",
    marginTop: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    width: "100%",
  },

  bold: {
    fontWeight: "800",
    marginTop: 6,
    color: "#111",
  },

  text: {
    marginTop: 4,
    color: "#111",
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    gap: 12,
    flexWrap: "wrap",
  },

  link: {
    color: "#2f6bd7",
    fontSize: 12,
    fontWeight: "600",
  },

  cancelBtn: {
    backgroundColor: "#e53935",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },

  cancelText: {
    color: "white",
    fontWeight: "700",
  },

  stack: {
    marginTop: 40,
    gap: 20,
    alignItems: "center",
    width: "100%",
  },

  bigBtn: {
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

  disabledBigBtn: {
    backgroundColor: "#9aa0a6",
  },

  disabledBtn: {
    opacity: 0.6,
  },

  btnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  navText: {
    fontSize: 22,
    color: "#111",
  },

  logoutBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#ff2f2f",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },

  logoutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
});
