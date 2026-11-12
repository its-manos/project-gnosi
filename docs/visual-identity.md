# Gnosi visual identity

Gnosi uses original faceted illustrations as its shared visual identity. Player characters and knowledge-world objects belong to the same illustrated world: crisp silhouettes, large angular colour planes and quiet matte shading, with enough personality to feel collectible.

## Art direction

- Use clear, recognisable subjects and a compact silhouette. One dominant subject per icon.
- Build volume with a few intentional flat facets. Avoid realistic material grain, glossy 3D rendering, soft painted highlights and excessive triangular detail.
- Use midnight navy, muted teal, lavender, warm ivory and antique brass. Allow restrained subject-specific colours, such as the moth's sage green or the Oni mask's terracotta.
- Let the app background and UI supply the frame. Artwork has genuine transparency, with no embedded card, label, border or external shadow.
- Keep details legible at 40–64 points. People use the existing friendly adult character proportions; object icons use a matching simplified treatment.
- Appearance choices use neutral presentation. Do not attach personality traits or learning ability to an appearance.

## Category subjects

| Category | Established motif |
| --- | --- |
| Ιστορία | Ionic column capital and short fluted shaft |
| Επιστήμη & Διάστημα | Decorative brass solar-system orrery |
| Φύση & Ζώα | Luna moth |
| Τέχνες & Πολιτισμός | Japanese Oni theatre mask |
| Τεχνολογία | Microchip |
| Γεωγραφία & Κοινωνία | Navigation compass |
| Δύσκολη Ιστορία | Sealed archive folder |

The orrery is a decorative symbol, not an instructional astronomical diagram. Exact scientific relationships belong in the lesson's verified diagrams and text.

## Asset delivery

The category illustrations live under `assets/category-world-icons/faceted/`. `CategoryArtworkIcons` statically requires the seven WebP files and `categoryIconMap` supplies the same illustrations to Home, Category headers and onboarding. Use the existing dimensions, `contentFit="contain"`, zero transition and memory caching. Keep route IDs, card sizing, labels, touch targets and animations independent of the artwork.

Exports fit the transparent subject to 176px, add an 8px transparent margin on all sides, and encode a 192×192 WebP at quality 85, alpha quality 100 and effort 6. These assets cover the app's compact category icons without decoding large source artwork. The previous set remains in the repository; only the faceted set is referenced by the current category registry.

## Generation references and prompts

The built-in image generator created each category illustration using its previous category image as the subject reference and the approved explorer portrait as the style/palette reference. The reference character was not added to the object icons.

Shared prompt: reillustrate the established category motif with the character's bold faceted polygon language, large angular colour planes, clean edges, matte illustrated surfaces and restrained warm highlights. Center a standalone subject on true transparency, readable at 40–64px. Use midnight navy, muted teal, lavender, warm ivory and antique brass with subject-specific accents. Exclude typography, frames, scenery, external shadows, photorealism, material grain, shiny 3D rendering, glow and excessive tiny decoration.

Individual subjects: warm limestone Ionic column; brass orrery with central sun and eight planets; sage/teal luna moth; ivory/terracotta/indigo Oni mask with brass horns; indigo/lavender microchip with brass pins; brass compass with teal face and cream/lavender needle; layered parchment archive with tied cord and terracotta wax seal.

Device review should compare Home and all Category headers at small and large text sizes, with attention to silhouette, contrast, consistent optical size and clear subject recognition.

## Validation of the first faceted category set

All seven files are 192×192 transparent WebP images and total 83,152 bytes (81.2 KiB), compared with 88,552 bytes for the previous category set: a reduction of about 6.1%. The set was visually inspected together at 32px and 64px on the Midnight Atlas background. Metadata inspection verified dimensions, alpha channels and non-opaque backgrounds for every image.

Typecheck and the existing Home/Adventure Path, Category Atlas, Welcome/onboarding and shared card checks pass. These checks preserve the existing icon dimensions, scaling, decorative accessibility behaviour and category navigation. Native visual review remains necessary to confirm the final optical balance on Android and iOS devices.

Android and iOS Metro exports also pass and package the seven faceted files. Inspection of the Android export confirms the previous category WebP files are not included alongside the new set.
