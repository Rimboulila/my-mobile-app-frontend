import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function User() {
  return (
    <View style={styles.screen}>
      <View style={styles.phone}>
        <Pressable style={styles.backBtn} onPress={() => router.replace("/")}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>

        <Text style={styles.title}>User</Text>

        <View style={styles.stack}>
          <Pressable
            style={styles.mainBtn}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.btnText}>PATIENT</Text>
          </Pressable>

          <Pressable
            style={styles.mainBtn}
            onPress={() => router.push("/admin")}
          >
            <Text style={styles.btnText}>RECEPTIONIST</Text>
          </Pressable>
        </View>
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
  },
  backText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    fontSize: 44,
    fontWeight: "500",
    color: "#111",
    marginTop: 70,
  },
  stack: {
    marginTop: 90,
    alignItems: "center",
    gap: 40,
  },
  mainBtn: {
    width: "72%",
    backgroundColor: "#0b5ed7",
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  btnText: {
    color: "white",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
