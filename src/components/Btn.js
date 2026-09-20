import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Gradient from "./Gradient";
import { feedback } from "../feedback";

export default function Btn({ title, onPress, colors, style, textStyle, disabled }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        feedback.tap();
        if (onPress) onPress();
      }}
      style={({ pressed }) => [
        { opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style
      ]}
    >
      <Gradient colors={colors} style={styles.inner}>
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </Gradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500"
  }
});
