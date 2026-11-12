import type { AvatarVariant } from "../state/PlayerAvatar";
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { nextTrophy, type Trophy, type TrophyFamily } from '../gamification/trophies';
import PlayerCharacter from './PlayerCharacter';
import ProgressTrack from './ProgressTrack';
import { colors } from '../theme';

const glyphs: Record<TrophyFamily, string> = {
  lessons: 'M5 5h6l1 2 1-2h6v15h-6l-1 1-1-1H5V5Zm7 2v14',
  worlds: 'm12 3 8 9-8 9-8-9 8-9Zm0 5-4 8 8-4-4-4Z',
  daily: 'M5 6h14v15H5V6Zm3-3v6m8-6v6M5 11h14m-10 5 2 2 4-4',
  streak: 'M13 3c1 6-6 7-6 12a5 5 0 0 0 10 0c0-3-2-5-2-5s0 4-3 4c-2-3 2-6 1-11Z',
  revision: 'M5 10a7 7 0 1 1 0 5M5 4v6h6m-2 4 2 2 4-4',
  hangman: 'M4 19V5h12v3M2 20h9m5-5v5m-3-2 3-3 3 3',
};
function TrophyIcon({ trophy }: { trophy: Trophy }) {
  const tone = trophy.unlocked ? [colors.accentLight, '#C8B7EC', '#DCC08B', '#EAD8AB', '#F3E4C1'][trophy.tier - 1] : '#737C91';
  return <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d={glyphs[trophy.family]} stroke={tone} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    {trophy.family === 'hangman' ? <Circle cx={16} cy={11} r={3} stroke={tone} strokeWidth={1.5} /> : null}
  </Svg>;
}
const shortTitles: Record<TrophyFamily, string> = { lessons: 'Ανακαλύψεις', worlds: 'Ορίζοντες', daily: 'Daily Quiz', streak: 'Συνέπεια', revision: 'Επανάληψη', hangman: 'Κρεμάλα' };
const units: Record<TrophyFamily, string> = { lessons: 'μαθήματα', worlds: 'κόσμοι', daily: 'Daily Quiz', streak: 'ημέρες σερί', revision: 'ημέρες επανάληψης', hangman: 'νίκες με XP' };
function TrophyTile({ trophy, preview = false }: { trophy: Trophy; preview?: boolean }) {
  return <View style={[styles.tile, preview && styles.previewTile, !trophy.unlocked && styles.locked]} accessible
    accessibilityLabel={`${trophy.title}, βαθμίδα ${trophy.tier}. ${trophy.description}: ${Math.min(trophy.current, trophy.target)} από ${trophy.target}. ${trophy.unlocked ? 'Κερδήθηκε' : 'Κλειδωμένο'}`}>
    <View style={preview && styles.medallion}><TrophyIcon trophy={trophy} /></View>
    <Text style={styles.tileTitle}>{preview ? shortTitles[trophy.family] : trophy.title}<Text style={styles.tier}> {["I", "II", "III", "IV", "V"][trophy.tier - 1]}</Text></Text>
    {!preview ? <Text style={styles.muted}>{trophy.unlocked ? `✓ ${trophy.target}` : `${Math.min(trophy.current, trophy.target)}/${trophy.target}`}</Text> : null}
  </View>;
}
export default function PlayerCollection({ trophies, ready, level, mode = 'trophies', dense = false, variant = 'male', onChooseVariant, saving = false, error }: {
  trophies: readonly Trophy[]; ready: boolean; level: number; mode?: 'trophies' | 'character'; dense?: boolean;
  variant?: AvatarVariant; onChooseVariant?: (value: AvatarVariant) => Promise<boolean>; saving?: boolean; error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const earned = trophies.filter(t => t.unlocked);
  const next = nextTrophy(trophies);
  // One highest earned tier per family; later tiers remain discoverable in collection.
  const showcase = [...new Map(earned.map(t => [t.family, t])).values()].slice(-3);
  return <>
    {mode === 'character' ? <Pressable onPress={() => setOpen(true)} disabled={!ready}
      accessibilityRole="button" accessibilityLabel="Επίλεξε εμφάνιση χαρακτήρα"
      style={styles.characterButton}>
      <View style={{ width: dense ? 88 : 100, height: dense ? 88 : 100 }}>
        {ready ? <PlayerCharacter level={level} size={dense ? 88 : 100} variant={variant} /> : null}
      </View>
      <Text style={styles.muted}>Αλλαγή ›</Text>
    </Pressable> : <View testID="profile-achievements" style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.title}>Οι διακρίσεις σου</Text>
        <Pressable onPress={() => setOpen(true)} disabled={!ready} accessibilityRole="button"
          accessibilityLabel="Όλες οι διακρίσεις" style={styles.link}>
          <Text style={styles.linkText}>Όλες · {ready ? `${earned.length}/${trophies.length}` : '—'} ›</Text>
        </Pressable>
      </View>
      {!ready ? <Text style={styles.muted}>Φόρτωση διακρίσεων…</Text> : <>
        {next ? <Pressable style={styles.next} onPress={() => setOpen(true)} accessibilityRole="button"
          accessibilityLabel={`${next.title}. ${next.description}: ${next.current} από ${next.target}. Άνοιγμα συλλογής.`}>
          <TrophyIcon trophy={next} />
          <View style={styles.nextCopy}>
            <Text style={styles.eyebrow}>ΕΠΟΜΕΝΟΣ ΣΤΟΧΟΣ</Text>
            <View style={styles.heading}><Text style={[styles.title, styles.goalTitle]}>{next.title}</Text>
              <Text style={styles.goalCount}>{next.current}/{next.target}</Text></View>
            <Text style={styles.muted}>{units[next.family]}</Text>
            <ProgressTrack variant="destination" style={styles.goalTrack}><View style={[styles.fill, { width: `${Math.min(100, next.current / next.target * 100)}%` }]} /></ProgressTrack>
          </View>
        </Pressable> : <Text style={styles.muted}>Κέρδισες όλες τις διακρίσεις!</Text>}
        {showcase.length ? <View style={styles.row}>{showcase.map(t => <TrophyTile key={t.id} trophy={t} preview />)}</View>
          : <Text style={styles.muted}>Η συλλογή σου ξεκινά με την πρώτη ανακάλυψη.</Text>}
      </>}
    </View>}
    {open ? <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.scrim}>
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={styles.heading}>
            <Text style={styles.title}>{mode === 'character' ? 'Ο χαρακτήρας σου' : 'Οι διακρίσεις σου'}</Text>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Κλείσιμο συλλογής" style={styles.link}>
              <Text style={styles.linkText}>Κλείσιμο ✕</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.collection}>
            {mode === 'character' ? <>
              <Text style={styles.muted}>Διάλεξε εμφάνιση για την κλάση σου. Η επιλογή σου παραμένει καθώς ανεβαίνεις επίπεδα.</Text>
              <View style={styles.choices}>
                {(['male', 'female'] as const).map(value => <Pressable key={value}
                  accessibilityRole="radio" accessibilityLabel={value === 'male' ? 'Εμφάνιση 1' : 'Εμφάνιση 2'}
                  accessibilityState={{ checked: variant === value, disabled: saving }} disabled={saving}
                  onPress={async () => { if (await onChooseVariant?.(value)) setOpen(false); }}
                  style={[styles.choice, variant === value && styles.choiceSelected]}>
                  <PlayerCharacter level={level} size={104} variant={value} />
                  <Text style={styles.linkText}>{variant === value ? 'Επιλεγμένο ✓' : 'Επιλογή'}</Text>
                </Pressable>)}
              </View>
              {saving ? <Text style={styles.muted}>Αποθήκευση…</Text> : null}
              {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
            </> : <>
              <Text style={styles.muted}>Κάθε βαθμίδα είναι μία ξεχωριστή διάκριση. Οι κερδισμένες διακρίσεις παραμένουν στη συλλογή σου.</Text>
              {(['lessons', 'worlds', 'daily', 'streak', 'revision', 'hangman'] as const).map(family => {
                const items = trophies.filter(t => t.family === family);
                return <View key={family} style={styles.section}>
                  <Text style={styles.title}>{items[0]?.title}</Text>
                  <Text style={styles.muted}>{items[0]?.description}</Text>
                  <View style={styles.grid}>{items.map(t => <TrophyTile key={t.id} trophy={t} />)}</View>
                </View>;
              })}
            </>}
          </ScrollView>
        </View>
      </View>
    </Modal> : null}
  </>;
}
const styles = StyleSheet.create({
  section: { gap: 8 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  muted: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  eyebrow: { color: '#AFA4DC', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  linkText: { color: '#C7BAF5', fontSize: 11, fontWeight: '800' },
  goalTitle: { flex: 1, minWidth: 0, fontSize: 13 },
  goalCount: { color: '#C7BAF5', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  previewTile: { paddingVertical: 8, gap: 4 },
  medallion: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSurface, alignItems: 'center', justifyContent: 'center' },
  next: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: '#38435C', backgroundColor: '#1A2538' },
  nextCopy: { flex: 1, minWidth: 0, gap: 4 }, goalTrack: { marginTop: 4 },
  fill: { height: '100%', backgroundColor: colors.accentLight }, row: { flexDirection: 'row', gap: 8 },
  tile: { flexGrow: 1, flexBasis: '28%', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, borderRadius: 15, backgroundColor: '#1A2538', borderWidth: 1, borderColor: '#38435C' },
  tier: { color: colors.accentLight, fontSize: 10, fontWeight: '800' },
  tileTitle: { color: colors.text, fontSize: 10, lineHeight: 14, textAlign: 'center', fontWeight: '700' },
  locked: { opacity: 0.62 }, characterButton: { alignItems: 'center', justifyContent: 'center', minWidth: 76 },
  scrim: { flex: 1, backgroundColor: '#070E1AE8', justifyContent: 'center', alignItems: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 600, maxHeight: '88%', backgroundColor: '#152133', padding: 16, borderRadius: 22, gap: 10 },
  collection: { gap: 16, paddingBottom: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { flex: 1, minWidth: 112, alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#3C4055', backgroundColor: '#202A3C' },
  choiceSelected: { borderColor: '#B5A4EE', backgroundColor: '#2B304A' },
  error: { color: '#F0B8B8', fontSize: 12, lineHeight: 18 },
});
