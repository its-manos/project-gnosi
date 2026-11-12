import { Image } from 'expo-image';
import type { AvatarVariant } from '../state/PlayerAvatar';
import { playerClass } from '../gamification/trophies';
const characters = {
  novice: { male: require('../../assets/player-characters/novice.webp'), female: require('../../assets/player-characters/novice-female.webp') },
  apprentice: { male: require('../../assets/player-characters/apprentice-male.webp'), female: require('../../assets/player-characters/apprentice.webp') },
  explorer: { male: require('../../assets/player-characters/explorer-male.webp'), female: require('../../assets/player-characters/explorer.webp') },
  researcher: { male: require('../../assets/player-characters/researcher-male.webp'), female: require('../../assets/player-characters/researcher.webp') },
  sage: { male: require('../../assets/player-characters/sage.webp'), female: require('../../assets/player-characters/sage-female.webp') },
};
/** Local 256px assets; decoded at the rendered size, no network or base64. */
export default function PlayerCharacter({ level, size = 76, variant = 'male' }: { level: number; size?: number; variant?: AvatarVariant }) {
  return <Image source={characters[playerClass(level).id][variant]} contentFit="contain" cachePolicy="memory" transition={0}
    style={{ width: size, height: size }} accessible={false} />;
}
