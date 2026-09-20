// Sounds + vibration for taps and results.
// Both can be switched off from the profile button (Account popup).

import { Vibration } from "react-native";
import { createAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hisab:feedback-settings";

// Sound files live in assets/sounds/  (replace them with your own .wav / .mp3 if you like)
const SOURCES = {
  tap: require("../assets/sounds/tap.wav"),
  success: require("../assets/sounds/success.wav"),
  error: require("../assets/sounds/error.wav"),
  delete: require("../assets/sounds/delete.wav")
};

// Vibration patterns in milliseconds: [wait, buzz, wait, buzz ...] (a single number = one buzz)
const PATTERNS = {
  tap: 12,
  success: [0, 25, 70, 25],
  error: [0, 80, 60, 80],
  delete: [0, 120]
};

let settings = { sound: true, vibration: true };
const players = {};

export function getFeedbackSettings() {
  return { ...settings };
}

export async function loadFeedbackSettings() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
  } catch (error) {
    console.warn("Could not load sound settings", error);
  }

  // Create the players up front so the first tap has no delay
  Object.keys(SOURCES).forEach(getPlayer);
}

export async function setFeedbackSetting(key, value) {
  settings = { ...settings, [key]: value };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Could not save sound settings", error);
  }
}

function getPlayer(name) {
  if (!players[name]) {
    try {
      players[name] = createAudioPlayer(SOURCES[name]);
    } catch (error) {
      console.warn("Could not create sound", name, error);
    }
  }
  return players[name];
}

function play(name) {
  if (settings.sound) {
    try {
      const player = getPlayer(name);
      if (player) {
        Promise.resolve(player.seekTo(0)).catch(() => {});
        player.play();
      }
    } catch (error) {
      // sounds must never break the app
    }
  }

  if (settings.vibration) {
    try {
      Vibration.vibrate(PATTERNS[name]);
    } catch (error) {
      // ignore
    }
  }
}

export const feedback = {
  tap: () => play("tap"),
  success: () => play("success"),
  error: () => play("error"),
  delete: () => play("delete")
};
