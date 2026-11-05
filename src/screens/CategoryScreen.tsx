import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import FantasyMap from "../components/FantasyMap";
import CategoryAtlasBackground from "../components/CategoryAtlasBackground";
import { MotionView } from "../components/HomeMotion";
import AtlasContinueCard, { atlasContinueStyles } from "../components/AtlasContinueCard";
import { AtlasContinueAccent, AtlasContinueArrow, AtlasProgressFill } from "../components/CategoryAtlasMotion";
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

// Muted slate, violet, bronze and green from the Adventure Path vocabulary.
// These are decorative identities, never lock/progression colors.
const REGION_COLORS = [
  "#6C668A", "#4E6D70", "#90795F", "#526A7D", "#756478", "#5C7769",
];
const REGION_SYMBOLS = ["✦", "✧", "✥", "✺", "✷", "✹"];

// The atlas is free exploration: this choice affects only the shortcut card,
// not the order, access, or placement of any destination.
export function chooseAtlasFeaturedRegion<T extends { id: string; status: string }>(
  regions: T[], lessons: readonly Pick<Lesson, "id" | "subcategoryId">[],
  inProgressLessonIds: readonly string[],
): T | undefined {
  const active = new Set(inProgressLessonIds);
  const inProgressRegionId = [...lessons].reverse()
    .find(lesson => active.has(lesson.id))?.subcategoryId;
  return regions.find(region => region.id === inProgressRegionId && region.status === "in-progress")
    ?? regions.find(region => region.status === "in-progress")
    ?? regions.find(region => region.status === "new")
    ?? regions[0];
}

