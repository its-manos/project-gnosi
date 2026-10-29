import { useEffect, useMemo, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Category, Lesson, Subcategory } from "../data/lessons";
import AppHeader from "../components/AppHeader";
import FantasyMap from "../components/FantasyMap";
import { colors } from "../theme";

type Props = {
  category: Category;
  subcategories: Subcategory[];
  lessons: Lesson[];
  onBack: () => void;
  onOpenSubcategory: (subcategoryId: string, categoryId: string) => void;
};

const REGION_COLORS = [
  "#7566A8",
  "#477F7C",
  "#A07A4B",
  "#5275A1",
  "#9A5C75",
  "#60866B",
];

export default function CategoryScreen({
  category,
  subcategories,
  lessons,
  onBack,
  onOpenSubcategory,
}: Props) {
  const entrance = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    entrance.setValue(0);
    zoom.setValue(0.88);

    Animated.parallel([
      Animated.timing(entrance, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(zoom, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entrance, zoom, category.id]);

  const mapRegions = useMemo(
    () =>
      subcategories.map((subcategory, index) => {
        const count = lessons.filter(
          (lesson) => lesson.subcategoryId === subcategory.id
        ).length;

        return {
          id: subcategory.id,
          title: subcategory.title,
          emoji: ["✦", "✧", "✥", "✺", "✷", "✹"][index % 6],
          detail: count === 0
            ? "Νέες ανακαλύψεις"
            : count === 1
              ? "1 μάθημα"
              : `${count} μαθήματα`,
          color: REGION_COLORS[index % REGION_COLORS.length],
        };
      }),
    [subcategories, lessons],
  );

  const totalLessons = lessons.filter((lesson) =>
    subcategories.some((subcategory) => subcategory.id === lesson.subcategoryId)
  ).length;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader onBack={onBack} backLabel="ΧΑΡΤΗΣ" />

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>ΕΞΕΡΕΥΝΑΣ ΤΗ ΧΩΡΑ</Text>
        <Text style={styles.title}>{category.title}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>

      <View style={styles.mapHeader}>
        <Text style={styles.mapHeaderTitle}>Οι περιοχές της</Text>
        <Text style={styles.mapHeaderTitleAccent}>{category.title}</Text>
      </View>
      <Text style={styles.hint}>
        Κάθε περιοχή ανοίγει ένα διαφορετικό πεδίο γνώσης.
      </Text>

      <Animated.View
        style={{
          opacity: entrance,
          transform: [{ scale: zoom }],
        }}
      >
        <FantasyMap
          regions={mapRegions}
          onSelectRegion={(subcategoryId) =>
            onOpenSubcategory(subcategoryId, category.id)
          }
          emptyMessage="Αυτή η χώρα δεν έχει ακόμη χαρτογραφημένες περιοχές."
        />
      </Animated.View>

      <View style={styles.footerStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{subcategories.length}</Text>
          <Text style={styles.statLabel}>
            {subcategories.length === 1 ? "ΠΕΡΙΟΧΗ" : "ΠΕΡΙΟΧΕΣ"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalLessons}</Text>
          <Text style={styles.statLabel}>
            {totalLessons === 1 ? "ΜΑΘΗΜΑ" : "ΜΑΘΗΜΑΤΑ"}
          </Text>
        </View>
      </View>

      <View style={styles.mapHint}>
        <Text style={styles.mapHintGlyph}>✧</Text>
        <Text style={styles.mapHintText}>
          Πάτησε πάνω σε μια περιοχή για να τη χαρτογραφήσεις πιο κοντά.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 36,
  },
  heading: { marginBottom: 21 },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  description: {
    color: "#A7ACC1",
    fontSize: 13,
    lineHeight: 20,
  },
  mapHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    alignItems: "baseline",
  },
  mapHeaderTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  mapHeaderTitleAccent: {
    color: colors.accentLight,
    fontSize: 17,
    fontWeight: "800",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    marginBottom: 3,
  },
  footerStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    gap: 26,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: 28,
    marginTop: 1,
    marginBottom: 15,
  },
  stat: { alignItems: "center", gap: 3 },
  statValue: {
    color: colors.accentLight,
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statDivider: { width: 1, height: 27, backgroundColor: colors.border },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    maxWidth: 280,
  },
  mapHintGlyph: { color: colors.accent, fontSize: 20 },
  mapHintText: {
    color: "#758099",
    fontSize: 10,
    lineHeight: 16,
    flex: 1,
    textAlign: "center",
  },
});
