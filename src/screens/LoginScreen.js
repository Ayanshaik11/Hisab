import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme";
import { feedback } from "../feedback";
import { errorMessage, isCancelled, loginWithEmail, loginWithGoogle } from "../auth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function showError(error) {
    if (isCancelled(error)) return;
    feedback.error();
    Alert.alert("Login failed", errorMessage(error));
  }

  async function emailLogin() {
    const trimmed = email.trim();

    if (!trimmed || !password) {
      feedback.error();
      Alert.alert("Enter email and password");
      return;
    }

    setBusy(true);

    try {
      await loginWithEmail(trimmed, password);
      feedback.success();          // App.js switches to the dashboard by itself
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function googleLogin() {
    setBusy(true);

    try {
      const ok = await loginWithGoogle();
      if (ok) feedback.success();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
        ]}
      >
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Enter the Email..."
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter the password"
            placeholderTextColor="#777"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={emailLogin}
          />

          <Pressable
            disabled={busy}
            onPress={() => {
              feedback.tap();
              emailLogin();
            }}
            style={({ pressed }) => [
              styles.button,
              { opacity: busy ? 0.6 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
            ]}
          >
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            disabled={busy}
            onPress={() => {
              feedback.tap();
              googleLogin();
            }}
            style={({ pressed }) => [
              styles.button,
              { opacity: busy ? 0.6 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
            ]}
          >
            <Text style={styles.buttonText}>
              <Text style={styles.g}>G</Text>  Continue with google
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    gap: 12,
    alignItems: "stretch",
    backgroundColor: "#985effc0",
    borderWidth: 3,
    borderColor: "#eee",
    borderRadius: 20
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    color: "#000",
    fontSize: 16
  },
  button: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: colors.btn
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "500" },
  g: { fontWeight: "bold" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: "#ffffff88" },
  or: { color: "rgba(255,255,255,0.7)" }
});
