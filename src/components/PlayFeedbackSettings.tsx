import { useSyncExternalStore } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { playPreferences } from "../play/preferences";
import { colors } from "../theme";
import ActionButton from "./ActionButton";
import { getSoundStatus, requestSoundPreview, subscribeSoundStatus } from "../play/soundStatus";

export default function PlayFeedbackSettings() {
  const p = useSyncExternalStore(playPreferences.subscribe, playPreferences.getSnapshot, playPreferences.getSnapshot);
  const sound = useSyncExternalStore(subscribeSoundStatus, getSoundStatus, getSoundStatus);
  return <View style={styles.card} testID="play-feedback-settings">
    <Text style={styles.title}>Ήχος και κίνηση</Text>
    <View style={styles.row}><View style={styles.copy}><Text style={styles.label}>Ήχοι παιχνιδιού</Text><Text style={styles.body}>Σύντομα ηχητικά σήματα στις απαντήσεις και τις ολοκληρώσεις.</Text></View><Switch accessibilityLabel="Ήχοι παιχνιδιού" value={p.sound} disabled={!p.ready} onValueChange={value => { void playPreferences.set("sound", value); }} trackColor={{ true: colors.accent }} /></View>
    <ActionButton secondary label="Δοκιμή ήχου" disabled={!p.ready || !p.sound} onPress={requestSoundPreview} />
    <Text style={styles.body} accessibilityLiveRegion="polite">{p.sound ? sound.message : "Ενεργοποίησε τους ήχους για να κάνεις δοκιμή."}</Text>
    <View style={styles.row}><View style={styles.copy}><Text style={styles.label}>Κινούμενα εφέ</Text><Text style={styles.body}>{p.reducedMotion ? "Η μειωμένη κίνηση της συσκευής έχει προτεραιότητα." : "Ήπιες κινήσεις και εορτασμοί προόδου."}</Text></View><Switch accessibilityLabel="Κινούμενα εφέ" value={p.animations} disabled={!p.ready} onValueChange={value => { void playPreferences.set("animations", value); }} trackColor={{ true: colors.accent }} /></View>
    {p.error ? <Text style={styles.body} accessibilityLiveRegion="polite">Δεν αποθηκεύτηκαν ή δεν φορτώθηκαν οι προτιμήσεις. Δοκίμασε ξανά την επιλογή.</Text> : null}
  </View>;
}
const styles = StyleSheet.create({ card: { padding: 18, marginVertical: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 16 }, title: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "800" }, row: { flexDirection: "row", gap: 16, alignItems: "center" }, copy: { flex: 1, gap: 4 }, label: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: "700" }, body: { color: colors.textMuted, fontSize: 12, lineHeight: 20 } });
