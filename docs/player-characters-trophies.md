# Player characters and trophies

Profile now pairs the live XP class with an original geometric character portrait. Tap the portrait to see all five classes and their level requirements (1, 2, 5, 10, 15). Titles and XP thresholds are unchanged. The character follows the current class automatically; this version does not add an avatar preference or new account schema.

The trophy preview contains the closest unfinished goal and the highest earned tier from up to three families. The collection opens in a dismissible native modal with all 24 milestones. The collection is mounted only while open. Existing Profile links, the XP explanation, loading states, and the accessibility scrolling fallback remain. Progress keeps its current learning/revision layout.

| Family | Targets | Source |
| --- | --- | --- |
| Lessons | 1, 5, 15, 30, 60 | Existing unique completed lessons |
| Worlds | 1, 3, 5 | Existing completed lesson category IDs |
| Daily Quiz | 1, 7, 30, 100 | Unique completed daily history dates |
| Quiz streak | 3, 7, 14, 30 | Historical longest streak, not current streak |
| Review | 1, 10, 25, 50 | Permanent review completion receipts on different dates |
| Hangman | 1, 10, 25, 50 | Positive Hangman reward receipts, up to three per day |

Revision milestones deliberately count completed review days. The mistake model retains latest wrong/correct facts, not a permanent lifetime correction total. Hangman stops issuing reward receipts after the XP cap; extra wins cannot be reconstructed and are not presented as lifetime wins. Future-dated daily and receipt entries are excluded. No new XP rewards, cloud writes, migrations, or dependencies are added. The legacy four-badge projection remains intact for existing consumers.

## Artwork and packaging

Original character artwork was generated with the built-in image generator, with flat geometric personality-test character illustrations as a stylistic reference. No existing character was copied. Runtime assets are `assets/player-characters/{novice,apprentice,explorer,researcher,sage}.webp`.

Shared prompt: one waist-up three-quarter portrait; centered, entire head and props visible; friendly adult proportions; large angular color planes; midnight navy, muted teal, lavender and antique brass; warm skin; true transparency; no text, frame, scenery or tiny details; readable at 64 pixels. Character specifications:

- Novice: short tousled dark hair, teal tunic, satchel, closed book.
- Apprentice: auburn bob, lavender tunic, open book.
- Explorer: dark curly hair, teal cloak, brass compass.
- Researcher: silver round glasses, dark hair in a bun, indigo coat, brass celestial instrument.
- Sage: elderly wizard, white beard, bent purple hat, midnight robe, lavender orb.

Exports trim transparent margins, fit to 240px within a 256px transparent canvas, and encode WebP at quality 85 with alpha quality 100. All five files together are 72,922 bytes (about 71.2 KiB). The existing expo-image renderer uses local Metro sources, memory caching and no transition. No network requests or full-resolution artwork are used at runtime. Runtime portraits were visually inspected together at 92px on the Profile background color.

## Validation and device review

Typecheck, content validation and beta configuration checks pass. Content validation retains 13 existing supplementary-image warnings. Expo Doctor passes 19/20 checks, reporting existing patch-version mismatches for expo, expo-asset, expo-audio, expo-status-bar and expo-updates; release-sensitive dependencies were not changed.

All 157 regression scripts pass across the suite run and focused reruns after updating the affected Profile contracts. Focused tests cover class boundaries/title consistency, milestone thresholds, future dates, reward receipts, historical streaks, hydration/account switching, collection discovery, lazy mounting and native modal dismissal. Existing profile tests were updated for the collection and compact summary strip.

Physical Android/iOS visual checks remain required: Profile on small and large screens, large text scrolling, transparent portraits, class gallery lock labels, trophy progress and collection scrolling, Android Back, XP help, and existing shortcuts. Native view mocks do not validate device layout or image decoding.
