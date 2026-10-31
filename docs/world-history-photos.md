# Photographic and archival world-history covers

## What changed

An audit found twenty lessons still configured with `coverKind: "editorial"` and empty image URLs: all twenty new world-history lessons. The existing image-update validator checked supplementary inline figures, so it could pass while these lessons still had generic covers and diagrams rather than photographic/documentary pictures.

This update removes that editorial-cover flag and supplies an image URL, Greek caption, attribution and original file-page link for each lesson. Existing reader/cover components then render the pictures through their established image and zoom paths. No native APIs, UI components or dependencies are changed. Images appear after the introduction, before the first body section. The existing twenty inline diagrams remain untouched.

The selection includes tablets from Pylos, Apollo 17 Earth photography, living stromatolites, a handaxe, modern harvesting, Uruk, an actual copper ingot from Uluburun, Persepolis, a Buddhist mural, Samarra, Great Zimbabwe, a later manuscript depiction of Mongol archers, a 1507 map, an abolitionist medallion, the 1789 rights declaration in an allegorical presentation, a steam engine, a historical concession map, the 1919 Paris conference, Berlin in November 1989 and a disassembled smartphone.

Modern photographs are not presented as reconstructions of prehistory. Historical maps and paintings are labelled as representations. The Mongol miniature’s source description dates the depicted manuscript to approximately 1430–1434; its filename’s “1305” is not used as its date. The phone is a real photographed object, while the lesson’s supply-chain example remains hypothetical.

## Assets and attribution

Fifteen new JPEG files are bundled offline. Five previous supplementary-image assets are reused by exact URL key, avoiding redundant asset files. Every cover has creator and licence text and a link to the original file page. The licence data and source metadata are retained in `scripts/fixtures/world-history-photo-rights.json`; the human-readable inventory is `assets/lesson-images/WORLD-HISTORY-PHOTO-ATTRIBUTION.md`.

Only public domain/CC0/CC BY/CC BY-SA imagery is used. New source assets were resized and JPEG-encoded, without destructive crops or generative editing. Source licences continue to apply to image derivatives. The app may crop cover previews; its zoom viewer displays the full image. External credit links require network access, while bundled images do not.

## Compatibility and checks

- All 81 lesson IDs and catalogue order remain exact.
- Full-object snapshots preserve the 61 other lessons. For the 20 image changes, every field except `coverKind`, `imageUrl`, `imageCaption`, `imageCredit` and `imageCreditUrl` remains exact. This includes all paragraphs, research sources, quiz questions, explanations, correct indices and progress-related identifiers.
- All 81 lessons now use bundled image covers. There are 172 cover/inline references resolving through 167 unique bundled asset keys; the difference is deliberate reuse.
- All original world-history diagrams remain in the body, and the previous 40-lesson supplementary-image update remains intact.
- World-photo, supplementary-image, bundled-image, reader and world-history progression tests pass. Content validation passes with 81 lessons referenced by inline media and no missing-image warnings.
- Active-app TypeScript and focused lint checks pass. The supplied historical archive’s unrelated extracted source copy under `assets/gnosi-bookmarks-update-root/` remains excluded only by the temporary verification config, not by a delivered config change.
- Files were decoded and visually inspected. Reader and zoom tests use mocked native views; a phone check of loading, cropping, zoom and airplane-mode availability is still needed.

The supplementary-image regression test now explicitly allows this documented cover-only change for the twenty world-history lessons while preserving its original snapshots for the other lessons and all old figure lists. It continues to check every learning-content field rather than silently accepting arbitrary catalogue changes.
