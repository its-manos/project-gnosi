# Contextual lesson figures

## Scope

The 40 lessons flagged by the previous validator now each receive a figure after a relevant taught paragraph pair. There are 27 sourced photographs or documentary reproductions and 13 original exact diagrams. The existing 41 figure lists and all 81 complete lesson objects remain unchanged. There are now 91 inline figures across 81 lessons and 152 cover/inline references resolving to packaged raster images.

The selection is pedagogical rather than decorative. Kleroterion slots illustrate sortition; Linear B tablets place administration in a material context; a close-up shows coral polyps; a microscope image shows an integrated circuit. Lascaux II is explicitly a replica. The Polytechnic photograph is a modern view of the site, not a photograph of the uprising. The eugenics emblem and Nazi boycott photograph are identified as historical propaganda and persecution, with no graphic violence.

Original diagrams explain Moon phases, orbit and free fall, gene expression, amplitude and frequency, atmospheric scattering, DNS versus page retrieval, encryption versus signatures, group accuracy, population versus density, cave chemistry, wall functions, solar shading and an exoplanet light curve. The AI, city and exoplanet diagrams use the precise hypothetical figures already in the articles, not invented real-world results. These diagrams are illustrations, not new factual lesson text.

## Asset handling

The source images were retrieved from Wikimedia Commons file metadata, with creator, actual image licence and licence URL recorded before use. Only public domain, CC0, CC BY and CC BY-SA material was selected. Each source image derivative retains its applicable licence; changes are limited to resizing and JPEG encoding. No generative image editing or crops were applied. Original source metadata is retained in `scripts/fixtures/supplementary-image-rights.json`; human-readable credits and links are in the attribution file and app captions.

All 40 assets are local. Metadata URLs remain stable lookup keys in the existing `bundledLessonImages` registry. Original diagram keys use a research-source URL plus `#gnosi-supplementary-<lesson-id>` and are not remote bitmap endpoints. Each file uses a literal require path for Metro. Full figures use contain rather than cover sizing. Existing caption accessibility labels and image-zoom controls apply without UI changes.

The rasterized diagram labels use DejaVu Sans. Rebuild with `python3 scripts/generate-supplementary-diagrams.py` after installing Pillow and the DejaVu fonts. No font binaries are redistributed.

## Verification

- Content validation: 7 categories, 22 subcategories, 81 lessons and 81 lesson IDs with inline media; no missing-inline-image warnings.
- Exact SHA-256 snapshots: all 81 lesson objects unchanged, including checkpoints, answer slots, sources and IDs; all 41 pre-existing figure lists unchanged.
- All 40 placements follow taught paragraph pairs, stay within article bounds, have captions, credits and original-source links, and resolve to real bundled files.
- Image integration: 152 cover/inline references resolve to packaged JPEG/PNG assets; source fragments, full-figure sizing and local priority pass.
- Reader: every paragraph/checkpoint boundary across all 81 articles, 91 figures, content notes, source retention, resume and completion pass with mocked native views.
- Zoom and world-history unlock/progress compatibility checks pass.
- Active app TypeScript and focused lint of changed TypeScript/CJS sources pass.
- Images were decoded and inspected visually. Portrait documents and low-resolution originals remain uncropped; zoom cannot create missing source detail.

Native views are mocked in automated tests; this does not establish real-device typography, offline installation or gesture behavior. A phone read-through and cold-launch airplane-mode check remain required. As in the previous update, unscoped typecheck of the supplied historical archive encounters unrelated extracted source copies under `assets/gnosi-bookmarks-update-root/`; active-app verification excludes that archive copy without changing the delivered project configuration.
