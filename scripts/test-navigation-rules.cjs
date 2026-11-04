/* Pure navigation rules: test destinations and lesson-exit protection without mounting React. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const file = path.join(__dirname, "../src/navigation/navigationRules.ts");
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleShim = { exports: {} };
vm.runInNewContext(compiled, { module: moduleShim, exports: moduleShim.exports });
const { backDestination, requiresLearningExitConfirmation } = moduleShim.exports;
const origins = { account: "profile", profile: "progress", knowledge: "home", lesson: "subcategory" };
for (const [screen, destination] of Object.entries({
  account: "profile", profile: "progress", "player-stats": "profile",
  "knowledge-review": "home", "learning-insights": "progress",
  "weekly-review": "progress", lesson: "subcategory", results: "subcategory",
  quiz: "lesson", subcategory: "category", category: "home", saved: "home",
})) {
  assert.equal(backDestination(screen, origins), destination, screen);
}
for (const current of ["lesson", "quiz"]) {
  for (const destination of ["home", "progress", "profile", "category"]) {
    assert.equal(requiresLearningExitConfirmation(current, destination), true);
  }
  for (const destination of ["lesson", "quiz"]) {
    assert.equal(requiresLearningExitConfirmation(current, destination), false);
  }
}
assert.equal(requiresLearningExitConfirmation("home", "profile"), false);
console.log("Navigation rules passed");
