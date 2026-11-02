# ΓΝΩΣΗ (Gnosi)

ΓΝΩΣΗ is a Greek-language educational mobile app for Android and iOS. Readers explore categories and guided paths, read sourced, illustrated lessons, answer questions within the text, and track learning over time. It is built with React Native, Expo and TypeScript.

**Stage:** active development / private-beta testing. The repository contains EAS build and update configuration; it does not represent a published store release.

## What's implemented

- Seven subject categories with subcategories, catalogue search and a map/list discovery interface.
- Illustrated Greek-language lessons with inline checkpoints, answer explanations, source links, image credits, zoom and resumable reading.
- Guided paths with completion-based sequential unlocking (plus a development-only unlock override).
- A date-based shared daily quiz, interest preferences, results and mistake practice.
- Weekly second-chance review, knowledge review, mastery tracking, XP, combos, levels and statistics.
- Onboarding, saved lessons, content-error reporting and accessibility-oriented loading/feedback states.
- Guest play with device-local persistence; optional email/password account, explicit guest-progress import and account-scoped Supabase synchronization.

**Not implemented:** a public, server-authoritative competitive leaderboard. Public-store distribution and external-device acceptance are separate release activities. The native app is the supported target; the presence of a web script does not constitute a tested web deployment.

## Stack and architecture

Versions below are the dependency declarations in **package.json**; **package-lock.json** pins the resolved versions installed by **npm ci**.

| Technology | Declared version / role |
| --- | --- |
| Expo | ~58.0.22, managed project |
| React Native | 0.88.1 |
| React | 19.3.0 |
| TypeScript | ~6.0.3, strict mode |
| AsyncStorage | 2.2.0, local documents and auth storage |
| Supabase JS | ^2.118.0, optional authentication and sync |
| expo-image | ~58.0.18, notably Android Wikimedia thumbnail rendering |
| expo-audio | ~58.0.11, playback feedback |
| expo-updates | ~58.0.20, EAS Update support |
| react-native-svg | 15.16.0, diagrams and map |

