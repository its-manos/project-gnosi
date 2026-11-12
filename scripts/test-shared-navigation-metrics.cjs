/* Shared navigation and metric primitives preserve existing touch, sizing and motion contracts. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { load } = require("./helpers/load-typescript.cjs");
const jsx = (type, props) => ({ type, props });
const nodes = node => node && typeof node === "object"
  ? [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)] : [];
const shared = {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": { Pressable: "Pressable", Text: "Text", View: "View", StyleSheet: { create: x => x } },
  "./HomeMotion": { MotionPressable: "MotionPressable", MotionView: "MotionView" },
  "../theme": { colors: { text: "#F3F0E8", textMuted: "#ABB0C1", accentLight: "#B1A5FF",
    surface: "#151928", border: "#2B3044" } },
};
const NavigationTile = load("src/components/NavigationTile.tsx", shared).default;
const MetricCard = load("src/components/MetricCard.tsx", shared).default;
const callbacks = [];
const shortcut = NavigationTile({
  title: "Δραστηριότητα", subtitle: "Στατιστικά & quiz", icon: jsx("ClockIcon", {}),
  onPress: () => callbacks.push("activity"), testID: "profile-activity-link",
});
assert.equal(shortcut.type, "Pressable", "Profile shortcut stays a lightweight native Pressable");
assert.equal(shortcut.props.accessibilityRole, "button");
assert.equal(shortcut.props.testID, "profile-activity-link");
assert.equal(shortcut.props.accessibilityLabel, "Δραστηριότητα. Στατιστικά & quiz");
assert.equal(shortcut.props.style({ pressed: false })[1].minHeight, 58);
assert.equal(shortcut.props.style({ pressed: false })[1].borderRadius, 15);
assert.equal(shortcut.props.style({ pressed: true })[2].backgroundColor, "#2D304A");
shortcut.props.onPress();
assert.deepEqual(callbacks, ["activity"]);
const shortcutTitle = nodes(shortcut).find(n => n.type === "Text" && n.props?.children === "Δραστηριότητα");
assert.equal(shortcutTitle.props.numberOfLines, 1);
assert.equal(shortcutTitle.props.adjustsFontSizeToFit, true);

const titleOnly = NavigationTile({
  title: "Ενδιαφέροντα", icon: jsx("SparkleIcon", {}), onPress: () => {},
});
assert.equal(titleOnly.props.accessibilityLabel, "Ενδιαφέροντα");
const titleOnlyText = nodes(titleOnly).find(n => n.props?.children === "Ενδιαφέροντα");
assert.equal(titleOnlyText.props.numberOfLines, 1);
assert.equal(titleOnlyText.props.adjustsFontSizeToFit, true);
assert.ok(!nodes(titleOnly).some(n => n.type === "Text" && n.props?.children === undefined));

const settings = NavigationTile({
  title: "Εμπειρία μάθησης", subtitle: "Ήχος και κίνηση", icon: jsx("SparkleIcon", {}),
  onPress: () => callbacks.push("settings"), variant: "settings",
  entranceDelay: 110, iconBackground: "#82C4C716",
});
assert.equal(settings.type, "MotionPressable", "Settings retains its reduced-motion-aware entry");
assert.equal(settings.props.entranceDelay, 110);
assert.equal(settings.props.pressScale, 0.983);
assert.equal(settings.props.accessibilityRole, "button");
assert.equal(settings.props.accessibilityLabel, "Εμπειρία μάθησης");
assert.equal(settings.props.style[1].minHeight, 75);
assert.equal(settings.props.style[1].borderRadius, 17);
const iconShell = nodes(settings).find(n => n.type === "View");
assert.equal(iconShell.props.style[1].width, 44);
assert.equal(iconShell.props.style[2].backgroundColor, "#82C4C716");
settings.props.onPress();
assert.deepEqual(callbacks, ["activity", "settings"]);

for (const [variant, minHeight, color] of [
  ["profile", 85, "#192A3B"], ["dashboard", 62, "#20243C"],
  ["streak", 83, "#151928"], ["standard", undefined, "#151928"],
]) {
  const card = MetricCard({ variant, children: "metric" });
  assert.equal(card.type, "View", variant + " stays static without an entry delay");
  assert.equal(card.props.style[1].minHeight, minHeight);
  assert.equal(card.props.style[1].backgroundColor, color);
  assert.equal(card.props.children, "metric");
}
const animated = MetricCard({ variant: "dashboard", entranceDelay: 145,
  style: { opacity: 1 }, children: "summary" });
assert.equal(animated.type, "MotionView", "Dashboard metric retains native entrance");
assert.equal(animated.props.entranceDelay, 145);
assert.equal(animated.props.style[1].minWidth, 88);
assert.equal(animated.props.style[2].opacity, 1);

const profile = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");
const settingsScreen = fs.readFileSync("src/screens/AccountScreen.tsx", "utf8");
const activity = fs.readFileSync("src/components/LearningActivityPanel.tsx", "utf8");
const stats = fs.readFileSync("src/screens/PlayerStatsScreen.tsx", "utf8");
assert.match(profile, /<NavigationTile\b/);
assert.doesNotMatch(profile, /testID="profile-summary"|quizStats.currentStreak/);
assert.match(profile, /Νέα κλάση στο επίπεδο/);
assert.match(settingsScreen, /<NavigationTile key=\{id\} variant="settings"/);
assert.match(settingsScreen, /onPress=\{\(\) => openSection\(id\)\}/);
assert.match(activity, /<MetricCard variant="dashboard" entranceDelay=\{80 \+ index \* 65\}/);
assert.match(activity, /<MetricCard variant="standard"/);
assert.equal((stats.match(/<MetricCard variant="streak"/g) || []).length, 2);
console.log("Shared navigation and metric cards passed: touch targets, entry animations, visual variants and unchanged screen actions.");
