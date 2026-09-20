import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Gradient from "./Gradient";
import { colors } from "../theme";
import { feedback } from "../feedback";

// Profile photo: replace  assets/profile.webp  with your own picture
const PROFILE_IMAGE = require("../../assets/profile.webp");

export default function TopBar({ title, onBack, onProfile }) {
  const insets = useSafeAreaInsets();

  return (
    <Gradient
      style={[styles.bar, { paddingTop: insets.top + 10, minHeight: 64 + insets.top }]}
    >
      {onBack ? (
        <Pressable
          onPress={() => {
            feedback.tap();
            onBack();
          }}
          style={styles.round}
          hitSlop={8}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
      ) : null}

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <Pressable
        onPress={() => {
          feedback.tap();
          onProfile();
        }}
        style={styles.round}
        hitSlop={8}
      >
        <Image source={PROFILE_IMAGE} style={styles.avatar} />
      </Pressable>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 10
  },
  round: {
    height: 40,
    width: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.deep,
    elevation: 4
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20
  },
  backText: {
    color: "#fff",
    fontSize: 20
  }
});
