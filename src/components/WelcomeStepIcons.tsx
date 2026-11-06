import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";

type Props = { size?: number };

/** Engraved compass/question emblem for the real Daily Quiz stage. */
export function WelcomeQuizIcon({ size = 44 }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 52 52"
    pointerEvents="none" accessible={false} testID="welcome-quiz-icon">
    <Defs>
      <LinearGradient id="welcome-quiz-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F7E2B8" />
        <Stop offset="55%" stopColor="#D0B28F" />
        <Stop offset="100%" stopColor="#967F8E" />
      </LinearGradient>
    </Defs>
    <Circle cx={26} cy={26} r={21} fill="#282741" stroke="#B9A4E3" strokeWidth={1} />
    <Circle cx={26} cy={26} r={16.8} fill="none" stroke="#676487" strokeWidth={0.85} />
    <Path d="M26 2.5L28.6 12L26 10L23.4 12Z M49.5 26L40 28.6L42 26L40 23.4Z M26 49.5L23.4 40L26 42L28.6 40Z M2.5 26L12 23.4L10 26L12 28.6Z"
      fill="url(#welcome-quiz-metal)" />
    <Path d="M20 20.6C20.7 15.5 30.9 15.6 31.7 21.4C32 24.5 27.1 26.5 26 29.7"
      stroke="url(#welcome-quiz-metal)" strokeWidth={3.3} fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={26} cy={35.1} r={2.2} fill="#E8CDA4" />
    <Circle cx={10} cy={10} r={1.7} fill="#8BC5C8" />
  </Svg>;
}

/** Open book with a guided path, matching the explorer/atlas visual language. */
export function WelcomeLessonIcon({ size = 44 }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 52 52"
    pointerEvents="none" accessible={false} testID="welcome-lesson-icon">
    <Defs>
      <LinearGradient id="welcome-book-cover" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFD7AD" />
        <Stop offset="100%" stopColor="#A18B80" />
      </LinearGradient>
    </Defs>
    <Path d="M25.7 15C19.3 11.4 11.1 11.5 5.5 14V39.3C12.5 36.5 19.6 37 25.7 40.5Z"
      fill="#2B3451" stroke="#D9C7B6" strokeWidth={1.5} strokeLinejoin="round" />
    <Path d="M26.3 15C32.5 11.4 40.8 11.5 46.5 14V39.3C39.4 36.5 32.5 37 26.3 40.5Z"
      fill="#33304F" stroke="#D9C7B6" strokeWidth={1.5} strokeLinejoin="round" />
    <Path d="M26 14.5V41" stroke="#EBCFA5" strokeWidth={1.5} />
    <G fill="none" stroke="url(#welcome-book-cover)" strokeLinecap="round" strokeWidth={1.05} opacity={0.85}>
      <Path d="M10.5 20.3C14.8 19 19.4 19.5 22 21" />
      <Path d="M10.5 25.3C14.8 24 19.4 24.5 22 26" />
      <Path d="M30 21C34.2 19.2 38.1 19 42 20.2" />
      <Path d="M30 26C34.2 24.2 38.1 24 42 25.2" />
      <Path d="M30 31C34.2 29.2 38.1 29 42 30.2" />
    </G>
    <Path d="M25.8 3.5L28.1 8.7 33.7 9 29.4 12.7 30.5 18.2 25.8 15.1 21.1 18.2 22.2 12.7 18 9 23.5 8.7Z"
      fill="#D5BEFF" stroke="#F3E5C7" strokeWidth={0.5} />
  </Svg>;
}
