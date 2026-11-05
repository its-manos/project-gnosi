#!/usr/bin/env node
/**
 * Export the *actual* static SVG geometry from the three React Native atlas
 * components without booting Expo. Requires existing typescript + sharp.
 *
 * Usage: node scripts/export-atlas-webp.cjs
 * Outputs preview assets only; app code is intentionally unchanged.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "assets", "atlas-export-preview");
const WIDTH = 1080, HEIGHT = 2400;
const componentFiles = [
  ["home", "src/components/HomeAtlasBackground.tsx"],
  ["category", "src/components/CategoryAtlasBackground.tsx"],
  ["subcategory", "src/components/AdventureAtlasBackground.tsx"],
];

const tagNames = ["Svg", "Circle", "Defs", "Ellipse", "G", "LinearGradient",
  "Path", "RadialGradient", "Rect", "Stop", "Text"];
const svgTags = Object.fromEntries(tagNames.map(name => [name,
  name === "Svg" ? "svg" : name === "G" ? "g" :
    name === "Text" ? "text" : name[0].toLowerCase() + name.slice(1)]));
const svgModule = { __esModule: true, default: "svg",
  ...Object.fromEntries(tagNames.map(name => [name, svgTags[name]])) };
const makeNode = (type, props, key) => ({ type, props: props || {}, key });
const jsxRuntime = {
  jsx: makeNode, jsxs: makeNode, Fragment: "fragment",
};
const react = {
  __esModule: true,
  memo: fn => fn,
  useMemo: fn => fn(),
  useEffect: () => {},
  useState: initial => [initial && typeof initial === "object" &&
    "width" in initial ? { width: WIDTH, height: HEIGHT } : initial, () => {}],
};
const rn = {
  __esModule: true,
  View: "view",
  Platform: { OS: "android" },
  StyleSheet: { create: x => x, absoluteFill: {}, absoluteFillObject: {} },
};
const reanimated = {
  __esModule: true, default: { View: "view" },
  useReducedMotion: () => true,
  useSharedValue: value => ({ value }),
  useAnimatedStyle: () => ({}),
  Easing: { inOut: x => x, cubic: x => x },
  withTiming: value => value,
  withSequence: (...args) => args[0],
  withRepeat: value => value,
  cancelAnimation: () => {},
};
function fakeRequire(id) {
  if (id === "react") return react;
  if (id === "react/jsx-runtime") return jsxRuntime;
  if (id === "react-native") return rn;
  if (id === "react-native-svg") return svgModule;
  if (id === "react-native-reanimated") return reanimated;
  if (id.startsWith("./")) return new Proxy({}, {
    get: () => () => null,
  });
  throw new Error("Unexpected import " + id);
}
function loadComponent(file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require: fakeRequire,
    Math, Array, Set, Map, Object, Number, String, console,
  }, { filename: file, timeout: 15000 });
  return module.exports.default;
}
function findSvg(node) {
  if (node == null || typeof node === "boolean") return null;
  if (Array.isArray(node)) {
    for (const child of node) { const svg = findSvg(child); if (svg) return svg; }
    return null;
  }
  if (typeof node !== "object") return null;
  if (typeof node.type === "function") return findSvg(node.type(node.props));
  if (node.type === "svg") return node;
  return findSvg(node.props.children);
}
const attributeNames = {
  className: "class", stopColor: "stop-color", stopOpacity: "stop-opacity",
  strokeWidth: "stroke-width", strokeOpacity: "stroke-opacity",
  strokeDasharray: "stroke-dasharray", strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin", fillOpacity: "fill-opacity",
  fillRule: "fill-rule", clipRule: "clip-rule", fontSize: "font-size",
  fontWeight: "font-weight", textAnchor: "text-anchor",
  letterSpacing: "letter-spacing", preserveAspectRatio: "preserveAspectRatio",
};
function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function render(node) {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(render).join("");
  if (typeof node !== "object") return escapeXml(node);
  if (typeof node.type === "function") return render(node.type(node.props));
  const tag = node.type;
  if (tag === "fragment") return render(node.props.children);
  if (tag === "view") return render(node.props.children);
  const attrs = Object.entries(node.props).filter(([key, val]) =>
    key !== "children" && key !== "key" && key !== "testID" &&
    key !== "pointerEvents" && key !== "accessible" &&
    key !== "style" && key !== "onLayout" && val != null &&
    typeof val !== "function" && typeof val !== "boolean")
    .map(([key, val]) => " " + (attributeNames[key] || key) +
      '="' + escapeXml(val) + '"').join("");
  return "<" + tag + attrs + ">" + render(node.props.children) +
    "</" + tag + ">";
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const [name, file] of componentFiles) {
    const Component = loadComponent(file);
    const props = name === "category" ?
      { width: WIDTH, height: HEIGHT, regionCount: 6 } :
      name === "subcategory" ? { width: WIDTH, height: HEIGHT } :
      { showAmbientMotion: false };
    const svg = findSvg(Component(props));
    if (!svg) throw new Error("No static SVG found for " + name);
    const xml = render(svg).replace(/^<svg /,
      '<svg xmlns="http://www.w3.org/2000/svg" ');
    fs.writeFileSync(path.join(out, name + ".svg"), xml);
    await sharp(Buffer.from(xml), { density: 72 })
      .resize(WIDTH, HEIGHT).webp({ quality: 88, effort: 6 })
      .toFile(path.join(out, name + ".webp"));
    console.log(name + ": " + WIDTH + "x" + HEIGHT + " preview exported");
  }
  console.log("Preview files: " + out);
})().catch(error => { console.error(error); process.exitCode = 1; });
