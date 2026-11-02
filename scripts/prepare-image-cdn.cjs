#!/usr/bin/env node
/* global __dirname */
/**
 * Gnosi controlled-CDN publishing pipeline.
 *
 * Prepares responsive WebP assets for public object storage (e.g. Cloudflare R2).
 * No credentials enter Expo, no image files are committed to the app.
 *
 * node scripts/prepare-image-cdn.cjs --status
 * node scripts/prepare-image-cdn.cjs --prepare --pilot-ancient-greece
 * rclone copy .image-cdn-build/objects r2:gnosi-images --progress
 * node scripts/prepare-image-cdn.cjs --verify --cdn=https://images.example.com
 * node scripts/prepare-image-cdn.cjs --publish --cdn=https://images.example.com
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const child = require("node:child_process");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const work = path.join(root, ".image-cdn-build");
const objects = path.join(work, "objects");
const manifestFile = path.join(work, "manifest.json");
const generatedTs = path.join(root, "src/data/cdnImageManifest.ts");
const PREFIX = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const THUMB_HOSTS = new Set(["commons.wikimedia.org", "upload.wikimedia.org", "thumb.wikimedia.org"]);
const UA = "GnosiMobile/1.0 (https://github.com/its-manos/project-gnosi)";
const MAX_DOWNLOAD = 15 * 1024 * 1024;
const RESIZES = { preview: "480x480>", full: "1280x1280>" };
const QUALITY = { preview: "72", full: "81" };
const args = process.argv.slice(2);
const flags = args.filter(arg => /^--(status|prepare|verify|publish)$/.test(arg));
const limitArg = args.find(arg => arg.startsWith("--limit="));
const cdnArg = args.find(arg => arg.startsWith("--cdn="));
const pilotAncientGreece = args.includes("--pilot-ancient-greece");
if (flags.length !== 1 || args.some(arg => !/^--(status|prepare|verify|publish|pilot-ancient-greece)$/.test(arg)
    && !/^--limit=\d+$/.test(arg) && !/^--cdn=https:\/\/[^?#\s]+$/.test(arg))
    || args.filter(arg => arg.startsWith("--limit=")).length > 1
    || args.filter(arg => arg.startsWith("--cdn=")).length > 1) {
  console.error("Usage: node scripts/prepare-image-cdn.cjs --status|--prepare|--verify|--publish [--pilot-ancient-greece] [--limit=4] [--cdn=https://images.example.com]");
  process.exit(2);
}
const action = flags[0].slice(2);
if (pilotAncientGreece && action !== "prepare") {
  console.error("--pilot-ancient-greece may only be used with --prepare");
  process.exit(2);
}
if (limitArg && !["status", "prepare"].includes(action)) {
  console.error("--limit is for staged preparation only. Verification and publishing always cover the full prepared manifest.");
  process.exit(2);
}
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : Infinity;
if (!(limit > 0)) throw new Error("--limit must be positive");
const cdnBase = cdnArg ? cdnArg.slice("--cdn=".length).replace(/\/+$/, "") : null;
if ((action === "verify" || action === "publish") && !cdnBase) {
  throw new Error("Pass your PUBLIC custom-domain URL with --cdn=https://images.example.com (no secret keys).");
}

require.extensions[".ts"] = (mod, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      esModuleInterop: true },
  }).outputText;
  mod._compile(compiled, filename);
};
const { lessons } = require(path.join(root, "src/data/lessons.ts"));
const { inlineArticleMedia } = require(path.join(root, "src/data/articleMedia.ts"));

const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const byUrl = new Map();
function include(url, credit, creditUrl, lessonId) {
  if (typeof url !== "string" || !url.startsWith(PREFIX)) return;
  if (byUrl.has(url)) {
    if (!byUrl.get(url).lessons.includes(lessonId)) byUrl.get(url).lessons.push(lessonId);
    return;
  }
  const key = sha(url).slice(0, 24);
  byUrl.set(url, { sourceUrl: url, credit: credit || "", creditUrl: creditUrl || "",
    lessons: [lessonId],
    preview: "commons/" + key + "-preview.webp",
    full: "commons/" + key + "-full.webp" });
}
for (const lesson of lessons) if (lesson.coverKind !== "editorial") {
  include(lesson.imageUrl, lesson.imageCredit, lesson.imageCreditUrl, lesson.id);
}
for (const [lessonId, figures] of Object.entries(inlineArticleMedia)) {
  for (const figure of figures) include(figure.url, figure.credit, figure.creditUrl, lessonId);
}
const catalogue = [...byUrl.values()];
/** Four specific Ancient Greece covers to exercise the Android failure path. */
const pilotLessonIds = [
  "ancient-athens",
  "greek-world-not-a-country",
  "greek-history-through-evidence",
  "greek-geography-seas",
];
const pilotEntries = pilotLessonIds.map(id => {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson || !byUrl.has(lesson.imageUrl)) {
    throw new Error("Missing Commons pilot cover for lesson " + id);
  }
  return byUrl.get(lesson.imageUrl);
});
if (new Set(pilotEntries.map(entry => entry.sourceUrl)).size !== pilotEntries.length) {
  throw new Error("The Ancient Greece pilot must use four distinct cover images");
}
console.log("Wikimedia Commons source URLs in lesson catalogue: " + catalogue.length);
function fileValid(filename) {
  return fs.existsSync(filename) && fs.statSync(filename).size > 100;
}
function entryReady(entry) {
  return fileValid(path.join(objects, entry.preview)) && fileValid(path.join(objects, entry.full));
}
const ready = catalogue.filter(entryReady);
console.log("Prepared locally: " + ready.length + "/" + catalogue.length + " (uncommitted image files)");

