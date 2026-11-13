import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppBackground from "../components/AppBackground";
import ProfileSectionHeader from "../components/ProfileSectionHeader";
import SourceLink from "../components/SourceLink";
import { usePvp } from "../hooks/usePvp";
import { normalizeRoomCode, PVP_TOPICS, pvpSecondsLeft, pvpStandings, validRoomCode, type PvpSettings } from "../quiz/pvp";
import { colors } from "../theme";
import AtlasContinueCard from "../components/AtlasContinueCard";
import ScreenEntrance from "../components/ScreenEntrance";
import { PvpBadge, PvpHero, PvpWorld } from "../components/PvpArtwork";
import { usePvpIdentity } from "../hooks/usePvpIdentity";
import { usePvpFeedback } from "../hooks/usePvpFeedback";
import { validPlayerName } from "../state/PvpIdentity";
import { usePvpPresentation } from "../hooks/usePvpPresentation";

function Action({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <AtlasContinueCard accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </AtlasContinueCard>;
}

export default function PvpScreen({ userId, onHome, onAccount }: {
  userId: string | null; onHome: () => void; onAccount: () => void;
}) {
  const game = usePvp(userId);
  const { busy, loading, error, offset, lastSynced } = game;
  const { room, revealEndsAt } = usePvpPresentation(game.room);
  const [draft, setDraft] = useState<{ token: string; value: number } | null>(null);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const identity = usePvpIdentity(userId);
  const [editingName, setEditingName] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
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
  const secondsLeft = room?.status === "reveal" ? Math.min(3, Math.max(0, Math.ceil((revealEndsAt - now) / 1000))) : pvpSecondsLeft(room?.deadline ?? null, now, offset);
  const token = `${room?.id}:${room?.matchId}:${room?.index}`;
  const selected = self?.answered ? self.answer : draft?.token === token ? draft.value : self?.selection ?? null;
  const question = room?.question;
  const reveal = room?.status === "reveal" || room?.status === "finished";
  const nameValid = identity.ready && Boolean(identity.name) && !editingName && !identity.saving;
  const standings = pvpStandings(room?.players ?? []);
  const winners = standings.filter(player => player.rank === 1);
  const playing = room?.status === "question" || room?.status === "reveal";
  const pageKey = `${room?.matchId}:${room?.index}:${room?.status === "finished"}`;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [pageKey]);
  useEffect(() => {
    if (identity.ready && !identity.name && self?.name) void identity.choose(self.name);
  }, [identity.ready, identity.name, self?.name, identity.choose]);
  usePvpFeedback(room, userId, Boolean(room?.status === "question" && countdown === 0), !stale);
  async function saveName() {
    if (await identity.choose(name)) setEditingName(false);
  }

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
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 18 }]}>
      {error ? <View style={styles.error} accessibilityLiveRegion="polite"><Text style={styles.body}>{error}</Text>
        <Action label="Ανανέωση" secondary disabled={busy} onPress={() => { void game.refresh(); }} /></View> : null}
      {loading || (userId && !identity.ready && !identity.error) ? <ActivityIndicator accessibilityLabel="Αναζήτηση ενεργού δωματίου" color={colors.accentLight} /> :
        !game.available || !userId ? <View style={styles.card}>
          <Text style={styles.eyebrow}>ΓΝΩΣΗ · 2–4 ΠΑΙΚΤΕΣ</Text>
          <Text accessibilityRole="header" style={styles.title}>Η γνώση γίνεται παρέα.</Text>
          <Text style={styles.body}>{game.available ? "Συνδέσου στον λογαριασμό σου για να δημιουργήσεις ένα ιδιωτικό δωμάτιο ή να μπεις στην παρέα σου." : "Το παιχνίδι με φίλους δεν είναι ακόμη διαθέσιμο. Μπορείς να συνεχίσεις με τα ατομικά παιχνίδια."}</Text>
          {game.available ? <Action label="Σύνδεση / Δημιουργία λογαριασμού" onPress={onAccount} /> : null}
        </View> : !room ? <>
          <ScreenEntrance style={styles.heroCard}>
            <PvpHero />
            <Text style={styles.eyebrow}>ΙΔΙΩΤΙΚΟ ΚΟΥΙΖ · 2–4 ΠΑΙΚΤΕΣ</Text>
            <Text accessibilityRole="header" style={styles.title}>Ποιος ξέρει περισσότερα;</Text>
            <Text style={styles.body}>Μάζεψε την παρέα σου. Ίδιες ερωτήσεις, κοινός χρόνος και μια μικρή μάχη γνώσεων.</Text>
          </ScreenEntrance>
          <View style={styles.identityCard}>
          {identity.name && !editingName ? <View style={styles.row}>
            <PvpBadge name={identity.name} index={0} /><View style={styles.playerCopy}>
              <Text style={styles.eyebrow}>ΠΑΙΖΕΙΣ ΩΣ</Text><Text style={styles.playerName}>{identity.name}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Αλλαγή ονόματος παίκτη" disabled={busy}
              style={styles.editName} onPress={() => { setName(identity.name); setEditingName(true); }}><Text style={styles.notice}>Αλλαγή</Text></Pressable>
          </View> : <>
            <Text style={styles.eyebrow}>Η ΤΑΥΤΟΤΗΤΑ ΣΟΥ ΣΤΟ ΠΑΙΧΝΙΔΙ</Text>
            <Text nativeID="pvp-name-label" style={styles.label}>Το όνομά σου στο παιχνίδι</Text>
            <TextInput testID="pvp-name" accessibilityLabel="Το όνομά σου στο παιχνίδι" value={name} onChangeText={setName} maxLength={24}
              placeholder="π.χ. Μάνος" placeholderTextColor={colors.textMuted} style={styles.input} autoCorrect={false} editable={!identity.saving && identity.ready} returnKeyType="done" onSubmitEditing={() => { void saveName(); }} />
            <Text style={styles.notice}>Διάλεξέ το μία φορά. Θα το θυμόμαστε σε αυτή τη συσκευή για τον λογαριασμό σου.</Text>
            <Action label={identity.saving ? "Αποθήκευση…" : "Αποθήκευση ονόματος"} disabled={!identity.ready || identity.saving || !validPlayerName(name)} onPress={() => { void saveName(); }} />
            {identity.name ? <Action label="Ακύρωση" secondary disabled={identity.saving} onPress={() => setEditingName(false)} /> : null}
          </>}
          {identity.error ? <><Text accessibilityLiveRegion="polite" style={styles.notice}>{identity.error}</Text>
            {!identity.ready ? <Action label="Φόρτωση ονόματος ξανά" secondary onPress={() => { void identity.retry(); }} /> : null}</> : null}
          </View>
          <View style={styles.modeTabs}>
            {([['create', 'Νέο δωμάτιο'], ['join', 'Έχω κωδικό']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="tab"
              accessibilityState={{ selected: mode === value }} style={[styles.modeTab, mode === value && styles.modeTabSelected]} onPress={() => setMode(value)}><Text style={styles.chipText}>{label}</Text></Pressable>)}
          </View>
          {mode === "create" ? <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Δημιούργησε δωμάτιο</Text>
            <Text style={styles.label}>Θέμα</Text>
            <View style={styles.chips}>{PVP_TOPICS.map(topic => <Pressable key={topic.id} accessibilityRole="button"
              accessibilityState={{ selected: settings.category === topic.id, disabled: busy }} disabled={busy}
              onPress={() => setSettings(current => ({ ...current, category: topic.id, count: topic.id === "all" ? current.count : 5 }))}
              style={[styles.chip, styles.topicChip, settings.category === topic.id && styles.selectedChip]}><PvpWorld category={topic.id} size={30} /><Text style={styles.chipText}>{topic.label}</Text></Pressable>)}</View>
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
            <Action label={busy ? "Σύνδεση…" : "Δημιουργία δωματίου"} disabled={busy || !nameValid} onPress={() => { void game.create(identity.name, settings); }} />
          </View> : <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Έχεις κωδικό πρόσκλησης;</Text>
            <TextInput testID="pvp-code" accessibilityLabel="Κωδικός δωματίου, 6 χαρακτήρες" value={code} onChangeText={value => setCode(normalizeRoomCode(value))}
              maxLength={6} autoCapitalize="characters" autoCorrect={false} placeholder="A1B2C3" placeholderTextColor={colors.textMuted} style={[styles.input, styles.codeInput]} editable={!busy} />
            <Text style={styles.body}>Ο φίλος σου θα βρει τον κωδικό στο δωμάτιό του. Μόλις μπεις, δήλωσε έτοιμος.</Text>
            <Action label="Συμμετοχή" disabled={busy || !nameValid || !validRoomCode(code)} onPress={() => { void game.join(identity.name, code); }} />
          </View>}
        </> : room.status === "closed" ? <View style={styles.card}>
          <Text style={styles.title}>Το δωμάτιο έκλεισε</Text><Text style={styles.body}>Δημιούργησε ένα νέο δωμάτιο για να συνεχίσετε.</Text>
          <Action label="Νέο παιχνίδι" onPress={game.dismiss} />
        </View> : <>
          {stale ? <Text accessibilityLiveRegion="polite" style={styles.notice}>Επανασύνδεση… Περιμένουμε ενημέρωση από το παιχνίδι.</Text> : null}
          {room.status === "lobby" ? <ScreenEntrance style={styles.heroCard}>
            <Text style={styles.eyebrow}>ΚΩΔΙΚΟΣ ΔΩΜΑΤΙΟΥ</Text>
            <Text selectable style={styles.roomCode} accessibilityLabel={`Κωδικός ${room.code.split("").join(" ")}`}>{room.code}</Text>
            <View style={styles.roomSettings}><PvpWorld category={room.category} size={42} /><View style={styles.playerCopy}>
              <Text style={styles.playerName}>{PVP_TOPICS.find(topic => topic.id === room.category)?.label}</Text><Text style={styles.body}>{room.count} ερωτήσεις · {room.seconds}″ ανά ερώτηση</Text></View></View>
            <Action label="Πρόσκληση φίλων" secondary onPress={() => { void invite(); }} />
            {shareError ? <Text style={styles.notice}>Δεν κοινοποιήθηκε η πρόσκληση. Μπορείς να στείλεις τον κωδικό που βλέπεις παραπάνω.</Text> : null}
            <Text style={styles.body}>Μοιράσου τον κωδικό και περιμένετε να είναι όλοι έτοιμοι.</Text>
          </ScreenEntrance> : null}
          {playing ? <View style={styles.scoreStrip}>{standings.map((player, index) => <View key={player.id} style={[styles.scoreChip, player.id === userId && styles.self]}>
            <View style={styles.row}><Text numberOfLines={1} style={styles.scoreName}>{player.name}</Text><Text style={styles.scoreSmall}>{player.score}</Text></View>
            <Text style={styles.playerMeta}>{player.left ? "Αποχώρησε" : !player.connected ? "Εκτός σύνδεσης" : player.answered ? "Απάντησε ✓" : "Σκέφτεται…"}</Text>
          </View>)}</View> : null}
          {room.status === "question" && countdown > 0 ? <ScreenEntrance key={`${room.matchId}:${room.index}:countdown`} style={styles.countdownCard}>
            <PvpWorld category={room.category} size={72} />
            <Text style={styles.eyebrow}>ΕΡΩΤΗΣΗ {room.index + 1} / {room.count}</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text><Text style={styles.body}>Ξεκινάμε… Έτοιμη η παρέα;</Text>
          </ScreenEntrance> : question && playing ? <ScreenEntrance key={`${room.matchId}:${room.index}:question`} style={styles.questionCard}>
            <View style={styles.row}><Text style={styles.eyebrow}>{reveal ? "ΑΠΟΤΕΛΕΣΜΑ" : "ΕΡΩΤΗΣΗ"} {room.index + 1} / {room.count}</Text>
              <Text style={[styles.timer, !reveal && secondsLeft <= 5 && styles.urgentText]} accessibilityLabel={`${reveal ? "Επόμενο βήμα σε " : ""}${secondsLeft} δευτερόλεπτα`}>{secondsLeft}″</Text></View>
            {!reveal ? <View style={styles.track}><View style={[styles.fill, secondsLeft <= 5 && styles.urgentFill, { width: `${Math.min(100, secondsLeft / room.seconds * 100)}%` }]} /></View> : null}
            <Text accessibilityRole="header" style={styles.question}>{question.prompt}</Text>
            {question.answers.map((answer, index) => <Pressable key={`${room.matchId}:${room.index}:${index}`} accessibilityRole="button"
              accessibilityLabel={`${answer}${reveal && index === question.correctIndex ? ", σωστή απάντηση" : ""}`}
              accessibilityState={{ selected: selected === index, disabled: disabled || reveal || Boolean(self?.answered) || secondsLeft === 0 }}
              disabled={disabled || reveal || Boolean(self?.answered) || secondsLeft === 0}
              onPress={() => { setDraft({ token, value: index }); void game.select(index, room); }} style={[styles.answer,
                selected === index && styles.selectedChip, reveal && index === question.correctIndex && styles.correct,
                reveal && self?.answer === index && index !== question.correctIndex && styles.incorrect]}>
              <View style={styles.letterBadge}><Text style={styles.answerLetter}>{reveal && index === question.correctIndex ? "✓" : reveal && self?.answer === index ? "×" : ["Α", "Β", "Γ", "Δ"][index]}</Text></View><Text style={styles.answerText}>{answer}</Text>
            </Pressable>)}
            <View style={[styles.feedback, reveal && (self?.answer === question.correctIndex ? styles.correct : styles.incorrect)]}><Text accessibilityLiveRegion="polite" style={styles.body}>{reveal ? (self?.answer === question.correctIndex ? "Σωστά! +1 πόντος" : self?.answered ? "Η σωστή απάντηση φαίνεται με πράσινο." : "Δεν δόθηκε απάντηση εγκαίρως.") : self?.answered ? "Η απάντησή σου κλείδωσε. Περιμένουμε την παρέα…" : secondsLeft === 0 ? "Ο χρόνος έληξε. Κλειδώνει η αποθηκευμένη επιλογή σου…" : busy ? "Αποθήκευση επιλογής…" : selected !== null && self?.selection !== selected ? "Η επιλογή δεν έχει αποθηκευτεί ακόμη. Επιβεβαίωσε ή επίλεξέ την ξανά." : "Μπορείς να αλλάξεις επιλογή πριν επιβεβαιώσεις. Στη λήξη του χρόνου κλειδώνει η αποθηκευμένη επιλογή σου."}</Text></View>
            {reveal ? <><Text style={styles.body}>{question.explanation}</Text>
              {question.sources?.map(source => <SourceLink key={source.url} source={{ ...source, publisher: source.publisher ?? "Πηγή" }} />)}
              <Text style={styles.notice}>{room.index + 1 === room.count ? "Τα τελικά αποτελέσματα" : "Η επόμενη ερώτηση"} σε {secondsLeft}″</Text></> : null}
          </ScreenEntrance> : null}
          {room.status === "finished" ? <ScreenEntrance style={styles.resultCard}>
            <PvpHero result />
            <Text style={styles.eyebrow}>ΤΕΛΙΚΑ ΑΠΟΤΕΛΕΣΜΑΤΑ</Text>
            <Text accessibilityRole="header" style={styles.title}>{room.endedEarly ? "Το παιχνίδι ολοκληρώθηκε νωρίτερα" : winners.length > 1 ? "Ισοπαλία στην κορυφή!" : `Στην κορυφή: ${winners[0]?.name ?? "η παρέα"}!`}</Text>
            <Text style={styles.body}>{room.endedEarly ? "Έμειναν λιγότεροι από δύο ενεργοί παίκτες στο δωμάτιο." : "Κάθε σωστή απάντηση μετράει για έναν πόντο. Οι ισοπαλίες μοιράζονται την ίδια θέση."}</Text>
            <View style={styles.resultStats}><View style={styles.resultStat}><Text style={styles.resultValue}>{self?.score ?? 0}<Text style={styles.statDenominator}>/{room.count}</Text></Text><Text style={styles.playerMeta}>Σωστές απαντήσεις</Text></View>
              <View style={styles.resultStat}><Text style={styles.resultValue}>{standings.find(player => player.id === userId)?.rank ?? "—"}<Text style={styles.statDenominator}>η</Text></Text><Text style={styles.playerMeta}>Η θέση σου</Text></View></View>
            {host ? <Action label="Παίξτε ξανά" disabled={disabled} onPress={() => { void game.rematch(); }} /> : <Text style={styles.notice}>Περίμενε τον οικοδεσπότη για νέο παιχνίδι.</Text>}
          </ScreenEntrance> : null}
          {!playing ? <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{room.status === "lobby" ? `Η παρέα · ${participants.length}/4` : "Βαθμολογία"}</Text>
            {room.status === "lobby" ? <View style={styles.seatGrid}>
              {participants.map((player, index) => <View key={player.id} style={[styles.seatCard, player.id === userId && styles.self]}>
                <View style={styles.row}><PvpBadge name={player.name} index={index} /><Text style={styles.score}>{player.ready ? "✓" : "…"}</Text></View>
                <Text style={styles.playerName}>{player.name}{player.id === userId ? " (εσύ)" : ""}</Text>
                <Text style={styles.playerMeta}>{!player.connected ? "Εκτός σύνδεσης" : player.ready ? "Έτοιμος" : "Δεν είναι έτοιμος"}{player.id === room.hostId ? " · Οικοδεσπότης" : ""}</Text>
              </View>)}
              {Array.from({ length: Math.max(0, 4 - participants.length) }, (_, index) => <View key={`empty:${index}`} style={[styles.seatCard, styles.emptySeat]}>
                <Text accessible={false} style={styles.emptyPlus}>＋</Text><Text style={styles.playerMeta}>Μια θέση για την παρέα σου</Text></View>)}
            </View> : standings.map((player, index) => <View key={player.id} style={[styles.player, player.id === userId && styles.self, player.rank === 1 && styles.winningPlayer]}>
              <PvpBadge name={player.name} index={index} winner={room.status === "finished" && player.rank === 1} />
              <View style={styles.playerCopy}><Text style={styles.playerName}>{room.status !== "lobby" ? `${player.rank}. ` : ""}{player.name}{player.id === userId ? " (εσύ)" : ""}</Text>
                <Text style={styles.playerMeta}>{player.id === room.hostId ? "Οικοδεσπότης · " : ""}{player.left ? "Αποχώρησε" : !player.connected ? "Εκτός σύνδεσης" : room.status === "lobby" ? player.ready ? "Έτοιμος" : "Περιμένουμε ετοιμότητα" : player.answered ? "Απάντησε" : "Στο παιχνίδι"}</Text></View>
              <Text style={styles.score}>{room.status === "lobby" ? player.ready ? "✓" : "…" : player.score}</Text>
            </View>)}
          </View> : null}
          {room.status === "lobby" ? <View style={styles.card}>
            <Action label={self?.ready ? "Είμαι έτοιμος ✓" : "Είμαι έτοιμος"} secondary disabled={disabled} onPress={() => { void game.ready(!self?.ready); }} />
            {host ? <Action label="Έναρξη παιχνιδιού" disabled={disabled || !allReady} onPress={() => { void game.start(); }} /> : <Text style={styles.notice}>Ο οικοδεσπότης ξεκινά όταν είστε όλοι έτοιμοι.</Text>}
            <Text style={styles.body}>Χρειάζονται 2–4 παίκτες. Τα παιχνίδια με φίλους έχουν ξεχωριστή βαθμολογία και δεν δίνουν XP.</Text>
          </View> : null}
          <Action label="Αποχώρηση από το δωμάτιο" secondary disabled={busy} onPress={exit} />
        </>}
    </ScrollView>
    {room?.status === "question" && countdown === 0 && !self?.answered ? <View testID="pvp-confirm-footer" style={[styles.confirmFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Action label="Επιβεβαίωση απάντησης" disabled={disabled || selected === null || secondsLeft === 0}
        onPress={() => { if (selected !== null) void game.answer(selected, room); }} />
    </View> : null}
  </KeyboardAvoidingView>;
}

const panel = { backgroundColor: "#182133", borderRadius: 22, borderWidth: 1, borderColor: "#38435C", padding: 18, gap: 14 };
const styles = StyleSheet.create({
  confirmFooter: { paddingHorizontal: 18, paddingTop: 12, backgroundColor: "#111A2B", borderTopWidth: 1, borderTopColor: "#4A4265", width: "100%", maxWidth: 600, alignSelf: "center" },
  heroCard: { ...panel, backgroundColor: "#202239", borderColor: "#655A80", paddingTop: 6 },
  identityCard: { ...panel, padding: 14, backgroundColor: "#172333" },
  questionCard: { ...panel, backgroundColor: "#172033", borderColor: "#5C547C", padding: 18 },
  countdownCard: { ...panel, alignItems: "center", paddingVertical: 28 },
  countdownNumber: { color: "#E7D5AF", fontSize: 76, lineHeight: 88, fontWeight: "900", fontVariant: ["tabular-nums"] },
  resultCard: { ...panel, borderColor: "#A08A64", backgroundColor: "#242433", paddingTop: 6 },
  resultStats: { flexDirection: "row", gap: 10 },
  resultStat: { flex: 1, alignItems: "center", gap: 8, padding: 16, backgroundColor: "#172032", borderRadius: 16 },
  resultValue: { color: "#E8D1A8", fontSize: 36, fontWeight: "900" },
  statDenominator: { color: colors.textMuted, fontSize: 18, fontWeight: "600" },
  winningPlayer: { borderWidth: 1, borderColor: "#A08A64", backgroundColor: "#302D30" },
  editName: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10 },
  modeTabs: { flexDirection: "row", gap: 6, padding: 5, backgroundColor: "#111B2C", borderRadius: 17, borderWidth: 1, borderColor: "#354059" },
  modeTab: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, minHeight: 46, borderRadius: 12 },
  modeTabSelected: { backgroundColor: "#39334F", borderColor: "#80709E", borderWidth: 1 },
  roomSettings: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: "#151E30", borderRadius: 14 },
  topicChip: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "100%" },
  scoreStrip: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scoreChip: { flexGrow: 1, flexBasis: "45%", minWidth: 0, padding: 10, gap: 5, borderRadius: 13, backgroundColor: "#192338", borderWidth: 1, borderColor: "#364059" },
  scoreName: { flex: 1, color: colors.textBody, fontSize: 13, fontWeight: "700" },
  scoreSmall: { color: "#E8D1A8", fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  urgentText: { color: colors.error },
  urgentFill: { backgroundColor: colors.error },
  letterBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(168,155,255,0.1)", alignItems: "center", justifyContent: "center" },
  feedback: { padding: 13, borderRadius: 13, backgroundColor: "#222B40", borderWidth: 1, borderColor: "#45506B" },
  seatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  seatCard: { flexBasis: "45%", flexGrow: 1, minWidth: 0, padding: 12, gap: 8, borderWidth: 1, borderColor: "#354058", borderRadius: 15, backgroundColor: "#111B2C" },
  emptySeat: { alignItems: "center", justifyContent: "center", borderStyle: "dashed", borderColor: "#404B63", backgroundColor: "transparent" },
  emptyPlus: { color: "#8D88AC", fontSize: 24, minWidth: 40, textAlign: "center" },
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginHorizontal: 18, marginTop: 8, marginBottom: 10 },
  content: { paddingHorizontal: 18, gap: 14, width: "100%", maxWidth: 600, alignSelf: "center" },
  card: panel,
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
  chipText: { color: colors.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  button: { minHeight: 52, padding: 14, borderRadius: 16, backgroundColor: "#39314F", borderColor: "#9A85BC", justifyContent: "center", alignItems: "center" },
  secondary: { backgroundColor: "#26324A", borderWidth: 1, borderColor: "#526080" },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: "800", textAlign: "center" },
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
