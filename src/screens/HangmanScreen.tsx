import { emitPlayFeedback } from "../play/events";
import GameXpStatus from "../components/GameXpStatus";
import { useLearningSession } from "../state/LearningSession";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import AppBackground from "../components/AppBackground";
import AtlasContinueCard, { atlasContinueStyles } from "../components/AtlasContinueCard";
import HangmanFigure from "../components/HangmanFigure";
import HangmanFeedbackMotion from "../components/HangmanFeedbackMotion";
import { MotionPressable, MotionView } from "../components/HomeMotion";
import { GREEK_ALPHABET, MAX_MISTAKES, guessHangman, hangmanMistakes, hangmanStatus, nextHangman, normalizeGreek, startHangman } from "../games/hangman/engine";
import { requestPracticeCue } from "../play/soundStatus";
import { colors } from "../theme";

// Rounds remain casual; only distinct daily win receipts enter learning sync.
export default function HangmanScreen({ onHome }: { onHome: () => void }) {
  const { store } = useLearningSession();
  const [game, setGame] = useState(startHangman);
  const [earnedXP, setEarnedXP] = useState(0);
  // The synchronous ref serializes rapid taps before React commits a render.
  const liveGame = useRef(game);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const word = normalizeGreek(game.word.word);
  const mistakes = hangmanMistakes(game);
  const status = hangmanStatus(game);
  const finished = status !== "playing";

  useEffect(() => {
    requestPracticeCue("question-open");
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [game.round]);

  function guess(letter: string) {
    const previous = liveGame.current;
    const next = guessHangman(previous, game.round, letter);
    if (next === previous) return;
    liveGame.current = next;
    if (hangmanStatus(next) === "won") {
      const xp = store.rewardHangman(next);
      setEarnedXP(xp);
      emitPlayFeedback({ id: `hangman:${next.word.id}:${next.round}:${Date.now()}`, kind: "complete", scope: store.userId ?? "guest", xp });
    } else {
      requestPracticeCue(normalizeGreek(next.word.word).includes(letter) ? "correct" : "incorrect");
    }
    setGame(next);
  }
  function nextWord() {
    const next = nextHangman(liveGame.current, game.round);
    if (next !== liveGame.current) setEarnedXP(0);
    liveGame.current = next;
    setGame(next);
  }

  const spokenWord = [...word].map(letter => game.guesses.includes(letter) || finished ? letter : "κενό").join(", ");
  const lastGuess = game.guesses.at(-1);
  return <View testID="hangman-screen" style={styles.screen}>
    <AppBackground />
    <ProfileSectionHeader title="Κρεμάλα" actionLabel="‹ Αρχική"
      actionAccessibilityLabel="Επιστροφή στην αρχική" onAction={onHome} style={styles.header} />
    <ScrollView ref={scroll} testID="hangman-scroll" showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, compact && styles.compactContent, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.meta}>
        <Text style={styles.eyebrow}>{game.word.category}</Text>
        <Text style={styles.metaText}>Νίκες {game.wins} · Γύρος {game.round}</Text>
      </View>
      <MotionView key={game.round} entranceDelay={0} style={[styles.puzzle, compact && styles.compactPuzzle]}>
        <HangmanFeedbackMotion mistakes={mistakes} won={status === "won"} style={styles.figure}>
          <HangmanFigure mistakes={mistakes} won={status === "won"} size={compact ? 116 : 150} />
        </HangmanFeedbackMotion>
        <View style={styles.lives} accessible accessibilityLabel={`${MAX_MISTAKES - mistakes} από ${MAX_MISTAKES} λάθη απομένουν`}>
          {Array.from({ length: MAX_MISTAKES }, (_, i) => <View key={i} accessible={false}
            style={[styles.life, i < mistakes && styles.lifeLost, status === "won" && styles.lifeWon]} />)}
        </View>
        <Text style={styles.clue}>{game.word.clue}</Text>
        <View testID="hangman-word" style={styles.word} accessible accessibilityLabel={`Λέξη ${word.length} γραμμάτων. ${spokenWord}`}>
          {[...word].map((letter, index) => {
            const guessed = game.guesses.includes(letter);
            const visible = guessed || finished;
            return <MotionView key={`${game.round}:${index}:${visible}`} entranceDelay={visible ? index * 12 : undefined}
              style={[styles.tile, guessed && styles.tileRevealed, finished && !guessed && styles.tileMissed]}>
              <Text accessible={false} style={[styles.letter, finished && !guessed && styles.missedLetter]}>{visible ? letter : ""}</Text>
            </MotionView>;
          })}
        </View>
        <Text testID="hangman-status" accessibilityLiveRegion="polite" style={[styles.status,
          status === "won" && styles.successText, status === "lost" && styles.errorText]}>
          {status === "won" ? "Τη βρήκες!" : status === "lost" ? `Η λέξη ήταν «${game.word.word}».`
            : `${MAX_MISTAKES - mistakes} λάθη ακόμα${lastGuess ? ` · ${lastGuess}: ${word.includes(lastGuess) ? "σωστό γράμμα" : "δεν υπάρχει"}` : " · Διάλεξε γράμμα"}`}
        </Text>
      </MotionView>
      {finished ? <MotionView entranceDelay={40} testID="hangman-result" style={styles.result}>
        <GameXpStatus game="hangman" earnedXP={earnedXP} />
        <Text style={styles.eyebrow}>ΜΙΑ ΜΙΚΡΗ ΓΝΩΣΗ</Text>
        <Text style={styles.fact}>{game.word.fact}</Text>
        <AtlasContinueCard testID="hangman-next" onPress={nextWord} accessibilityRole="button"
          accessibilityLabel="Επόμενη λέξη" style={styles.next}>
          <Text style={atlasContinueStyles.title}>Επόμενη λέξη</Text>
          <Text accessible={false} style={styles.nextArrow}>→</Text>
        </AtlasContinueCard>
      </MotionView> : <View testID="hangman-keyboard" style={styles.keyboard}>
        {[...GREEK_ALPHABET].map(letter => {
          const used = game.guesses.includes(letter);
          const correct = used && word.includes(letter);
          return <MotionPressable key={letter} testID={`hangman-key-${letter}`} disabled={used}
            onPress={() => guess(letter)} accessibilityRole="button" accessibilityState={{ disabled: used }}
            accessibilityLabel={`${letter}${used ? correct ? ", υπάρχει στη λέξη" : ", δεν υπάρχει στη λέξη" : ""}`}
            style={[styles.key, used && (correct ? styles.keyCorrect : styles.keyWrong)]}>
            <Text style={[styles.keyText, used && (correct ? styles.successText : styles.usedText)]}>{letter}</Text>
          </MotionPressable>;
        })}
      </View>}
      <Text style={styles.footer}>{finished ? "Παίζεις για τη χαρά της γνώσης." : "Βρες τη λέξη πριν κάνεις 6 λάθη. Τόνοι και διαλυτικά δεν μετράνε."}</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginHorizontal: profileSectionLayout.horizontal, marginTop: profileSectionLayout.top },
  content: { flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 18, paddingTop: 13, gap: 16 },
  compactContent: { gap: 10, paddingTop: 8 },
  meta: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  eyebrow: { color: "#D5B785", fontSize: 11, lineHeight: 16, letterSpacing: 0.7, fontWeight: "800" },
  metaText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  puzzle: { borderRadius: 22, backgroundColor: "#192135", borderWidth: 1, borderColor: "#514967", padding: 18, gap: 14, alignItems: "center", justifyContent: "center", flexGrow: 1 },
  compactPuzzle: { padding: 12, gap: 10 },
  figure: { alignItems: "center" },
  lives: { flexDirection: "row", gap: 5 },
  life: { width: 23, height: 5, borderRadius: 3, backgroundColor: colors.accentLight },
  lifeLost: { backgroundColor: "#5D3948" },
  lifeWon: { backgroundColor: colors.success },
  clue: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "600", textAlign: "center" },
  word: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 5, maxWidth: "100%" },
  tile: { width: 29, minHeight: 38, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: "#55516C", backgroundColor: "#111929", alignItems: "center", justifyContent: "center" },
  tileRevealed: { borderColor: "#9683CA", backgroundColor: "#302B4A" },
  tileMissed: { borderColor: "#84505D", backgroundColor: colors.errorSurface },
  letter: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: "800" },
  missedLetter: { color: colors.error },
  status: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: "center", fontWeight: "700" },
  keyboard: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  key: { width: "14%", minWidth: 44, minHeight: 46, paddingVertical: 7, borderRadius: 11, backgroundColor: "#242B42", borderWidth: 1, borderColor: "#55516C", alignItems: "center", justifyContent: "center" },
  keyText: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: "800" },
  keyCorrect: { backgroundColor: colors.successSurface, borderColor: "#397363" },
  keyWrong: { backgroundColor: "#161C2C", borderColor: "#33374B" },
  successText: { color: colors.success },
  errorText: { color: colors.error },
  usedText: { color: "#838A9D" },
  result: { gap: 10 },
  fact: { color: colors.textBody, fontSize: 15, lineHeight: 23 },
  next: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 50 },
  nextArrow: { color: colors.accentLight, fontSize: 22 },
  footer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
