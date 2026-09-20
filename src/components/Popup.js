import React, { useEffect, useRef } from "react";
import { Animated, BackHandler, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";

// A centred-ish box over a dark backdrop. Tap outside or press Back to close.
// It sits near the top (not the middle) so the keyboard never covers it.
export default function Popup({ visible, onClose, children }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;

    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.wrap, { paddingTop: insets.top + 60 }]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.box,
            {
              opacity: anim,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
              ]
            }
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000aa"
  },
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center"
  },
  box: {
    width: "86%",
    maxWidth: 420,
    padding: 25,
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20
  }
});
