import { useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
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

// Display-only markers: curriculum positions and unlock rules remain unchanged.
const ancientGreeceChapters: Record<number, string> = {
  0: "ΚΕΦΑΛΑΙΟ I",
  5: "ΚΕΦΑΛΑΙΟ II",
  11: "ΚΕΦΑΛΑΙΟ III",
  18: "ΚΕΦΑΛΑΙΟ IV",
  24: "ΚΕΦΑΛΑΙΟ V",
};
const chapterStarts = [5, 11, 18, 24];
const NODE_SPACING = 142;
const CHAPTER_GAP = 25;
const NODE_WIDTH = 148;

function pointFor(index: number, width: number, isAncientGreece: boolean) {
  // Mirror the turns to create a winding trail, but keep every 148pt label
  // within the map even on narrow devices.
  const lane = [0.27, 0.69, 0.72, 0.31][index % 4];
  const chapterOffset = isAncientGreece
    ? chapterStarts.filter(start => start <= index).length * CHAPTER_GAP : 0;
  return { x: Math.round(width * lane), y: 75 + index * NODE_SPACING + chapterOffset };
}

function segmentBetween(from: { x: number; y: number }, to: { x: number; y: number }) {
  const half = (to.y - from.y) * 0.45;
  return "M " + from.x + " " + from.y +
    " C " + from.x + " " + (from.y + half) +
    " " + to.x + " " + (to.y - half) + " " + to.x + " " + to.y;
}

export default function SubcategoryScreen({
  category, subcategory, lessons, onBack, onOpenLesson,
  completedLessonIds, inProgressLessonIds, progressLoaded,
}: Props) {
  const { width: viewportWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const mapTopRef = useRef(0);
  const path = useMemo(() => getSubcategoryPath(lessons, subcategory.id), [lessons, subcategory.id]);
  const completed = path.filter(lesson => completedLessonIds.includes(lesson.id)).length;
  const nextLesson = path.find(lesson => !completedLessonIds.includes(lesson.id) &&
    inProgressLessonIds.includes(lesson.id) &&
    getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds).unlocked)
    ?? path.find(lesson => !completedLessonIds.includes(lesson.id) &&
      getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds).unlocked);
  const nextIndex = nextLesson ? path.findIndex(lesson => lesson.id === nextLesson.id) : -1;
  const isAncientGreece = subcategory.id === "ancient-greece";
  const mapWidth = Math.max(1, Math.min(420, viewportWidth - 40));
  const points = path.map((_lesson, index) => pointFor(index, mapWidth, isAncientGreece));
  const mapHeight = points.length ? points[points.length - 1].y + 115 : 0;
  const segments = points.slice(1).map((point, index) => ({
    d: segmentBetween(points[index], point),
    done: completedLessonIds.includes(path[index].id) &&
      completedLessonIds.includes(path[index + 1].id),
    toNext: path[index + 1].id === nextLesson?.id &&
      completedLessonIds.includes(path[index].id),
  }));
  const progressPercent = path.length ? Math.round(completed / path.length * 100) : 0;
  const isTesting = devLessonsUnlocked();

  const jumpToCurrent = () => {
    if (nextIndex < 0 || !points[nextIndex]) return;
    // Scroll within the existing page, leaving space above the active node
    // for its chapter marker. No separate screen or navigation is involved.
    scrollRef.current?.scrollTo({
      y: Math.max(0, mapTopRef.current + points[nextIndex].y - 180),
      animated: true,
    });
  };

  return (
    <ScrollView ref={scrollRef} testID="subcategory-adventure-path"
      contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      bounces={false} alwaysBounceVertical={false} overScrollMode="never">
      <AppHeader onBack={onBack} style={styles.appHeader} />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{category.title.toUpperCase()}  /  ΔΙΑΔΡΟΜΗ ΓΝΩΣΗΣ</Text>
        <Text style={styles.title}>{subcategory.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{subcategory.description}</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Η ΠΟΡΕΙΑ ΣΟΥ</Text>
          <Text style={styles.progressCount}>{progressLoaded
            ? completed + " / " + path.length + " μαθήματα" : "—"}</Text>
        </View>
        <View testID="adventure-progress" style={styles.progressTrack} accessible
          accessibilityRole="progressbar" accessibilityLabel="Πρόοδος διαδρομής"
          accessibilityValue={{ min: 0, max: Math.max(1, path.length),
            now: progressLoaded ? completed : 0 }}>
          <View style={[styles.progressFill, { width: (progressLoaded ? progressPercent : 0) + "%" }]} />
        </View>
      </View>

      {progressLoaded && nextLesson ?
        <Pressable testID="adventure-continue"
          style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
          onPress={() => onOpenLesson(nextLesson.id)} accessibilityRole="button"
          accessibilityLabel={"Συνέχισε τη διαδρομή: " + nextLesson.title}>
          <View style={styles.continueAccent} />
          <View style={styles.continueCopy}>
            <View style={styles.continueMeta}>
              <Text style={styles.continueEyebrow}>ΕΠΟΜΕΝΟΣ ΣΤΑΘΜΟΣ</Text>
              <Text style={styles.continueIndex}>{nextIndex + 1} / {path.length}</Text>
            </View>
            <Text style={styles.continueTitle} numberOfLines={2}>{nextLesson.title}</Text>
            <Text style={styles.continuePrompt}>Συνέχισε την εξερεύνηση  →</Text>
          </View>
          <View style={styles.continueButton}>
            <Text style={styles.continueArrow}>›</Text>
          </View>
        </Pressable> : null}

      {progressLoaded && path.length > 0 && completed === path.length ?
        <View style={styles.finishedCard}>
          <Text style={styles.finishedTitle}>✦ Ολοκλήρωσες τη διαδρομή!</Text>
          <Text style={styles.finishedCopy}>Όλοι οι σταθμοί παραμένουν διαθέσιμοι για επανάληψη.</Text>
        </View> : null}

      {path.length > 0 ?
        <View style={styles.mapToolbar}>
          <View style={styles.mapToolbarCopy}>
            <Text style={styles.mapHeading}>Ο ΧΑΡΤΗΣ ΤΗΣ ΔΙΑΔΡΟΜΗΣ</Text>
            <Text style={styles.mapSubheading}>Κάθε σταθμός μια νέα ανακάλυψη</Text>
          </View>
          {progressLoaded && nextIndex > 1 ?
            <Pressable testID="adventure-jump-to-current" onPress={jumpToCurrent}
              style={({ pressed }) => [styles.jumpButton, pressed && styles.pressed]}
              accessibilityRole="button" accessibilityLabel="Μετάβαση στον επόμενο σταθμό του χάρτη">
              <Text style={styles.jumpText}>Η ΘΕΣΗ ΜΟΥ  ↓</Text>
            </Pressable> : null}
        </View> : null}

      {isTesting && path.length > 1 ?
        <Text style={styles.devHint}>Δοκιμή: όλοι οι σταθμοί ξεκλείδωτοι.</Text> : null}

      {path.length === 0 ?
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Νέες αποστολές έρχονται</Text>
          <Text style={styles.finishedCopy}>Εξερεύνησε έναν άλλο κόσμο μέχρι τότε.</Text>
        </View> :
        <View testID="adventure-map" onLayout={event => {
          mapTopRef.current = event.nativeEvent.layout.y;
        }} style={[styles.map, { width: mapWidth, height: mapHeight }]}>
          <Svg width={mapWidth} height={mapHeight} style={styles.pathSvg} pointerEvents="none">
            {/* Faint engraved contours and stars suggest an old atlas without a
                raster image that could crop or overflow across devices. */}
            {points.filter((_point, index) => index % 3 === 1).map((point, index) => (
              <Ellipse key={"contour-" + index} cx={point.x < mapWidth / 2 ? mapWidth - 28 : 28}
                cy={point.y + 48} rx={Math.min(110, mapWidth * 0.28)} ry={63}
                stroke="#6F658D" strokeWidth={1} opacity={0.14} fill="none" />
            ))}
            {points.filter((_point, index) => index % 4 === 2).map((point, index) => (
              <Circle key={"star-" + index} cx={point.x < mapWidth / 2 ? mapWidth - 22 : 22}
                cy={point.y - 40} r={2.1} fill="#BAA9DA" opacity={0.43} />
            ))}
            {segments.map((segment, index) => (
              <Path key={"route-base-" + index} d={segment.d} fill="none"
                stroke="#24283C" strokeWidth={14} strokeLinecap="round" />
            ))}
            {segments.map((segment, index) => (
              <Path key={"route-line-" + index} d={segment.d} fill="none"
                stroke={segment.done ? "#2E9A7E" : segment.toNext ? "#A89BFF" : "#645C81"}
                strokeWidth={segment.done ? 5 : 3} strokeLinecap="round"
                strokeDasharray={segment.done ? undefined : "3 11"}
                opacity={segment.done ? 0.9 : segment.toNext ? 1 : 0.65} />
            ))}
          </Svg>

          {path.map((lesson, index) => {
            const point = points[index];
            const access = getLessonAccess(lesson, path, completedLessonIds, inProgressLessonIds);
            const done = completedLessonIds.includes(lesson.id);
            const started = inProgressLessonIds.includes(lesson.id) && !done;
            const disabled = !progressLoaded || !access.unlocked;
            const active = progressLoaded && nextLesson?.id === lesson.id;
            const chapter = isAncientGreece ? ancientGreeceChapters[index] : undefined;
            return (
              <View key={lesson.id} style={[styles.stopPosition, {
                left: point.x - NODE_WIDTH / 2, top: point.y - 36,
              }]}>
                {chapter ? <Text style={styles.chapterBadge}>{chapter}</Text> : null}
                <Pressable testID={"adventure-node-" + lesson.id}
                  style={({ pressed }) => [styles.nodePressable, pressed && !disabled && styles.pressed]}
                  onPress={() => onOpenLesson(lesson.id)} disabled={disabled}
                  accessibilityRole="button" accessibilityState={{ disabled }}
                  accessibilityLabel={lesson.title + (done ? ", ολοκληρωμένο" : started ? ", σε εξέλιξη"
                    : disabled ? ", κλειδωμένο. Ολοκλήρωσε πρώτα " +
                      (access.prerequisite?.title ?? "το προηγούμενο μάθημα")
                      : ", διαθέσιμο")}>
                  <View style={styles.nodeOuter}>
                    {active ? <View style={styles.activeHalo} /> : null}
                    <View style={[styles.node, done && styles.nodeDone, active && styles.nodeActive,
                      disabled && styles.nodeLocked]}>
                      {done ? <Text style={styles.nodeCheck}>✓</Text>
                        : disabled ? <Svg width={23} height={25} viewBox="0 0 24 24">
                          <Path d="M6.5 10V7.5a5.5 5.5 0 0 1 11 0V10M5.5 10h13v10h-13z"
                            stroke="#777D93" strokeWidth={1.8} strokeLinejoin="round" fill="none" />
                          <Circle cx={12} cy={15} r={1.4} fill="#777D93" />
                        </Svg>
                          : <Text style={styles.nodeNumber}>{index + 1}</Text>}
                    </View>
                  </View>
                  <Text style={[styles.nodeTitle, disabled && styles.nodeTitleLocked,
                    active && styles.nodeTitleActive]} numberOfLines={2}>{lesson.title}</Text>
                  {active ? <Text style={styles.nodeStatus}>{started ? "ΣΕ ΕΞΕΛΙΞΗ" : "ΕΠΟΜΕΝΟΣ ΣΤΑΘΜΟΣ"}</Text> : null}
                </Pressable>
              </View>
            );
          })}
        </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%", maxWidth: 720, alignSelf: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 44, gap: 13,
  },
  appHeader: { marginBottom: 1 },
  hero: { gap: 5, marginBottom: 2 },
  eyebrow: {
    color: colors.accentLight, fontSize: 10, lineHeight: 16,
    fontWeight: "900", letterSpacing: 1.15,
  },
  title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 1 },
  progressHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 11,
  },
  progressLabel: {
    color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1,
  },
  progressCount: { color: colors.text, fontSize: 12, fontWeight: "800" },
  progressTrack: {
    height: 8, borderRadius: 5, backgroundColor: "#282A41", overflow: "hidden", marginTop: 3,
  },
  progressFill: {
    height: "100%", backgroundColor: colors.accentLight, borderRadius: 5,
  },
  continueCard: {
    flexDirection: "row", alignItems: "center", padding: 15, paddingLeft: 18,
    gap: 12, backgroundColor: "#1B2034", borderWidth: 1, borderColor: "#51496F",
    borderRadius: 20, minHeight: 114, overflow: "hidden",
  },
  continueAccent: {
    position: "absolute", left: 0, top: 17, bottom: 17,
    width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3,
    backgroundColor: colors.accentLight,
  },
  continueCopy: { flex: 1, gap: 6 },
  continueMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  continueEyebrow: {
    color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.7,
  },
  continueIndex: { color: "#9D98B7", fontSize: 10, fontWeight: "800" },
  continueTitle: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "900" },
  continuePrompt: { color: "#B7ABE9", fontSize: 11, lineHeight: 17, fontWeight: "700" },
  continueButton: {
    width: 43, height: 43, borderRadius: 22, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  continueArrow: { color: "#1C1B32", fontSize: 32, lineHeight: 37, fontWeight: "600", marginTop: -3 },
  mapToolbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 3,
  },
  mapToolbarCopy: { flex: 1, gap: 3 },
  mapHeading: { color: colors.textBody, fontWeight: "900", fontSize: 10, letterSpacing: 0.9 },
  mapSubheading: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  jumpButton: {
    minHeight: 44, paddingHorizontal: 11, borderRadius: 12, backgroundColor: "#27243D",
    borderWidth: 1, borderColor: "#484162", justifyContent: "center", alignItems: "center",
  },
  jumpText: { color: colors.accentLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  map: { alignSelf: "center", position: "relative", marginTop: 2 },
  pathSvg: { position: "absolute", top: 0, left: 0 },
  stopPosition: { position: "absolute", width: NODE_WIDTH, alignItems: "center" },
  chapterBadge: {
    position: "absolute", top: -28, alignSelf: "center", overflow: "hidden",
    color: "#C9BDFF", fontSize: 10, fontWeight: "900", textAlign: "center",
    lineHeight: 16, letterSpacing: 0.75, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 8, backgroundColor: "#2D2944",
  },
  nodePressable: { width: NODE_WIDTH, alignItems: "center", minHeight: 120 },
  nodeOuter: { width: 74, height: 74, alignItems: "center", justifyContent: "center" },
  activeHalo: {
    position: "absolute", width: 74, height: 74, borderRadius: 37,
    borderColor: "#8C7CDE", borderWidth: 1, backgroundColor: "#25213E",
    transform: [{ scale: 1.15 }],
  },
  node: {
    width: 69, height: 69, borderRadius: 35, borderWidth: 3,
    backgroundColor: "#2B2C45", borderColor: "#6C668A",
    alignItems: "center", justifyContent: "center",
  },
  nodeActive: { borderColor: "#B9A8FF", borderWidth: 4, backgroundColor: "#4B3F79" },
  nodeDone: { borderColor: colors.success, backgroundColor: colors.successSurface },
  nodeLocked: { borderColor: "#373A50", backgroundColor: "#1D2232" },
  nodeNumber: { color: "#F6F0FF", fontSize: 25, lineHeight: 31, fontWeight: "900" },
  nodeCheck: { color: colors.success, fontSize: 34, lineHeight: 40, fontWeight: "800" },
  nodeTitle: {
    color: colors.textBody, fontSize: 12, lineHeight: 17, fontWeight: "800",
    textAlign: "center", marginTop: 7, minHeight: 34,
    textShadowColor: "#0B0D15", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  nodeTitleLocked: { color: "#9298AB" },
  nodeTitleActive: { color: "#C7BCFF" },
  nodeStatus: { color: "#B9A8FF", fontSize: 9, lineHeight: 14, fontWeight: "900", letterSpacing: 0.4 },
  finishedCard: { padding: 16, borderRadius: 17, backgroundColor: colors.successSurface, gap: 5 },
  finishedTitle: { color: colors.success, fontSize: 15, fontWeight: "800" },
  finishedCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  empty: { padding: 20, backgroundColor: colors.surface, borderRadius: 16, gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  devHint: { color: "#E4C486", fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.76 },
});
