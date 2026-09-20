import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import Popup from "./Popup";
import Btn from "./Btn";
import { gradients } from "../theme";
import { feedback, getFeedbackSettings, setFeedbackSetting } from "../feedback";
import { logout } from "../auth";

// Opens from the profile button: email, sound + vibration switches, log out
export default function AccountPopup({ visible, onClose, email }) {
  const [settings, setSettings] = useState(getFeedbackSettings());

  useEffect(() => {
    if (visible) setSettings(getFeedbackSettings());
  }, [visible]);

  function change(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
    setFeedbackSetting(key, value).then(() => {
      if (value) feedback.tap();
    });
  }

  function confirmLogout() {
    Alert.alert("Log out of Hisab?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          onClose();
          logout();
        }
      }
    ]);
  }

  return (
    <Popup visible={visible} onClose={onClose}>
      <Text style={styles.title}>Account</Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}

      <View style={styles.row}>
        <Text style={styles.label}>Sounds</Text>
        <Switch
          value={settings.sound}
          onValueChange={(v) => change("sound", v)}
          trackColor={{ false: "#444", true: "#9153ff" }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Vibration</Text>
        <Switch
          value={settings.vibration}
          onValueChange={(v) => change("vibration", v)}
          trackColor={{ false: "#444", true: "#9153ff" }}
          thumbColor="#fff"
        />
      </View>

      <Btn title="Log out" colors={gradients.red} onPress={confirmLogout} />
      <Btn title="Close" colors={gradients.primary} onPress={onClose} />
    </Popup>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  email: { color: "rgba(255,255,255,0.7)", fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: "#fff", fontSize: 18 }
});
