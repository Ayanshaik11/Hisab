// Import Firebase authentication functions
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Import our Firebase Auth instance
import { auth } from "./fb-init.js";


// Get the elements from index.html
const emailInput = document.getElementById("input-email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const googleBtn = document.getElementById("ggl-login-btn");


// Turn Firebase error codes into readable messages
function showAuthError(error) {

  console.error(error);

  // Closing the Google popup isn't an error worth alerting about
  if (
    error.code === "auth/popup-closed-by-user" ||
    error.code === "auth/cancelled-popup-request"
  ) {
    return;
  }

  const messages = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "That email address isn't valid.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-blocked": "Your browser blocked the Google popup. Allow popups and try again.",
    "auth/missing-initial-state": "Google login failed in this browser. Please try again.",
    "auth/operation-not-supported-in-this-environment": "Google login isn't available in the app yet. Please use email and password.",
    "auth/unauthorized-domain": "This domain isn't authorised in Firebase → Authentication → Settings → Authorized domains."
  };

  alert(messages[error.code] || error.message);

}


// Email + Password Login
loginBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  loginBtn.disabled = true;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "main.html";

  } catch (error) {

    showAuthError(error);

  } finally {

    loginBtn.disabled = false;

  }

});

// Press Enter in either box to log in
[emailInput, passwordInput].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
});


// Google Login
//  - In the Android app: native Google sign-in (popups don't work in a WebView)
//  - In a normal browser: the usual Firebase popup
const isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

async function googleLoginNative() {

  const FirebaseAuthentication = window.Capacitor.registerPlugin("FirebaseAuthentication");

  // skipNativeAuth is on (capacitor.config.json), so this only returns Google's token
  const result = await FirebaseAuthentication.signInWithGoogle();

  const idToken = result.credential && result.credential.idToken;

  if (!idToken) {
    throw new Error("Google did not return a login token.");
  }

  // Sign in to the same Firebase web SDK the rest of the app uses
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);

}

googleBtn.addEventListener("click", async () => {

  googleBtn.disabled = true;

  try {

    if (isNativeApp) {
      await googleLoginNative();
    } else {
      await signInWithPopup(auth, new GoogleAuthProvider());
    }

    window.location.href = "main.html";

  } catch (error) {

    // Person backed out of the Google account chooser
    if (/cancel/i.test(String(error && (error.message || error.code)))) return;

    showAuthError(error);

  } finally {

    googleBtn.disabled = false;

  }

});


// Already logged in? Skip the login page.
onAuthStateChanged(auth, (user) => {

  if (user) {
    window.location.href = "main.html";
  }

});
