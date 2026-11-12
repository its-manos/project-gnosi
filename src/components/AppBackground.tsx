/** Shared screen backdrop using Home's bundled Midnight Atlas artwork. */
import { memo } from "react";
import HomeAtlasBackground from "./HomeAtlasBackground";

function AppBackground() {
  // Keep other screens calm and avoid additional ambient animation loops.
  return <HomeAtlasBackground showAmbientMotion={false} />;
}

export default memo(AppBackground);
