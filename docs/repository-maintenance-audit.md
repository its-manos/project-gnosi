# Repository maintenance audit — 2026-11-02

**Source:** GitHub **main**, starting at commit **6e8a81cea0f200950ce842e7813ca400b4c6eeda**. The maintenance work is proposed on **chore/repository-cleanup-readme**, not merged. The tree at inspection contained 528 tracked files: 160 under **src/**, 60 under **docs/**, 83 **scripts/test-*.cjs** tests and 168 binary image/audio assets.

This is a **remote repository inspection**, not a substitute for local execution, a complete semantic dead-code analysis, device testing or a licence audit. We examined the main entry/navigation, major content/storage/image modules, app/EAS configuration, dependency manifests and the one-time metadata script. We also checked references to that script through the checked-in script and documentation files.

## A. Removed (safe, evidence-backed)

- **scripts/fix-lesson-metadata.cjs**: one-off source rewriter that adds **contentNote**, **coverKind** and **editorialReviewedAt** to the **Lesson** type. All three fields already exist in **src/data/lessons.ts**, so the script's intended operation is now a no-op. It is not in **package.json** scripts, and no references were found in the current documentation, root Markdown or other scripts. It is not a mobile runtime module. This deletion still requires the ordinary local regression run before merging.

No lesson, production TypeScript module, migration, historical fixture, binary asset or licence record was deleted.

## B. Changed safely / future consolidation

- **README.md**: replaced old implementation/phase notes with a developer guide matching the actual custom navigator, current packages, hybrid image delivery, scoped persistence, SQL setup, test commands and EAS profiles. Removed stale links to missing **APPLY-*.md** files.
- **AGENTS.md**: corrected contradictory advice to introduce Expo Router, which this project does not use. Removed claims of a configured lint script.
- **.gitignore**: consolidated ignored environment/credential patterns and added Expo shared cache, generic cache, coverage, local logs, editor metadata and generated Android/iOS archive extensions. Assets, migrations, source and fixtures are not ignored.
- **docs/private-beta.md**: marked its original instructions as historical and corrected language implying every current lesson image is bundled.
- **Dependencies:** no additions, removals or version changes. **expo-status-bar** may merit a later targeted import/native-usage review; don't remove it solely because **App.tsx** uses React Native's **StatusBar**. Check Expo Doctor and a native build first.

Potential deeper refactors (custom navigation complexity, duplicated historical content wrappers and separate image loaders) should be assessed in independent PRs with device coverage, rather than mixed with documentation cleanup.

## C. Deliberately retained

- **src/screens/QuizScreen.tsx**, **src/components/AnswerOption.tsx** and **ProgressBar.tsx**: the standalone quiz is still registered in **AppNavigator** and uses those components.
- **src/components/NextImageWarmup.tsx**: intentional disabled placeholder while image delivery is being tested; do not remove without tracing reader integration and regressions.
- **src/components/ResolvedCommonsImage.tsx**, **ResilientImage.tsx**, Commons resolver and **src/data/bundledLessonImages.ts**: separate Android, cross-platform, bundled and remote image behavior; not duplicates to delete blindly.
- **scripts/configure-play-feedback.cjs**: current **scripts/test-play-feedback.cjs** references it.
- **scripts/bundle-commons-images.cjs**: opt-in packaging/verification utility used by package scripts; do not bulk-package or delete assets as part of cleanup.
- **scripts/fixtures/**, older compatibility modules and **supabase/migrations/**: protect historical answers, progress restores, account isolation, reward rules and backend schema.
- **assets/lesson-images/** credits/manifests and source image binaries: preserve licences and Metro static-asset references.
- **docs/** editorial and historical research files: citations and migration decisions may depend on them even when not imported by runtime code.
- Expo audio, asset, update and system UI dependencies: native configuration or toolchain requirements cannot be assessed by TypeScript imports alone.

## Verification

**Executed remotely:** retrieved the full tracked GitHub tree; inspected **package.json**, lockfile presence, app/EAS configuration, navigation, representative state/content/image modules and documentation; compared stated test-script count with the tree. Checked the new README's 13 internal document links (all exist), documented **npm run** scripts (all defined), direct **node scripts/...** references (all exist) and Markdown code-fence balance. Read the one-off helper and confirmed its required fields already exist; reviewed references across documentation and script sources.

**Not executed:** **npm ci**, TypeScript, Expo Doctor, content validation, native builds, any of the 83 Node tests, SQL integration, runtime image fetches or manual Android/iOS tests. No connected local working tree or executable dependencies were available through this GitHub-only route. Do not treat a previously reported premerge 83/83 result as a post-cleanup test run.

Before merging, use a clean local checkout of the maintenance branch and run:

~~~bash
npm ci
npm run typecheck
npm run validate:content
npm run beta:check:config
npx expo-doctor@latest
for test in scripts/test-*.cjs; do
  echo "Running $test"
  node "$test" || exit 1
done
git diff --check origin/main...HEAD
~~~

Then open on both Android and iOS through the supported development runtime: check remote and bundled covers/inline images, zoom, source credits, app navigation/back, local resume, guest/account isolation, daily/weekly reviews and basic XP. Run **npm run beta:check** only with correctly configured beta environment variables. **No new APK is needed solely for these documentation and script-cleanup changes.**
