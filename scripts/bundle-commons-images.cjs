#!/usr/bin/env node
/* global __dirname */
/**
 * Download remaining Commons lesson photos into checked-in Metro assets.
 * Run manually: node scripts/bundle-commons-images.cjs --apply
 * No third-party image proxy and no production runtime dependency on Wikimedia.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const imageDir = path.join(root, "assets/lesson-images/commons");
const manifestPath = path.join(imageDir, "manifest.json");
const mapPath = path.join(root, "src/data/bundledLessonImages.ts");
const START = "  // BEGIN GENERATED COMMONS IMAGE ASSETS - scripts/bundle-commons-images.cjs";
const END = "  // END GENERATED COMMONS IMAGE ASSETS";
const PREFIX = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const UA = "GnosiMobile/1.0 (https://github.com/its-manos/project-gnosi)";
const MAX_BYTES = 12 * 1024 * 1024;
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const verify = args.has("--verify");
if ([...args].some(x => !["--apply", "--verify", "--dry-run"].includes(x)) ||
    (apply && (verify || args.has("--dry-run"))) || (verify && args.has("--dry-run"))) {
  console.error("Usage: node scripts/bundle-commons-images.cjs [--dry-run | --apply | --verify]");
  process.exit(2);
}

require.extensions[".ts"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  mod._compile(compiled, filename);
};

const { lessons } = require(path.join(root, "src/data/lessons.ts"));
const { inlineArticleMedia } = require(path.join(root, "src/data/articleMedia.ts"));
const catalogue = new Map();
function add(uri, credit, creditUrl, lessonId) {
  if (typeof uri !== "string" || !uri.startsWith(PREFIX)) return;
  const existing = catalogue.get(uri);
  if (existing) {
    if (!existing.usedBy.includes(lessonId)) existing.usedBy.push(lessonId);
    return;
  }
  catalogue.set(uri, {
    url: uri,
    credit: typeof credit === "string" ? credit : "",
    creditUrl: typeof creditUrl === "string" ? creditUrl : "",
    usedBy: [lessonId],
  });
}
for (const lesson of lessons) {
  if (lesson.coverKind !== "editorial") {
    add(lesson.imageUrl, lesson.imageCredit, lesson.imageCreditUrl, lesson.id);
  }
}
for (const [id, figures] of Object.entries(inlineArticleMedia)) {
  for (const fig of figures) add(fig.url, fig.credit, fig.creditUrl, id);
}

const originalMap = fs.readFileSync(mapPath, "utf8");
function removeGenerated(source) {
  const start = source.indexOf(START);
  if (start === -1) return source;
  const end = source.indexOf(END, start);
  if (end < 0 || source.indexOf(START, start + START.length) !== -1) {
    throw new Error("Malformed generated asset block: refuse to edit file");
  }
  return source.slice(0, start) + source.slice(end + END.length).replace(/^\r?\n/, "");
}
const manualMap = removeGenerated(originalMap);
const manuallyBundled = new Set([...manualMap.matchAll(/^\s*"([^"]+)":\s*require\(/gm)].map(m => m[1]));
if (!manualMap.trimEnd().endsWith("};")) throw new Error("Unexpected bundledLessonImages.ts file ending");
const wanted = [...catalogue.values()].filter(row => !manuallyBundled.has(row.url));
const sha = text => crypto.createHash("sha256").update(text).digest("hex");
function fileFormat(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "png";
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  // GIF is intentionally excluded: RN Android Image may lack GIF decoder support.
  throw new Error("Unsupported image type (expected JPEG, PNG, or WebP; not HTML, SVG, or GIF)");
}
const existing = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
if (!Array.isArray(existing)) throw new Error("Invalid image manifest");
const stored = new Map(existing.map(row => [row.url, row]));
function matches(row) {
  if (!row || typeof row.filename !== "string" || !/^[a-f0-9]{20}\.(jpg|png|webp)$/.test(row.filename)) return false;
  const file = path.join(imageDir, row.filename);
  if (!fs.existsSync(file)) return false;
  return sha(fs.readFileSync(file)) === row.sha256;
}
const missing = wanted.filter(row => !matches(stored.get(row.url)));
console.log("Commons catalogue: " + catalogue.size + " URLs; " + manuallyBundled.size +
  " existing packaged URL keys; " + wanted.length + " additional URLs; " +
  missing.length + " unbundled/missing images.");
if (!apply && !verify) {
  for (const row of missing.slice(0, 12)) console.log("  • " + row.url);
  if (missing.length > 12) console.log("  … and " + (missing.length - 12) + " more");
  console.log("Run --apply to download the missing images, then --verify to check all are packaged.");
  process.exit(0);
}
if (verify) {
  for (const row of missing) console.error("NOT BUNDLED " + row.url);
  if (missing.length) process.exit(1);
  if (originalMap.includes(START)) {
    for (const row of wanted) {
      if (!originalMap.includes(JSON.stringify(row.url) + ": require(")) {
        console.error("MISSING GENERATED MAPPING " + row.url);
        process.exitCode = 1;
      }
    }
  } else if (wanted.length) {
    console.error("Missing generated asset mapping in src/data/bundledLessonImages.ts");
    process.exitCode = 1;
  }
  if (!process.exitCode) console.log("Commons bundle verified: every currently referenced Commons lesson image has a local Metro asset.");
  process.exit();
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const headers = { "User-Agent": UA, "Api-User-Agent": UA, "Accept": "image/jpeg,image/png,image/webp,*/*;q=0.4" };
async function fetchImage(url) {
  const tail = url.slice(PREFIX.length).split(/[?#]/, 1)[0];
  if (!tail) throw new Error("Empty Commons filename");
  const candidates = [
    PREFIX + tail + "?width=960",
    "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/" + tail + "&width=960",
    PREFIX + tail + "?width=500",
  ];
  const errors = [];
  for (const candidate of candidates) {
    // Limited retries on explicit rate limiting only. Never hammer 403s.
    for (let attempt = 0; attempt < 2; attempt++) {
      let response;
      try {
        response = await fetch(candidate, { headers, signal: AbortSignal.timeout(25000), redirect: "follow" });
        if (response.status === 429 || response.status === 503) {
          await response.body?.cancel();
          if (!attempt) { await delay(4000); continue; }
        }
        if (!response.ok) throw new Error("HTTP " + response.status);
        const destination = new URL(response.url);
        if (!["commons.wikimedia.org", "upload.wikimedia.org"].includes(destination.hostname)) {
          throw new Error("Unexpected redirect destination " + destination.hostname);
        }
        const length = Number(response.headers.get("content-length"));
        if (Number.isFinite(length) && length > MAX_BYTES) throw new Error("Oversized image");
        const chunks = [];
        let bytes = 0;
        for await (const chunk of response.body) {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) throw new Error("Image exceeds 12MB limit");
          chunks.push(Buffer.from(chunk));
        }
        const data = Buffer.concat(chunks);
        if (!data.length) throw new Error("Empty image");
        return { data, ext: fileFormat(data) };
      } catch (error) {
        errors.push((error && error.message) || String(error));
        break;
      }
    }
  }
  throw new Error(errors.join("; "));
}

async function main() {
  fs.mkdirSync(imageDir, { recursive: true });
  let downloaded = 0;
  const failures = [];
  for (let i = 0; i < missing.length; i++) {
    const row = missing[i];
    process.stdout.write("[" + (i + 1) + "/" + missing.length + "] " +
      row.usedBy.join(", ") + " · ");
    try {
      // Intentional sequential requests to reduce Wikimedia load.
      const image = await fetchImage(row.url);
      const filename = sha(row.url).slice(0, 20) + "." + image.ext;
      fs.writeFileSync(path.join(imageDir, filename), image.data);
      stored.set(row.url, { ...row, filename, sha256: sha(image.data), bytes: image.data.length });
      downloaded++;
      console.log(filename);
    } catch (error) {
      const message = (error && error.message) || String(error);
      failures.push({ url: row.url, error: message });
      console.error("FAILED " + message);
    }
    await delay(600);
  }
  // Copy metadata/credits from the CURRENT lesson references; no false licence audit claim.
  const entries = wanted.filter(row => matches(stored.get(row.url))).map(row => ({
    ...row,
    filename: stored.get(row.url).filename,
    sha256: stored.get(row.url).sha256,
    bytes: stored.get(row.url).bytes,
  })).sort((a, b) => a.url.localeCompare(b.url, "en"));
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2) + "\n");
  const generated = entries.map(row =>
    "  " + JSON.stringify(row.url) + ": require(\"../../assets/lesson-images/commons/" + row.filename + "\"),"
  ).join("\n");
  const trimmed = manualMap.trimEnd();
  const brace = trimmed.lastIndexOf("};");
  const newMap = trimmed.slice(0, brace) + (entries.length
    ? START + "\n" + generated + "\n" + END + "\n"
    : "") + trimmed.slice(brace) + "\n";
  if (newMap !== originalMap) fs.writeFileSync(mapPath, newMap);
  console.log("Downloaded " + downloaded + ", packaged " + entries.length +
    ", failed " + failures.length + " image(s).");
  console.log("Next: node scripts/bundle-commons-images.cjs --verify");
  if (failures.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
