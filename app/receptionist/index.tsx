import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Patient = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  birthday?: string;
  phone?: string;
  address?: string;
};

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

export default function ReceptionistIndex() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/auth/patients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("PATIENTS:", data);

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Failed to load patients.");
        return;
      }

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("FETCH PATIENTS ERROR:", error);
      Alert.alert("Error", "Could not load patients.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("/login");
    } catch (error) {
      console.log("SIGN OUT ERROR:", error);
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
    <View style={styles.screen}>
      <View style={styles.phone}>
        <Text style={styles.title}>Patient list</Text>

        <View style={styles.headerRow}>
          <Pressable style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search patient..."
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchPatients}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/receptionist/patientDetails",
                  params: { id: item._id },
                })
              }
            >
              <Text style={styles.cardName}>
                {item.firstName || "No"} {item.lastName || "Name"}
              </Text>
              <Text style={styles.cardInfo}>{item.email || "No email"}</Text>
              <Text style={styles.cardInfo}>{item.phone || "No phone"}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loading ? "Loading patients..." : "No patients found."}
            </Text>
          }
        />
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.navBtn}
          onPress={() => router.push("/receptionist/createApp")}
        >
          <Text style={styles.navIcon}>＋</Text>
        </Pressable>

        <Pressable
          style={styles.navBtn}
          onPress={() => router.push("/receptionist")}
        >
          <Text style={styles.navIcon}>🏠</Text>
        </Pressable>

        <Pressable
          style={styles.navBtn}
          onPress={() => router.push("/receptionist/communication")}
        >
          <Text style={styles.navIcon}>💬</Text>
        </Pressable>

        <Pressable
          style={styles.navBtn}
          onPress={() => router.push("/receptionist/seeAppointments")}
        >
          <Text style={styles.navIcon}>📋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efeff2",
    alignItems: "center",
  },
  phone: {
    width: "100%",
    maxWidth: 500,
    paddingTop: 60,
    paddingHorizontal: 20,
    flex: 1,
    paddingBottom: 70,
  },
  title: {
    fontSize: 34,
    fontWeight: "500",
    marginBottom: 20,
    color: "#111",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#666",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
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
    fontSize: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoutBtn: {
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
