import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppBackground from "../components/AppBackground";
import ProfileSectionHeader from "../components/ProfileSectionHeader";
import SourceLink from "../components/SourceLink";
import { usePvp } from "../hooks/usePvp";
import { normalizeRoomCode, PVP_TOPICS, pvpSecondsLeft, pvpStandings, validRoomCode, type PvpSettings } from "../quiz/pvp";
import { colors } from "../theme";

function Action({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </Pressable>;
}

export default function PvpScreen({ userId, onHome, onAccount }: {
  userId: string | null; onHome: () => void; onAccount: () => void;
}) {
  const game = usePvp(userId);
  const { room, busy, loading, error, offset, lastSynced } = game;
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [settings, setSettings] = useState<PvpSettings>({ category: "all", count: 5, seconds: 30 });
  const [now, setNow] = useState(Date.now());
  const [shareError, setShareError] = useState(false);
  useEffect(() => {
    setNow(Date.now());
    if (!room || room.status === "closed") return;
    const clock = setInterval(() => setNow(Date.now()), room.status === "question" || room.status === "reveal" ? 250 : 1000);
    return () => clearInterval(clock);
  }, [room?.id, room?.status]);

  function exit() {
    if (busy) return;
    if (!room || room.status === "closed") { onHome(); return; }
    Alert.alert("Αποχώρηση από το δωμάτιο;", "Η θέση σου θα ελευθερωθεί. Αν παίζετε ήδη, οι υπόλοιποι θα συνεχίσουν.", [
      { text: "Παραμονή", style: "cancel" },
      { text: "Αποχώρηση", style: "destructive", onPress: () => { void game.leave().then(ok => { if (ok) onHome(); }); } },
    ]);
  }
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => { exit(); return true; });
    return () => listener.remove();
  }, [room, busy]);

  const self = room?.players.find(player => player.id === userId);
  const host = room?.hostId === userId;
  const participants = room?.players.filter(player => !player.left) ?? [];
  const allReady = participants.length >= 2 && participants.every(player => player.ready);
  const stale = Boolean(room && now - lastSynced > 6000);
  const disabled = busy || stale;
  const countdown = pvpSecondsLeft(room?.startsAt ?? null, now, offset);
  const secondsLeft = pvpSecondsLeft(room?.status === "reveal" ? room.revealUntil : room?.deadline ?? null, now, offset);
  const question = room?.question;
  const reveal = room?.status === "reveal" || room?.status === "finished";
  const nameValid = name.trim().length > 0 && name.trim().length <= 24;
  const standings = pvpStandings(room?.players ?? []);
  const winners = standings.filter(player => player.rank === 1);

  async function invite() {
    if (!room) return;
    try {
      setShareError(false);
      await Share.share({ message: `Παίξε ΓΝΩΣΗ μαζί μου! Άνοιξε «Παίξε με φίλους» και μπες με τον κωδικό ${room.code}.` });
    } catch { setShareError(true); }
  }

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <AppBackground />
    <ProfileSectionHeader title="Παίξε με φίλους" actionLabel="Αρχική" actionAccessibilityLabel="Επιστροφή στην αρχική" onAction={exit} style={styles.header} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 18 }]}>
      {error ? <View style={styles.error} accessibilityLiveRegion="polite"><Text style={styles.body}>{error}</Text>
        <Action label="Ανανέωση" secondary disabled={busy} onPress={() => { void game.refresh(); }} /></View> : null}
      {loading ? <ActivityIndicator accessibilityLabel="Αναζήτηση ενεργού δωματίου" color={colors.accentLight} /> :
        !game.available || !userId ? <View style={styles.card}>
          <Text style={styles.eyebrow}>ΓΝΩΣΗ · 2–4 ΠΑΙΚΤΕΣ</Text>
          <Text accessibilityRole="header" style={styles.title}>Η γνώση γίνεται παρέα.</Text>
          <Text style={styles.body}>{game.available ? "Συνδέσου στον λογαριασμό σου για να δημιουργήσεις ένα ιδιωτικό δωμάτιο ή να μπεις στην παρέα σου." : "Το παιχνίδι με φίλους δεν είναι ακόμη διαθέσιμο. Μπορείς να συνεχίσεις με τα ατομικά παιχνίδια."}</Text>
          {game.available ? <Action label="Σύνδεση / Δημιουργία λογαριασμού" onPress={onAccount} /> : null}
        </View> : !room ? <>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>ΙΔΙΩΤΙΚΟ ΚΟΥΙΖ · 2–4 ΠΑΙΚΤΕΣ</Text>
            <Text accessibilityRole="header" style={styles.title}>Ποιος ξέρει περισσότερα;</Text>
            <Text style={styles.body}>Ίδιες ερωτήσεις, κοινός χρόνος και ένας πόντος για κάθε σωστή απάντηση. Παίξτε από τις δικές σας συσκευές.</Text>
            <Text nativeID="pvp-name-label" style={styles.label}>Το όνομά σου στο παιχνίδι</Text>
            <TextInput testID="pvp-name" accessibilityLabel="Το όνομά σου στο παιχνίδι" value={name} onChangeText={setName} maxLength={24}
              placeholder="π.χ. Μάνος" placeholderTextColor={colors.textMuted} style={styles.input} autoCorrect={false} editable={!busy} />
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Δημιούργησε δωμάτιο</Text>
            <Text style={styles.label}>Θέμα</Text>
            <View style={styles.chips}>{PVP_TOPICS.map(topic => <Pressable key={topic.id} accessibilityRole="button"
              accessibilityState={{ selected: settings.category === topic.id, disabled: busy }} disabled={busy}
              onPress={() => setSettings(current => ({ ...current, category: topic.id, count: topic.id === "all" ? current.count : 5 }))}
              style={[styles.chip, settings.category === topic.id && styles.selectedChip]}><Text style={styles.chipText}>{topic.label}</Text></Pressable>)}</View>
            <Text style={styles.label}>Ερωτήσεις</Text>
            <View style={styles.chips}>{([5, 10] as const).map(count => <Pressable key={count} accessibilityRole="button"
              accessibilityLabel={`${count} ερωτήσεις`} accessibilityState={{ selected: settings.count === count, disabled: busy || (count === 10 && settings.category !== "all") }}
              disabled={busy || (count === 10 && settings.category !== "all")} onPress={() => setSettings(current => ({ ...current, count }))}
              style={[styles.chip, settings.count === count && styles.selectedChip, count === 10 && settings.category !== "all" && styles.disabled]}><Text style={styles.chipText}>{count}</Text></Pressable>)}</View>
            {settings.category !== "all" ? <Text style={styles.notice}>Τα θεματικά παιχνίδια έχουν 5 ερωτήσεις.</Text> : null}
            <Text style={styles.label}>Χρόνος ανά ερώτηση</Text>
            <View style={styles.chips}>{([15, 30] as const).map(seconds => <Pressable key={seconds} accessibilityRole="button"
              accessibilityState={{ selected: settings.seconds === seconds, disabled: busy }} disabled={busy}
              onPress={() => setSettings(current => ({ ...current, seconds }))} style={[styles.chip, settings.seconds === seconds && styles.selectedChip]}><Text style={styles.chipText}>{seconds} δευτερόλεπτα</Text></Pressable>)}</View>
            <Action label={busy ? "Σύνδεση…" : "Δημιουργία δωματίου"} disabled={busy || !nameValid} onPress={() => { void game.create(name, settings); }} />
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Έχεις κωδικό πρόσκλησης;</Text>
            <TextInput testID="pvp-code" accessibilityLabel="Κωδικός δωματίου, 6 χαρακτήρες" value={code} onChangeText={value => setCode(normalizeRoomCode(value))}
              maxLength={6} autoCapitalize="characters" autoCorrect={false} placeholder="A1B2C3" placeholderTextColor={colors.textMuted} style={[styles.input, styles.codeInput]} editable={!busy} />
            <Action label="Συμμετοχή" secondary disabled={busy || !nameValid || !validRoomCode(code)} onPress={() => { void game.join(name, code); }} />
          </View>
        </> : room.status === "closed" ? <View style={styles.card}>
          <Text style={styles.title}>Το δωμάτιο έκλεισε</Text><Text style={styles.body}>Δημιούργησε ένα νέο δωμάτιο για να συνεχίσετε.</Text>
          <Action label="Νέο παιχνίδι" onPress={game.dismiss} />
        </View> : <>
          {stale ? <Text accessibilityLiveRegion="polite" style={styles.notice}>Επανασύνδεση… Περιμένουμε ενημέρωση από το παιχνίδι.</Text> : null}
          {room.status === "lobby" ? <View style={styles.card}>
            <Text style={styles.eyebrow}>ΚΩΔΙΚΟΣ ΔΩΜΑΤΙΟΥ</Text>
            <Text selectable style={styles.roomCode} accessibilityLabel={`Κωδικός ${room.code.split("").join(" ")}`}>{room.code}</Text>
            <Text style={styles.body}>{PVP_TOPICS.find(topic => topic.id === room.category)?.label} · {room.count} ερωτήσεις · {room.seconds}″</Text>
            <Action label="Πρόσκληση φίλων" secondary onPress={() => { void invite(); }} />
            {shareError ? <Text style={styles.notice}>Δεν κοινοποιήθηκε η πρόσκληση. Μπορείς να στείλεις τον κωδικό που βλέπεις παραπάνω.</Text> : null}
            <Text style={styles.body}>Μοιράσου τον κωδικό και περιμένετε να είναι όλοι έτοιμοι.</Text>
          </View> : null}
          {room.status === "question" && countdown > 0 ? <View style={styles.card}>
            <Text style={styles.eyebrow}>ΕΡΩΤΗΣΗ {room.index + 1} / {room.count}</Text>
            <Text style={styles.title}>Ξεκινάμε σε {countdown}…</Text>
          </View> : question && (room.status === "question" || room.status === "reveal") ? <View style={styles.card}>
            <View style={styles.row}><Text style={styles.eyebrow}>ΕΡΩΤΗΣΗ {room.index + 1} / {room.count}</Text>
              <Text style={styles.timer} accessibilityLabel={`${secondsLeft} δευτερόλεπτα`}>{secondsLeft}″</Text></View>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, secondsLeft / (reveal ? 7 : room.seconds) * 100)}%` }]} /></View>
            <Text accessibilityRole="header" style={styles.question}>{question.prompt}</Text>
            {question.answers.map((answer, index) => <Pressable key={`${room.matchId}:${room.index}:${index}`} accessibilityRole="button"
              accessibilityLabel={`${answer}${reveal && index === question.correctIndex ? ", σωστή απάντηση" : ""}`}
              accessibilityState={{ selected: self?.answer === index, disabled: disabled || reveal || Boolean(self?.answered) || secondsLeft === 0 }}
              disabled={disabled || reveal || Boolean(self?.answered) || secondsLeft === 0}
              onPress={() => { void game.answer(index); }} style={[styles.answer,
                self?.answer === index && styles.selectedChip, reveal && index === question.correctIndex && styles.correct,
                reveal && self?.answer === index && index !== question.correctIndex && styles.incorrect]}>
              <Text style={styles.answerLetter}>{["Α", "Β", "Γ", "Δ"][index]}</Text><Text style={styles.answerText}>{answer}</Text>
            </Pressable>)}
            <Text accessibilityLiveRegion="polite" style={styles.body}>{reveal ? (self?.answer === question.correctIndex ? "Σωστά! +1 πόντος" : self?.answered ? "Η σωστή απάντηση φαίνεται με πράσινο." : "Δεν δόθηκε απάντηση εγκαίρως.") : self?.answered ? "Η απάντησή σου κλείδωσε. Περιμένουμε την παρέα…" : busy ? "Αποστολή απάντησης…" : "Διάλεξε μία απάντηση. Η επιλογή σου κλειδώνει."}</Text>
            {reveal ? <><Text style={styles.body}>{question.explanation}</Text>
              {question.sources?.map(source => <SourceLink key={source.url} source={{ ...source, publisher: source.publisher ?? "Πηγή" }} />)}
              <Text style={styles.notice}>{room.index + 1 === room.count ? "Τα τελικά αποτελέσματα" : "Η επόμενη ερώτηση"} σε {secondsLeft}″</Text></> : null}
          </View> : null}
          {room.status === "finished" ? <View style={styles.card}>
            <Text style={styles.eyebrow}>ΤΕΛΙΚΑ ΑΠΟΤΕΛΕΣΜΑΤΑ</Text>
            <Text accessibilityRole="header" style={styles.title}>{room.endedEarly ? "Το παιχνίδι ολοκληρώθηκε νωρίτερα" : winners.length > 1 ? "Ισοπαλία στην κορυφή!" : `Νίκη για ${winners[0]?.name ?? "την παρέα"}!`}</Text>
            <Text style={styles.body}>{room.endedEarly ? "Έμειναν λιγότεροι από δύο ενεργοί παίκτες στο δωμάτιο." : "Κάθε σωστή απάντηση μετράει για έναν πόντο. Οι ισοπαλίες μοιράζονται την ίδια θέση."}</Text>
            {host ? <Action label="Παίξτε ξανά" disabled={disabled} onPress={() => { void game.rematch(); }} /> : <Text style={styles.notice}>Περίμενε τον οικοδεσπότη για νέο παιχνίδι.</Text>}
          </View> : null}
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{room.status === "lobby" ? `Η παρέα · ${participants.length}/4` : "Βαθμολογία"}</Text>
            {standings.map(player => <View key={player.id} style={[styles.player, player.id === userId && styles.self]}>
              <View style={styles.playerCopy}><Text style={styles.playerName}>{room.status !== "lobby" ? `${player.rank}. ` : ""}{player.name}{player.id === userId ? " (εσύ)" : ""}</Text>
                <Text style={styles.playerMeta}>{player.id === room.hostId ? "Οικοδεσπότης · " : ""}{player.left ? "Αποχώρησε" : !player.connected ? "Εκτός σύνδεσης" : room.status === "lobby" ? player.ready ? "Έτοιμος" : "Περιμένουμε ετοιμότητα" : player.answered ? "Απάντησε" : "Στο παιχνίδι"}</Text></View>
              <Text style={styles.score}>{room.status === "lobby" ? player.ready ? "✓" : "…" : player.score}</Text>
            </View>)}
          </View>
          {room.status === "lobby" ? <View style={styles.card}>
            <Action label={self?.ready ? "Είμαι έτοιμος ✓" : "Είμαι έτοιμος"} secondary disabled={disabled} onPress={() => { void game.ready(!self?.ready); }} />
            {host ? <Action label="Έναρξη παιχνιδιού" disabled={disabled || !allReady} onPress={() => { void game.start(); }} /> : <Text style={styles.notice}>Ο οικοδεσπότης ξεκινά όταν είστε όλοι έτοιμοι.</Text>}
            <Text style={styles.body}>Χρειάζονται 2–4 παίκτες. Τα παιχνίδια με φίλους έχουν ξεχωριστή βαθμολογία και δεν δίνουν XP.</Text>
          </View> : null}
          <Action label="Αποχώρηση από το δωμάτιο" secondary disabled={busy} onPress={exit} />
        </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginHorizontal: 18, marginTop: 8, marginBottom: 10 },
  content: { paddingHorizontal: 18, gap: 14 },
  card: { backgroundColor: "#172133", borderRadius: 20, borderWidth: 1, borderColor: "#344159", padding: 18, gap: 14 },
  eyebrow: { color: colors.accentLight, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.text, fontSize: 25, lineHeight: 33, fontWeight: "900" },
  sectionTitle: { color: colors.text, fontSize: 19, lineHeight: 26, fontWeight: "800" },
  label: { color: colors.textBody, fontSize: 14, fontWeight: "700" },
  body: { color: colors.textBody, fontSize: 14, lineHeight: 22 },
  notice: { color: colors.accentLight, fontSize: 13, lineHeight: 21 },
  input: { backgroundColor: "#0F1726", borderColor: "#4A5670", borderWidth: 1, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, color: colors.text, fontSize: 17 },
  codeInput: { letterSpacing: 5, fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 12, borderWidth: 1, borderColor: "#47516A", backgroundColor: "#1D293E", minHeight: 44, justifyContent: "center", paddingHorizontal: 13, paddingVertical: 10 },
  selectedChip: { borderColor: colors.accentLight, backgroundColor: "#353052" },
  chipText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  button: { minHeight: 50, padding: 14, borderRadius: 13, backgroundColor: colors.accentLight, justifyContent: "center", alignItems: "center" },
  secondary: { backgroundColor: "#26324A", borderWidth: 1, borderColor: "#526080" },
  buttonText: { color: "#151328", fontSize: 15, fontWeight: "800", textAlign: "center" },
  secondaryText: { color: colors.text },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  error: { padding: 14, gap: 10, backgroundColor: colors.errorSurface, borderRadius: 12 },
  roomCode: { color: colors.text, fontSize: 38, letterSpacing: 6, fontWeight: "900", textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  timer: { fontSize: 23, color: colors.accentLight, fontWeight: "800", fontVariant: ["tabular-nums"] },
  track: { height: 5, borderRadius: 4, backgroundColor: "#344159", overflow: "hidden" },
  fill: { height: 5, backgroundColor: colors.accentLight },
  question: { color: colors.text, fontSize: 21, lineHeight: 30, fontWeight: "800" },
  answer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, minHeight: 56, borderRadius: 13, borderWidth: 1, borderColor: "#4A5670", backgroundColor: "#1B293E" },
  answerLetter: { fontSize: 15, fontWeight: "800", color: colors.accentLight },
  answerText: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 23 },
  correct: { borderColor: colors.success, backgroundColor: colors.successSurface },
  incorrect: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  player: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#111B2C" },
  self: { borderWidth: 1, borderColor: "#7E70BA" },
  playerCopy: { flex: 1, gap: 4 },
  playerName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  playerMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  score: { color: colors.accentLight, fontSize: 24, fontWeight: "800" },
});
