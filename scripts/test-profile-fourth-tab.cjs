const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = path => fs.readFileSync(path, "utf8");
const tabs = read("src/components/BottomNavigation.tsx");
const routes = read("src/navigation/AppNavigator.tsx");
const profile = read("src/screens/ProfileScreen.tsx");

const destinations = [...tabs.matchAll(/\{ key: "(home|progress|saved|profile)", label:/g)]
  .map(match => match[1]);
assert.deepEqual(destinations, ["home", "progress", "saved", "profile"],
  "The bottom navbar should retain its three routes and add Profile last.");
assert.match(tabs, /\["profile", "player-stats", "account"\]/,
  "The Profile tab should remain selected in its secondary destinations.");
assert.match(tabs, /accessibilityRole="tab"/);
assert.match(tabs, /accessibilityState=\{\{ selected \}\}/);

assert.match(routes, /case "profile":/);
assert.match(routes, /case "player-stats":/);
assert.match(routes, /destination === "profile"/);
assert.match(routes, /app\.screen === "account" \? accountOrigin/,
  "The account route should preserve the tab that opened it.");
assert.doesNotMatch(routes, /app\.screen === "profile" \? profileOrigin/,
  "Profile should be active itself rather than masquerading as Progress or Home.");
assert.match(routes, /navigateTo\(destination\)/,
  "Bottom-tab navigation must still pass through the unfinished-lesson guard.");

assert.match(profile, /useKnowledgeProfile\(/,
  "Use the existing account-scoped XP/achievement model.");
assert.match(profile, /profile\.badges\.map\(/);
assert.match(profile, /calculateDailyChallengeProgress\(dailyHistory\(daily\.doc\), today\)/,
  "The streak must remain a daily-quiz streak, not an invented login streak.");
assert.doesNotMatch(profile, /completedIds|completedLessons|totalLessonCount/,
  "Reading/learning completion belongs to Progress and Insights, not Profile.");
for (const callback of ["onStats", "onAccount", "onInterests", "onGuide"]) {
  assert.match(profile, new RegExp("onPress=\\{" + callback + "\\}"),
    "Existing Profile action must remain wired: " + callback);
}
assert.match(profile, /scrollEnabled=\{canScroll\}/,
  "Default Profile layout should fit the viewport with a scroll fallback.");
assert.match(profile, /ProgressGradientBackground/);
console.log("Profile fourth-tab routing, data ownership and action contracts passed.");
