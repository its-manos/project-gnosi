import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import { colors } from "../theme";
import { getLessonAccess, getSubcategoryPath } from "../utils/lessonPath";
import { devLessonsUnlocked } from "../utils/devLessonAccess";

type Props = {
  completedLessonIds: string[];
  inProgressLessonIds: string[];
  progressLoaded: boolean;
  category: Category;
  subcategory: Subcategory;
  lessons: Lesson[];
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
};

// The curriculum already has five editorial chapters with *unequal* sizes.
// These are display markers only; they never change lesson IDs or unlock rules.
const ancientGreeceChapters: Record<number, string> = {
  0: "ΚΕΦΑΛΑΙΟ I",
  5: "ΚΕΦΑΛΑΙΟ II",
  11: "ΚΕΦΑΛΑΙΟ III",
  18: "ΚΕΦΑΛΑΙΟ IV",
  24: "ΚΕΦΑΛΑΙΟ V",
};

function pointFor(index: number, width: number) {
  const lane = [0.29, 0.69, 0.72, 0.32][index % 4];
  return { x: Math.round(width * lane), y: 80 + index * 139 };
}

export default function SubcategoryScreen({
  category, subcategory, lessons, onBack, onOpenLesson,
  completedLessonIds, inProgressLessonIds, progressLoaded,
}: Props) {
  const { width: viewportWidth } = useWindowDimensions();
  const path = useMemo(() => getSubcategoryPath(lessons, subcategory.id), [lessons, subcategory.id]);
  const completed = path.filter(lesson => completedLessonIds.includes(lesson.id)).length;
  const nextLesson = path.find(lesson => !completedLessonIds.includes(lesson.id) && inProgressLessonIds.includes(lesson.id) &&
    getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds).unlocked)
    ?? path.find(lesson => !completedLessonIds.includes(lesson.id) &&
      getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds).unlocked);
  const mapWidth = Math.max(250, Math.min(410, viewportWidth - 40));
  const mapHeight = 180 + Math.max(0, path.length - 1) * 139;
  const points = path.map((_lesson, index) => pointFor(index, mapWidth));
  const route = points.map((point, index) => {
    if (index === 0) return "M " + point.x + " " + point.y;
    const previous = points[index - 1] ?? point;
    return "C " + previous.x + " " + (previous.y + 55) + " " +
      point.x + " " + (point.y - 55) + " " + point.x + " " + point.y;
  }).join(" ");
  const isTesting = devLessonsUnlocked();

  return (
    <ScrollView testID="subcategory-adventure-path"
      contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppHeader onBack={onBack} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{category.title.toUpperCase()} · ΔΙΑΔΡΟΜΗ ΓΝΩΣΗΣ</Text>
        <Text style={styles.title}>{subcategory.title}</Text>
        <Text style={styles.description}>{subcategory.description}</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Η πρόοδός σου</Text>
          <Text style={styles.progressText}>{progressLoaded ? completed + " / " + path.length : "—"}</Text>
        </View>
        <View style={styles.progressTrack} accessible accessibilityRole="progressbar"
          accessibilityLabel="Πρόοδος διαδρομής" accessibilityValue={{
            min: 0, max: Math.max(1, path.length), now: progressLoaded ? completed : 0,
          }}>
          <View style={[styles.progressFill, { width: progressLoaded && path.length
            ? String(Math.round(completed / path.length * 100)) + "%" : "0%" }]} />
        </View>
      </View>

      {progressLoaded && nextLesson ?
        <Pressable testID="adventure-continue" style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
          onPress={() => onOpenLesson(nextLesson.id)} accessibilityRole="button"
          accessibilityLabel={"Συνέχισε τη διαδρομή: " + nextLesson.title}>
          <View style={styles.continueCopy}>
            <Text style={styles.continueEyebrow}>ΕΠΟΜΕΝΟΣ ΣΤΑΘΜΟΣ</Text>
            <Text style={styles.continueTitle} numberOfLines={2}>{nextLesson.title}</Text>
          </View>
          <View style={styles.continueButton}><Text style={styles.continueArrow}>▶</Text></View>
        </Pressable> : null}
      {progressLoaded && path.length > 0 && completed === path.length ?
        <View style={styles.finishedCard}>
          <Text style={styles.finishedTitle}>✦ Ολοκλήρωσες τη διαδρομή!</Text>
          <Text style={styles.description}>Μπορείς να επιστρέψεις σε όποιο μάθημα θέλεις.</Text>
        </View> : null}
      {isTesting && path.length > 1 ?
        <Text style={styles.devHint}>Λειτουργία δοκιμών: όλα τα μαθήματα είναι ξεκλείδωτα.</Text> : null}
      {!isTesting && path.length > 1 ?
        <Text style={styles.pathHint}>Ακολούθησε τους σταθμούς με τη σειρά. Κάθε ολοκλήρωση ανοίγει τον επόμενο.</Text> : null}

      {path.length === 0 ?
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Νέες αποστολές έρχονται</Text>
          <Text style={styles.description}>Εξερεύνησε έναν άλλο κόσμο μέχρι τότε.</Text>
        </View> :
        <View testID="adventure-map" style={[styles.map, { width: mapWidth, height: mapHeight }]}>
          <Svg width={mapWidth} height={mapHeight} style={styles.pathSvg} pointerEvents="none">
            <Path d={route} fill="none" stroke={colors.borderStrong} strokeWidth={8} strokeLinecap="round" />
            <Path d={route} fill="none" stroke="#7365A9" strokeWidth={3} strokeLinecap="round" strokeDasharray="5 9" />
          </Svg>
          {path.map((lesson, index) => {
            const point = points[index] ?? pointFor(index, mapWidth);
            const access = getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds);
            const done = completedLessonIds.includes(lesson.id);
            const started = inProgressLessonIds.includes(lesson.id) && !done;
            const disabled = !progressLoaded || !access.unlocked;
            const active = nextLesson?.id === lesson.id;
            const chapter = subcategory.id === "ancient-greece" ? ancientGreeceChapters[index] : undefined;
            return (
              <View key={lesson.id} style={[styles.stopPosition, { left: point.x - 72, top: point.y - 42 }]}>
                {chapter ? <Text style={styles.chapterBadge}>{chapter}</Text> : null}
                <Pressable testID={"adventure-node-" + lesson.id} style={styles.nodePressable}
                  onPress={() => onOpenLesson(lesson.id)} disabled={disabled}
                  accessibilityRole="button" accessibilityState={{ disabled }}
                  accessibilityLabel={lesson.title + (done ? ", ολοκληρωμένο" : started ? ", σε εξέλιξη"
                    : disabled ? ", κλειδωμένο. Ολοκλήρωσε πρώτα " + (access.prerequisite?.title ?? "το προηγούμενο μάθημα")
                    : ", διαθέσιμο")}>
                  <View style={[styles.node, done && styles.nodeDone, active && styles.nodeActive,
                    disabled && styles.nodeLocked]}>
                    <Text style={[styles.nodeNumber, done && styles.nodeDoneText, disabled && styles.nodeLockedText]}>
                      {done ? "✓" : disabled ? "🔒" : String(index + 1)}
                    </Text>
                  </View>
                  <Text style={[styles.nodeTitle, disabled && styles.nodeTitleLocked,
                    active && styles.nodeTitleActive]} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                  {started ? <Text style={styles.nodeStatus}>Σε εξέλιξη</Text> : null}
                </Pressable>
              </View>
            );
          })}
        </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 12 },
  header: { gap: 7 },
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 16, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900" },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressText: { color: colors.textBody, fontSize: 11, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 5, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.success, borderRadius: 5 },
  continueCard: { flexDirection: "row", alignItems: "center", padding: 13, gap: 12,
    backgroundColor: "#242039", borderColor: "#514B6A", borderWidth: 1, borderRadius: 16 },
  continueCopy: { flex: 1, gap: 5 },
  continueEyebrow: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  continueTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  continueButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accent, borderRadius: 21 },
  continueArrow: { color: "#111421", fontSize: 16, fontWeight: "900" },
  pathHint: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  devHint: { color: "#E4C486", fontSize: 11, lineHeight: 17 },
  map: { alignSelf: "center", position: "relative", marginTop: 6 },
  pathSvg: { position: "absolute", top: 0, left: 0 },
  stopPosition: { width: 144, position: "absolute", alignItems: "center" },
  chapterBadge: { color: "#D4C6FF", fontSize: 10, fontWeight: "900", textAlign: "center",
    lineHeight: 14, marginTop: -18, marginBottom: 4, backgroundColor: "#25233A",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
  nodePressable: { width: 144, alignItems: "center" },
  node: { width: 65, height: 65, borderRadius: 33, alignSelf: "center",
    borderWidth: 3, borderColor: "#746B94", backgroundColor: "#292A43",
    alignItems: "center", justifyContent: "center" },
  nodeActive: { borderColor: colors.accentLight, backgroundColor: "#453D70", borderWidth: 4 },
  nodeDone: { borderColor: colors.success, backgroundColor: colors.successSurface },
  nodeLocked: { borderColor: colors.borderStrong, backgroundColor: "#202535" },
  nodeNumber: { color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: "900" },
  nodeDoneText: { color: colors.success },
  nodeLockedText: { color: colors.textMuted, fontSize: 17 },
  nodeTitle: { color: colors.textBody, fontSize: 12, lineHeight: 16,
    fontWeight: "700", textAlign: "center", marginTop: 5, minHeight: 32 },
  nodeTitleLocked: { color: colors.textMuted },
  nodeTitleActive: { color: colors.accentLight },
  nodeStatus: { color: colors.accentLight, fontSize: 10, textAlign: "center", lineHeight: 14 },
  finishedCard: { padding: 14, borderRadius: 16, backgroundColor: colors.successSurface, gap: 4 },
  finishedTitle: { color: colors.success, fontSize: 15, fontWeight: "800" },
  empty: { padding: 20, backgroundColor: colors.surface, borderRadius: 16, gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
