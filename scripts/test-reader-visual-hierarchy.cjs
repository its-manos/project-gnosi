/* A deliberately small guardrail: Midnight Atlas styling must not make
 * published long-form lessons harder to read or alter checkpoint gates.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = name => fs.readFileSync(path.join(root, name), "utf8");
const paletteSource = source("src/theme.ts");
const reader = source("src/screens/ReaderLessonScreen.tsx");
const figures = source("src/components/ArticleFigure.tsx");
const captions = source("src/components/ExpandableImageCaption.tsx");
const fontStore = source("src/state/ReaderTextSize.ts");
const readingPalette = paletteSource.split("export const reading = {")[1]?.split("};")[0];
assert.ok(readingPalette, "The dedicated reading palette must exist.");

const color = name => {
  const value = readingPalette.match(new RegExp(`\\b${name}: "(#[0-9A-Fa-f]{6})"`))?.[1];
  assert.ok(value, `Missing reading palette color: ${name}`);
  return value;
};
const luminance = hex => {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
// Go beyond the 4.5:1 WCAG AA text threshold for the main reading palette.
for (const background of ["background", "surface"]) {
  for (const foreground of ["text", "heading", "muted", "accent"]) {
    assert.ok(contrast(color(foreground), color(background)) >= 7,
      `${foreground} on ${background} must reach 7:1 contrast`);
  }
}

assert.match(fontStore, /READER_TEXT_SIZE_DEFAULT = 18/, "Keep the reader's 18pt default.");
assert.match(fontStore, /READER_TEXT_SIZE_MIN = 16/, "Do not lower minimum reading size.");
assert.match(fontStore, /READER_TEXT_SIZE_MAX = 24/, "Keep larger reading sizes available.");
assert.ok(reader.includes("readerTextSize.adjust(-2)") && reader.includes("readerTextSize.adjust(2)"),
  "Reader controls should use the persisted device preference.");
const lineHeightRatio = Number(reader.match(/lineHeight: Math\.round\(readingSize \* ([\d.]+)\)/)?.[1]);
assert.ok(lineHeightRatio >= 1.6 && lineHeightRatio <= 1.85,
  "Long-form line spacing must remain comfortable without excessive leading.");
assert.match(reader, /maxWidth: 620/, "Keep line length constrained on tablets.");
assert.match(reader, /showsVerticalScrollIndicator=\{false\}/);
assert.match(reader, /getReadingVisibleParagraphLimit\(lesson, checkpointAnswers\)/);
assert.match(reader, /testID={`reader-paragraph-\$\{number\}`}/);
assert.match(reader, /testID={`reader-checkpoint-\$\{firstPending\.questionIndex\}`}/);
assert.match(reader, /testID="reader-finish"/);
assert.match(reader, /testID="reader-locked"/);
assert.match(reader, /getParagraphText\(paragraph\)/);
assert.match(reader, /<ArticleFigure /);
assert.match(reader, /<ReaderSources lesson=\{lesson\} \/>/);
// The question invitation must stay compact without shrinking its tap target.
assert.ok(reader.includes("checkpointButton: { minHeight: 48, marginTop: 10, paddingVertical: 10 }"),
  "Checkpoint CTA must remain at least 48pt tall.");
assert.ok(reader.includes("style={styles.checkpointButton}"),
  "The compact override must only apply to the checkpoint button.");
assert.ok(reader.includes("checkpointHint: { color: reading.muted, fontSize: 13, lineHeight: 20 }"),
  "Compact helper text must remain readable.");
assert.match(captions, /fontSize: 13/, "Captions should remain comfortably legible.");
assert.ok(reader.includes("<ExpandableImageCaption key={lesson.id}"),
  "Reader cover captions use the shared expandable component.");
assert.ok(figures.includes("<ExpandableImageCaption caption={figure.caption}"),
  "Inline figure captions use the shared expandable component.");
assert.match(figures, /fontSize: 12/, "Attribution should not shrink to tiny text.");

const readingViewport = reader.split("<NextImageWarmup")[0];
assert.doesNotMatch(readingViewport, /<ProgressGradientBackground/,
  "Decorative gradients must stay on question screens, never beneath article text.");
assert.match(reader, /<ProgressGradientBackground \/>/,
  "Full-screen questions keep their established Midnight Atlas background.");
console.log("Reader legibility and presentation guardrails passed.");