export default function CategoryScreen({
  category, subcategories, lessons, completedLessonIds, inProgressLessonIds,
  progressLoaded, onBack, onOpenSubcategory,
}: Props) {
  const [mapViewport, setMapViewport] = useState({ width: 0, height: 0 });
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
  const categoryLessons = useMemo(
    () => lessons.filter(lesson => lesson.categoryId === category.id),
    [lessons, category.id],
  );
  const featuredRegion = useMemo(
    () => chooseAtlasFeaturedRegion(mapRegions, categoryLessons, inProgressLessonIds),
    [mapRegions, categoryLessons, inProgressLessonIds],
  );
  const hasProgress = featuredRegion?.status === "in-progress";
  const featuredPercent = featuredRegion?.totalLessons
    ? Math.round(featuredRegion.completedLessons / featuredRegion.totalLessons * 100) : 0;

  return (
    <View testID="category-atlas-screen" style={styles.screen}>
      <MotionView entranceDelay={0} testID="category-atlas-header" style={styles.navigationHeader}>
        <Pressable testID="category-atlas-back" onPress={onBack} style={styles.backButton}
          accessibilityRole="button" accessibilityLabel="Επιστροφή στους κόσμους γνώσης"
          hitSlop={8}>
          <Text style={styles.backText}>‹ ΠΙΣΩ</Text>
        </Pressable>
        <Text testID="category-atlas-title" style={styles.categoryTitle}
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {category.title.toLocaleUpperCase("el-GR")}
        </Text>
        <View style={styles.headerMark} accessible={false}>
          <Text style={styles.sparkle}>✦</Text>
        </View>
      </MotionView>

      {featuredRegion ? (
        <AtlasContinueCard key={category.id} testID="category-atlas-continue"
          entranceDelay={75} pressScale={0.983}
          disabled={!progressLoaded}
          accessibilityRole="button"
          accessibilityState={{ disabled: !progressLoaded }}
          accessibilityLabel={progressLoaded
            ? (hasProgress ? "Συνέχισε: " : "Εξερεύνησε: ") + featuredRegion.title
            : "Φόρτωση προόδου κατηγορίας"}
          onPress={() => {
            if (progressLoaded) onOpenSubcategory(featuredRegion.id, category.id);
          }}>
          <AtlasContinueAccent />
          <View style={atlasContinueStyles.heading}>
            <Text style={styles.cardCategory} numberOfLines={1}>Η ΠΡΟΟΔΟΣ ΣΟΥ</Text>
            <Text style={styles.categoryCount} testID="category-atlas-category-progress">
              {progressLoaded ? categoryProgress.completed + " / " + categoryProgress.total : "— / " + categoryProgress.total}
            </Text>
          </View>
          <View style={atlasContinueStyles.body}>
            <View style={atlasContinueStyles.copy}>
              <Text style={atlasContinueStyles.eyebrow}>
                {!progressLoaded ? "ΦΟΡΤΩΣΗ ΠΡΟΟΔΟΥ" :
                  hasProgress ? "ΣΥΝΕΧΙΣΕ ΤΗΝ ΕΞΕΡΕΥΝΗΣΗ" :
                  featuredRegion.status === "complete" ? "ΟΛΟΚΛΗΡΩΜΕΝΗ ΠΕΡΙΟΧΗ" :
                  "ΕΞΕΡΕΥΝΗΣΕ ΜΙΑ ΠΕΡΙΟΧΗ"}
              </Text>
              <Text style={atlasContinueStyles.title} numberOfLines={2}>{featuredRegion.title}</Text>
            </View>
            <View style={atlasContinueStyles.action} accessible={false}>
              <AtlasContinueArrow />
            </View>
          </View>
          <View style={styles.progressSummary}>
            <Text style={styles.progressCaption}>Πρόοδος περιοχής</Text>
            <Text style={styles.progressCaption}>{progressLoaded
              ? featuredRegion.completedLessons + " / " + featuredRegion.totalLessons + " μαθήματα"
              : "Φόρτωση…"}</Text>
          </View>
          <View testID="category-atlas-progress" style={atlasContinueStyles.progressTrack}
            accessible accessibilityRole="progressbar"
            accessibilityLabel={"Πρόοδος περιοχής " + featuredRegion.title}
            accessibilityValue={{ min: 0, max: Math.max(1, featuredRegion.totalLessons),
              now: progressLoaded ? featuredRegion.completedLessons : 0 }}>
            <AtlasProgressFill percent={progressLoaded ? featuredPercent : 0} />
          </View>
        </AtlasContinueCard>
      ) : null}

      <View testID="category-atlas-map-viewport" style={styles.mapViewport}
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout;
          if (width <= 0 || height <= 0) return;
          setMapViewport(previous => Math.abs(previous.width - width) < 1 &&
            Math.abs(previous.height - height) < 1 ? previous : { width, height });
        }}>
        {/* Static cartography is independent of the map's interaction tree. */}
        {mapViewport.width > 0 && mapViewport.height > 0 ? (
          <CategoryAtlasBackground width={mapViewport.width} height={mapViewport.height}
            regionCount={mapRegions.length} />
        ) : null}
        {/* Mount destinations alongside the chart on both platforms. The
            background must never appear as an empty map while waiting for
            card animation callbacks or a second delayed reveal. */}
        {mapViewport.width > 0 && mapViewport.height > 0 ? (
          <View key={category.id} testID="category-atlas-map-entrance"
            style={styles.mapEntrance}>
            <FantasyMap
              regions={mapRegions}
              fitViewport={mapViewport}
              hideControls externalBackground
              onSelectRegion={subcategoryId => onOpenSubcategory(subcategoryId, category.id)}
              emptyMessage="Αυτός ο κόσμος δεν έχει ακόμη χαρτογραφημένες περιοχές."
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, minHeight: 0, width: "100%", maxWidth: 720, alignSelf: "center",
    paddingHorizontal: 20, paddingTop: 6, gap: 9, backgroundColor: "#101827",
    overflow: "hidden",
  },
  navigationHeader: {
    minHeight: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  backButton: { width: 66, minHeight: 44, justifyContent: "center" },
  backText: { color: colors.accentLight, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  categoryTitle: {
    flex: 1, textAlign: "center", color: colors.accentLight,
    fontSize: 19, lineHeight: 25, fontWeight: "900", letterSpacing: 1.4,
  },
  headerMark: { width: 66, minHeight: 44, justifyContent: "center", alignItems: "flex-end" },
  sparkle: { color: colors.accentLight, fontSize: 22 },
  cardCategory: {
    flex: 1, color: colors.accentLight, fontSize: 13, lineHeight: 19,
    fontWeight: "900", letterSpacing: 0.15,
  },
  categoryCount: { color: "#C9C3E0", fontSize: 12, fontWeight: "900" },
  progressSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressCaption: { color: colors.textMuted, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  mapViewport: {
    flex: 1, minHeight: 0, width: "100%", overflow: "hidden",
    marginBottom: 8, borderTopWidth: 1, borderColor: "#25273A",
  },
  // Keep the interactive SVG at its measured size; card motion never blocks
  // island mounting or animates the full SVG and its touch geometry.
  mapEntrance: { width: "100%" },
});
