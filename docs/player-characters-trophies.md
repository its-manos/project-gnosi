# Player identity and trophies

Home and Profile share the character for the live player class and the same saved appearance preference. Home places the portrait inside its existing 50-point XP ring with a compact level badge. Profile shows the larger portrait, level/total XP, one XP progress bar and the next-class hint. The streak row and XP-help control are removed. Existing shortcuts, loading states and the accessibility scrolling fallback remain.

## Classes and appearance

| Class | First level | Character motif |
| --- | --- | --- |
| Αρχάριος | 1 | Novice traveller with a closed book |
| Μαθητευόμενος | 2 | Apprentice with an open book |
| Εξερευνητής | 5 | Explorer with a compass |
| Ερευνητής | 10 | Researcher with glasses and a celestial instrument |
| Σοφός | 15 | Elderly wizard with a book and lavender orb |

Tapping the Profile portrait opens two appearances of the current class. Only their portraits and selection indicators are displayed; neutral accessibility labels distinguish “Εμφάνιση 1” and “Εμφάνιση 2”. The selected appearance follows level/class changes automatically. No earlier/later class portraits mount in the picker.

`PlayerAvatarStore` persists the internal `male`/`female` asset variant through AsyncStorage, scoped separately to each account and the guest profile. This is a device preference, not cloud-synced account data. Reads are deduplicated, controls wait for hydration, overlapping writes are blocked, and failed saves retain the previous choice with retry feedback. Scoped stores survive screen remounts and pending writes. A loading portrait keeps its reserved frame empty instead of flashing another appearance.

## Trophy collection

The preview shows the closest unfinished goal and the highest earned tier from up to three families. The full collection contains 24 milestones and mounts only when opened. Roman numerals sit beside trophy titles; full requirements remain accessible in the collection. Cards use the established navy surfaces, borders and spacing, with the shared `TrophyIcon` and `ProgressTrack` components.

| Family | Targets | Saved evidence |
| --- | --- | --- |
| Lessons | 1, 5, 15, 30, 60 | Unique completed lessons |
| Worlds | 1, 3, 5 | Categories containing completed lessons |
| Daily Quiz | 1, 7, 30, 100 | Unique completed daily history dates |
| Quiz streak | 3, 7, 14, 30 | Historical longest streak |
| Review | 1, 10, 25, 50 | Permanent review receipts on distinct dates |
| Hangman | 1, 10, 25, 50 | Positive reward receipts, up to three per day |

Review milestones count credited review days: the mistake model does not retain a permanent lifetime correction total. Hangman wins after the XP cap are not recorded as reward receipts and cannot be reconstructed. Future-dated daily and receipt entries are excluded. The legacy four-badge projection remains available to existing consumers. XP rules, backend documents and Progress behaviour are unchanged.

## Unlock celebrations

Accepted local lesson completions, rewarded Hangman wins, completed Daily Quizzes and credited reviews compare before/after metrics using the same projection as Profile. Only crossed thresholds emit events. Hydration, imports and remote sync never emit them; persisted progress prevents replay after restart without another cloud field or progress write.

A silent top banner groups milestones earned by one action and dismisses after 2.8 seconds. It uses shared trophy glyphs/ranks, respects the app's animation preference and system reduced motion, filters account scope, deduplicates notices and clears on backgrounding. The overlay does not intercept touches or change dashboard height. Existing XP feedback and sounds remain separate.

## Artwork and delivery

The ten transparent 256px portraits in `assets/player-characters/` total 145,918 bytes (142.5 KiB); every file is below 25 KB. They use local Metro sources, memory caching and no transition through the existing expo-image renderer. Portraits fit a 240px subject within a 256px canvas, encoded as WebP at quality 85 and alpha quality 100.

Original artwork was created with the built-in image generator. The shared character prompt specifies a friendly adult waist-up three-quarter portrait, large angular colour planes, midnight navy/teal/lavender/antique brass, warm skin and true transparency; no text, frame, scenery or tiny details. Companion variants preserve each class's pose, clothes, props, framing and palette while changing face/hair. For the elderly woman wizard, the beard is removed while retaining the hat, robe, book and orb. These are original characters, not copies of personality-test characters.

The seven category illustrations follow the same [faceted visual identity](visual-identity.md). Their 192px WebP set totals 83,152 bytes (81.2 KiB). Previous artwork remains in the repository, while current Metro bundles reference the new set.

## Verification

Validation covers class boundaries, asset mappings/dimensions/transparency, appearance restoration and account isolation, failed/overlapping saves, local lesson/Daily Quiz/Hangman milestones, quiet restart/import, duplicate suppression, grouped notices, automatic dismissal, backgrounding and reduced motion. Home checks preserve the existing avatar footprint and verify live appearance/level updates.

Typecheck, content validation, beta configuration and Android/iOS Metro exports pass. Content validation has 13 existing supplementary-image warnings. Expo Doctor reports existing patch mismatches; release dependencies are unchanged. Automated native-view mocks do not prove physical screen layout or image decoding.

On-device review covers Home/Profile fit, small Android screens and large text, portrait clarity, appearance persistence after restart/class changes, collection scrolling/Android Back, and a single brief celebration for a new milestone. The user has reviewed and accepted the visual direction; this workspace has no emulator or connected-device tooling.
