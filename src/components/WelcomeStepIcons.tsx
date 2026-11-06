import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from "react-native-svg";

type Props = { size?: number };

/** A small explorer's globe unfolding from a book: a unique Gnosi atlas emblem. */
export function WelcomeAtlasIcon({ size = 108 }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 120 120"
    pointerEvents="none" accessible={false} testID="welcome-atlas-icon">
    <Defs>
      <LinearGradient id="welcome-atlas-orb" x1="15%" y1="10%" x2="85%" y2="100%">
        <Stop offset="0%" stopColor="#7AACC3" />
        <Stop offset="48%" stopColor="#3F7293" />
        <Stop offset="100%" stopColor="#343E77" />
      </LinearGradient>
      <LinearGradient id="welcome-atlas-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF0C9" />
        <Stop offset="55%" stopColor="#DBBC8D" />
        <Stop offset="100%" stopColor="#A8897F" />
      </LinearGradient>
      <LinearGradient id="welcome-atlas-page" x1="0%" y1="0%" x2="95%" y2="100%">
        <Stop offset="0%" stopColor="#414568" />
        <Stop offset="100%" stopColor="#222D49" />
      </LinearGradient>
    </Defs>
    <Circle cx={60} cy={60} r={55} fill="#1D253F" stroke="#615D86" strokeWidth={1.2} />
    <Circle cx={60} cy={60} r={49} fill="none" stroke="#8479A1" strokeWidth={0.8} opacity={0.65} />
    <Path d="M60 0V9 M60 111V120 M0 60H9 M111 60H120"
      stroke="#CCB6E9" strokeWidth={1.6} strokeLinecap="round" />
    <Ellipse cx={60} cy={56} rx={46} ry={15} rotation={-24}
      fill="none" stroke="#B6A4D1" strokeWidth={1.3} opacity={0.72} />
    <Circle cx={60} cy={54} r={28} fill="url(#welcome-atlas-orb)"
      stroke="url(#welcome-atlas-gold)" strokeWidth={2.2} />
    <Path d="M32 54H88 M60 26C46 38 46 69 60 82 M60 26C74 38 74 69 60 82"
      fill="none" stroke="#D5EBED" strokeWidth={1} opacity={0.65} />
    <Path d="M36 42C47 48 73 48 84 42 M36 66C47 60 73 60 84 66"
      fill="none" stroke="#D5EBED" strokeWidth={1} opacity={0.52} />
    <Path d="M48 33L56 37L53 47L45 52L42 46Z M69 56L79 52L84 59L78 67L72 65L67 61Z"
      fill="#9AD4C3" opacity={0.77} />
    <Path d="M59.8 83C46.5 76 29 77 19 82V104C34 99 48 101 59.8 107Z"
      fill="url(#welcome-atlas-page)" stroke="url(#welcome-atlas-gold)" strokeWidth={1.9}
      strokeLinejoin="round" />
    <Path d="M60.2 83C73.5 76 91 77 101 82V104C86 99 72 101 60.2 107Z"
      fill="url(#welcome-atlas-page)" stroke="url(#welcome-atlas-gold)" strokeWidth={1.9}
      strokeLinejoin="round" />
    <Path d="M60 82V107 M27 87C38 84 48 87 54 90 M27 93C38 90 48 93 54 96
      M93 87C82 84 72 87 66 90 M93 93C82 90 72 93 66 96"
      stroke="#CFBFBA" strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.77} />
    <Circle cx={26} cy={23} r={2} fill="#8ED5CB" />
    <Circle cx={96} cy={30} r={2.3} fill="#EDCCA3" />
    <Path d="M97 11V18 M93.5 14.5H100.5" stroke="#B8A6EA"
      strokeWidth={1.6} strokeLinecap="round" />
  </Svg>;
}

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
