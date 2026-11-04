import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

const REGION_COLORS = [
  "#7867AA", "#487C79", "#A08051", "#577C9C", "#9B6D86", "#658A75",
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
  const featuredRegion = useMemo(
    () => chooseAtlasFeaturedRegion(mapRegions,
      lessons.filter(lesson => lesson.categoryId === category.id), inProgressLessonIds),
    [mapRegions, lessons, category.id, inProgressLessonIds],
  );
  const hasProgress = featuredRegion?.status === "in-progress";
  const featuredPercent = featuredRegion?.totalLessons
    ? Math.round(featuredRegion.completedLessons / featuredRegion.totalLessons * 100) : 0;

  return (
    <View testID="category-atlas-screen" style={styles.screen}>
      <View style={styles.navigationHeader}>
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
      </View>

      {featuredRegion ? (
        <Pressable testID="category-atlas-continue" style={styles.continueCard}
          disabled={!progressLoaded}
          accessibilityRole="button"
          accessibilityState={{ disabled: !progressLoaded }}
          accessibilityLabel={progressLoaded
            ? (hasProgress ? "Συνέχισε: " : "Εξερεύνησε: ") + featuredRegion.title
            : "Φόρτωση προόδου κατηγορίας"}
          onPress={() => {
            if (progressLoaded) onOpenSubcategory(featuredRegion.id, category.id);
          }}>
          <View style={styles.cardHeading}>
            <Text style={styles.cardCategory} numberOfLines={1}>Η ΠΡΟΟΔΟΣ ΣΟΥ</Text>
            <Text style={styles.categoryCount} testID="category-atlas-category-progress">
              {progressLoaded ? categoryProgress.completed + " / " + categoryProgress.total : "— / " + categoryProgress.total}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardCopy}>
              <Text style={styles.cardEyebrow}>
                {!progressLoaded ? "ΦΟΡΤΩΣΗ ΠΡΟΟΔΟΥ" :
                  hasProgress ? "ΣΥΝΕΧΙΣΕ ΤΗΝ ΕΞΕΡΕΥΝΗΣΗ" :
                  featuredRegion.status === "complete" ? "ΟΛΟΚΛΗΡΩΜΕΝΗ ΠΕΡΙΟΧΗ" :
                  "ΕΞΕΡΕΥΝΗΣΕ ΜΙΑ ΠΕΡΙΟΧΗ"}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{featuredRegion.title}</Text>
            </View>
            <View style={styles.cardAction} accessible={false}>
              <Text style={styles.cardArrow}>↗</Text>
            </View>
          </View>
          <View style={styles.progressSummary}>
            <Text style={styles.progressCaption}>Πρόοδος περιοχής</Text>
            <Text style={styles.progressCaption}>{progressLoaded
              ? featuredRegion.completedLessons + " / " + featuredRegion.totalLessons + " μαθήματα"
              : "Φόρτωση…"}</Text>
          </View>
          <View testID="category-atlas-progress" style={styles.progressTrack}
            accessible accessibilityRole="progressbar"
            accessibilityLabel={"Πρόοδος περιοχής " + featuredRegion.title}
            accessibilityValue={{ min: 0, max: Math.max(1, featuredRegion.totalLessons),
              now: progressLoaded ? featuredRegion.completedLessons : 0 }}>
            <View style={[styles.progressFill, {
              width: (progressLoaded ? featuredPercent : 0) + "%",
            }]} />
          </View>
        </Pressable>
      ) : null}

      <View testID="category-atlas-map-viewport" style={styles.mapViewport}
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout;
          if (width <= 0 || height <= 0) return;
          setMapViewport(previous => Math.abs(previous.width - width) < 1 &&
            Math.abs(previous.height - height) < 1 ? previous : { width, height });
        }}>
        <FantasyMap
          regions={mapRegions}
          fitViewport={mapViewport.width && mapViewport.height ? mapViewport : undefined}
          onSelectRegion={subcategoryId => onOpenSubcategory(subcategoryId, category.id)}
          emptyMessage="Αυτός ο κόσμος δεν έχει ακόμη χαρτογραφημένες περιοχές."
        />
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
    fontSize: 19, lineHeight: 25, fontWeight: "900", letterSpacing: 1.2,
  },
  headerMark: { width: 66, minHeight: 44, justifyContent: "center", alignItems: "flex-end" },
  sparkle: { color: colors.accentLight, fontSize: 22 },
  continueCard: {
    paddingHorizontal: 15, paddingTop: 11, paddingBottom: 12,
    backgroundColor: "#1B2034", borderColor: "#6A618C",
    borderWidth: 1, borderRadius: 18, gap: 7,
  },
  cardHeading: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  cardCategory: {
    flex: 1, color: "#ABA1D4", fontSize: 11, lineHeight: 17,
    fontWeight: "900", letterSpacing: 0.8,
  },
  categoryCount: { color: "#C9C3E0", fontSize: 12, fontWeight: "900" },
  cardBody: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardCopy: { flex: 1, gap: 2 },
  cardEyebrow: {
    color: "#ABA1D4", fontSize: 9, lineHeight: 14, fontWeight: "900", letterSpacing: 0.8,
  },
  cardTitle: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  cardAction: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent,
    borderWidth: 1, borderColor: "#C9BFFF", alignItems: "center", justifyContent: "center",
  },
  cardArrow: { color: "#171B2A", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  progressSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressCaption: { color: "#ADAFC4", fontSize: 10, lineHeight: 14, fontWeight: "700" },
  progressTrack: {
    height: 8, borderRadius: 5, backgroundColor: "#302F4B", overflow: "hidden",
    borderWidth: 1, borderColor: "#62597D",
  },
  progressFill: {
    height: "100%", borderRadius: 5, backgroundColor: colors.accentLight,
  },
  mapViewport: {
    flex: 1, minHeight: 0, width: "100%", overflow: "hidden",
    marginBottom: 8, borderTopWidth: 1, borderColor: "#25273A",
  },
});
