import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppScreen } from "../hooks/useLearningApp";
import { colors } from "../theme";

type NavigationTarget = "home" | "progress" | "profile";

type Props = {
  currentScreen: AppScreen;
  onNavigate: (screen: NavigationTarget) => void;
};

type Tab = {
  key: NavigationTarget;
  label: string;
  accessibilityLabel: string;
};

const tabs: Tab[] = [
  { key: "home", label: "Αρχική", accessibilityLabel: "Επιστροφή στην αρχική" },
  { key: "progress", label: "Πρόοδος", accessibilityLabel: "Πρόοδος μαθημάτων και καθημερινών quiz" },
  { key: "profile", label: "Προφίλ", accessibilityLabel: "Το προφίλ μου" },
];

function TabIcon({ name, color }: { name: NavigationTarget; color: string }) {
  if (name === "home") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M3 10.5 12 3l9 7.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (name === "progress") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.8} />
        <Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (name === "profile") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={1.8} />
        <Path d="M5 20v-1.4c0-3.1 2.8-5.1 7-5.1s7 2 7 5.1V20" stroke={color}
          strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  // Exhaustive: only the three visible root tabs have icons.
  return null;
}

function activeTabForScreen(screen: AppScreen): NavigationTarget | null {
  if (["home", "category", "subcategory", "lesson", "quiz", "results", "review"].includes(screen)) return "home";
  if (["progress", "learning-insights", "weekly-review", "knowledge-review"].includes(screen)) return "progress";
  if (["profile", "player-stats", "account"].includes(screen)) return "profile";
  if (screen === "saved") return "profile";
  return null;
}

export default function BottomNavigation({ currentScreen, onNavigate }: Props) {
  const activeTab = activeTabForScreen(currentScreen);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 5) }]}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        const iconColor = selected ? colors.accentLight : colors.textMuted;

        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
            onPress={() => onNavigate(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityState={{ selected }}
          >
            <TabIcon name={tab.key} color={iconColor} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}
              style={[styles.label, selected && styles.labelSelected]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    minHeight: 60,
    paddingHorizontal: 8,
    paddingTop: 6,
    backgroundColor: "#0E111C",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 12,
    paddingHorizontal: 2,
  },
  tabSelected: {
    backgroundColor: "rgba(168, 155, 255, 0.16)",
  },
  tabPressed: {
    opacity: 0.72,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  labelSelected: {
    color: colors.accentLight,
    fontWeight: "800",
  },
});
