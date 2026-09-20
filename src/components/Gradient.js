import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "../theme";

// Same look as the old CSS: linear-gradient(45deg, from, to)
export default function Gradient({ colors = gradients.primary, style, children }) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
