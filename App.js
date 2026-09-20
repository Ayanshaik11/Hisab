import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./src/firebase";
import { configureGoogle } from "./src/auth";
import { loadFeedbackSettings } from "./src/feedback";
import { colors } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import MainScreen from "./src/screens/MainScreen";
import PersonScreen from "./src/screens/PersonScreen";

configureGoogle();

export default function App() {
  const [user, setUser] = useState(undefined);    // undefined = still checking, null = logged out
  const [ready, setReady] = useState(false);
  const [personId, setPersonId] = useState(null); // which person page is open (null = dashboard)

  useEffect(() => {
    loadFeedbackSettings().finally(() => setReady(true));

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setPersonId(null);
    });
  }, []);

  // Phone Back button on a person page goes to the dashboard
  useEffect(() => {
    if (!personId) return undefined;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPersonId(null);
      return true;
    });

    return () => sub.remove();
  }, [personId]);

  let content;

  if (user === undefined || !ready) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  } else if (!user) {
    content = <LoginScreen />;
  } else if (personId) {
    content = (
      <PersonScreen
        key={personId}
        user={user}
        personId={personId}
        onBack={() => setPersonId(null)}
      />
    );
  } else {
    content = <MainScreen user={user} onOpenPerson={setPersonId} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>{content}</View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" }
});
