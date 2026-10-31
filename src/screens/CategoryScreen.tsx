import { useEffect, useMemo, useState } from "react";
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
  const [entrance] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(0.88));

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
          detail: count === 0 ? "Σύντομα" : "",
          color: REGION_COLORS[index % REGION_COLORS.length],
        };
      }),
    [subcategories, lessons],
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader onBack={onBack} backLabel="ΧΑΡΤΗΣ" />

      <View style={styles.heading}>
        <Text style={styles.title}>{category.title}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>

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

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 36,
  },
  heading: { marginBottom: 21 },
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
});
