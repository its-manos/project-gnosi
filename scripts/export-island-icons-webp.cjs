#!/usr/bin/env node
/**
 * Export the three History island icons from their ACTUAL React Native SVG
 * source components to transparent, high-DPI WebP. Do not maintain a second
 * hand-traced SVG version: this script evaluates the checked-in TSX art and
 * serializes its original SVG primitives.
 *
 * Usage:
 *   npm run atlas:islands:export
 *   npm run atlas:islands:check
 *
 * The conversion is entirely build-time; the app mounts only expo-image.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const dest = path.join(root, "assets/atlas-export-preview/island-icons");
const SIZE = 256; // 68pt icon remains crisp at >3x without large textures.
const ICONS = [
  ["ancient-greece", "src/components/islandIcons/AncientGreeceIslandIcon.tsx"],
  ["world-history", "src/components/islandIcons/WorldHistoryIslandIcon.tsx"],
  ["mythology", "src/components/islandIcons/MythologyIslandIcon.tsx"],
];

const tags = {
  default: "svg", Circle: "circle", ClipPath: "clipPath", Defs: "defs",
  Ellipse: "ellipse", G: "g", LinearGradient: "linearGradient",
  RadialGradient: "radialGradient", Path: "path", Rect: "rect",
  Stop: "stop", Text: "text",
};
const allowed = new Set(Object.values(tags));
const svgModule = { __esModule: true, ...tags };
const jsx = (type, props) => ({ type, props: props || {} });

function getTree(source) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, source), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: source,
    reportDiagnostics: true,
  });
  if (code.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) {
    throw Error("Failed to transpile icon: " + source);
  }
  vm.runInNewContext(code.outputText, {
    module: mod, exports: mod.exports,
    require: id => {
      if (id === "react-native-svg") return svgModule;
      if (id === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      throw Error("Unexpected dependency " + id + " in icon " + source);
    },
  }, { timeout: 5000, filename: source });
  if (typeof mod.exports.default !== "function") {
    throw Error("Missing exported SVG icon component in " + source);
  }
  return mod.exports.default({ size: SIZE });
}

function escape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toAttr(name) {
  if (name === "viewBox") return name;
  return name.replace(/[A-Z]/g, char => "-" + char.toLowerCase());
}

const OMIT = new Set([
  "children", "key", "ref", "testID", "accessible",
  "accessibilityLabel", "accessibilityHint",
  "accessibilityElementsHidden", "importantForAccessibility",
  "pointerEvents", "style",
]);

function serialize(node) {
  if (node == null || node === false || node === true) return "";
  if (Array.isArray(node)) return node.map(serialize).join("");
  if (typeof node === "string" || typeof node === "number") return escape(node);
  if (node.type === "fragment") return serialize(node.props.children);
  if (!allowed.has(node.type)) throw Error("Unsupported SVG node: " + String(node.type));
  const attrs = Object.entries(node.props).filter(([key, value]) =>
    !OMIT.has(key) && value != null && typeof value !== "function");
  const opening = "<" + node.type + attrs.map(([key, value]) =>
    " " + toAttr(key) + '="' + escape(value) + '"').join("") + ">";
  return opening + serialize(node.props.children) + "</" + node.type + ">";
}

async function main() {
  const check = process.argv.includes("--check");
  if (!check) fs.mkdirSync(dest, { recursive: true });
  const sizes = [];
  for (const [id, source] of ICONS) {
    const tree = getTree(source);
    if (tree.type !== "svg" || tree.props.viewBox !== "0 0 100 100") {
      throw Error("Unexpected viewBox for " + id);
    }
    const markup = '<?xml version="1.0" encoding="UTF-8"?>' + serialize(tree);
    const bytes = await sharp(Buffer.from(markup), { density: 72 })
      .resize(SIZE, SIZE)
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toBuffer();
    const meta = await sharp(bytes).metadata();
    if (meta.width !== SIZE || meta.height !== SIZE || !meta.hasAlpha) {
      throw Error("Invalid transparent icon export: " + id);
    }
    const output = path.join(dest, id + ".webp");
    if (check) {
      if (!fs.existsSync(output) || !fs.readFileSync(output).equals(bytes)) {
        throw Error("Island icon missing or stale: " + id +
          ". Run npm run atlas:islands:export and commit the WebP");
      }
    } else {
      fs.writeFileSync(output, bytes);
    }
    sizes.push(id + " " + bytes.length + " bytes");
  }
  console.log((check ? "Island icon WebP parity verified: " : "Island icons exported: ") +
    sizes.join(", "));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
