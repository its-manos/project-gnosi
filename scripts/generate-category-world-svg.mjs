#!/usr/bin/env node
/**
 * Generate an accurate, decorative orthographic hemisphere from Natural Earth
 * public-domain land polygons. This is an offline, reproducible build:
 * assets/atlas-source/natural-earth-110m-land.geojson is tracked in the repo.
 * Data: https://github.com/nvkelso/natural-earth-vector
 * License: https://www.naturalearthdata.com/about/terms-of-use/
 * Usage: node scripts/generate-category-world-svg.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoGraticule, geoOrthographic, geoPath } from "d3-geo";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "assets/atlas-source/natural-earth-110m-land.geojson");
const output = path.join(root, "assets/atlas-source/category-world.svg");
const land = JSON.parse(fs.readFileSync(input, "utf8"));
if (land.type !== "FeatureCollection" || land.features?.length < 100) {
  throw Error("Natural Earth land polygons are missing or incomplete");
}

// True spherical geometry, without stretching individual landmasses.
// This orthographic hemisphere is centred at 12°W, 27°N.
const projection = geoOrthographic()
  .rotate([12, -27])
  .translate([540, 1230])
  .scale(815)
  .clipAngle(90)
  .precision(0.35);
const pathMaker = geoPath(projection);
const geography = pathMaker(land);
const graticule = pathMaker(geoGraticule().step([30, 30])());
if (!geography || !graticule || geography.length < 5000) {
  throw Error("Cannot project Natural Earth coastline features");
}

let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2400" viewBox="0 0 1080 2400">
  <title>Gnosi — Midnight Atlas, Atlantic hemisphere</title>
  <desc>Accurate orthographic hemisphere centred at 12 degrees west and 27 degrees north, using public-domain Natural Earth 1:110m land polygons. Decorative, not for navigation.</desc>
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2=".78" y2="1">
      <stop offset="0" stop-color="#101B29"/><stop offset=".44" stop-color="#152D3A"/>
      <stop offset="1" stop-color="#0C1828"/>
    </linearGradient>
    <radialGradient id="atmosphere" cx=".52" cy=".43" r=".78">
      <stop offset="0" stop-color="#477184" stop-opacity=".30"/>
      <stop offset=".61" stop-color="#244153" stop-opacity=".14"/>
      <stop offset="1" stop-color="#101827" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="globe-water" cx=".45" cy=".36" r=".84">
      <stop offset="0" stop-color="#294657"/>
      <stop offset=".64" stop-color="#1B3443"/>
      <stop offset="1" stop-color="#112535"/>
    </radialGradient>
    <linearGradient id="earth" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#87938A"/>
      <stop offset=".45" stop-color="#687F7E"/>
      <stop offset="1" stop-color="#385564"/>
    </linearGradient>
    <radialGradient id="vignette" cx=".5" cy=".5" r=".75">
      <stop offset="0" stop-color="#091421" stop-opacity="0"/>
      <stop offset=".7" stop-color="#091421" stop-opacity=".12"/>
      <stop offset="1" stop-color="#070F1D" stop-opacity=".46"/>
    </radialGradient>
    <linearGradient id="plate-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#C6B89D" stop-opacity=".45"/>
      <stop offset=".55" stop-color="#90ABAF" stop-opacity=".19"/>
      <stop offset="1" stop-color="#B7A78D" stop-opacity=".42"/>
    </linearGradient>
    <clipPath id="globe-clip"><circle cx="540" cy="1230" r="815"/></clipPath>
  </defs>

  <rect width="1080" height="2400" fill="url(#sea)"/>
  <rect width="1080" height="2400" fill="url(#atmosphere)"/>
  <!-- Decorative currents are not mistaken for coastlines. -->
  <g fill="none" stroke="#8AAEBC" stroke-width="1.6" opacity=".095">
    <path d="M -60 422 Q 170 334 344 401 T 820 418 Q 975 390 1140 330"/>
    <path d="M -70 455 Q 162 367 354 442 T 790 456 Q 1008 416 1140 359"/>
    <path d="M -80 2029 Q 247 1960 436 2040 T 871 2075 Q 1008 2033 1160 1990"/>
    <path d="M -80 2074 Q 247 2006 434 2086 T 871 2121 Q 1008 2077 1160 2034"/>
  </g>
  <g fill="none" stroke="#D8C3A0" stroke-width="1" opacity=".11" stroke-dasharray="3 17">
    <ellipse cx="540" cy="1230" rx="518" ry="1060"/>
    <path d="M 540 182 V 2285"/>
  </g>

  <!-- Geography and graticule use the SAME true spherical projection. -->
  <circle cx="540" cy="1230" r="815" fill="url(#globe-water)" fill-opacity=".70"
    stroke="#C2B294" stroke-opacity=".40" stroke-width="2.2"/>
  <g clip-path="url(#globe-clip)">
    <path d="__GRATICULE__" fill="none" stroke="#9FB7BE" stroke-opacity=".13" stroke-width="1.6"/>
    <path d="__GEOGRAPHY__" fill="url(#earth)" fill-opacity=".33" stroke="#B9B09A"
      stroke-opacity=".54" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="__GEOGRAPHY__" fill="none" stroke="#C7D0BC"
      stroke-opacity=".08" stroke-width="4.2" stroke-linejoin="round"/>
  </g>

  <g transform="translate(918 2160)" opacity=".43">
    <circle r="50" fill="none" stroke="#CCBA96" stroke-width="1.2"/>
    <circle r="36" fill="none" stroke="#A8BCC1" stroke-width=".85"/>
    <path d="M 0 -63 L 8 -9 L 63 0 L 8 9 L 0 63 L -8 9 L -63 0 L -8 -9 Z"
      fill="#CFBD9B" fill-opacity=".15" stroke="#C9B38E" stroke-width="1.1"/>
    <path d="M 0 -46 V 46 M -46 0 H 46" stroke="#D6D0B8" stroke-width="1.1" opacity=".6"/>
    <circle r="4.5" fill="#CEC09B"/>
  </g>
  <g fill="none" stroke="#D3BE9A" opacity=".24" stroke-width="1.4">
    <path d="M 68 125 V 165 M 48 145 H 88 M 1012 125 V 165 M 992 145 H 1032"/>
    <path d="M 68 2307 V 2267 M 48 2287 H 88 M 1012 2307 V 2267 M 992 2287 H 1032"/>
  </g>
  <rect width="1080" height="2400" fill="url(#vignette)"/>
  <rect x="18" y="22" width="1044" height="2356" rx="18" fill="none"
    stroke="url(#plate-rim)" stroke-opacity=".48" stroke-width="2"/>
  <rect x="29" y="33" width="1022" height="2334" rx="11" fill="none"
    stroke="#9EB9BD" stroke-opacity=".14" stroke-width="1"/>
</svg>
`;
svg = svg.replaceAll("__GRATICULE__", graticule).replaceAll("__GEOGRAPHY__", geography);

if (process.argv.includes("--check")) {
  if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== svg) {
    throw Error("World atlas SVG is stale. Run npm run atlas:world:svg");
  }
  console.log("Natural Earth SVG is current and geographically reproducible");
} else {
  fs.writeFileSync(output, svg);
  console.log("Generated " + land.features.length + " land polygons: " +
    svg.length + " SVG chars");
}