Navigation is implemented in **src/navigation/AppNavigator.tsx** with application state from **src/hooks/useLearningApp.ts**. This repository does **not** currently depend on React Navigation or Expo Router. Native platform configuration is generated from **app.json** (there are no checked-in **android/** or **ios/** projects).

### Repository map

~~~text
App.tsx, index.ts                App root, providers and registration
app.json, eas.json               Expo and EAS build/update configuration
src/
  components/                   Reader, quiz, cards, image and account UI
  screens/                      Home, catalogue, reader, daily quiz, reviews, profile
  navigation/                   Custom screen routing and navigation guards
  hooks/                        Screen logic and lifecycle hooks
  state/                        Learning, daily, reporting and analytics stores
  data/                         Lesson catalogue, question banks and image mappings
  quiz/                         Shared question adapters, session engine and compatibility
  knowledge/                    Knowledge model and spaced review
  gamification/                 Reward rules, XP and legacy migration
  play/                         Audio, animation and feedback settings
  lib/                          Supabase client and synchronization transports
  utils/                        Content, progress, image and sync utilities
  theme.ts                      Shared design tokens
assets/                          Branding, bundled lesson images, sound effects
scripts/                         Validators, 83 Node regression tests and test fixtures
supabase/migrations/             Ordered database schema, RPC and policy migrations
supabase/reports/                Analytics SQL
supabase/templates/              Signup confirmation email template
docs/                            Curriculum, editorial, architecture and beta guides
~~~

## Local setup (Ubuntu / Linux)

Install Git, npm and a Node.js 22 release compatible with Expo SDK 58 (Node 22.13 or newer is the baseline documented for this project). Use an Android phone with the compatible Expo Go app, or an Android SDK/emulator if testing on the computer. On Linux, test iOS through Expo Go on a physical iPhone; a local iOS simulator/native build requires macOS.

~~~bash
git clone https://github.com/its-manos/project-gnosi.git
cd project-gnosi
npm ci
npm run start
~~~

Use the development-server QR code on a compatible device. The phone and computer must be able to reach each other; for stale Metro output use:

~~~bash
npx expo start --clear
~~~

**Environment:** the app runs in guest/local-only mode without a configured Supabase client. To enable accounts and cloud synchronization, create an ignored **.env.local** (or **.env**) with the following client-public values from your own Supabase project:

~~~dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
~~~

Never commit actual environment files, Supabase secret/service-role keys, SMTP credentials, signing credentials or auth tokens. The client checks for an HTTPS URL and a publishable key with the **sb_publishable_** prefix in **src/lib/supabase.ts**. Backend features require the SQL migrations in **supabase/migrations/**, applied **in filename order** to the intended Supabase project, plus the hosted email/SMTP configuration described in [Account email setup](docs/account-email-setup.md). An empty or misconfigured backend is **not** equivalent to a fully tested cloud beta.

**Expo Go vs native builds:** Expo Go is useful for daily iPhone/Android UI and JavaScript tests when the required native modules are supported by that SDK's Expo Go runtime. It does not validate release signing, native dependency changes or over-the-air update delivery. Use an EAS build for those checks.

## Running checks

These commands come from **package.json** and the checked-in test scripts:

~~~bash
npm run typecheck
npm run validate:content
npm run beta:check:config
node scripts/test-reader-pilot.cjs
node scripts/test-quiz-engine.cjs
node scripts/test-android-expo-image-integration.cjs
node scripts/test-automatic-sync.cjs
node scripts/test-knowledge-reviews-sql.cjs
~~~

Run the full Node regression collection from the repository root:

~~~bash
for test in scripts/test-*.cjs; do
  echo "Running $test"
  node "$test" || exit 1
done
~~~

There are **83** checked-in **scripts/test-*.cjs** files at the time of this README update. SQL integration tests use the PGlite development dependency. Expo's separate dependency/configuration diagnostic can be run with **npx expo-doctor@latest** after installing dependencies. **npm run beta:check** additionally requires configured beta environment variables. There is no configured **npm test**, ESLint script or GitHub Actions workflow in this repository; don't assume they ran.

Most Node tests mock native components, storage, network, or Supabase. A passing suite does not prove image accessibility, live email delivery, actual EAS Update behavior, permissions, typography or Android/iOS device behavior. Test those on real hardware.

## Content, questions and paths

- **src/data/lessons.ts** defines the category/subcategory catalogue, shared lesson types and lesson aggregation. Topic files alongside it provide the individual lesson content.
- Each lesson has a stable ID, category/subcategory IDs, sections/paragraphs, questions, image metadata and cited sources. Some lessons provide explicit paragraph-anchored checkpoints; older ones use the legacy placement scheme.
- **src/data/articleMedia.ts** and topic media files hold inline figures and attribution; **src/data/bundledLessonImages.ts** maps supported remote source strings to static Metro asset **require()** calls.
- **src/quiz/** implements shared evaluation, scoring and historical compatibility across lesson and daily contexts; **src/utils/lessonPath.ts** controls path ordering and unlocks.
- **src/knowledge/**, **src/gamification/** and the scoped stores retain reviews, XP, history and attempts. Stable IDs, question revisions and compatibility fixtures matter for existing users.

Follow [Curriculum](docs/CONTENT-CURRICULUM-v1.md), [Guided-content standard](docs/guided-content-standard.md), [Editorial tracker](docs/LESSON-EDITORIAL-TRACKER.md), [Lesson paths and results](docs/lesson-path-and-results.md) and [Quiz engine](docs/unified-quiz-engine.md). Run content validation and relevant legacy-regression tests whenever editing published questions or path order. Do not regenerate an existing question ID casually.

## Images and licensing

Gnosi currently uses a **hybrid** approach. Existing local JPEG/PNG assets are packaged through Metro's static **require()** mapping; other Wikimedia Commons cover and inline figures remain remote. **ResilientImage** checks the bundled mapping first and handles remote loading/fallbacks. For unbundled Commons **Special:FilePath** images on Android, **ResolvedCommonsImage** resolves a direct Wikimedia thumbnail using the Commons API, then renders it through **expo-image** with memory/disk caching. Other image paths may use React Native's image loader. Image frames reserve space and figures retain captions and credit/source links.

An offline device can show bundled images, **not** necessarily remote ones. Remote availability and licences must be checked independently; an automated structural test is not a copyright or native-HTTP audit. See [Commons 403 / Android delivery notes](docs/COMMONS-IMAGE-DELIVERY-403.md), [Supplementary images](docs/supplementary-lesson-images.md) and **assets/lesson-images/** attribution manifests.

The opt-in **npm run images:commons:status**, **images:commons:bundle** and **images:commons:verify** scripts inspect or package more Commons images. **bundle** downloads files and increases the native app size; it is **not** part of the routine install or development workflow. Do not remove local assets or licence manifests based on filename-only searches.

## Local progress and cloud synchronization

Learning and daily documents are persisted in AsyncStorage under guest or account-scoped keys. Saved attempts permit checkpoint resume. Sign-in creates an identity-scoped session; guest progress is not automatically merged into the account. Users must explicitly preview/import it. When configured, the app synchronizes account-scoped learning, daily activity and reviews with Supabase; queued or failed operations can be retried. Migrations and compatibility logic protect older data formats and must remain intact.

See [Account setup](docs/account-email-setup.md), [Content reports](docs/content-reporting.md), [Mastery and review](docs/knowledge-mastery-phase-4.md) and [XP rules](docs/xp-phase-2.md). Backend setup, RLS policy acceptance, signup confirmation and cross-device sync require live manual verification.

## EAS builds and updates

**app.json** configures package identifiers, native plugins, an EAS project connection and the **fingerprint** runtime policy. **eas.json** has an internally distributed Android **preview** APK profile (update channel **preview**) and an iOS/store-oriented **beta** profile (channel **beta**); both use EAS environment **preview**.

~~~bash
npx eas-cli@latest login
npm run beta:check
npm run beta:android
# After creating/testing an update-enabled compatible APK:
npm run beta:update:android -- --message "Describe the change"
~~~

The optional **npm run beta:updates:setup** command updates linked-project configuration; inspect its diff before committing. EAS builds require the correct remote environment variables, Expo access and signing credentials. A native module, permissions or native-config change can change the fingerprint runtime and require a **new APK**. JavaScript/content changes can usually ship through EAS Update only to builds with a compatible runtime and channel. Expo Go does **not** verify production OTA updates.

For iOS distribution, **npm run beta:ios** and the EAS submit workflow require Apple-side configuration and credentials; a build profile alone does not publish an app. Follow [Private beta / build guide](docs/private-beta.md) and recheck its historical notes against the current source.

## Contributing and maintenance

1. Branch from current **main**; keep documentation, content and code changes reviewable.
2. Use **npx expo install PACKAGE** for Expo/native dependencies, and commit **package.json** with the lockfile. Check SDK compatibility before changing native packages.
3. Preserve published content IDs, older quiz revisions, migrations, rights metadata and fixtures. Treat legacy components as live until you trace actual navigation and persistence use.
4. Run **npm ci**, typecheck, content validation, the complete regression collection and Expo Doctor; test both platforms on a device for UI, network and native changes.
5. Review **git diff --check**, confirm no secrets or generated outputs are staged, and open a PR. Merge only after review and release acceptance.

Known release gates: real Android/iOS image loading and zoom, external-account signup emails, offline/reconnect transitions, cross-device identity isolation and EAS Update on an installed APK.
