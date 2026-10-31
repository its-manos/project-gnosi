import { useKnowledgeProfile } from "../hooks/useKnowledgeProfile";
import KnowledgeMastery from "../components/KnowledgeMastery";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { type Category, type Lesson, type Subcategory } from "../data/lessons";
import FantasyMap from "../components/FantasyMap";
import ReadingPick from "../components/ReadingPick";
import WeeklyReviewCard from "../components/WeeklyReviewCard";
import { colors } from "../theme";

type Props = {
  onKnowledgeReview?: () => void;
  categories: Category[];
  subcategories: Subcategory[];
  featuredLesson: Lesson | null;
  suggestedLessons: Lesson[];
  progressLoaded: boolean;
  completedCount: number;
  savedCount: number;
  inProgressLesson: Lesson | null;
  inProgressAnsweredCount: number;
  inProgressQuestionCount: number;
  onResumeLesson: (lessonId: string) => void;
  onOpenCategory: (categoryId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenSaved: () => void;
  onOpenSearch: () => void;
  onStartDailyChallenge: () => void;
  onOpenDailyPreferences: () => void;
  onWeeklyReview?: () => void;
  onOpenProfile?: () => void;
};

export default function HomeScreen({
  onKnowledgeReview, categories, featuredLesson, suggestedLessons, progressLoaded, completedCount, savedCount,
  inProgressLesson, inProgressAnsweredCount, inProgressQuestionCount, onResumeLesson,
  onOpenCategory, onOpenLesson, onOpenSearch, onStartDailyChallenge, onOpenDailyPreferences, onWeeklyReview, onOpenProfile,
}: Props) {
  const { profile, ready: profileReady } = useKnowledgeProfile();
  const xpFraction = profileReady ? Math.min(1, Math.max(0, profile.earned / profile.required)) : 0;
  const ringLength = 2 * Math.PI * 28;
  const mapRegions = useMemo(() => categories.map((category) => ({
    id: category.id, title: category.title, emoji: category.emoji,
  })), [categories]);
  const resumeProgress = inProgressQuestionCount > 0
    ? Math.min(100, Math.max(0, inProgressAnsweredCount / inProgressQuestionCount * 100)) : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>ΓΝΩΣΗ</Text>
        {onOpenProfile ? <Pressable testID="home-level-profile" style={styles.levelBadge} onPress={onOpenProfile}
          accessibilityRole="button" accessibilityLabel={profileReady ? `Το προφίλ μου. Επίπεδο ${profile.level}. ${profile.earned} από ${profile.required} XP για το επόμενο επίπεδο.` : "Το προφίλ μου. Φόρτωση επιπέδου."}
          accessibilityHint="Άνοιξε το προφίλ σου" hitSlop={4}>
          <Svg width={64} height={64} viewBox="0 0 64 64" style={styles.levelRing} accessible={false} pointerEvents="none">
            <Circle cx={32} cy={32} r={28} fill="none" stroke={colors.borderStrong} strokeWidth={3.5} />
            {xpFraction > 0 ? <Circle testID="home-xp-ring" cx={32} cy={32} r={28} fill="none" stroke={colors.accentLight} strokeWidth={3.5}
              strokeLinecap="round" strokeDasharray={`${ringLength * xpFraction} ${ringLength}`} rotation={-90} origin="32, 32" /> : null}
          </Svg>
          <View pointerEvents="none" style={styles.levelCenter}>
            <Text style={styles.levelCaption} maxFontSizeMultiplier={1.3}>ΕΠ.</Text>
            <Text testID="home-level" style={styles.levelNumber} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>{profileReady ? profile.level : "—"}</Text>
          </View>
        </Pressable> : null}
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>Πού θα ταξιδέψεις;</Text>
      </View>

      <View testID="home-exploration" style={styles.exploration}>
        <FantasyMap overview regions={mapRegions} onSelectRegion={onOpenCategory}
          emptyMessage="Οι πρώτοι κόσμοι γνώσης θα εμφανιστούν εδώ." />
      </View>

      <View testID="home-secondary-content" style={styles.secondary}>
        {inProgressLesson ? (
          <Pressable style={styles.resumeCard} onPress={() => onResumeLesson(inProgressLesson.id)}
            accessibilityRole="button" accessibilityLabel={`Συνέχισε το μάθημα ${inProgressLesson.title}`}>
            <Text style={styles.eyebrow}>ΣΥΝΕΧΙΣΕ ΤΟ ΜΑΘΗΜΑ</Text>
            <Text style={styles.cardTitle}>{inProgressLesson.title}</Text>
            <Text style={styles.meta}>{inProgressAnsweredCount} από {inProgressQuestionCount} ερωτήσεις · Συνέχεια →</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${resumeProgress}%` }]} /></View>
          </Pressable>
        ) : null}

        <View style={styles.dailyCard}>
          <Pressable style={styles.dailyMain} onPress={onStartDailyChallenge} accessibilityRole="button"
            accessibilityLabel="Ξεκίνα την καθημερινή πρόκληση με επτά ερωτήσεις">
            <Text style={styles.dailyGlyph}>✦</Text>
            <View style={styles.dailyCopy}><Text style={styles.eyebrow}>Η ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
              <Text style={styles.cardTitle}>7 ερωτήσεις γνώσεων</Text><Text style={styles.meta}>Νέα πρόκληση κάθε μέρα</Text></View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
          <Pressable onPress={onOpenDailyPreferences} style={styles.preferences} accessibilityRole="button"
            accessibilityLabel="Ρύθμιση ενδιαφερόντων για προτάσεις μαθημάτων">
            <Text style={styles.preferencesText}>Τα ενδιαφέροντά σου →</Text>
          </Pressable>
        </View>

        {onKnowledgeReview ? <KnowledgeMastery compact onOpen={onKnowledgeReview} /> : null}
        {onWeeklyReview ? <WeeklyReviewCard onOpen={onWeeklyReview} hideWhenEmpty /> : null}
        <Text style={styles.sectionTitle}>Μια μικρή ανακάλυψη</Text>
        {!progressLoaded ? <ActivityIndicator color={colors.accentLight} accessibilityLabel="Φόρτωση προτάσεων ανάγνωσης" />
          : featuredLesson ? <ReadingPick lesson={featuredLesson} label="Η ΑΝΑΚΑΛΥΨΗ ΤΗΣ ΗΜΕΡΑΣ" featured onPress={() => onOpenLesson(featuredLesson.id)} />
          : <View style={styles.emptyCard}><Text style={styles.cardTitle}>Διάλεξε την επόμενη διαδρομή σου</Text>
            <Text style={styles.meta}>Εξερεύνησε τις θεματικές ή ξαναδιάβασε ένα αγαπημένο άρθρο.</Text>
            <Pressable onPress={onOpenSearch} style={styles.browseButton} accessibilityRole="button"><Text style={styles.preferencesText}>Όλα τα άρθρα →</Text></Pressable>
          </View>}

        {progressLoaded && suggestedLessons.length > 0 ? <View>
          <Text style={styles.sectionTitle}>Και μια άλλη οπτική</Text>
          {suggestedLessons.map((lesson) => <ReadingPick key={lesson.id} lesson={lesson} label="ΜΙΑ ΑΚΟΜΗ ΑΝΑΚΑΛΥΨΗ" onPress={() => onOpenLesson(lesson.id)} />)}
        </View> : null}

        <Text style={styles.footer}>{completedCount} ολοκληρωμένα · {savedCount} αποθηκευμένα</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 36, width: "100%", maxWidth: 680, alignSelf: "center" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  logo: { color: colors.accentLight, fontSize: 22, lineHeight: 30, fontWeight: "900", letterSpacing: 3, flexShrink: 1 },
  levelBadge: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: colors.surface },
  levelRing: { position: "absolute", top: 0, left: 0 },
  levelCenter: { width: 46, alignItems: "center", justifyContent: "center" },
  levelCaption: { color: colors.textMuted, fontSize: 8, lineHeight: 12, fontWeight: "800", letterSpacing: 1 },
  levelNumber: { color: colors.accentLight, fontSize: 22, lineHeight: 28, fontWeight: "900", fontVariant: ["tabular-nums"] },
  intro: { gap: 4, marginBottom: 8 },
  title: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: "700", letterSpacing: -0.4 },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  exploration: { marginBottom: 8 },
  secondary: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
  resumeCard: { borderWidth: 1, borderColor: "#514B6A", borderRadius: 18, backgroundColor: colors.surface, padding: 18, gap: 8, marginBottom: 16 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 16, fontWeight: "800", letterSpacing: 0.7 },
  cardTitle: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: colors.border, marginTop: 3 },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.success },
  dailyCard: { backgroundColor: "#202431", borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: "hidden", marginBottom: 8 },
  dailyMain: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  dailyGlyph: { color: colors.accentLight, fontSize: 28 },
  dailyCopy: { flex: 1, gap: 4 },
  arrow: { color: colors.accentLight, fontSize: 24 },
  preferences: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  preferencesText: { color: colors.accentLight, fontSize: 13, lineHeight: 21, fontWeight: "600" },
  sectionTitle: { color: colors.text, fontSize: 21, lineHeight: 29, fontWeight: "700", marginTop: 18, marginBottom: 14 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 10 },
  browseButton: { minHeight: 44, justifyContent: "center" },
  footer: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 18 },
});
