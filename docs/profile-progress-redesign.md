# Profile and Progress redesign (after Phase 4)

The previous Progress page combined next actions, XP rules, achievements, retention, reading completion, activity charts, quiz history, account controls, privacy and development tools. The new layout gives each page a clear job.

| Page | Default contents | Details on demand |
| --- | --- | --- |
| Progress | Resume lesson, one next-action review card, Knowledge / Reading selector | Three strongest subjects first; all subjects, mastery help and learning units expand independently. Reading has its own category bars and collapsed completed-lesson list. |
| Profile | Guest/account identity, existing live title/level/XP card and achievements, two quick metrics | Links to statistics, account/settings, interests and the startup guide. |
| Statistics | Lesson totals, quiz streak and known-correct question count, activity chart | Daily accuracy, point totals, streak record and ten most recent daily results behind the existing disclosure. |
| Account/settings | Existing authentication, backup, reports, account sync/import | Usage-sharing control and existing development-only reset tools. |

The home avatar and Progress header open Profile. There is no fifth bottom tab. A profile entered from Home keeps Home selected; a profile entered from Progress keeps Progress selected. Statistics and account settings return to Profile before the original launcher. Android Back follows the same hierarchy. Interest preferences close back to Profile. The selected Knowledge/Reading view survives a trip to Profile or a lesson during the current app session.

Scheduled review is the main action when due, with unfinished review taking priority. Otherwise the main action returns to exploration and free practice is a secondary link. Pending weekly mistakes remain a small secondary link rather than another large competing card. Completed weekly results are still reachable from the existing Home card/results flow.

The knowledge view does not repeat the review launch or full explanation. It shows three strongest subject bars initially (stable catalogue order breaks ties); all eight subjects remain available. The difference between retention and articles read remains explicit. The reading view preserves all completed lessons, including those beyond the first few results. There is no automatic conversion of reading into mastery.

## Data and implementation

This is a UI/navigation refactor only. No SQL migration, dependency, XP/mastery rule, quiz selection, saved-answer format or cloud-write behavior changes. Existing hooks and stores provide live data; no new profile fetch, editable username/avatar schema or duplicated player state is introduced. Identity uses the existing account email or guest label. Account switches keep the established scoped-store lifecycle.

The existing `KnowledgeProgress` component renders player title directly from live level, retaining the no-restart title fix. Existing legacy score checks and loading/empty states move to Statistics. Privacy stays opt-in through the existing UsageSharing component. Guest import remains explicit in Account/settings. The development reset remains development-only, guest-only through its existing controls and store guard, with confirmation.

The app's established navigator is extended for `profile` and `player-stats`; this focused redesign does not migrate the navigation framework. Analytics maps Profile to the existing `account` value and Statistics to `progress`, so the current backend allowlist remains valid. Those analytics screen counts are intentionally grouped rather than separately identifying the new pages.

Changed UI: `ProgressScreen`, `HomeScreen`, `AccountScreen`, `KnowledgeMastery`, `AppNavigator`, route type. New UI: `ProfileScreen`, `PlayerStatsScreen`, `ReviewActions`, `LearningDevTools`. Existing detailed statistics moved rather than being deleted. No changes to the database or learning stores.

## Validation

- Typecheck passes.
- Lint over changed source/tests has zero errors and the single pre-existing navigator analytics dependency warning.
- Full script suite: **48/50 passed**. The two existing beta configuration failures remain `test-beta-build.cjs` and `test-beta-updates.cjs`; this fixture lacks the expected EAS/update configuration. Project-specific Expo config was not replaced.
- New/updated headless UI checks cover guest/account identity, profile links, focused Progress, exclusive tabs, all completed lessons, empty/loading states, the three-subject preview/full expansion, optional mastery explanation, one review CTA, due/resume/practice/weekly states, retained daily history, honest legacy scores, route return origins, bottom-tab selection, preferences and Android Back.
- Existing live-title, mastery, quiz, offline-store/sync, XP, account, onboarding and SQL checks pass. Navigation/disclosure tests were rerun after adding view retention and the final assertions.
- Native views are mocked. No Android/iOS device or simulator visual check, real Supabase action, commit, push or beta update was performed here.

## Manual device checks

1. Open Progress with a fresh guest: no invented progress, an exploration action, clear knowledge/reading separation. Verify the profile link and Home avatar.
2. With a lesson in progress, confirm resume is near the top and opens the correct checkpoint. With reviews due, confirm one main review action; leaving and returning preserves the existing review session.
3. Switch Knowledge/Reading. Expand all subjects/help/units. Reading shows all completed lessons; open a later entry and return to Reading. Stats/XP/account controls should not fill this page.
4. Open Profile from Home and from Progress. Confirm the proper bottom tab remains selected and both on-screen Back and Android Back return to the launcher. Open Statistics/account settings and return through Profile.
5. Check guest label and signed-in email, offline/loading states, account switch, guest import, source links, live title change after a level-up, and that no login is required to use Profile or Progress.
6. Open daily history in Statistics and compare totals/recent results with the previous release. Open interests from Profile and close/save them; return to Profile without starting a quiz.
7. Confirm usage sharing remains opt-in and available in settings; development reset is absent from production and cannot reset account data.
8. On Android and iOS, check small screens, large text, wrapping email/title, safe areas, selected tab announcements and VoiceOver/TalkBack disclosure states. Physical visual QA is still required.

Phase 5 remains on hold until the user confirms this redesign and asks to continue.
