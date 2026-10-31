# Historical v1 scoring foundation

The current rules and permanent accounting are documented in [Phase 2](xp-phase-2.md). This document records the earlier foundation and its migration baseline.

Learning gives progress. Remembering gives mastery. Exploring gives rewards.

## Implemented rules

| Activity | XP | Limit |
| --- | --- | --- |
| Complete a lesson | 40 | Once per lesson |
| First lesson attempt accuracy | 0–40, proportional and rounded | First recorded attempt only; perfect replays do not add XP |
| Complete a daily quiz | 20 | Once per Athens date |
| Correct daily answer | 10 | Included in that day's completed result |
| Correctly recall an old mistake in weekly review | 15 | Once per lesson/question |
| Complete a lesson in a new category | 25 | Once per category |

The daily quiz still awards 100 points per correct answer, up to 700. Those quiz points measure accuracy and remain separate from XP. Wrong answers have no penalty, and a zero-score completion still earns participation XP. Reopening a result, immediate mistake practice, repeated taps, and lesson replays do not add rewards.

Levels begin at 0, 200, 600, 1200, 2000 XP and follow `100 × (level − 1) × level`. The card displays XP to the next level and four milestones: first lesson, five lessons, exploring three categories, and first delayed recall. Milestones award recognition, with no additional hidden XP.

## Educational meaning

Questions answered correctly during a lesson are now labelled as correctly answered questions. They are not evidence of later recall. The new recall count uses successful answers in the existing weekly review, where the source lesson predates that review week. Immediate correction/practice does not increase this count.

This phase uses the existing missed-question weekly review. A perfect initial lesson does not yet generate a delayed review, so zero recalled questions does not mean the learner has forgotten the material. A later phase should add spaced review of correctly answered questions too, then use repeated delayed recall to describe durable mastery. The current card makes no claim of scientifically measured or permanent retention.

## Persistence and compatibility

XP, levels and milestones are derived from existing persisted, account-scoped lesson completion events, completed IDs, merged daily history, and weekly answers. No schema, SQL migration, new database rows, or separate XP balance is required. Existing account sync, explicit guest imports and resets retain their current behavior.

Deduplication is by lesson ID, daily date and lesson/question recall identity, rather than counting button taps or event IDs. The earliest recorded lesson completion determines its accuracy bonus; offline duplicate first completions cannot inflate it. Offline sync can reconcile the earliest attempt and therefore adjust the displayed bonus. These are personal progress indicators, not server-authoritative competitive scores.

Legacy completed lessons earn completion and exploration credit. If no original first-attempt score exists, the app does not fabricate an accuracy bonus. Current content and compatible quiz fingerprints determine valid recall evidence; substantive editorial changes can change recall totals and their derived XP. Unchanged stored history produces the same totals after restart or import. No multiplier or penalty is tied to streaks, time spent, or speed.

## UI

- Progress: complete XP/level card, exploration/recall counts, milestone progress and expandable rule breakdown.
- Lesson result: compact total XP/level card; historical/best/latest score behavior remains intact.
- Daily result: separate daily quiz points, exact XP earned by that completed challenge, and compact total progress.
- The card waits for both learning and daily hydration. The progress bar exposes native accessibility values; layout wraps with screen width and font scaling.

## Verification

Run `node scripts/test-knowledge-scoring.cjs` and `npm run typecheck`. The scoring tests cover legacy data, offline duplicate events, replay farming, delayed recall, wrong answers, changed keys, daily date deduplication, future records, exploration, level boundaries, deterministic reconstruction and card states.

Existing result, progress, reader, lesson mistake, weekly review, daily challenge, learning activity, automatic sync, learning backup, daily sync, history, progress stats and editorial compatibility checks were also run. Native views and network transports are mocked in these tests; an installed-device check remains necessary.
