import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import FantasyMap from "../components/FantasyMap";
import { colors } from "../theme";

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
  featuredLesson: Lesson;
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
};

export default function HomeScreen({
  categories,
  subcategories,
  featuredLesson,
  completedCount,
  savedCount,
  inProgressLesson,
  inProgressAnsweredCount,
  inProgressQuestionCount,
  onResumeLesson,
  onOpenCategory,
  onOpenLesson,
  onOpenSaved,
  onOpenSearch,
  onStartDailyChallenge,
}: Props) {
  const mapRegions = useMemo(
    () => categories.map((category) => {
      const count = subcategories.filter(
        (subcategory) => subcategory.categoryId === category.id
      ).length;

      return {
        id: category.id,
        title: category.title,
        emoji: category.emoji,
        detail: count === 1 ? "1 περιοχή" : `${count} περιοχές`,
      };
    }),
    [categories, subcategories]
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader />

      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>Ο ΑΤΛΑΣ ΤΗΣ ΓΝΩΣΗΣ</Text>
          <Text style={styles.title}>Πού θα ταξιδέψεις;</Text>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            style={styles.iconButton}
            onPress={onOpenSearch}
            accessibilityRole="button"
            accessibilityLabel="Αναζήτηση μαθημάτων"
          >
            <Text style={styles.iconButtonText}>⌕</Text>
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={onOpenSaved}
            accessibilityRole="button"
            accessibilityLabel={`Αποθηκευμένα μαθήματα: ${savedCount}`}
          >
            <Text style={styles.iconButtonText}>♧</Text>
            {savedCount > 0 ? (
              <View style={styles.savedDot} />
            ) : null}
          </Pressable>
        </View>
      </View>

      <Text style={styles.hint}>
        Άγγιξε μια χώρα για να ανακαλύψεις τις θεματικές της περιοχές.
      </Text>

      <Pressable
        style={styles.dailyChallengeCard}
        onPress={onStartDailyChallenge}
        accessibilityRole="button"
        accessibilityLabel="Ξεκίνα την καθημερινή πρόκληση με επτά ερωτήσεις"
      >
        <View style={styles.dailyChallengeIcon}>
          <Text style={styles.dailyChallengeGlyph}>✦</Text>
        </View>
        <View style={styles.dailyChallengeCopy}>
          <Text style={styles.dailyChallengeEyebrow}>Η ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
          <Text style={styles.dailyChallengeTitle}>7 ερωτήσεις γνώσεων</Text>
          <Text style={styles.dailyChallengeMeta}>Έως 700 πόντοι · Νέα πρόκληση κάθε μέρα</Text>
        </View>
        <Text style={styles.dailyChallengeArrow}>→</Text>
      </Pressable>

      <View style={styles.mapLabelRow}>
        <Text style={styles.mapLabel}>ΟΙ ΓΝΩΣΤΟΙ ΚΟΣΜΟΙ</Text>
        <Text style={styles.mapCount}>
          {categories.length} ΧΩΡΕΣ · {subcategories.length} ΠΕΡΙΟΧΕΣ
        </Text>
      </View>

      <FantasyMap
        regions={mapRegions}
        onSelectRegion={onOpenCategory}
        emptyMessage="Οι πρώτοι κόσμοι γνώσης θα εμφανιστούν εδώ."
      />

      <View style={styles.progressLine}>
        <View style={styles.progressDot} />
        <Text style={styles.progressText}>
          {completedCount} {completedCount === 1 ? "μάθημα" : "μαθήματα"} ολοκληρωμένα
        </Text>
        <View style={styles.progressDivider} />
        <Text style={styles.progressText}>
          {savedCount} αποθηκευμένα
        </Text>
      </View>

      {inProgressLesson ? (
        <Pressable
          style={styles.resumeCard}
          onPress={() => onResumeLesson(inProgressLesson.id)}
          accessibilityRole="button"
          accessibilityLabel={`Συνέχισε το μάθημα ${inProgressLesson.title}`}
        >
          <View style={styles.resumeIcon}>
            <Text style={styles.discoveryGlyph}>↗</Text>
          </View>
          <View style={styles.discoveryContent}>
            <Text style={styles.resumeEyebrow}>ΣΥΝΕΧΙΣΕ ΑΠΟ ΕΚΕΙ ΠΟΥ ΕΜΕΙΝΕΣ</Text>
            <Text style={styles.discoveryTitle} numberOfLines={2}>
              {inProgressLesson.title}
            </Text>
            <Text style={styles.discoveryMeta}>
              {inProgressAnsweredCount} από {inProgressQuestionCount} checkpoints · Συνέχεια →
            </Text>
            <View style={styles.resumeProgressTrack}>
              <View
                style={[
                  styles.resumeProgressFill,
                  {
                    width: `${inProgressQuestionCount > 0 ? (inProgressAnsweredCount / inProgressQuestionCount) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Pressable>
      ) : null}

      {(!inProgressLesson || inProgressLesson.id !== featuredLesson.id) ? (
        <Pressable
          style={styles.discoveryCard}
          onPress={() => onOpenLesson(featuredLesson.id)}
          accessibilityRole="button"
          accessibilityLabel={`Σημερινή ανακάλυψη: ${featuredLesson.title}`}
        >
          <View style={styles.discoveryIcon}>
            <Text style={styles.discoveryGlyph}>✦</Text>
          </View>
          <View style={styles.discoveryContent}>
            <Text style={styles.discoveryEyebrow}>ΜΙΑ ΜΙΚΡΗ ΑΝΑΚΑΛΥΨΗ</Text>
            <Text style={styles.discoveryTitle} numberOfLines={2}>
              {featuredLesson.title}
            </Text>
            <Text style={styles.discoveryMeta}>
              {featuredLesson.readingMinutes} λεπτά ανάγνωσης · Δες το άρθρο →
            </Text>
          </View>
        </Pressable>
      ) : null}

      <Text style={styles.footerNote}>
        Κάθε χώρα κρύβει έναν διαφορετικό τρόπο να δεις τον κόσμο.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 34,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  headingText: { flex: 1 },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  quickActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    color: colors.accentLight,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "600",
  },
  savedDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    right: 8,
    top: 7,
    backgroundColor: colors.success,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  dailyChallengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#201D38",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    padding: 13,
    marginBottom: 20,
  },
  dailyChallengeIcon: {
    width: 44,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSurface,
  },
  dailyChallengeGlyph: { color: colors.accentLight, fontSize: 25 },
  dailyChallengeCopy: { flex: 1, gap: 4 },
  dailyChallengeEyebrow: { color: colors.accentLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.0 },
  dailyChallengeTitle: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  dailyChallengeMeta: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  dailyChallengeArrow: { color: colors.accentLight, fontSize: 23, fontWeight: "800", paddingLeft: 2 },
  mapLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  mapLabel: {
    color: "#7F89A4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  mapCount: {
    color: "#7F89A4",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  progressLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 9,
    marginTop: -2,
    marginBottom: 14,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  progressText: { color: colors.textMuted, fontSize: 10 },
  progressDivider: {
    height: 12,
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  discoveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    padding: 14,
  },
  discoveryIcon: {
    width: 43,
    height: 49,
    borderRadius: 13,
    backgroundColor: colors.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  discoveryGlyph: { color: colors.accentLight, fontSize: 24 },
  discoveryContent: { flex: 1, gap: 4 },
  discoveryEyebrow: {
    color: colors.accentLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  discoveryTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  discoveryMeta: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#1B1B31",
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 19,
    padding: 14,
    marginBottom: 12,
  },
  resumeIcon: {
    width: 43,
    height: 49,
    borderRadius: 13,
    backgroundColor: colors.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeEyebrow: {
    color: colors.accentLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  resumeProgressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
    width: "100%",
  },
  resumeProgressFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  footerNote: {
    color: "#68728A",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 18,
  },
});
