import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { onValue, push, ref, set } from "firebase/database";

import { database } from "../firebase";
import { colors, gradients } from "../theme";
import { formatMoney } from "../utils";
import { feedback } from "../feedback";
import Gradient from "../components/Gradient";
import TopBar from "../components/TopBar";
import Popup from "../components/Popup";
import Btn from "../components/Btn";
import AccountPopup from "../components/AccountPopup";

export default function MainScreen({ user, onOpenPerson }) {
  const insets = useSafeAreaInsets();

  const [people, setPeople] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Live list of people:  users/<uid>/people   (same place as the web app)
  useEffect(() => {
    const peopleRef = ref(database, `users/${user.uid}/people`);

    return onValue(
      peopleRef,
      (snapshot) => {
        setPeople(snapshot.val() || {});
        setLoaded(true);
      },
      (error) => {
        console.error(error);
        setLoadError("Could not load data. Check your database rules.");
      }
    );
  }, [user.uid]);

  const entries = Object.entries(people);

  // Total outstanding is always across everyone, regardless of the search
  const total = entries.reduce((sum, [, p]) => sum + (Number(p.balance) || 0), 0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(people)
      .filter(([, p]) => (p.name || "").toLowerCase().includes(q))
      .sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""));
  }, [people, query]);

  function openAdd() {
    setName("");
    setAddOpen(true);
  }

  async function savePerson() {
    const trimmed = name.trim();

    if (!trimmed) {
      feedback.error();
      Alert.alert("Enter person's name");
      return;
    }

    setSaving(true);

    try {
      const newPersonRef = push(ref(database, `users/${user.uid}/people`));
      await set(newPersonRef, { name: trimmed, balance: 0 });

      feedback.success();
      setName("");
      setAddOpen(false);
    } catch (error) {
      console.error(error);
      feedback.error();
      Alert.alert("Failed to add person");
    } finally {
      setSaving(false);
    }
  }

  let message = null;
  if (loadError) message = loadError;
  else if (!loaded) message = null;
  else if (entries.length === 0) message = "No people added yet.";
  else if (matches.length === 0) message = "No one matches your search.";

  return (
    <View style={styles.screen}>
      <TopBar title="Hisab" onProfile={() => setAccountOpen(true)} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <Gradient style={styles.summary}>
          <Text style={styles.summaryLabel}>Total Outstanding:</Text>
          <Text style={styles.summaryValue}>{formatMoney(total)}</Text>
        </Gradient>

        <Gradient style={styles.search}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Person..."
            placeholderTextColor="#fff"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </Gradient>

        <View style={styles.list}>
          {!loaded && !loadError ? <ActivityIndicator color="#fff" style={{ padding: 20 }} /> : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          {matches.map(([personId, person]) => (
            <Pressable
              key={personId}
              onPress={() => {
                feedback.tap();
                onOpenPerson(personId);
              }}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardName}>{person.name}</Text>
              <Text style={styles.cardBalance}>Balance: {formatMoney(person.balance)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => {
          feedback.tap();
          openAdd();
        }}
        style={[styles.fabWrap, { bottom: insets.bottom + 20 }]}
      >
        <Gradient style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Gradient>
      </Pressable>

      <Popup visible={addOpen} onClose={() => setAddOpen(false)}>
        <Text style={styles.popupTitle}>Add Person</Text>

        <Gradient style={styles.field}>
          <TextInput
            style={styles.fieldInput}
            placeholder="Enter name..."
            placeholderTextColor="#fff"
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={savePerson}
          />
        </Gradient>

        <Btn title="Save" colors={gradients.green} onPress={savePerson} disabled={saving} />
        <Btn title="Cancel" colors={gradients.red} onPress={() => setAddOpen(false)} />
      </Popup>

      <AccountPopup
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
        email={user.email}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  summary: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    borderRadius: 20
  },
  summaryLabel: { color: "#fff", fontSize: 16 },
  summaryValue: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  search: {
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30
  },
  searchInput: {
    color: "#fff",
    fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 12
  },
  list: { paddingHorizontal: 16, paddingTop: 10, gap: 12 },
  message: { color: "#fff", opacity: 0.7, textAlign: "center", padding: 20 },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: 20
  },
  cardPressed: { transform: [{ scale: 0.98 }], borderColor: colors.purpleLight },
  cardName: { color: "#fff", fontSize: 19, fontWeight: "bold", marginBottom: 6 },
  cardBalance: { color: "#fff", opacity: 0.8, fontSize: 16 },
  fabWrap: { position: "absolute", right: 20, elevation: 8 },
  fab: {
    height: 50,
    width: 120,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 38 },
  popupTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  field: { borderRadius: 10, paddingHorizontal: 10 },
  fieldInput: { color: "#fff", fontSize: 18, paddingVertical: 10 }
});
