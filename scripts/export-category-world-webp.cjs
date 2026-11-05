#!/usr/bin/env node
/**
 * Deterministically rasterize the preserved Category world-map SVG for Expo.
 * This is intentionally independent from the old exporter, which requires
 * missing historical Home/Subcategory SVG sources.
 *
 * Usage: node scripts/export-category-world-webp.cjs [--check]
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const source = path.resolve(__dirname, "../assets/atlas-source/category-world.svg");
const destination = path.resolve(__dirname, "../assets/atlas-export-preview/category-world.webp");

async function main() {
  if (!fs.existsSync(source)) throw new Error("Missing category-world.svg source");
  const sourceMarkup = fs.readFileSync(source, "utf8");
  if (!sourceMarkup.includes('viewBox="0 0 1080 2400"')
    || !sourceMarkup.includes('Midnight Atlas')) {
    throw new Error("Unexpected world atlas SVG viewBox or source metadata");
  }

  // A reusable, locally reproducible raster. Flat render, no SVG timing hooks.
  const bytes = await sharp(Buffer.from(sourceMarkup))
    .resize(1080, 2400, { fit: "fill" })
    .webp({ quality: 86, effort: 6 })
    .toBuffer();

  if (process.argv.includes("--check")) {
    if (!fs.existsSync(destination)) {
      throw new Error("Missing category-world.webp. Run npm run atlas:world:export");
    }
    const current = fs.readFileSync(destination);
    if (!current.equals(bytes)) {
      throw new Error("Category world WebP is stale; regenerate and commit it");
    }
    console.log("Category world atlas WebP matches the committed SVG");
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  const metadata = await sharp(bytes).metadata();
  console.log("Category world atlas exported: " + metadata.width + "x" +
    metadata.height + " WebP, " + bytes.length + " bytes");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
