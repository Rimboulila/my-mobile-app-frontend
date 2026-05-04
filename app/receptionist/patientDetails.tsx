import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
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

type Patient = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  phone?: string;
  address?: string;
  email?: string;
};

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

export default function PatientDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 36 : isSmallPhone ? 26 : 32;
  const navHeight = isTablet ? 72 : 60;
  const navIconSize = isTablet ? 22 : 18;

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/patients/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("PATIENT DETAILS:", data);

      if (!response.ok) {
        Alert.alert(
          "Error",
          data?.message || "Failed to load patient details.",
        );
        setPatient(null);
        return;
      }

      setPatient(data);
    } catch (error) {
      console.log("FETCH PATIENT DETAILS ERROR:", error);
      Alert.alert("Error", "Could not load patient details.");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={[styles.screen, { paddingHorizontal: horizontalPad }]}>
        <View style={styles.phone}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: navHeight + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { fontSize: titleSize }]}>
              Patient details
            </Text>

            {/* 🔵 Back Button */}
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>

            <View style={styles.card}>
              {loading ? (
                <Text style={styles.loadingText}>
                  Loading patient details...
                </Text>
              ) : !patient ? (
                <Text style={styles.loadingText}>Patient not found.</Text>
              ) : (
                <>
                  <Row label="First Name:" value={patient.firstName ?? "-"} />
                  <Row label="Last Name:" value={patient.lastName ?? "-"} />
                  <Row label="Birthday:" value={patient.birthday ?? "-"} />
                  <Row label="Phone Number:" value={patient.phone ?? "-"} />
                  <Row label="Address:" value={patient.address ?? "-"} />
                  <Row label="Email:" value={patient.email ?? "-"} />
                </>
              )}
            </View>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    textAlign: "center",
  },

  backBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },

  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
  },

  row: {
    marginBottom: 12,
  },

  rowLabel: {
    fontWeight: "800",
    color: "#111",
  },

  rowValue: {
    marginTop: 2,
    color: "#111",
  },

  loadingText: {
    textAlign: "center",
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
