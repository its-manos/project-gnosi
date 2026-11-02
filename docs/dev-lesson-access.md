# Development-only lesson unlocking

## How to use (Expo Go / development)

1. Run `npx expo start --clear` from the app repository and open the development build.
2. From the home screen, open **Προφίλ → Λογαριασμός και ρυθμίσεις**.
3. Under **ΕΡΓΑΛΕΙΑ ΑΝΑΠΤΥΞΗΣ**, tap **Ξεκλείδωμα όλων των μαθημάτων (DEV)**.
4. Browse any category/subcategory. All **implemented** lessons can now open regardless of their predecessor's completion; the original editorial order stays unchanged.
5. Tap **Επαναφορά κλειδωμένων μαθημάτων (DEV)** to test normal progression again.

The override is in-memory and **off by default** each new development session; it is not persisted to storage or Supabase and it does not mark lessons completed, award XP, create answer events, or alter guest/account data. The existing answer/XP/replay rules still run normally **when you actually complete a lesson**. It cannot be enabled in release builds, and unpublished planned lessons remain absent.

## Checks

- `node scripts/test-dev-lesson-unlock.cjs` verifies that the initial state and production behavior still lock later lessons, all implemented lessons unlock when enabled, and switching off restores the original access constraints.
- `node scripts/test-lesson-path.cjs` verifies the regular completion/hydration/account isolation checks still pass without the override.
- `npm run typecheck` and `npm run validate:content` plus device checks are needed before marking QA complete.
- Expo device check: enable in Account, open a later article, turn off, verify it locks again if no prerequisite was completed. Confirm the test switch is hidden from a production build.