if (action === "status") {
  console.log("No images are bundled into the app by this pipeline. Use --prepare [--limit=4] to generate WebP.");
  process.exit(0);
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function detectRaster(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return ".png";
  if (bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP") return ".webp";
  throw new Error("Not a supported raster bitmap (possible HTML/error response)");
}
async function download(sourceUrl) {
  const encoded = sourceUrl.slice(PREFIX.length).split(/[?#]/, 1)[0];
  if (!encoded || encoded.includes("/")) throw new Error("Unexpected Commons filename");
  const urls = [
    PREFIX + encoded + "?width=1280",
    "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/" + encoded + "&width=1280",
    PREFIX + encoded + "?width=960",
  ];
  const failures = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": UA, "Api-User-Agent": UA, "Accept": "image/*" },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) { await response.body?.cancel(); throw new Error("HTTP " + response.status); }
      const target = new URL(response.url);
      // The previous bundler wrongly rejected thumb.wikimedia.org; it's an official CDN host.
      if (target.protocol !== "https:" || !THUMB_HOSTS.has(target.hostname)) {
        throw new Error("Unexpected redirect destination " + target.hostname);
      }
      const reported = Number(response.headers.get("content-length"));
      if (reported > MAX_DOWNLOAD) throw new Error("Image exceeds 15 MiB");
      const chunks = [];
      let size = 0;
      for await (const part of response.body) {
        size += part.length;
        if (size > MAX_DOWNLOAD) throw new Error("Image exceeds 15 MiB");
        chunks.push(Buffer.from(part));
      }
      const bytes = Buffer.concat(chunks);
      const ext = detectRaster(bytes);
      return { bytes, ext };
    } catch(error) {
      failures.push(error?.message || String(error));
    }
  }
  throw new Error(failures.join("; "));
}
function converter() {
  const magick = child.spawnSync("magick", ["-version"], { encoding: "utf8" });
  if (magick.status === 0) return "magick";
  const convert = child.spawnSync("convert", ["-version"], { encoding: "utf8" });
  if (convert.status === 0) return "convert";
  throw new Error("ImageMagick missing. On Ubuntu run: sudo apt install imagemagick");
}
function webpConvert(command, input, destination, rendition) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const options = [input + "[0]", "-auto-orient", "-resize", RESIZES[rendition],
    "-strip", "-quality", QUALITY[rendition], "-define", "webp:method=6",
    "webp:" + destination];
  const run = child.spawnSync(command, options, { encoding: "utf8", timeout: 60000 });
  if (run.status !== 0 || !fileValid(destination)) {
    throw new Error("ImageMagick/WebP conversion failed: " + (run.stderr || run.error || "").toString().slice(0, 400));
  }
}
function writtenManifest(entries) {
  fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(manifestFile, JSON.stringify(entries, null, 2) + "\n");
}
async function prepare() {
  const command = converter();
  fs.mkdirSync(objects, { recursive: true });
  const selection = (pilotAncientGreece ? pilotEntries : catalogue)
    .filter(row => !entryReady(row)).slice(0, limit);
  console.log("Preparing " + selection.length + " images (sequential, rate-friendly)" +
    (pilotAncientGreece ? " from Ancient Greece pilot covers" : ""));
  const failures = [];
  for (const [index, entry] of selection.entries()) {
    const input = path.join(work, sha(entry.sourceUrl).slice(0,24) + "-original");
    try {
      const image = await download(entry.sourceUrl);
      const original = input + image.ext;
      fs.writeFileSync(original, image.bytes);
      try {
        for (const rendition of ["preview", "full"]) {
          if (!fileValid(path.join(objects, entry[rendition]))) {
            webpConvert(command, original, path.join(objects, entry[rendition]), rendition);
          }
        }
      } finally { fs.rmSync(original, { force: true }); }
      console.log("[" + (index + 1) + "/" + selection.length + "] OK " + entry.lessons.join(", "));
    } catch(error) {
      console.error("[" + (index + 1) + "/" + selection.length + "] FAILED " +
        entry.lessons.join(", ") + ": " + (error?.message || error));
      failures.push(entry.sourceUrl);
    }
    await delay(500);
  }
  writtenManifest(catalogue.filter(entryReady));
  console.log("WebP prepared " + catalogue.filter(entryReady).length + "/" + catalogue.length +
    "; failed " + failures.length + ". Files remain in .image-cdn-build/ (not inside the Expo app).");
  if (failures.length) process.exitCode = 1;
}

async function checkCdn() {
  if (!fs.existsSync(manifestFile)) throw new Error("Run --prepare first");
  const rows = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No prepared images");
  let passed = 0;
  const good = [];
  const failed = [];
  for (const entry of rows) {
    if (!byUrl.has(entry.sourceUrl)) {
      failed.push("Manifest source URL no longer in catalogue: " + entry.sourceUrl);
      continue;
    }
    let both = true;
    for (const key of [entry.preview, entry.full]) {
      if (!/^commons\/[a-f0-9]{24}-(preview|full)\.webp$/.test(key) || !fileValid(path.join(objects, key))) {
        both = false;
        failed.push("Missing locally prepared WebP: " + key);
        continue;
      }
      const response = await fetch(cdnBase + "/" + key, { method: "HEAD", signal: AbortSignal.timeout(12000) });
      const mime = response.headers.get("content-type") || "";
      if (!response.ok || !/^image\/webp\b/i.test(mime)) {
        both = false;
        failed.push("Missing CDN object / invalid type: " + key + " HTTP " + response.status + " " + mime);
      }
      await response.body?.cancel();
    }
    if (both) { passed++; good.push(entry); }
  }
  console.log("CDN verified: " + passed + "/" + rows.length + " prepared images (" + failed.length + " object errors)");
  for (const error of failed.slice(0, 12)) console.error("  " + error);
  if (failed.length) throw new Error("CDN verification failed. Check R2 upload and custom domain.");
  return good;
}
function publish(rows) {
  const sorted = [...rows].sort((a,b) => a.sourceUrl.localeCompare(b.sourceUrl,"en"));
  const lines = [
    "/**",
    " * Generated by scripts/prepare-image-cdn.cjs --publish after CDN verification.",
    " * Original Commons metadata/attribution remains in the lesson catalogue.",
    " * Never put Cloudflare account credentials, upload tokens or private URLs here.",
    " */",
    'export type CdnImageRenditions = { preview: string; full: string };',
    "export const cdnImageManifest: Record<string, CdnImageRenditions> = {",
  ];
  for (const row of sorted) lines.push("  " + JSON.stringify(row.sourceUrl) +
    ": { preview: " + JSON.stringify(row.preview) + ", full: " + JSON.stringify(row.full) + " },");
  lines.push("};", "");
  fs.writeFileSync(generatedTs, lines.join("\n"));
  console.log("Generated " + path.relative(root, generatedTs) + " for " + sorted.length +
    " verified CDN images. Commit only this source file, never .image-cdn-build/");
}
async function main() {
  if (action === "prepare") return prepare();
  const verified = await checkCdn();
  if (action === "publish") publish(verified);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
