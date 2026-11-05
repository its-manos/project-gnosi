const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

const cardStyle = read("src/components/questionCardStyles.ts");
assert.match(cardStyle, /minHeight: 54/, "question answers remain at least 44pt targets");
assert.match(cardStyle, /minHeight: 50/, "confirmation stays touch-friendly");
assert.match(cardStyle, /rim:/, "all cards share a restrained Atlas top edge");
for (const file of [
  "SingleChoiceQuestionCard.tsx", "MultipleSelectQuestionCard.tsx",
  "OrderingQuestionCard.tsx", "MatchingQuestionCard.tsx",
  "SpotMistakeQuestionCard.tsx", "FillBlankQuestionCard.tsx",
]) {
  assert.match(read("src/components/" + file), /style={styles.rim}/, file + " uses common surface");
}
const reader = read("src/screens/ReaderLessonScreen.tsx");
const preview = read("src/screens/QuizTypesPreviewScreen.tsx");
const legacyQuiz = read("src/screens/QuizScreen.tsx");
const navigation = read("src/navigation/AppNavigator.tsx");
for (const [screen, source] of [["reader", reader], ["preview", preview], ["legacy", legacyQuiz]]) {
  assert.match(source, /<QuestionStageFooter/, screen + " anchors the primary button");
}
assert.match(navigation, /!isDailyChallengeOpen && app\.screen !== "quiz"/,
  "dedicated quiz stages hide bottom tabs while the user answers");
assert.match(legacyQuiz, /scrollEnabled={viewport.scrollEnabled}/,
  "legacy quiz also avoids scrolling when content fits");
const daily = read("src/screens/DailyChallengeScreen.tsx");
for (const [name, source] of [["reader", reader], ["daily", daily]]) {
  assert.match(source, /onLayout={quizViewport.onLayout}/, name + " measures viewport");
  assert.match(source, /onContentSizeChange={quizViewport.onContentSizeChange}/, name + " measures content");
  assert.match(source, /quizViewport.scrollEnabled/, name + " only scrolls on actual overflow");
}
assert.match(reader, /compactAnswered/, "reader uses the compact submitted-answer layout");
assert.match(daily, /compactAnswered/, "daily quiz uses the compact submitted-answer layout");
assert.match(read("src/components/QuizReveal.tsx"), /translateY/, "question reveal has gentle lift");
assert.match(read("src/components/QuizReveal.tsx"), /isReduceMotionEnabled/, "system reduced motion honored");
const blank = read("src/components/FillBlankQuestionCard.tsx");
const preview = read("src/screens/QuizTypesPreviewScreen.tsx");
assert.match(blank, /testID="fill-blank-sentence"/, "one prominent sentence is the question");
assert.match(blank, /punctuationOnly/, "punctuation stays attached to the answer slot");
assert.doesNotMatch(blank, /style={styles\.hint}|style={styles\.wordBankHeading}/,
  "word bank does not repeat explanatory instructions");
assert.match(preview, /onLayout={viewport.onLayout}/, "preview measures available space");
assert.match(preview, /scrollEnabled={session.completed \|\| viewport.scrollEnabled}/,
  "preview stays fixed when the current question fits");
assert.doesNotMatch(preview, /sectionHeading|sandboxNote|sectionEyebrow/,
  "dev preview drops redundant hero and duplicate format title");


let slots = [], cursor = 0;
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], next => {
      slots[index] = typeof next === "function" ? next(slots[index]) : next;
    }];
  },
  useCallback: fn => fn,
};
const compiled = ts.transpileModule(read("src/hooks/useAdaptiveQuestionScroll.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
vm.runInNewContext(compiled, {
  module: mod, exports: mod.exports,
  require: id => {
    if (id === "react") return react;
    if (id === "../utils/screenLayout") return {
      stableLayoutHeight: (previous, next) => next > 0 && Math.abs(previous - next) >= 1 ? next : previous,
    };
    throw Error("unexpected dependency: " + id);
  },
});
const render = () => { cursor = 0; return mod.exports.useAdaptiveQuestionScroll(); };
let viewport = render();
assert.equal(viewport.scrollEnabled, false, "initial viewport cannot scroll");
viewport.onLayout({ nativeEvent: { layout: { height: 700 } } });
viewport.onContentSizeChange(390, 650);
viewport = render();
assert.equal(viewport.scrollEnabled, false, "fitting question is fixed");
viewport.onContentSizeChange(390, 702);
viewport = render();
assert.equal(viewport.scrollEnabled, false, "tiny rounding overflow is ignored");
viewport.onContentSizeChange(390, 790);
viewport = render();
assert.equal(viewport.scrollEnabled, true, "long explanations can scroll, not clip");
viewport.onContentSizeChange(390, 570);
viewport = render();
assert.equal(viewport.scrollEnabled, false, "scrolling switches off after compact feedback");
console.log("Question stage passed: shared Atlas styling, responsive non-scroll fit, safe overflow, reduced-motion entrance.");
