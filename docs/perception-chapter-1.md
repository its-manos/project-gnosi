# ΓΝΩΣΗ — Εγκέφαλος και Ψευδαισθήσεις · Chapter I
Status: first five lessons integrated for review · 2026-10-31

## Scope and lesson order

1. `perception-eyes-not-cameras` — Γιατί τα μάτια μας δεν είναι κάμερες;
2. `perception-blind-spot` — Πού κρύβεται το τυφλό σημείο;
3. `perception-color-context` — Γιατί το ίδιο γκρι φαίνεται διαφορετικό;
4. `perception-depth-two-eyes` — Πώς βλέπουμε βάθος σε έναν επίπεδο κόσμο;
5. `perception-gestalt-whole` — Γιατί βλέπουμε σχήματα που δεν έχουν σχεδιαστεί;

All lessons belong to `science / brain-perception`. Each includes original Greek intro, four titled sections of two paragraphs, four multiple-choice reasoning questions with explanations, two scientific references, explicit visual credits, and a reviewed-at date. The narrative builds from the retina to missing visual information, color context, depth cues and grouping. All ids are new, preserving existing progress keys.

## Media provenance and constraints

The first pass uses Wikimedia Commons **raster thumbnail URLs** through `Special:FilePath` (SVG sources with `?width=1200`), not native SVG URLs.

- `Anatomy of eye of human being.jpg`, Aliyu Mohammed Aliyu, CC0 1.0, https://commons.wikimedia.org/wiki/File:Anatomy_of_eye_of_human_being.jpg
- `Blind spot demonstration.svg`, NicoRay, simple-geometry public domain, https://commons.wikimedia.org/wiki/File:Blind_spot_demonstration.svg
- `Simultaneous Contrast.svg`, Qef (based on Xanzzibar and K. P. Miyapuram), public domain, https://commons.wikimedia.org/wiki/File:Simultaneous_Contrast.svg
- `Binocular vision Stereopsis.svg`, T.vanschaik, CC0 1.0, https://commons.wikimedia.org/wiki/File:Binocular_vision_Stereopsis.svg
- `Gestalt proximity.svg`, Kasufcgslfguhvsne, public domain, https://commons.wikimedia.org/wiki/File:Gestalt_proximity.svg

**Important device QA:** the existing `ResilientImage` loader must render Commons SVG raster thumbnail redirects correctly on both platforms; verify the blind-spot diagram is usable at the device's physical display size and with its actual figure orientation. For production reliability, package licensed raster versions into `assets/lesson-images`, register matching URLs in `bundledLessonImages.ts`, and verify all license/attribution statements against Commons. Current image URLs require connectivity.

## Research & editorial starting points

- National Eye Institute, *How the Eyes Work*: https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work
- Webvision / NCBI, *The Perception of Depth*: https://www.ncbi.nlm.nih.gov/books/NBK11512/
- Wikimedia Commons metadata for each diagram, linked above.
- Further bibliography is embedded in each `Lesson.sources`. Validate all reference URLs and ensure direct support for each scientific assertion before publishing.

## Pre-release QA checklist

- [x] New subcategory registered with existing `science` category.
- [x] Five distinct lesson ids appended after existing content, preserving existing order.
- [x] Every lesson authored in Greek with four explanatory quiz checks.
- [x] Image credits and source links present in each lesson data object.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run validate:content`.
- [ ] Run reader, image and progress tests from the repository.
- [ ] Open all five lessons in Expo Go and Android beta: cover, typography, question flow, sound, XP, save/resume and completion.
- [ ] Validate external sources and image license at publish time and bundle images for offline use.
- [ ] Check blind-spot exercise instructions on small displays with accessibility scaling.
- [ ] Merge via PR after QA.

**Validation scope note:** the commit was made through the GitHub integration, without a runnable local checkout. Static structural checks were applied when composing lesson records; project lint/typecheck/device tests have not yet been executed.
