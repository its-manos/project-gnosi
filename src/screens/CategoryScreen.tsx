import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ImageSourcePropType } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import FantasyMap from "../components/FantasyMap";
import { colors } from "../theme";
import { getAtlasCategoryProgress, getAtlasRegionProgress } from "../utils/categoryAtlas";

type Props = {
  category: Category;
  subcategories: Subcategory[];
  lessons: Lesson[];
  completedLessonIds: string[];
  inProgressLessonIds: string[];
  progressLoaded: boolean;
  onBack: () => void;
  onOpenSubcategory: (subcategoryId: string, categoryId: string) => void;
};

// This locally bundled artwork is only shown for History's three destinations.
// Other category atlases and Home's knowledge overview keep their SVG treatment.
const HISTORY_ATLAS_IMAGE: ImageSourcePropType =
  require("../../assets/maps/history-midnight-atlas.webp");

const REGION_COLORS = [
  "#7867AA", "#487C79", "#A08051", "#577C9C", "#9B6D86", "#658A75",
];
const REGION_SYMBOLS = ["✦", "✧", "✥", "✺", "✷", "✹"];

export default function CategoryScreen({
  category, subcategories, lessons, completedLessonIds, inProgressLessonIds,
  progressLoaded, onBack, onOpenSubcategory,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const [controlsHeight, setControlsHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [entrance] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(0.975));

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) setReduceMotion(enabled);
    }).catch(() => { if (mounted) setReduceMotion(true); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    entrance.setValue(reduceMotion ? 1 : 0);
    zoom.setValue(reduceMotion ? 1 : 0.975);
    if (reduceMotion) return;
    const animation = Animated.parallel([
      Animated.timing(entrance, { toValue: 1, duration: 230, useNativeDriver: true }),
      Animated.timing(zoom, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [entrance, zoom, category.id, reduceMotion]);

  const categoryProgress = useMemo(
    () => getAtlasCategoryProgress(lessons, category.id, completedLessonIds, progressLoaded),
    [lessons, category.id, completedLessonIds, progressLoaded],
  );
  const mapRegions = useMemo(
    () => subcategories.map((subcategory, index) => {
      const progress = getAtlasRegionProgress(
        lessons, subcategory.id, completedLessonIds, inProgressLessonIds, progressLoaded,
      );
      return {
        id: subcategory.id,
        title: subcategory.title,
        emoji: REGION_SYMBOLS[index % REGION_SYMBOLS.length],
        color: REGION_COLORS[index % REGION_COLORS.length],
        detail: progress.status === "coming-soon" ? "Σύντομα"
          : progress.status === "loading" ? "Φόρτωση…"
          : progress.completed + " / " + progress.total,
        totalLessons: progress.total,
        completedLessons: progress.completed,
        progressLoaded: progressLoaded && progress.total > 0,
        status: progress.status,
      };
    }),
    [subcategories, lessons, completedLessonIds, inProgressLessonIds, progressLoaded],
  );

  const isHistoryAtlas = category.id === "history" && mapRegions.length === 3;
  // Size the overlay to the *remaining* viewport after measured header and
  // map/list controls. The image itself fills the screen independently.
  const frameWidth = Math.max(1, Math.min(520, windowWidth - 28));
  const chromeMeasured = viewportHeight > 0 && navHeight > 0 && headingHeight > 0 && controlsHeight > 0;
  // Insets: content padding (4 + 12), nav gap (10), heading gap (6),
  // control margins (3 + 8), plus 8px rounding/safe-area tolerance.
  const chromeSpacing = 4 + 12 + 10 + 6 + 3 + 8 + 8;
  const usableMapPixels = chromeMeasured
    ? Math.max(0, viewportHeight - navHeight - headingHeight - controlsHeight - chromeSpacing)
    : 0;
  const minMapHeight = Math.floor(usableMapPixels * 360 / frameWidth);
  const fittedMapHeight = chromeMeasured ? Math.max(1, minMapHeight) : undefined;
  // Position the SVG tap targets relative to the full-screen artwork, not to
  // the now-transparent map region (which starts below the screen header).
  const mapTop = 4 + navHeight + 10 + headingHeight + 6 + 3 + controlsHeight + 8;
  const illustrationMetrics = useMemo(() => ({
    screenWidth: windowWidth, screenHeight: viewportHeight,
    mapWidth: frameWidth, mapTop,
  }), [windowWidth, viewportHeight, frameWidth, mapTop]);
  const canScroll = viewportHeight > 0 && contentHeight > viewportHeight + 3;

  return (
    <View style={styles.screenRoot}>
      {isHistoryAtlas ? (
        <>
          <Image testID="history-midnight-atlas-screen-background"
            source={HISTORY_ATLAS_IMAGE} resizeMode="stretch"
            style={styles.screenBackground} pointerEvents="none"
            accessible={false} />
          <View pointerEvents="none" style={styles.historyHeaderShade} />
        </>
      ) : null}
    <ScrollView testID="category-atlas-screen"
      style={[styles.viewport, isHistoryAtlas && styles.historyViewport]}
      contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      scrollEnabled={canScroll} bounces={false} alwaysBounceVertical={false} overScrollMode="never"
      onLayout={event => {
        const next = event.nativeEvent.layout.height;
        setViewportHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
      }}
      onContentSizeChange={(_width, next) => {
        setContentHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
      }}>
      <View style={styles.navBar} onLayout={event => {
        const next = event.nativeEvent.layout.height;
        setNavHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
      }}>
        <Pressable testID="category-atlas-back" style={styles.back} onPress={onBack}
          accessibilityRole="button" accessibilityLabel="Επιστροφή στους κόσμους γνώσης"
          hitSlop={6}>
          <Text style={styles.backLabel}>‹  Κόσμοι</Text>
        </Pressable>
        <Text style={styles.brand} maxFontSizeMultiplier={1.3}>ΓΝΩΣΗ</Text>
        <View style={styles.rightMark} accessible={false}><Text style={styles.sparkle}>✦</Text></View>
      </View>

      <View style={styles.heading} onLayout={event => {
        const next = event.nativeEvent.layout.height;
        setHeadingHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
      }}>
        <View style={styles.headingRow}>
          <Text style={styles.title}>{category.title}</Text>
          <View style={styles.percentBadge} accessible
            accessibilityLabel={progressLoaded
              ? "Ολοκλήρωση κόσμου " + categoryProgress.percent + " τοις εκατό"
              : "Φόρτωση προόδου κόσμου"}>
            <Text style={styles.percentText}>{progressLoaded ? categoryProgress.percent + "%" : "—"}</Text>
          </View>
        </View>
        <View style={styles.progressLine}>
          <Text style={styles.progressCaption}>Πρόοδος</Text>
          <Text style={styles.progressCaption}>{progressLoaded
            ? categoryProgress.completed + " / " + categoryProgress.total + " μαθήματα"
            : "Φόρτωση…"}</Text>
        </View>
        <View testID="category-atlas-progress" style={styles.track}
          accessible accessibilityRole="progressbar"
          accessibilityLabel="Ολοκληρωμένα μαθήματα σε αυτόν τον κόσμο"
          accessibilityValue={{ min: 0, max: Math.max(1, categoryProgress.total),
            now: progressLoaded ? categoryProgress.completed : 0 }}>
          <View style={[styles.trackFill, { width: (progressLoaded ? categoryProgress.percent : 0) + "%" }]} />
        </View>
      </View>

      <Animated.View style={[styles.atlasArea, { opacity: entrance, transform: [{ scale: zoom }] }]}>
        <FantasyMap
          regions={mapRegions}
          illustrated={isHistoryAtlas}
          fitHeight={isHistoryAtlas ? fittedMapHeight : undefined}
          illustrationMetrics={isHistoryAtlas ? illustrationMetrics : undefined}
          minHeight={minMapHeight}
          onControlsHeightChange={next => {
            setControlsHeight(previous => Math.abs(previous - next) < 1 ? previous : next);
          }}
          onSelectRegion={subcategoryId => onOpenSubcategory(subcategoryId, category.id)}
          emptyMessage="Αυτός ο κόσμος δεν έχει ακόμη χαρτογραφημένες περιοχές."
        />
      </Animated.View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, minHeight: 0, overflow: "hidden", backgroundColor: colors.background },
  screenBackground: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  historyHeaderShade: { position: "absolute", top: 0, left: 0, right: 0,
    height: 172, backgroundColor: "rgba(6, 12, 22, 0.24)" },
  historyViewport: { backgroundColor: "transparent" },
  viewport: { flex: 1, backgroundColor: colors.background },
  content: {
    width: "100%", maxWidth: 560, alignSelf: "center",
    paddingHorizontal: 14, paddingTop: 4, paddingBottom: 12,
  },
  navBar: { minHeight: 44, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 10 },
  back: { minWidth: 80, minHeight: 44, justifyContent: "center" },
  backLabel: { color: colors.accentLight, fontSize: 13, lineHeight: 20, fontWeight: "800" },
  brand: { color: colors.accentLight, fontSize: 15, letterSpacing: 2.6,
    fontWeight: "900", textAlign: "center", flexShrink: 1 },
  rightMark: { width: 80, minHeight: 44, justifyContent: "center", alignItems: "flex-end" },
  sparkle: { color: colors.accentLight, fontSize: 23 },
  heading: { gap: 5, marginBottom: 6 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "space-between" },
  title: { flex: 1, color: colors.text, fontSize: 27, lineHeight: 34,
    fontWeight: "900", letterSpacing: -0.45 },
  percentBadge: { backgroundColor: colors.accentSurface, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 12, minWidth: 50, alignItems: "center" },
  percentText: { color: "#C9BCFF", fontSize: 14, fontWeight: "800" },
  progressLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  progressCaption: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  track: { height: 5, borderRadius: 5, backgroundColor: colors.border, overflow: "hidden", marginTop: 3 },
  trackFill: { height: "100%", borderRadius: 5, backgroundColor: colors.accentLight },
  atlasArea: { width: "100%" },
});
