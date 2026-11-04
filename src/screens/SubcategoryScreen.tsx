import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, cancelAnimation, scrollTo, useAnimatedReaction, useAnimatedRef,
  useSharedValue, withTiming } from "react-native-reanimated";
import type { ScrollViewInstance } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import { colors } from "../theme";
import AdventureAtlasBackground from "../components/AdventureAtlasBackground";
import { AdventureActiveHalo, AdventureContinueAccent, AdventureContinueArrow, AdventureProgressFill } from "../components/AdventureMotion";
import { MotionCounter, MotionIcon, MotionPressable, MotionView } from "../components/HomeMotion";
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
// Chapter markers need clearance for three-line Greek titles,
// but no longer need room for a redundant status caption.
const CHAPTER_GAP = 40;
const NODE_WIDTH = 148;
const MAP_BOTTOM_PADDING = 32;

export function getAdventureEntryOffset(
  chapterY: number, mapHeight: number, viewportHeight: number,
) {
  const maxScroll = Math.max(0, mapHeight + MAP_BOTTOM_PADDING - viewportHeight);
  // Leave enough room above the focused checkpoint for its label or chapter marker.
  return Math.min(maxScroll, Math.max(0, chapterY - 112));
}

// Keep the established, correctly aligned current-lesson destination.
export function getAdventureCurrentOffset(
  checkpointY: number, mapHeight: number, viewportHeight: number,
) {
  return getAdventureEntryOffset(checkpointY + 12, mapHeight, viewportHeight);
}

