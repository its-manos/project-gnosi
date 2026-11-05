/**
 * Μυθολογία — original sculptural Minotaur head, with powerful crescent horns,
 * weathered bronze/limestone planes and a small labyrinth-stone pedestal.
 * A static island landmark: decorative only and never an interaction layer.
 */
import Svg, {
  Circle, Defs, Ellipse, G, LinearGradient, Path, Stop,
} from "react-native-svg";

type Props = { size?: number };

export default function MythologyIslandIcon({ size = 64 }: Props) {
  return (
    <Svg testID="mythology-minotaur-svg" width={size} height={size}
      viewBox="0 0 100 100" accessible={false} pointerEvents="none">
      <Defs>
        <LinearGradient id="minotaur-horn" x1="10%" y1="0%" x2="85%" y2="90%">
          <Stop offset="0%" stopColor="#F4E5C7" />
          <Stop offset="48%" stopColor="#B8A88A" />
          <Stop offset="100%" stopColor="#807B72" />
        </LinearGradient>
        <LinearGradient id="minotaur-face" x1="10%" y1="5%" x2="87%" y2="95%">
          <Stop offset="0%" stopColor="#D8BC98" />
          <Stop offset="40%" stopColor="#9D8D80" />
          <Stop offset="100%" stopColor="#3D555D" />
        </LinearGradient>
        <LinearGradient id="minotaur-muzzle" x1="0%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#DDC6A8" />
          <Stop offset="100%" stopColor="#746F70" />
        </LinearGradient>
        <LinearGradient id="minotaur-base" x1="0%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#C9B493" />
          <Stop offset="100%" stopColor="#5C6570" />
        </LinearGradient>
      </Defs>

      <Ellipse cx={50} cy={86} rx={31} ry={5} fill="#0A1C29" opacity={0.45} />

      {/* Massive swept horns frame the face; upward silhouettes remain readable
          even at a reduced 35pt icon on compact phones. */}
      <Path d="M 33 35 C 21 35 10 28 8 11 C 14 17 22 19 30 18
               C 35 19 39 26 39 34 Z"
        fill="url(#minotaur-horn)" stroke="#F0DCC0" strokeWidth={1.2} strokeLinejoin="round"/>
      <Path d="M 67 35 C 79 35 90 28 92 11 C 86 17 78 19 70 18
               C 65 19 61 26 61 34 Z"
        fill="url(#minotaur-horn)" stroke="#E1CBAE" strokeWidth={1.2} strokeLinejoin="round"/>
      <Path d="M 19 23 Q 26 26 33 31 M 81 23 Q 74 26 67 31"
        fill="none" stroke="#6C7071" strokeWidth={1.1} strokeOpacity={0.57}/>
      {/* Angular ears, forehead and heavy bronze cheek planes. */}
      <Path d="M 32 33 L 18 35 L 26 48 L 34 49 Z"
        fill="#B6A48A" stroke="#DFC7A5" strokeWidth={0.8}/>
      <Path d="M 68 33 L 82 35 L 74 48 L 66 49 Z"
        fill="#756F6B" stroke="#CBB795" strokeWidth={0.8}/>
      <Path d="M 33 27 Q 50 20 67 27 L 73 39 L 69 57
               L 65 65 L 60 74 L 50 78 L 40 74 L 35 65 L 31 57 L 27 39 Z"
        fill="url(#minotaur-face)" stroke="#E2CCAA" strokeWidth={1.25}
        strokeLinejoin="round"/>
      {/* Strong brow and central forehead ridge, no cartoon eyes. */}
      <Path d="M 30 42 L 43 39 L 48 44 L 50 34 L 52 44 L 57 39 L 70 42"
        fill="none" stroke="#E6D1AF" strokeOpacity={0.55} strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M 50 34 V 58 M 47 39 L 46 56 M 54 39 L 55 56"
        fill="none" stroke="#4C5960" strokeWidth={1.15} strokeOpacity={0.65}/>
      <Path d="M 32 48 Q 39 43 45 49 L 42 53 L 35 53 Z"
        fill="#223845" stroke="#B1A38D" strokeWidth={0.7}/>
      <Path d="M 68 48 Q 61 43 55 49 L 58 53 L 65 53 Z"
        fill="#223845" stroke="#B1A38D" strokeWidth={0.7}/>
      <Path d="M 38 50 L 42 49 M 62 50 L 58 49"
        stroke="#E8C998" strokeWidth={1.1} strokeLinecap="round"/>
      {/* A broad bovine muzzle with sculpted nostrils and chiseled jaw. */}
      <Path d="M 41 58 Q 50 54 59 58 L 66 65 Q 64 73 56 76 L 44 76
               Q 36 73 34 65 Z"
        fill="url(#minotaur-muzzle)" stroke="#E1C8A5" strokeWidth={1.0}/>
      <Path d="M 41 64 Q 38 64 39 68 Q 42 70 45 67 L 44 65 Z
               M 59 64 Q 62 64 61 68 Q 58 70 55 67 L 56 65 Z"
        fill="#263C45" stroke="#8F8578" strokeWidth={0.4}/>
      <Path d="M 44 72 Q 50 74 56 72" stroke="#4C4D51"
        strokeWidth={1} fill="none" strokeLinecap="round"/>
      <Path d="M 36 53 L 33 62 M 64 53 L 67 62"
        stroke="#D9BFA0" strokeWidth={0.8} strokeOpacity={0.7}/>
      {/* A narrow labyrinth plinth references the Cretan myth, not a caption. */}
      <Path d="M 30 78 L 70 78 L 76 83 H 24 Z"
        fill="url(#minotaur-base)" stroke="#DBCAAE" strokeWidth={0.9}/>
      <Path d="M 22 83 H 78 L 82 87 H 18 Z"
        fill="#70777A" stroke="#C6B69B" strokeWidth={0.85}/>
      <G fill="none" stroke="#E8D4AF" strokeWidth={0.85} opacity={0.7}
        strokeLinecap="round" strokeLinejoin="round">
        <Path d="M 36 81 H 42 V 79.5 H 47 V 81 H 51 V 80 H 56 V 81 H 64" />
        <Path d="M 34 85 H 39 V 84 H 45 M 55 84 H 62 V 85 H 67" />
      </G>
      <G fill="#F0DABE" opacity={0.52}>
        <Circle cx={33} cy={43} r={0.6}/>
        <Circle cx={68} cy={57} r={0.5}/>
        <Circle cx={51} cy={82} r={0.55}/>
      </G>
    </Svg>
  );
}
