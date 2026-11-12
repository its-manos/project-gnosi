import { Image } from 'expo-image';
import { playerClass } from '../gamification/trophies';
const characters = {
  novice: require('../../assets/player-characters/novice.webp'),
  apprentice: require('../../assets/player-characters/apprentice.webp'),
  explorer: require('../../assets/player-characters/explorer.webp'),
  researcher: require('../../assets/player-characters/researcher.webp'),
  sage: require('../../assets/player-characters/sage.webp'),
};
/** Local 256px assets; decoded at the rendered size, no network or base64. */
export default function PlayerCharacter({ level, size = 76 }: { level: number; size?: number }) {
  return <Image source={characters[playerClass(level).id]} contentFit="contain" cachePolicy="memory" transition={0}
    style={{ width: size, height: size }} accessible={false} />;
}
