import Svg, { Path, Circle } from "react-native-svg";
import type { Trophy, TrophyFamily } from "../gamification/trophies";
import { colors } from "../theme";
const glyphs: Record<TrophyFamily, string> = {
  lessons: 'M5 5h6l1 2 1-2h6v15h-6l-1 1-1-1H5V5Zm7 2v14',
  worlds: 'm12 3 8 9-8 9-8-9 8-9Zm0 5-4 8 8-4-4-4Z',
  daily: 'M5 6h14v15H5V6Zm3-3v6m8-6v6M5 11h14m-10 5 2 2 4-4',
  streak: 'M13 3c1 6-6 7-6 12a5 5 0 0 0 10 0c0-3-2-5-2-5s0 4-3 4c-2-3 2-6 1-11Z',
  revision: 'M5 10a7 7 0 1 1 0 5M5 4v6h6m-2 4 2 2 4-4',
  hangman: 'M4 19V5h12v3M2 20h9m5-5v5m-3-2 3-3 3 3',
};
export default function TrophyIcon({ trophy }: { trophy: Trophy }) {
  const tone = trophy.unlocked ? [colors.accentLight, '#C8B7EC', '#DCC08B', '#EAD8AB', '#F3E4C1'][trophy.tier - 1] : '#737C91';
  return <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d={glyphs[trophy.family]} stroke={tone} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    {trophy.family === 'hangman' ? <Circle cx={16} cy={11} r={3} stroke={tone} strokeWidth={1.5} /> : null}
  </Svg>;
}
