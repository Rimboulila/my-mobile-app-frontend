import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  _id: string;
  text: string;
  createdAt: string;
  senderRole: string;
  senderId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
};

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

export default function Communication() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const horizontalPad = isTablet ? 40 : isSmallPhone ? 12 : 20;
  const titleSize = isTablet ? 22 : isSmallPhone ? 15 : 18;
  const msgFontSize = isTablet ? 14 : isSmallPhone ? 11 : 12;
  const senderFontSize = isTablet ? 13 : isSmallPhone ? 10 : 11;
  const navHeight = isTablet ? 72 : 64;
  const navIconSize = isTablet ? 26 : 22;
  const bubbleMaxWidth = isTablet ? "60%" : "80%";

  useEffect(() => {
    fetchMyMessages();
  }, []);

  const fetchMyMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No token found.");
        setMessages([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/messages/my`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log("PATIENT MESSAGES:", data);

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Failed to load messages.");
        setMessages([]);
        return;
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("FETCH MESSAGES ERROR:", error);
      Alert.alert("Error", "Could not load messages.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View
        style={[
          styles.phone,
          {
            paddingHorizontal: horizontalPad,
            paddingBottom: navHeight + 16,
          },
        ]}
      >
        <Text style={[styles.title, { fontSize: titleSize }]}>
          Communication
        </Text>

        <ScrollView
          style={styles.chatCard}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={styles.emptyText}>Loading messages...</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet.</Text>
          ) : (
            messages.map((msg) => (
              <View key={msg._id} style={styles.msgRow}>
                <Text style={[styles.avatar, { fontSize: isTablet ? 20 : 16 }]}>
                  👤
                </Text>
                <View
                  style={[
                    styles.bubbleLeft,
                    { maxWidth: bubbleMaxWidth as any },
                  ]}
                >
                  <Text
                    style={[styles.senderName, { fontSize: senderFontSize }]}
                  >
                    {msg.senderId?.firstName || "Receptionist"}{" "}
                    {msg.senderId?.lastName || ""}
                  </Text>
                  <Text style={[styles.msgText, { fontSize: msgFontSize }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))
          )}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efeff2",
  },

  phone: {
    flex: 1,
    paddingTop: 16,
  },

  title: {
    fontWeight: "500",
    color: "#111",
    marginTop: 6,
    marginBottom: 18,
  },

  chatCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 18,
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },

  chatContent: {
    paddingVertical: 18,
    paddingBottom: 24,
    flexGrow: 1,
  },

  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },

  avatar: {
    marginRight: 8,
  },

  bubbleLeft: {
    backgroundColor: "#f2f2f2",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexShrink: 1,
  },

  senderName: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#333",
  },

  msgText: {
    color: "#111",
    lineHeight: 18,
    flexShrink: 1,
  },

  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    flex: 1,
    textAlignVertical: "center",
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

  navText: {},
});
