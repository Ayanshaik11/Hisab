import { auth, database } from "./fb-init.js";

import {
  ref,
  push,
  update,
  remove,
  onValue,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// ---------- PERSON ID FROM URL (person.html?id=...) ----------

const personId = new URLSearchParams(window.location.search).get("id");


// ---------- HTML ELEMENTS ----------

const backBtn = document.getElementById("back-btn");
const profileBtn = document.getElementById("profile-btn");
const personNameEl = document.getElementById("person-name");
const personBalanceEl = document.getElementById("person-balance");
const transactionList = document.getElementById("transaction-list");
const noTransactions = document.getElementById("no-transactions");

const deletePersonBtn = document.getElementById("delete-person");

const addMoneyBtn = document.getElementById("add-money");
const removeMoneyBtn = document.getElementById("remove-money");

const popup = document.getElementById("money-popup");
const popupTitle = document.getElementById("popup-title");
const amountInput = document.getElementById("money-amount");
const dateInput = document.getElementById("money-date");
const saveMoneyBtn = document.getElementById("save-money");
const cancelMoneyBtn = document.getElementById("cancel-money");


// ---------- HELPERS ----------

let currentUid = null;
let currentType = "add"; // "add" or "remove"
let latestPerson = null; // most recent data for this person

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return (n < 0 ? "−" : "") + "₹" + Math.abs(n).toLocaleString("en-IN");
}

// Today as YYYY-MM-DD in the user's local time zone
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// "2026-09-19" -> "19 Sep 2026" (parsed by hand so time zones can't shift the day)
function formatDate(dateString) {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


// ---------- NAVIGATION ----------

backBtn.addEventListener("click", () => {
  window.location.href = "main.html";
});

profileBtn.addEventListener("click", async () => {
  if (!confirm("Log out of Hisab?")) return;
  await signOut(auth);
  window.location.href = "index.html";
});


// ---------- POPUP ----------

function openPopup(type) {
  currentType = type;
  popupTitle.textContent = type === "add" ? "Add Money" : "Remove Money";
  amountInput.value = "";
  dateInput.value = todayString();
  popup.classList.add("show");
  amountInput.focus();
}

function closePopup() {
  popup.classList.remove("show");
}

addMoneyBtn.addEventListener("click", () => openPopup("add"));
removeMoneyBtn.addEventListener("click", () => openPopup("remove"));
cancelMoneyBtn.addEventListener("click", closePopup);

// Tap the dark area outside the box to close
popup.addEventListener("click", (e) => {
  if (e.target === popup) closePopup();
});


// ---------- SAVE TRANSACTION ----------

saveMoneyBtn.addEventListener("click", async () => {

  const amount = Math.round(parseFloat(amountInput.value) * 100) / 100;
  const date = dateInput.value;

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Enter an amount greater than 0");
    return;
  }

  if (!date) {
    alert("Pick a date");
    return;
  }

  if (!currentUid || !personId) {
    alert("Please login first");
    return;
  }

  const personPath = `users/${currentUid}/people/${personId}`;
  const transactionKey = push(ref(database, `${personPath}/transactions`)).key;

  saveMoneyBtn.disabled = true;

  try {

    // One atomic write: the balance changes and the transaction is recorded
    // together, so they can never get out of sync.
    await update(ref(database, personPath), {
      balance: increment(currentType === "add" ? amount : -amount),
      [`transactions/${transactionKey}`]: {
        type: currentType,
        amount: amount,
        date: date,
        createdAt: serverTimestamp()
      }
    });

    closePopup();

  } catch (error) {

    console.error(error);
    alert("Failed to save. Check your connection and database rules.");

  } finally {

    saveMoneyBtn.disabled = false;

  }

});


// ---------- DELETE PERSON ----------

deletePersonBtn.addEventListener("click", async () => {

  if (!currentUid || !personId || !latestPerson) return;

  const count = Object.keys(latestPerson.transactions || {}).length;
  const balance = Number(latestPerson.balance) || 0;

  let message = `Delete ${latestPerson.name}`;

  if (count > 0) {
    message += count === 1
      ? " and their 1 transaction"
      : ` and all ${count} transactions`;
  }

  message += "? This can't be undone.";

  if (balance !== 0) {
    message += `\n\nTheir balance of ${formatMoney(balance)} will be removed from your total.`;
  }

  if (!confirm(message)) return;

  deletePersonBtn.disabled = true;

  try {

    // Removing the person node deletes their balance and every transaction with it
    await remove(ref(database, `users/${currentUid}/people/${personId}`));

    window.location.href = "main.html";

  } catch (error) {

    console.error(error);
    alert("Failed to delete. Check your connection and database rules.");
    deletePersonBtn.disabled = false;

  }

});


// ---------- RENDER ----------

function renderPerson(person) {

  latestPerson = person;

  personNameEl.textContent = person.name;
  document.title = `${person.name} - Hisab`;
  personBalanceEl.textContent = formatMoney(person.balance);

  // Oldest first (by date, then by entry order) so we can work out the
  // running balance after each transaction
  const ordered = Object.entries(person.transactions || {})
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) =>
      (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id)
    );

  let running = 0;
  ordered.forEach((t) => {
    running += (t.type === "add" ? 1 : -1) * (Number(t.amount) || 0);
    t.runningBalance = Math.round(running * 100) / 100;
  });

  // Show newest first
  const transactions = ordered.reverse();

  if (transactions.length === 0) {
    transactionList.replaceChildren(noTransactions);
    return;
  }

  const rows = transactions.map((t) => {

    const isAdd = t.type === "add";

    const row = document.createElement("div");
    row.className = `transaction-item ${isAdd ? "add" : "remove"}`;

    const info = document.createElement("div");
    info.className = "transaction-info";

    const label = document.createElement("span");
    label.textContent = isAdd ? "Money added" : "Money removed";

    const when = document.createElement("small");
    when.textContent = formatDate(t.date);

    info.append(label, when);

    const amountEl = document.createElement("span");
    amountEl.className = "transaction-amount";
    amountEl.textContent = (isAdd ? "+" : "−") + formatMoney(t.amount).replace("−", "");

    const balanceAfter = document.createElement("small");
    balanceAfter.className = "transaction-balance";
    balanceAfter.textContent = `Balance ${formatMoney(t.runningBalance)}`;

    const right = document.createElement("div");
    right.className = "transaction-right";
    right.append(amountEl, balanceAfter);

    row.append(info, right);

    return row;

  });

  transactionList.replaceChildren(...rows);

}


// ---------- CHECK LOGIN + LISTEN FOR THIS PERSON ----------

let stopListening = null;

onAuthStateChanged(auth, (user) => {

  if (stopListening) {
    stopListening();
    stopListening = null;
  }

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!personId) {
    window.location.href = "main.html";
    return;
  }

  currentUid = user.uid;

  const personRef = ref(database, `users/${user.uid}/people/${personId}`);

  stopListening = onValue(
    personRef,
    (snapshot) => {

      const person = snapshot.val();

      if (!person) {
        // person doesn't exist (bad link) — go back to the list
        window.location.href = "main.html";
        return;
      }

      renderPerson(person);

    },
    (error) => {
      console.error(error);
      noTransactions.textContent =
        "Could not load data. Check your database rules.";
    }
  );

});
