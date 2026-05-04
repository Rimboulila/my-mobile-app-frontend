import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  doctor: string;
  status: string;
  bookedBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

type PendingAction = {
  id: string;
  action: "done" | "missed";
} | null;

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

const appointmentTypeLabels: Record<string, string> = {
  checkup: "Routine GP Consultation",
  consultation: "Mental Health Review (GP)",
  urgent: "Blood Pressure Check",
};

const getAppointmentTypeLabel = (type: string) => {
  return appointmentTypeLabels[type] || type;
};

const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

const getEndOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  return endOfWeek;
};

const isWithinCurrentWeek = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointmentDate = new Date(`${dateString}T00:00:00`);
  const endOfWeek = getEndOfWeek();

  return appointmentDate >= today && appointmentDate <= endOfWeek;
};

export default function SeeAppointments() {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 36 : isSmallPhone ? 26 : 32;
  const navHeight = isTablet ? 72 : 60;
  const navIconSize = isTablet ? 22 : 18;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"booked" | "available">("booked");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/appointments/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setAppointments([]);
        return;
      }

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appt: Appointment) => {
    try {
      setRemovingId(appt._id);

      const token = await AsyncStorage.getItem("token");

      const deleteResponse = await fetch(
        `${API_BASE_URL}/api/appointments/${appt._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!deleteResponse.ok) {
        Alert.alert("Error", "Error removing appointment");
        return;
      }

      setAppointments((prev) => prev.filter((a) => a._id !== appt._id));

      Alert.alert("Success", "Appointment deleted");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not delete appointment");
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveAppointmentWithMessage = async (appt: Appointment) => {
    try {
      setRemovingId(appt._id);

      const token = await AsyncStorage.getItem("token");

      const deleteResponse = await fetch(
        `${API_BASE_URL}/api/appointments/${appt._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!deleteResponse.ok) {
        Alert.alert("Error", "Error removing appointment");
        return;
      }

      if (appt.bookedBy?.email) {
        const text = `Hello ${appt.bookedBy.firstName}, your appointment with ${appt.doctor} on ${appt.date} at ${appt.time} has been removed.`;

        await fetch(`${API_BASE_URL}/api/messages/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: appt.bookedBy.email,
            text,
          }),
        });
      }

      setAppointments((prev) => prev.filter((a) => a._id !== appt._id));

      Alert.alert("Success", "Appointment removed and patient notified.");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not remove appointment.");
    } finally {
      setRemovingId(null);
    }
  };

  const confirmDeleteAppointment = (
    appt: Appointment,
    withMessage: boolean = false,
  ) => {
    Alert.alert(
      "Delete appointment",
      "Are you sure you want to delete this appointment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            withMessage
              ? handleRemoveAppointmentWithMessage(appt)
              : handleDeleteAppointment(appt),
        },
      ],
    );
  };

  const confirmAppointmentAction = async () => {
    if (!pendingAction) return;

    try {
      setSavingId(pendingAction.id);

      const token = await AsyncStorage.getItem("token");

      const endpoint =
        pendingAction.action === "done"
          ? `${API_BASE_URL}/api/appointments/complete/${pendingAction.id}`
          : `${API_BASE_URL}/api/appointments/missed/${pendingAction.id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        Alert.alert("Error", "Could not update appointment status.");
        return;
      }

      const newStatus =
        pendingAction.action === "done" ? "completed" : "missed";

      setAppointments((prev) =>
        prev.map((a) =>
          a._id === pendingAction.id ? { ...a, status: newStatus } : a,
        ),
      );

      setPendingAction(null);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSavingId(null);
    }
  };

  const canMarkAppointment = (date: string, time: string) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    return new Date() >= appointmentDateTime;
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === "available") {
      return a.status === "available";
    }

    if (filter === "booked") {
      if (a.status === "booked") {
        return true;
      }

      if (["completed", "missed", "expired"].includes(a.status)) {
        return isWithinCurrentWeek(a.date);
      }

      return false;
    }

    return false;
  });

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};

    filteredAppointments.forEach((appt) => {
      if (!groups[appt.date]) groups[appt.date] = [];
      groups[appt.date].push(appt);
    });

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const doctorCompare = a.doctor.localeCompare(b.doctor);
        if (doctorCompare !== 0) return doctorCompare;
        return a.time.localeCompare(b.time);
      });
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredAppointments]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.screen, { paddingHorizontal: horizontalPad }]}>
        <View style={styles.phone}>
          <Text style={[styles.title, { fontSize: titleSize }]}>
            Appointments List
          </Text>

          <View style={styles.filterRow}>
            <Pressable
              style={[
                styles.filterBtn,
                filter === "booked" && styles.activeFilterBtn,
              ]}
              onPress={() => setFilter("booked")}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filter === "booked" && styles.activeFilterBtnText,
                ]}
              >
                Booked
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterBtn,
                filter === "available" && styles.activeFilterBtn,
              ]}
              onPress={() => setFilter("available")}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filter === "available" && styles.activeFilterBtnText,
                ]}
              >
                Available
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.card}
            contentContainerStyle={{ paddingBottom: navHeight + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text style={styles.empty}>Loading...</Text>
            ) : groupedAppointments.length === 0 ? (
              <Text style={styles.empty}>No appointments</Text>
            ) : (
              groupedAppointments.map(([date, dayAppointments]) => (
                <View key={date}>
                  <Text style={styles.dayHeader}>{date}</Text>

                  {dayAppointments.map((appt) => {
                    const isPending = pendingAction?.id === appt._id;
                    const todayString = getTodayString();
                    const isPastDay = appt.date < todayString;

                    return (
                      <View key={appt._id} style={styles.item}>
                        <Text style={styles.name}>
                          {appt.doctor} - {getAppointmentTypeLabel(appt.type)}
                        </Text>

                        <Text>{appt.time}</Text>
                        <Text>{appt.hospital}</Text>
                        <Text>Status: {appt.status}</Text>

                        {appt.bookedBy && (
                          <Text>
                            {appt.bookedBy.firstName} {appt.bookedBy.lastName}
                          </Text>
                        )}

                        {filter === "booked" && !isPending && (
                          <>
                            {appt.status === "booked" ? (
                              canMarkAppointment(appt.date, appt.time) ? (
                                <View style={styles.row}>
                                  <Pressable
                                    style={styles.doneBtn}
                                    onPress={() =>
                                      setPendingAction({
                                        id: appt._id,
                                        action: "done",
                                      })
                                    }
                                    disabled={savingId === appt._id}
                                  >
                                    <Text style={styles.btnText}>
                                      {savingId === appt._id
                                        ? "Saving..."
                                        : "Done"}
                                    </Text>
                                  </Pressable>

                                  <Pressable
                                    style={styles.missedBtn}
                                    onPress={() =>
                                      setPendingAction({
                                        id: appt._id,
                                        action: "missed",
                                      })
                                    }
                                    disabled={savingId === appt._id}
                                  >
                                    <Text style={styles.btnText}>
                                      {savingId === appt._id
                                        ? "Saving..."
                                        : "Missed"}
                                    </Text>
                                  </Pressable>
                                </View>
                              ) : (
                                <Pressable
                                  style={styles.removeBtn}
                                  onPress={() =>
                                    confirmDeleteAppointment(appt, true)
                                  }
                                  disabled={removingId === appt._id}
                                >
                                  <Text style={styles.btnText}>
                                    {removingId === appt._id
                                      ? "Removing..."
                                      : "Remove appointment from patient"}
                                  </Text>
                                </Pressable>
                              )
                            ) : ["completed", "missed", "expired"].includes(
                                appt.status,
                              ) ? (
                              <Pressable
                                style={styles.removeBtn}
                                onPress={() => confirmDeleteAppointment(appt)}
                                disabled={removingId === appt._id}
                              >
                                <Text style={styles.btnText}>
                                  {removingId === appt._id
                                    ? "Removing..."
                                    : "Remove appointment"}
                                </Text>
                              </Pressable>
                            ) : isPastDay ? (
                              <Pressable
                                style={styles.removeBtn}
                                onPress={() => confirmDeleteAppointment(appt)}
                                disabled={removingId === appt._id}
                              >
                                <Text style={styles.btnText}>
                                  {removingId === appt._id
                                    ? "Removing..."
                                    : "Remove appointment"}
                                </Text>
                              </Pressable>
                            ) : null}
                          </>
                        )}

                        {filter === "available" && (
                          <Pressable
                            style={styles.deleteBtn}
                            onPress={() => confirmDeleteAppointment(appt)}
                            disabled={removingId === appt._id}
                          >
                            <Text style={styles.btnText}>
                              {removingId === appt._id
                                ? "Deleting..."
                                : "Delete appointment"}
                            </Text>
                          </Pressable>
                        )}

                        {isPending && (
                          <View style={styles.confirmBox}>
                            <Text>
                              Confirm {pendingAction?.action} appointment?
                            </Text>

                            <View style={styles.row}>
                              <Pressable
                                style={styles.confirmBtn}
                                onPress={confirmAppointmentAction}
                                disabled={savingId === appt._id}
                              >
                                <Text style={styles.btnText}>
                                  {savingId === appt._id
                                    ? "Saving..."
                                    : "Confirm"}
                                </Text>
                              </Pressable>

                              <Pressable
                                style={styles.cancelBtn}
                                onPress={() => setPendingAction(null)}
                                disabled={savingId === appt._id}
                              >
                                <Text style={styles.btnText}>Cancel</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
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
    paddingTop: 24,
  },

  title: {
    marginBottom: 20,
    color: "#111",
    fontWeight: "500",
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  filterBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  activeFilterBtn: {
    backgroundColor: "#0b5ed7",
  },

  filterBtnText: {
    fontWeight: "600",
  },

  activeFilterBtnText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },

  dayHeader: {
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
    color: "#111",
  },

  item: {
    backgroundColor: "#eef0f3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  name: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#111",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  doneBtn: {
    flex: 1,
    backgroundColor: "#2e7d32",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },

  missedBtn: {
    flex: 1,
    backgroundColor: "#f57c00",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },

  removeBtn: {
    backgroundColor: "#e53935",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },

  deleteBtn: {
    backgroundColor: "#c62828",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },

  confirmBox: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
  },

  confirmBtn: {
    flex: 1,
    backgroundColor: "#0b5ed7",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#888",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
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