// Slower native-thread glide, without frame-by-frame JavaScript scroll commands.
export function getAdventureScrollDuration(distance: number) {
  return Math.round(Math.min(5200, Math.max(1500, Math.abs(distance) * 1.25)));
}

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
  const scrollRef = useAnimatedRef<ScrollViewInstance>();
  const scrollPosition = useSharedValue(0);
  useAnimatedReaction(
    () => scrollPosition.value,
    y => { scrollTo(scrollRef, 0, y, false); },
  );
  const [mapViewportHeight, setMapViewportHeight] = useState(0);
  const [mapContentHeight, setMapContentHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [atlasSize, setAtlasSize] = useState<{ width: number; height: number } | null>(null);
  const autoFocusedRef = useRef<string | null>(null);
  const userInteractedRef = useRef(false);
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
  // Labels can extend slightly past the 148pt checkpoint touch target without
  // crossing the map edge, even in the outermost 27% / 72% lanes.
  const labelWidth = Math.min(170, mapWidth * 0.51);
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

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => { if (mounted) setReduceMotion(enabled); })
      .catch(() => { if (mounted) setReduceMotion(true); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  // Animate on the UI thread; keep the same landing point that already
  // works, while allowing a slower, explicit duration.
  const scrollToCurrent = (animated: boolean) => {
    const focusIndex = nextIndex >= 0 ? nextIndex : path.length - 1;
    if (focusIndex < 0 || !points[focusIndex]) return;
    const target = getAdventureCurrentOffset(
      points[focusIndex].y, mapHeight, mapViewportHeight,
    );
    scrollPosition.value = animated
      ? withTiming(target, {
        duration: getAdventureScrollDuration(target - scrollPosition.value),
        easing: Easing.inOut(Easing.cubic),
      })
      : target;
  };

  // The Continue card stays pinned. After progress and map measurements are
  // ready, focus once on the next checkpoint. Dragging before hydration wins.
  useEffect(() => {
    if (!progressLoaded || reduceMotion === null || !mapViewportHeight ||
      mapContentHeight < mapViewportHeight ||
      mapContentHeight + 2 < mapHeight + MAP_BOTTOM_PADDING ||
      !points.length ||
      autoFocusedRef.current === subcategory.id || userInteractedRef.current) return;
    autoFocusedRef.current = subcategory.id;
    scrollToCurrent(!reduceMotion);
  }, [progressLoaded, reduceMotion, mapViewportHeight, mapContentHeight,
    subcategory.id, nextIndex, mapHeight, path.length]);

  return (
    <View testID="subcategory-adventure-path" style={styles.screen}>
      <MotionView entranceDelay={0} testID="adventure-category-header" style={styles.navigationHeader}>
        <MotionPressable testID="adventure-back" pressScale={0.95} onPress={onBack} style={styles.backButton}
          accessibilityRole="button" accessibilityLabel="Επιστροφή στην κατηγορία"
          hitSlop={8}>
          <Text style={styles.backText}>‹ ΠΙΣΩ</Text>
        </MotionPressable>
        <Text testID="adventure-category-title" style={styles.categoryTitle}
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {category.title.toLocaleUpperCase("el-GR")}
        </Text>
        <View style={styles.headerMark} accessible={false}>
          <MotionIcon index={0}><Text style={styles.sparkle}>✦</Text></MotionIcon>
        </View>
      </MotionView>

      {path.length > 0 ?
        <MotionPressable entranceDelay={70} testID="adventure-continue"
          style={styles.continueCard}
          onPress={() => { if (progressLoaded && nextLesson) onOpenLesson(nextLesson.id); }}
          disabled={!progressLoaded || !nextLesson} accessibilityRole="button"
          accessibilityState={{ disabled: !progressLoaded || !nextLesson }}
          accessibilityLabel={progressLoaded && nextLesson
            ? "Συνέχισε τη διαδρομή: " + nextLesson.title
            : "Πρόοδος διαδρομής: " + subcategory.title}>
          {progressLoaded && nextLesson ? <AdventureContinueAccent /> : null}
          <View style={styles.cardHeading}>
            <Text style={styles.subcategoryTitle} numberOfLines={1}>{subcategory.title}</Text>
            <MotionCounter progressKey={progressLoaded ? completed + "/" + path.length : "loading"}
              style={styles.progressCount}>{progressLoaded
                ? completed + " / " + path.length : "— / " + path.length}</MotionCounter>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.continueCopy}>
              <Text style={styles.continueEyebrow}>
                {!progressLoaded ? "ΦΟΡΤΩΣΗ ΠΡΟΟΔΟΥΣ" :
                  nextLesson ? "ΕΠΟΜΕΝΟΣ ΣΤΑΘΜΟΣ" : "ΔΙΑΔΡΟΜΗ ΟΛΟΚΛΗΡΩΜΕΝΗ"}
              </Text>
              <Text style={styles.continueTitle} numberOfLines={2}>
                {!progressLoaded ? "Ο χάρτης σου ετοιμάζεται…" :
                  nextLesson ? nextLesson.title : "Εξερεύνησες όλους τους σταθμούς!"}
              </Text>
            </View>
            {progressLoaded && nextLesson ?
              <View style={styles.continueButton}><AdventureContinueArrow /></View>
              : null}
          </View>
          <View testID="adventure-progress" style={styles.progressTrack}
            accessible accessibilityRole="progressbar" accessibilityLabel="Πρόοδος διαδρομής"
            accessibilityValue={{ min: 0, max: Math.max(1, path.length),
              now: progressLoaded ? completed : 0 }}>
            <AdventureProgressFill percent={progressLoaded ? progressPercent : 0} />
          </View>
        </MotionPressable> : null}

      {isTesting && path.length > 1 ?
        <Text style={styles.devHint}>Δοκιμή: όλοι οι σταθμοί ξεκλείδωτοι.</Text> : null}

      {/* Do not animate the whole fixed viewport, SVG, scroll container and
          30 checkpoint subtrees as one large surface. Continue, header and
          the active checkpoint retain their smaller entrance/motion cues. */}
      {path.length === 0 ?
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Νέες αποστολές έρχονται</Text>
          <Text style={styles.finishedCopy}>Εξερεύνησε έναν άλλο κόσμο μέχρι τότε.</Text>
        </View> :
        <View testID="adventure-map-viewport" style={styles.mapViewport}
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            if (width <= 0 || height <= 0) return;
            setAtlasSize(previous => previous &&
              Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1
              ? previous : { width, height });
          }}>
          {/* The atlas is fixed within the map viewport, not in the scrollable path. */}
          <View testID="adventure-atlas-underlay" pointerEvents="none"
            accessible={false} style={styles.atlasUnderlay}>
            {atlasSize && atlasSize.width > 0 && atlasSize.height > 0 ?
              <AdventureAtlasBackground width={atlasSize.width} height={atlasSize.height} /> : null}
          </View>
          <Animated.ScrollView ref={scrollRef} testID="adventure-map-scroll"
            style={styles.mapScroll} contentContainerStyle={styles.mapScrollContent}
            showsVerticalScrollIndicator={false} bounces={false}
            alwaysBounceVertical={false} overScrollMode="never"
            onLayout={event => {
              const height = event.nativeEvent.layout.height;
              setMapViewportHeight(previous => Math.abs(previous - height) < 1 ? previous : height);
            }}
            onContentSizeChange={(_width, height) => {
              setMapContentHeight(previous => Math.abs(previous - height) < 1 ? previous : height);
            }}
            onScrollBeginDrag={() => { userInteractedRef.current = true; cancelAnimation(scrollPosition); }}>
            <View testID="adventure-map" style={[styles.map, { width: mapWidth, height: mapHeight }]}>
          <Svg width={mapWidth} height={mapHeight} style={styles.pathSvg} pointerEvents="none">
            {/* An engraved double stroke keeps the path visible on sea and land.
                The short glow is static: no per-segment animations or extra layers. */}
            {segments.map((segment, index) => (
              <Path key={"route-etch-" + index} d={segment.d} fill="none"
                stroke="#BBA889" strokeWidth={17} strokeLinecap="round" opacity={0.16} />
            ))}
            {segments.map((segment, index) => (
              <Path key={"route-base-" + index} d={segment.d} fill="none"
                stroke="#101929" strokeWidth={13} strokeLinecap="round" opacity={0.94} />
            ))}
            {segments.map((segment, index) =>
              segment.done || segment.toNext ?
                <Path key={"route-halo-" + index} d={segment.d} fill="none"
                  stroke={segment.done ? "#3F9A7C" : "#AD9FFB"} strokeWidth={8}
                  strokeLinecap="round" opacity={segment.done ? 0.20 : 0.25} /> : null)}
            {segments.map((segment, index) => (
              <Path key={"route-line-" + index} d={segment.d} fill="none"
                stroke={segment.done ? "#2E9A7E" : segment.toNext ? "#A89BFF" : "#82778F"}
                strokeWidth={segment.done ? 4.5 : segment.toNext ? 3.5 : 2.8}
                strokeLinecap="round"
                strokeDasharray={segment.done ? undefined : "3 11"}
                opacity={segment.done ? 0.96 : segment.toNext ? 1 : 0.78} />
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
            // Locked destinations have no press feedback. On Android they
            // should not each mount Reanimated shared values, worklets and
            // entrance bookkeeping inside a long scrollable path.
            const NodePressable = Platform.OS === "android" && disabled
              ? Pressable : MotionPressable;
            return (
              <View key={lesson.id} style={[styles.stopPosition, {
                left: point.x - NODE_WIDTH / 2, top: point.y - 36,
              }]}>
                {chapter ? <Text style={styles.chapterBadge}>{chapter}</Text> : null}
                <NodePressable pressScale={0.96} testID={"adventure-node-" + lesson.id}
                  style={styles.nodePressable}
                  onPress={() => onOpenLesson(lesson.id)} disabled={disabled}
                  accessibilityRole="button" accessibilityState={{ disabled }}
                  accessibilityLabel={lesson.title + (done ? ", ολοκληρωμένο" : started ? ", σε εξέλιξη"
                    : disabled ? ", κλειδωμένο. Ολοκλήρωσε πρώτα " +
                      (access.prerequisite?.title ?? "το προηγούμενο μάθημα")
                      : ", διαθέσιμο")}>
                  <View style={[styles.nodeOuter, done && styles.nodeOuterDone,
                    active && styles.nodeOuterActive, disabled && styles.nodeOuterLocked]}>
                    {active ? <AdventureActiveHalo /> : null}
                    <View style={[styles.node, done && styles.nodeDone, active && styles.nodeActive,
                      disabled && styles.nodeLocked]}>
                      {/* A single stationary engraved inset per medal. No new SVG or animation. */}
                      {done || disabled ?
                        <View pointerEvents="none" accessible={false}
                          style={[styles.nodeInset, done && styles.nodeInsetDone,
                            disabled && styles.nodeInsetLocked]} /> : null}
                      {done ? <Text style={styles.nodeCheck}>✓</Text>
                        : disabled ? <Svg width={23} height={25} viewBox="0 0 24 24">
                          <Path d="M6.5 10V7.5a5.5 5.5 0 0 1 11 0V10M5.5 10h13v10h-13z"
                            stroke="#8993A8" strokeWidth={1.8} strokeLinejoin="round" fill="none" />
                          <Circle cx={12} cy={15} r={1.4} fill="#8993A8" />
                        </Svg>
                          : <Text style={styles.nodeNumber}>{index + 1}</Text>}
                    </View>
                  </View>
                  <Text testID={"adventure-label-" + lesson.id}
                    style={[styles.nodeTitle, { width: labelWidth },
                      disabled && styles.nodeTitleLocked, active && styles.nodeTitleActive]}
                    numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.85}>
                    {lesson.title}
                  </Text>
                </NodePressable>
              </View>
            );
          })}
            </View>
          </Animated.ScrollView>
        </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, minHeight: 0, width: "100%", maxWidth: 720,
    alignSelf: "center", paddingHorizontal: 20, paddingTop: 6, gap: 9,
    backgroundColor: "#101827", overflow: "hidden",
  },
  atlasUnderlay: { ...StyleSheet.absoluteFill },
  mapViewport: {
    flex: 1, minHeight: 0, position: "relative", overflow: "hidden",
    // A small outside gap separates the atlas from the fixed bottom navigation.
    // Margin (not padding) keeps the atlas and scroll bounds aligned to the viewport.
    marginBottom: 8,
    backgroundColor: "#101827",
    borderTopWidth: 1, borderColor: "#25273A",
  },
  mapScroll: { flex: 1 },
  mapScrollContent: { alignItems: "center", paddingBottom: MAP_BOTTOM_PADDING },
  navigationHeader: {
    minHeight: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  backButton: { width: 66, minHeight: 44, justifyContent: "center" },
  backText: { color: colors.accentLight, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  categoryTitle: {
    flex: 1, textAlign: "center", color: colors.accentLight,
    fontSize: 19, lineHeight: 25, fontWeight: "900", letterSpacing: 1.4,
  },
  headerMark: { width: 66, minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  sparkle: { color: colors.accentLight, fontSize: 22 },
  continueCard: {
    paddingHorizontal: 15, paddingTop: 12, paddingBottom: 13,
    backgroundColor: "#1B2034", borderColor: "#6A618C",
    borderWidth: 1, borderRadius: 18, gap: 8,
  },
  cardHeading: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  subcategoryTitle: {
    flex: 1, color: colors.accentLight, fontSize: 14,
    fontWeight: "900", lineHeight: 19,
  },
  progressCount: { color: "#C9C3E0", fontSize: 12, fontWeight: "900" },
  cardBody: { flexDirection: "row", alignItems: "center", gap: 10 },
  continueCopy: { flex: 1, gap: 3 },
  continueEyebrow: {
    color: "#ABA1D4", fontSize: 9, lineHeight: 14, fontWeight: "900", letterSpacing: 0.8,
  },
  continueTitle: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  continueButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
    borderWidth: 1, borderColor: "#C9BFFF",
    alignItems: "center", justifyContent: "center",
  },
  progressTrack: {
    height: 8, borderRadius: 5, backgroundColor: "#302F4B", overflow: "hidden",
    borderWidth: 1, borderColor: "#62597D",
  },
  map: { alignSelf: "center", position: "relative", marginTop: 2 },
  pathSvg: { position: "absolute", top: 0, left: 0 },
  stopPosition: { position: "absolute", width: NODE_WIDTH, alignItems: "center" },
  chapterBadge: {
    position: "absolute", top: -28, alignSelf: "center", overflow: "hidden",
    // Warm engraved chapter markers distinguish milestones from violet lessons.
    color: "#E3CEAA", fontSize: 10, fontWeight: "900", textAlign: "center",
    lineHeight: 16, letterSpacing: 0.9, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 8, borderWidth: 0.75, borderColor: "#90795F",
    backgroundColor: "#24263B",
  },
  nodePressable: { width: NODE_WIDTH, alignItems: "center", minHeight: 120 },
  nodeOuter: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: "center", justifyContent: "center",
  },
  // Completed stations resemble aged bronze seals, with a green core so
  // completion remains identifiable without depending on metal color alone.
  nodeOuterDone: { borderWidth: 1.5, borderColor: "#AE9671", backgroundColor: "#262D32" },
  // The current stop gets a single stationary outer outline from the halo.
  // Do not stack a third opaque ring on the fixed-size outer wrapper.
  nodeOuterActive: { backgroundColor: "transparent" },
  nodeOuterLocked: { borderWidth: 1, borderColor: "#41495C", backgroundColor: "#18212F" },
  node: {
    width: 69, height: 69, borderRadius: 35, borderWidth: 3,
    backgroundColor: "#2B2C45", borderColor: "#6C668A",
    alignItems: "center", justifyContent: "center",
  },
  nodeDone: { borderWidth: 2, borderColor: "#BBA27C", backgroundColor: "#254339" },
  nodeActive: { borderWidth: 3, borderColor: "#C5B7FF", backgroundColor: "#4B3F79" },
  nodeLocked: { borderWidth: 2, borderColor: "#485166", backgroundColor: "#222938" },
  nodeInset: {
    position: "absolute", top: 7, right: 7, bottom: 7, left: 7,
    borderRadius: 28, borderWidth: 1,
  },
  nodeInsetDone: { borderColor: "#A8916B", opacity: 0.68 },
  nodeInsetLocked: { borderColor: "#5F687B", opacity: 0.32 },
  nodeNumber: { color: "#F6F0FF", fontSize: 25, lineHeight: 31, fontWeight: "900" },
  nodeCheck: { color: "#C1EDD3", fontSize: 34, lineHeight: 40, fontWeight: "800" },
  nodeTitle: {
    color: colors.textBody, fontSize: 12, lineHeight: 16, fontWeight: "800",
    textAlign: "center", marginTop: 5,
    // Contrast comes from the shadow, not a large dark rectangle covering the atlas.
    textShadowColor: "#020713", textShadowRadius: 7, textShadowOffset: { width: 0, height: 1 },
  },
  nodeTitleLocked: { color: "#9298AB" },
  nodeTitleActive: { color: "#C7BCFF" },
  finishedCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  empty: { padding: 20, backgroundColor: colors.surface, borderRadius: 16, gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  devHint: { color: "#E4C486", fontSize: 11, lineHeight: 17 },
});
