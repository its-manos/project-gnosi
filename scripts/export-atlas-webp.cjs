#!/usr/bin/env node
/**
 * Rebuild atlas WebP assets from preserved SVG exports.
 *
 * The app now renders WebP rather than the original static SVG components,
 * so the old component-evaluation exporter cannot recover those sources.
 * Keep the source SVG files locally (or restore them from an archive) before
 * running this command.
 *
 * Usage: node scripts/export-atlas-webp.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const out = path.resolve(__dirname, "../assets/atlas-export-preview");
const WIDTH = 1080;
const HEIGHT = 2400;
const names = ["home", "category", "subcategory"];

async function main() {
  const missing = names.filter(name => !fs.existsSync(path.join(out, name + ".svg")));
  if (missing.length) {
    throw new Error(
      "Missing original SVG exports: " + missing.map(name => name + ".svg").join(", ") +
      ". These SVGs are no longer embedded in the app components. " +
      "Restore them in assets/atlas-export-preview/ before rebuilding WebP assets."
    );
  }

  for (const name of names) {
    const input = path.join(out, name + ".svg");
    const output = path.join(out, name + ".webp");
    await sharp(input, { density: 72 })
      .resize(WIDTH, HEIGHT)
      .webp({ quality: 88, effort: 6 })
      .toFile(output);
    console.log(name + ": " + WIDTH + "x" + HEIGHT + " WebP exported");
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
