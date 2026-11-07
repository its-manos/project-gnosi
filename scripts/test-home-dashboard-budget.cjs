const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/utils/homeDashboardLayout.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
Function('module', 'exports', code)(mod, mod.exports);
const layout = mod.exports.homeDashboardLayout;
for (const width of [320, 360, 390, 430, 768]) {
  let prior;
  for (let height = 500; height <= 1200; height++) {
    const current = layout(height, width);
    assert.ok(current.heroHeight >= 162 && current.heroHeight <= 230);
    assert.ok(current.quizHeight >= 82 && current.quizHeight <= 110);
    assert.ok(current.iconSize >= 28 && current.iconSize <= 46);
    if (current.iconSize < 46) {
      assert.equal(current.heroHeight, 162, 'cards reach minimum before icons shrink');
      assert.equal(current.quizHeight, 82);
    }
    if (prior) {
      assert.ok(current.iconSize >= prior.iconSize);
      assert.ok(current.heroHeight >= prior.heroHeight);
      assert.ok(current.quizHeight >= prior.quizHeight);
    }
    if (height >= 650) assert.equal(current.iconSize, 46, 'normal phones preserve full icons');
    if (height >= 600) assert.ok(current.estimatedHeight <= height + 2, 'budget fits typical portrait viewports');
    prior = current;
  }
}
assert.equal(layout(1200, 430).heroHeight, layout(850, 430).heroHeight,
  'tall screens do not inflate Continue into empty padding');
assert.equal(layout(700, 390, 1.6).naturalText, true);
console.log('Home budget: cards shrink first, icons shrink last, monotonic resizing and bounded card growth passed.');
