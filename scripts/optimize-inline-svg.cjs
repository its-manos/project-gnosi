#!/usr/bin/env node
/**
 * Optimize literal react-native-svg <Path d="..."> data without converting
 * TSX into XML or touching responsive/animated SVG geometry.
 *
 * There are no standalone .svg assets in Gnosi. We give SVGO synthetic,
 * independent <path> nodes so it can run convertPathData safely.
 *
 * Run: npm run svg:optimize  (write smaller path data)
 *      npm run svg:check     (fail if more savings are possible)
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const mode = process.argv[2] || "--dry-run";
if (!["--write", "--check", "--dry-run"].includes(mode)) {
  console.error("Usage: node scripts/optimize-inline-svg.cjs [--write|--check|--dry-run]");
  process.exit(2);
}

function filesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(filename);
    return entry.isFile() && filename.endsWith(".tsx") ? [filename] : [];
  });
}

function isLiteralPath(data) {
  // The SVG paths here begin with M/m and use only SVG path commands,
  // numeric values and separators. Leave JSX expressions unchanged.
  return /^\s*[Mm]\s*[-+.\d]/.test(data)
    && /^[MmLlHhVvCcSsQqTtAaZzEe\d.,+\-\s]+$/.test(data);
}

const files = filesIn(path.join(root, "src")).filter((file) =>
  fs.readFileSync(file, "utf8").includes("react-native-svg")
);
const candidates = [];
const originals = new Map();

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  originals.set(file, source);
  for (const match of source.matchAll(/\bd="([^"]+)"/g)) {
    if (!isLiteralPath(match[1])) continue;
    candidates.push({
      id: "gnosi" + candidates.length,
      file,
      start: match.index + 3,
      end: match.index + match[0].length - 1,
      original: match[1],
    });
  }
}

if (!candidates.length) {
  console.log("No literal JSX SVG path data found; dynamic path expressions are untouched.");
  process.exit(0);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "gnosi-svgo-"));
let optimizedXml;
try {
  const input = path.join(temp, "source.svg");
  const output = path.join(temp, "optimized.svg");
  // Optimize paths independently: no removal or merging of native SVG nodes.
  fs.writeFileSync(input,
    '<svg xmlns="http://www.w3.org/2000/svg">' +
    candidates.map((item) => '<path id="' + item.id + '" d="' + item.original + '"/>').join("") +
    "</svg>\n");
  execFileSync("npm", [
    "exec", "--yes", "--package=svgo@4.0.0", "--", "svgo",
    "--input", input, "--output", output,
    "--config", path.join(__dirname, "svgo-paths.config.mjs"),
  ], { cwd: root, stdio: "pipe", timeout: 120000 });
  optimizedXml = fs.readFileSync(output, "utf8");
} catch (error) {
  console.error("SVGO could not run. Check your npm connection:", error.stderr?.toString() || error.message);
  process.exitCode = 1;
  return;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const optimized = new Map();
for (const tag of optimizedXml.match(/<path\b[^>]*>/g) || []) {
  const id = /\bid="([^"]+)"/.exec(tag)?.[1];
  const data = /\bd="([^"]+)"/.exec(tag)?.[1];
  if (id && data) optimized.set(id, data);
}
if (optimized.size !== candidates.length) {
  throw new Error("SVGO changed the SVG element inventory; refusing to write.");
}

const replacements = new Map();
let saved = 0;
for (const item of candidates) {
  const next = optimized.get(item.id);
  if (!isLiteralPath(next)) throw new Error("Invalid optimized path " + item.id);
  if (next.length >= item.original.length) continue;
  if (!replacements.has(item.file)) replacements.set(item.file, []);
  replacements.get(item.file).push({ ...item, next });
  saved += item.original.length - next.length;
}

for (const [file, entries] of replacements) {
  let content = originals.get(file);
  for (const item of entries.reverse()) {
    content = content.slice(0, item.start) + item.next + content.slice(item.end);
  }
  if (mode === "--write") fs.writeFileSync(file, content);
}

console.log("SVG path audit: " + candidates.length + " static paths across " +
  files.length + " components; " + replacements.size + " files; " + saved +
  " bytes " + (mode === "--write" ? "saved" : "available to save") + ".");
console.log("Dynamic JSX paths, SVG elements, gradients and animations were not changed.");
if (mode === "--check" && replacements.size) process.exitCode = 1;
