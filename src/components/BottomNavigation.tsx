import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppScreen } from "../hooks/useLearningApp";
import { colors } from "../theme";

type NavigationTarget = "home" | "progress" | "search" | "saved";

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
  { key: "search", label: "Αναζήτηση", accessibilityLabel: "Αναζήτηση μαθημάτων" },
  { key: "saved", label: "Αποθηκευμένα", accessibilityLabel: "Αποθηκευμένα άρθρα" },
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

  if (name === "search") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={10.8} cy={10.8} r={6.8} stroke={color} strokeWidth={1.8} />
        <Path d="m16 16 4.5 4.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3.5h12v17l-6-3.8-6 3.8v-17Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function activeTabForScreen(screen: AppScreen): NavigationTarget | null {
  if (["home", "category", "subcategory", "lesson"].includes(screen)) return "home";
  if (screen === "progress") return "progress";
  if (screen === "search") return "search";
  if (screen === "saved") return "saved";
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
            <Text style={[styles.label, selected && styles.labelSelected]}>
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
    minHeight: 68,
    paddingHorizontal: 12,
    paddingTop: 7,
    backgroundColor: "#0E111C",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  tabSelected: {
    backgroundColor: colors.accentSurface,
  },
  tabPressed: {
    opacity: 0.72,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  labelSelected: {
    color: colors.accentLight,
    fontWeight: "800",
  },
});
