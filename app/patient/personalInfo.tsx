import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type User = {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  phone?: string;
  address?: string;
  email?: string;
};

export default function PersonalInfo() {
  const [user, setUser] = useState<User | null>(null);
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 40 : isSmallPhone ? 30 : 44;
  const navHeight = isTablet ? 72 : 64;
  const navIconSize = isTablet ? 26 : 22;

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      console.log("STORED USER:", stored);
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

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
          <Text style={[styles.title, { fontSize: titleSize }]}>
            Personal{"\n"}information
          </Text>

          <View style={styles.card}>
            <Row label="First Name:" value={user?.firstName ?? "-"} />
            <Row label="Last Name:" value={user?.lastName ?? "-"} />
            <Row label="Birthday:" value={user?.birthday ?? "-"} />
            <Row label="Phone Number:" value={user?.phone ?? "-"} />
            <Row label="Address:" value={user?.address ?? "-"} />
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
            onPress={() => router.replace("/patient")}
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

  scrollContent: {
    paddingTop: 24,
  },

  title: {
    fontWeight: "500",
    color: "#111",
    marginTop: 10,
    marginBottom: 18,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    width: "100%",
  },

  row: {
    marginBottom: 10,
  },

  rowLabel: {
    fontWeight: "800",
    color: "#111",
  },

  rowValue: {
    marginTop: 2,
    color: "#111",
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
  },
});
