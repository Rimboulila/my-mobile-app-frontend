import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_BASE_URL = "https://my-mobile-app-backend.onrender.com";

const doctorHospitalMap: Record<string, string> = {
  "Dr Smith": "Kingston Hospital",
  "Dr Patel": "St George's Hospital",
  "Dr Khan": "Chelsea and Westminster",
};

export default function AddAppointment() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [appointmentType, setAppointmentType] = useState("");
  const [customAppointmentType, setCustomAppointmentType] = useState("");
  const [doctor, setDoctor] = useState("");
  const [loading, setLoading] = useState(false);

  const hospital = doctor ? doctorHospitalMap[doctor] : "";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time: Date | null) => {
    if (!time) return "";
    const hours = String(time.getHours()).padStart(2, "0");
    const minutes = String(time.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const displayTime = (time: Date | null) => {
    if (!time) return "Choose time";

    return time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isTimeWithinRange = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const minTime = 8 * 60;
    const maxTime = 18 * 60;

    return totalMinutes >= minTime && totalMinutes <= maxTime;
  };

  const createAppointment = async () => {
    const date = formatDate(selectedDate);
    const time = formatTime(selectedTime);

    const finalAppointmentType =
      appointmentType === "other"
        ? customAppointmentType.trim()
        : appointmentType;

    if (!date || !time || !finalAppointmentType || !doctor) {
      Alert.alert("Missing fields", "Please complete all fields.");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please login again.");
        return;
      }

      const payload = {
        date,
        time,
        type: finalAppointmentType,
        doctor,
        hospital,
      };

      const response = await fetch(`${API_BASE_URL}/api/appointments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Could not create appointment.");
        return;
      }

      Alert.alert("Success", "Appointment created");
      router.replace("/receptionist");
    } catch (error) {
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.phone}>
        <Text style={styles.title}>Add{"\n"}appointment</Text>

        <View style={styles.formBlock}>
          <Text style={styles.label}>SELECT DATE</Text>

          <Pressable
            style={styles.inputButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.inputButtonText,
                !selectedDate && styles.placeholderText,
              ]}
            >
              {selectedDate ? formatDate(selectedDate) : "Choose date"}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || tomorrow}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={tomorrow}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}

          <Text style={[styles.label, styles.spacedLabel]}>
            SELECT APPOINTMENT TYPE
          </Text>

          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={appointmentType}
              onValueChange={setAppointmentType}
              style={styles.picker}
            >
              <Picker.Item label="Select type" value="" color="#666" />
              <Picker.Item
                label="Routine GP Consultation"
                value="Routine GP Consultation"
                color="#111"
              />
              <Picker.Item
                label="Mental Health Review (GP)"
                value="Mental Health Review (GP)"
                color="#111"
              />
              <Picker.Item
                label="Blood Pressure Check"
                value="Blood Pressure Check"
                color="#111"
              />
              <Picker.Item label="Other" value="other" color="#111" />
            </Picker>
          </View>

          {appointmentType === "other" && (
            <TextInput
              style={[styles.input, styles.spacedInput]}
              placeholder="Enter appointment type"
              placeholderTextColor="#666"
              value={customAppointmentType}
              onChangeText={setCustomAppointmentType}
            />
          )}

          <Text style={[styles.label, styles.spacedLabel]}>SELECT TIME</Text>

          <Pressable
            style={styles.inputButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text
              style={[
                styles.inputButtonText,
                !selectedTime && styles.placeholderText,
              ]}
            >
              {displayTime(selectedTime)}
            </Text>
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime || new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, time) => {
                setShowTimePicker(false);

                if (!time) return;

                if (!isTimeWithinRange(time)) {
                  Alert.alert(
                    "Invalid time",
                    "Please choose a time between 8:00 AM and 6:00 PM.",
                  );
                  return;
                }

                setSelectedTime(time);
              }}
            />
          )}

          <Text style={[styles.label, styles.spacedLabel]}>SELECT DOCTOR</Text>

          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={doctor}
              onValueChange={setDoctor}
              style={styles.picker}
            >
              <Picker.Item label="Select doctor" value="" color="#666" />
              <Picker.Item label="Dr Smith" value="Dr Smith" color="#111" />
              <Picker.Item label="Dr Patel" value="Dr Patel" color="#111" />
              <Picker.Item label="Dr Khan" value="Dr Khan" color="#111" />
            </Picker>
          </View>

          <Text style={[styles.label, styles.spacedLabel]}>HOSPITAL</Text>

          <View style={styles.inputButton}>
            <Text
              style={[
                styles.inputButtonText,
                !hospital && styles.placeholderText,
              ]}
            >
              {hospital || "Hospital auto selected"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.confirmBtn} onPress={createAppointment}>
            <Text style={styles.confirmText}>
              {loading ? "Creating..." : "Confirm"}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
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
    paddingTop: 40,
    paddingHorizontal: 20,
    flex: 1,
    paddingBottom: 80,
  },

  title: {
    fontSize: 32,
    marginTop: 20,
    marginBottom: 20,
    color: "#111",
    fontWeight: "500",
  },

  formBlock: {
    width: "100%",
  },

  label: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
    letterSpacing: 1,
  },

  spacedLabel: {
    marginTop: 16,
  },

  inputButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  inputButtonText: {
    fontSize: 14,
    color: "#111",
  },

  placeholderText: {
    color: "#666",
  },

  input: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111",
  },

  spacedInput: {
    marginTop: 10,
  },

  pickerWrap: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    justifyContent: "center",
    overflow: "hidden",
  },

  picker: {
    width: "100%",
    height: 52,
    color: "#111",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },

  confirmBtn: {
    width: "45%",
    backgroundColor: "#0b5ed7",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontWeight: "700",
  },

  cancelBtn: {
    width: "45%",
    backgroundColor: "#ff3b30",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },

  cancelText: {
    color: "#fff",
    fontWeight: "700",
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
});
