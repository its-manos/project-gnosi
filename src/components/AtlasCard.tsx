import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";
import { MotionView } from "./HomeMotion";

// One Midnight Atlas hero surface; layouts and animation timing remain screen-owned.
export const atlasCardStyles = StyleSheet.create({
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#555078",
    backgroundColor: "#20243C",
    overflow: "hidden",
  },
});

export default function AtlasCard({ style, ...props }: ComponentProps<typeof MotionView>) {
  return <MotionView {...props} style={[atlasCardStyles.hero, style]} />;
}
