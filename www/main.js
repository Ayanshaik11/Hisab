import { auth, database } from "./fb-init.js";

import {
  ref,
  push,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// ---------- HTML ELEMENTS ----------

const addPersonBtn = document.getElementById("add-person");
const popup = document.getElementById("add-person-popup");
const closePopup = document.getElementById("close-popup");
const savePerson = document.getElementById("save-person");
const personName = document.getElementById("person-name");
const peopleList = document.getElementById("people-list");
const totalBalance = document.getElementById("total-balance");
const searchInput = document.getElementById("search-id");
const profileBtn = document.getElementById("profile-btn");


// ---------- HELPERS ----------

let people = {}; // latest data from Firebase

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return (n < 0 ? "−" : "") + "₹" + Math.abs(n).toLocaleString("en-IN");
}

function showMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  peopleList.replaceChildren(p);
}


// ---------- RENDER LIST + TOTAL ----------

function render() {

  const entries = Object.entries(people);

  // Total outstanding is always across everyone, regardless of the search
  const total = entries.reduce(
    (sum, [, person]) => sum + (Number(person.balance) || 0),
    0
  );
  totalBalance.textContent = formatMoney(total);

  if (entries.length === 0) {
    showMessage("No people added yet.");
    return;
  }

  const query = searchInput.value.trim().toLowerCase();

  const matches = entries
    .filter(([, person]) => (person.name || "").toLowerCase().includes(query))
    .sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""));

  if (matches.length === 0) {
    showMessage("No one matches your search.");
    return;
  }

  const cards = matches.map(([personId, person]) => {

    const card = document.createElement("div");
    card.className = "person-card";

    const name = document.createElement("h3");
    name.textContent = person.name;   // textContent, so names can't inject HTML

    const balance = document.createElement("p");
    balance.textContent = `Balance: ${formatMoney(person.balance)}`;

    card.append(name, balance);

    card.addEventListener("click", () => {
      window.location.href = `person.html?id=${encodeURIComponent(personId)}`;
    });

    return card;

  });

  peopleList.replaceChildren(...cards);

}

searchInput.addEventListener("input", render);


// ---------- POPUP ----------

addPersonBtn.addEventListener("click", () => {
  popup.classList.add("show");
  personName.focus();
});

closePopup.addEventListener("click", () => {
  popup.classList.remove("show");
});

// Tap the dark area outside the box to close
popup.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.remove("show");
});

// Press Enter in the name box to save
personName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") savePerson.click();
});


// ---------- LOG OUT ----------

profileBtn.addEventListener("click", async () => {
  if (!confirm("Log out of Hisab?")) return;
  await signOut(auth);
  window.location.href = "index.html";
});


// ---------- CHECK LOGIN + LISTEN FOR PEOPLE ----------

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

  const peopleRef = ref(database, `users/${user.uid}/people`);

  stopListening = onValue(
    peopleRef,
    (snapshot) => {
      people = snapshot.val() || {};
      render();
    },
    (error) => {
      console.error(error);
      showMessage("Could not load data. Check your database rules.");
    }
  );

});


// ---------- SAVE NEW PERSON ----------

savePerson.addEventListener("click", async () => {

  const name = personName.value.trim();

  if (!name) {
    alert("Enter person's name");
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  savePerson.disabled = true;

  try {

    const peopleRef = ref(database, `users/${user.uid}/people`);
    const newPersonRef = push(peopleRef);

    await set(newPersonRef, {
      name: name,
      balance: 0
    });

    personName.value = "";
    popup.classList.remove("show");

  } catch (error) {

    console.error(error);
    alert("Failed to add person");

  } finally {

    savePerson.disabled = false;

  }

});
