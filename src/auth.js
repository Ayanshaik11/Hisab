import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

// Loaded only when needed, so a problem with Google login can never stop the app opening
function googleModule() {
  return require("@react-native-google-signin/google-signin");
}

import { auth } from "./firebase";
import { GOOGLE_WEB_CLIENT_ID } from "./config";

export function configureGoogle() {
  try {
    const { GoogleSignin } = googleModule();
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  } catch (error) {
    console.warn("Google sign-in is not available", error);
  }
}

export async function loginWithEmail(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

// Returns false if the person backed out of the Google account chooser
export async function loginWithGoogle() {
  const { GoogleSignin, isSuccessResponse } = googleModule();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) return false;

  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error("Google did not return a login token.");
  }

  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  return true;
}

export async function logout() {
  try {
    await googleModule().GoogleSignin.signOut();   // so the Google account chooser shows again next time
  } catch (error) {
    // not signed in with Google - fine
  }
  await signOut(auth);
}

const FIREBASE_MESSAGES = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That email address isn't valid.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email. Log in with your email and password."
};

function statusCodes() {
  try {
    return googleModule().statusCodes || {};
  } catch (error) {
    return {};
  }
}

export function isCancelled(error) {
  const code = String((error && error.code) || "");
  const codes = statusCodes();
  return code === codes.SIGN_IN_CANCELLED || code === codes.IN_PROGRESS;
}

export function errorMessage(error) {
  console.error(error);

  const code = String((error && error.code) || "");
  const message = String((error && error.message) || "");

  if (FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code];

  if (code === statusCodes().PLAY_SERVICES_NOT_AVAILABLE) {
    return "Google Play Services is missing or out of date on this phone.";
  }

  if (code === "10" || /DEVELOPER_ERROR|\b10\b/.test(message)) {
    return (
      "Google login isn't set up correctly (error 10).\n\n" +
      "The SHA-1 shown in the GitHub build summary must be added in Firebase " +
      "(Project settings > your Android app), and the Web client ID in src/config.js " +
      "must be from the same Firebase project."
    );
  }

  return message || "Something went wrong. Try again.";
}
