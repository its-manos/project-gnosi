import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, AppState, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLearningSession } from '../state/LearningSession';
import TrophyIcon from '../components/TrophyIcon';
import { colors } from '../theme';
import { usePlayMotion } from './motion';
import { subscribeTrophyUnlocks, type TrophyUnlock } from './trophyEvents';
import { TROPHY_RANKS } from '../gamification/trophies';
/** An account-keyed, silent, nonblocking companion to the existing XP overlay. */
export default function TrophyCelebrations({ children }: { children: ReactNode }) {
  const { store } = useLearningSession();
  const [queue, setQueue] = useState<TrophyUnlock[]>([]);
  const [reveal] = useState(() => new Animated.Value(1));
  const foreground = useRef(AppState.currentState === 'active');
  const motion = usePlayMotion();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const seen = new Set<string>();
    const off = subscribeTrophyUnlocks(event => {
      if (event.scope !== (store.userId ?? 'guest') || !foreground.current) return;
      const trophies = event.trophies.filter(trophy => !seen.has(trophy.id));
      if (!trophies.length) return;
      trophies.forEach(trophy => seen.add(trophy.id));
      setQueue(current => [...current, { ...event, trophies }]);
    });
    const state = AppState.addEventListener('change', value => {
      foreground.current = value === 'active';
      if (!foreground.current) setQueue([]);
    });
    return () => { off(); state.remove(); };
  }, [store]);
  const notice = queue[0];
  useEffect(() => {
    if (!notice) return;
    reveal.setValue(motion ? 0 : 1);
    const animation = motion ? Animated.sequence([
      Animated.timing(reveal, { toValue: 1, duration: 180, useNativeDriver: true, isInteraction: false }),
      Animated.delay(2400),
      Animated.timing(reveal, { toValue: 0, duration: 180, useNativeDriver: true, isInteraction: false }),
    ]) : undefined;
    animation?.start();
    const timer = setTimeout(() => setQueue(current => current[0] === notice ? current.slice(1) : current), 2800);
    return () => { clearTimeout(timer); animation?.stop(); reveal.setValue(1); };
  }, [notice, motion, reveal]);
  const titles = notice?.trophies.map(trophy => `${trophy.title} ${TROPHY_RANKS[trophy.tier - 1]}`).join(' · ');
  return <View style={styles.root}>{children}{notice ? <Animated.View pointerEvents="none"
    testID="trophy-celebration" accessible accessibilityLiveRegion="polite"
    accessibilityLabel={`Νέα διάκριση. ${titles}`}
    style={[styles.overlay, { top: insets.top + 12, opacity: reveal,
      transform: motion ? [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] : [] }]}>
    <View style={styles.icon}><TrophyIcon trophy={notice.trophies[0]} /></View>
    <View style={styles.copy}>
      <Text style={styles.heading}>{notice.trophies.length === 1 ? 'Νέα διάκριση!' : `${notice.trophies.length} νέες διακρίσεις!`}</Text>
      <Text style={styles.title} numberOfLines={2}>{titles}</Text>
    </View>
  </Animated.View> : null}</View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', alignSelf: 'center', width: '90%', maxWidth: 420,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 15,
    backgroundColor: '#1A2538', borderWidth: 1, borderColor: '#555078', zIndex: 45, elevation: 12 },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accentSurface, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  heading: { color: colors.accentLight, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  title: { color: colors.text, fontSize: 12, lineHeight: 18, fontWeight: '800' },
});
