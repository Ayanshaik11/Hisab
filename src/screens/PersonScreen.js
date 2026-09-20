import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { increment, onValue, push, ref, remove, serverTimestamp, update } from "firebase/database";

import { database } from "../firebase";
import { colors, gradients } from "../theme";
import { formatDate, formatMoney, parseYMD, toYMD, todayString } from "../utils";
import { feedback } from "../feedback";
import Gradient from "../components/Gradient";
import TopBar from "../components/TopBar";
import Popup from "../components/Popup";
import Btn from "../components/Btn";
import AccountPopup from "../components/AccountPopup";

export default function PersonScreen({ user, personId, onBack }) {
  const insets = useSafeAreaInsets();

  const [person, setPerson] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [popupType, setPopupType] = useState(null);   // "add" | "remove" | null
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const personPath = `users/${user.uid}/people/${personId}`;

  // Live data for this person (same place as the web app)
  useEffect(() => {
    return onValue(
      ref(database, personPath),
      (snapshot) => {
        const value = snapshot.val();

        if (!value) {
          // person doesn't exist any more (deleted) - go back to the list
          onBack();
          return;
        }

        setPerson(value);
      },
      (error) => {
        console.error(error);
        setLoadError("Could not load data. Check your database rules.");
      }
    );
  }, [personPath]);

  // Oldest first (by date, then entry order) to work out the running balance,
  // then shown newest first
  const transactions = useMemo(() => {
    if (!person) return [];

    const ordered = Object.entries(person.transactions || {})
      .map(([id, t]) => ({ id, ...t }))
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));

    let running = 0;
    ordered.forEach((t) => {
      running += (t.type === "add" ? 1 : -1) * (Number(t.amount) || 0);
      t.runningBalance = Math.round(running * 100) / 100;
    });

    return ordered.reverse();
  }, [person]);

  function openPopup(type) {
    setPopupType(type);
    setAmountText("");
    setDate(todayString());
  }

  function pickDate() {
    DateTimePickerAndroid.open({
      value: parseYMD(date),
      mode: "date",
      onChange: (event, selected) => {
        if (event.type === "set" && selected) setDate(toYMD(selected));
      }
    });
  }

  async function saveMoney() {
    const amount = Math.round(parseFloat(amountText.replace(",", ".")) * 100) / 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      feedback.error();
      Alert.alert("Enter an amount greater than 0");
      return;
    }

    if (!date) {
      feedback.error();
      Alert.alert("Pick a date");
      return;
    }

    const type = popupType;
    const transactionKey = push(ref(database, `${personPath}/transactions`)).key;

    setSaving(true);

    try {
      // One atomic write: the balance changes and the transaction is recorded
      // together, so they can never get out of sync. (Exactly as the web app did.)
      await update(ref(database, personPath), {
        balance: increment(type === "add" ? amount : -amount),
        [`transactions/${transactionKey}`]: {
          type,
          amount,
          date,
          createdAt: serverTimestamp()
        }
      });

      feedback.success();
      setPopupType(null);
    } catch (error) {
      console.error(error);
      feedback.error();
      Alert.alert("Failed to save", "Check your connection and database rules.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!person) return;

    const count = Object.keys(person.transactions || {}).length;
    const balance = Number(person.balance) || 0;

    let message = `Delete ${person.name}`;

    if (count > 0) {
      message += count === 1 ? " and their 1 transaction" : ` and all ${count} transactions`;
    }

    message += "? This can't be undone.";

    if (balance !== 0) {
      message += `\n\nTheir balance of ${formatMoney(balance)} will be removed from your total.`;
    }

    Alert.alert("Delete person", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete }
    ]);
  }

  async function doDelete() {
    setDeleting(true);

    try {
      // Removing the person node deletes their balance and every transaction with it
      await remove(ref(database, personPath));
      feedback.delete();
      onBack();
    } catch (error) {
      console.error(error);
      feedback.error();
      Alert.alert("Failed to delete", "Check your connection and database rules.");
      setDeleting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <TopBar
        title={person ? person.name : "Person"}
        onBack={onBack}
        onProfile={() => setAccountOpen(true)}
      />

      {!person ? (
        <View style={styles.center}>
          {loadError ? (
            <Text style={styles.muted}>{loadError}</Text>
          ) : (
            <ActivityIndicator color="#fff" />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
          <Gradient style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{formatMoney(person.balance)}</Text>
          </Gradient>

          <View style={styles.section}>
            <Text style={styles.heading}>Transactions</Text>

            {transactions.length === 0 ? (
              <Text style={styles.empty}>No transactions yet.</Text>
            ) : (
              transactions.map((t) => {
                const isAdd = t.type === "add";
                const tint = isAdd ? colors.green : colors.red;

                return (
                  <View key={t.id} style={[styles.txn, { borderLeftColor: tint }]}>
                    <View>
                      <Text style={styles.txnLabel}>{isAdd ? "Money added" : "Money removed"}</Text>
                      <Text style={styles.txnSmall}>{formatDate(t.date)}</Text>
                    </View>

                    <View style={styles.txnRight}>
                      <Text style={[styles.txnAmount, { color: tint }]}>
                        {(isAdd ? "+" : "−") + formatMoney(t.amount).replace("−", "")}
                      </Text>
                      <Text style={styles.txnSmall}>Balance {formatMoney(t.runningBalance)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.danger}>
            <Pressable
              disabled={deleting}
              onPress={() => {
                feedback.tap();
                confirmDelete();
              }}
              style={({ pressed }) => [
                styles.deleteBtn,
                { opacity: deleting ? 0.5 : 1, backgroundColor: pressed ? colors.red : "transparent" }
              ]}
            >
              <Text style={styles.deleteText}>Delete person</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <View style={[styles.actions, { paddingBottom: insets.bottom + 14 }]}>
        <Btn
          title="+ Add Money"
          colors={gradients.green}
          style={styles.actionBtn}
          onPress={() => openPopup("add")}
          disabled={!person}
        />
        <Btn
          title="− Remove Money"
          colors={gradients.red}
          style={styles.actionBtn}
          onPress={() => openPopup("remove")}
          disabled={!person}
        />
      </View>

      <Popup visible={popupType !== null} onClose={() => setPopupType(null)}>
        <Text style={styles.popupTitle}>{popupType === "add" ? "Add Money" : "Remove Money"}</Text>

        <Text style={styles.label}>Amount</Text>
        <Gradient style={styles.field}>
          <TextInput
            style={styles.fieldInput}
            placeholder="Enter amount"
            placeholderTextColor="#fff"
            keyboardType="decimal-pad"
            value={amountText}
            onChangeText={setAmountText}
            autoFocus
          />
        </Gradient>

        <Text style={styles.label}>Date</Text>
        <Pressable
          onPress={() => {
            feedback.tap();
            pickDate();
          }}
        >
          <Gradient style={styles.field}>
            <Text style={styles.fieldInput}>{formatDate(date)}</Text>
          </Gradient>
        </Pressable>

        <Btn title="Save" colors={gradients.green} onPress={saveMoney} disabled={saving} />
        <Btn title="Cancel" colors={gradients.red} onPress={() => setPopupType(null)} />
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  muted: { color: "#fff", opacity: 0.7, textAlign: "center" },
  balanceCard: {
    margin: 16,
    marginTop: 20,
    padding: 24,
    alignItems: "center",
    borderRadius: 20
  },
  balanceLabel: { color: "#fff", opacity: 0.9, marginBottom: 6, fontSize: 16 },
  balanceValue: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  section: { paddingHorizontal: 16, gap: 10 },
  heading: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 2 },
  empty: { color: "#fff", opacity: 0.6, textAlign: "center", padding: 20 },
  txn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderRadius: 16
  },
  txnLabel: { color: "#fff", fontSize: 16 },
  txnSmall: { color: "#fff", opacity: 0.6, fontSize: 12, marginTop: 4 },
  txnRight: { alignItems: "flex-end" },
  txnAmount: { fontSize: 18, fontWeight: "600" },
  danger: { paddingTop: 28, paddingHorizontal: 16, alignItems: "center" },
  deleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 15
  },
  deleteText: { color: colors.red, fontSize: 16 },
  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingTop: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: "#ffffff22"
  },
  actionBtn: { flex: 1 },
  popupTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  label: { color: "#fff", opacity: 0.8, fontSize: 14, marginBottom: -6 },
  field: { borderRadius: 10, paddingHorizontal: 10 },
  fieldInput: { color: "#fff", fontSize: 18, paddingVertical: 10 }
});
