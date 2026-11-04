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
assert.match(routes, /currentScreen=\{isDailyChallengeOpen \? "home" : app\.screen === "account" \? accountOrigin/,
  "Profile should highlight itself while Android Back can still retain its origin.");
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
assert.ok(profile.includes('accessibilityState={{ expanded: xpExpanded, disabled: !profileReady }}'),
  "The existing XP explanation should remain accessible.");
assert.ok(profile.includes('<XpRules learningXP={profile.learningXP}'));
assert.ok(read("src/components/KnowledgeProgress.tsx").includes('<XpRules learningXP={p.learningXP}'),
  "Keep XP rules in one shared component.");
const activity = read("src/screens/PlayerStatsScreen.tsx");
assert.ok(activity.includes('<LearningActivityPanel todayKey={todayKey}'),
  "Player activity history must remain accessible.");
assert.ok(activity.includes('calculateDailyChallengeProgress(history, todayKey)'),
  "Daily quiz history and streaks must use the existing calculator.");
assert.ok(activity.includes('progress-daily-details'),
  "Keep expandable daily challenge history and accuracy.");
assert.doesNotMatch(activity, /lessonScores|mastery\.count|completedLessons|totalLessonCount/,
  "Mastery and lesson completion belong in Progress / Learning Insights.");
assert.ok(routes.includes('<PlayerStatsScreen onBack={() => app.setScreen("profile")} />'),
  "Player Statistics should not require learning-progress props.");
console.log("Profile fourth-tab and activity ownership contracts passed.");
