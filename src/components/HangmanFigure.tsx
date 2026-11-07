import { useEffect, type PropsWithChildren } from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import Animated, { cancelAnimation, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "../theme";

const AnimatedG = Animated.createAnimatedComponent(G);
function RevealStroke({ visible, children }: PropsWithChildren<{ visible: boolean }>) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.value = reduced ? Number(visible) : withTiming(Number(visible), { duration: 240 });
    return () => cancelAnimation(opacity);
  }, [visible, reduced, opacity]);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
}

/** Decorative figure. The screen exposes mistakes as accessible text. */
export default function HangmanFigure({ mistakes, won = false, size = 150 }: {
  mistakes: number; won?: boolean; size?: number;
}) {
  const ink = won ? colors.success : colors.accentLight;
  return <Svg width={size} height={size} viewBox="0 0 180 180" accessible={false}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Circle cx={90} cy={90} r={78} fill="#1C2337" stroke="#393651" />
    <Path d="M30 153h105M54 152V28h65v18M54 50l22-22" stroke="#82739F" strokeWidth={4} strokeLinecap="round" fill="none" />
    <G stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none">
      <RevealStroke visible={mistakes >= 1 || won}><Circle cx={119} cy={61} r={15} /></RevealStroke>
      <RevealStroke visible={mistakes >= 2 || won}><Path d="M119 76v38" /></RevealStroke>
      <RevealStroke visible={mistakes >= 3 || won}><Path d={won ? "M119 86 98 66" : "M119 86 98 104"} /></RevealStroke>
      <RevealStroke visible={mistakes >= 4 || won}><Path d={won ? "M119 86 140 66" : "M119 86 140 104"} /></RevealStroke>
      <RevealStroke visible={mistakes >= 5 || won}><Path d="m119 114-18 25" /></RevealStroke>
      <RevealStroke visible={mistakes >= 6 || won}><Path d="m119 114 18 25" /></RevealStroke>
    </G>
    {won ? <Path d="M112 62q7 9 14 0M31 69l3-7 3 7 7 3-7 3-3 7-3-7-7-3zM146 36l2-5 2 5 5 2-5 2-2 5-2-5-5-2z"
      stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" /> : null}
  </Svg>;
}
