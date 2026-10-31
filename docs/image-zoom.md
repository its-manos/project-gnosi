# Lesson image zoom

Adds a full-screen viewer for lesson-reader photo covers and inline illustrations, including architecture plans and astronomy diagrams. Catalogue-card taps still open lessons. Generated decorative editorial covers are not zoom targets.

## Controls

- Tap an image or its small expand badge to open it.
- Pinch with two fingers to zoom from fit (100%) up to 600%.
- Drag to inspect the enlarged image; panning stays within image bounds.
- Double-tap to enlarge around the tap point; double-tap again to return to fit.
- Use + / − buttons as an alternative to gestures, or “Επαναφορά” to reset.
- Close with “Κλείσιμο ×,” Android Back, or the accessibility escape action.
- Rotate the phone to refit the image within the new viewport.

Images use contain sizing in the viewer, preserving the complete diagram without cropping. Captions and linked credits remain available in a scrollable footer. The footer adapts to shorter windows. The modal measures its own safe area and does not remount the lesson reader, change answers or reset the reading position.

The viewer uses the existing bundled bitmap image map and the existing native Image loader. Current lesson images remain available offline; future remote images retain the loader's normal loading/failure states. Zooming does not request another network copy or parse an SVG filename as markup. It enlarges the bundled source; it does not add image detail beyond that source's resolution.

No gesture SDK or native dependency is added. Gestures use React Native PanResponder. Zoom buttons and adjustable accessibility actions support people who cannot pinch. Underlying thumbnail descriptions are represented once by the accessible open button; the modal exposes its caption, zoom level, controls and credit link.

## Apply and preview

Extract into the project folder and replace matching files, then run:

```bash
npm run typecheck
node scripts/test-image-zoom.cjs
node scripts/test-bundled-images.cjs
npx expo start --clear
```

Phone smoke check:

1. Open Τέχνες & Πολιτισμός → Αρχιτεκτονική → Κάτοψη, τομή, όψη (using your existing lesson unlock/progress).
2. Tap the Palladio plan inside the article. Check that the entire image fits first, then pinch/drag to inspect a corner and its labels.
3. Double-tap twice, try the buttons, and rotate to landscape. Confirm fit resets and Close stays reachable.
4. Open the credit link and return. Try a long caption and scroll its footer.
5. Close the viewer using both the close button and Android Back. Confirm you return to the same place in the article with the same checkpoint answers.
6. Try a photo cover and an astronomy diagram. In airplane mode, reopen a bundled illustration and zoom it.
7. Try TalkBack/VoiceOver if available: open button, caption/zoom value, +/-/reset and escape/close.

Once checked, publish through the existing OTA-enabled Android beta:

```bash
npm run beta:update:android -- --message "Add lesson image zoom"
```

No npm install, SQL change or new APK is required for the existing update-enabled base. Nothing has been published automatically.

## Validation

TypeScript, image-zoom, existing article-image, bundled-image, 61-lesson reader, analytics UI and OTA-configuration tests passed. Android export passed. Tests cover contain geometry, focal-point anchoring, clamped pan/scale, two-finger to one-finger transitions, native End + Release double-tap sequencing, rotation/reset, lazy mounting/dismissal, modal Back handling, accessible controls, dimensions from the native loader, unchanged bundled source priority, captions and credits. Native views and gestures are mocked; phone rendering and gesture feel still require the check above.

References: [React Native PanResponder](https://reactnative.dev/docs/panresponder), [Modal](https://reactnative.dev/docs/modal), [Image](https://reactnative.dev/docs/image).
