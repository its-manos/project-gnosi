# ΓΝΩΣΗ private beta

The first distribution target is a standalone Android APK. The iPhone profile
is ready for TestFlight, but the owner does not yet have paid Apple Developer
membership. Continue iPhone testing with the existing Expo Go setup until that
account setup is complete. No cloud build, store submission or tester invitation
has been made by this update.

## What changed

Onboarding now has four short steps: welcome; an explanation of daily questions
and guided lessons; selection of 3–5 daily-quiz interests; and a friendly
send-off. Guided lessons are explained as paths where each completion unlocks
the next lesson in the same subcategory. Interest choices personalise the daily
quiz. Finishing saves those choices and opens the homepage, where the user can
choose either way to play. It does not start or reset a quiz or lesson.

Existing users can preview it from **Πρόοδος → Δες τον οδηγό εκκίνησης** without
clearing their progress. Back preserves the selection draft, skipping is
available at every step, and existing quiz difficulty is preserved. Difficulty
can be changed in the daily-challenge settings from the homepage.

## 1. Check the project

Use the working project after the editorial and lesson-path updates. Extract
this update into it, overwriting matching files. Use Node 22.13 or newer. This
update aligns Expo and React Native patch versions with the SDK compatibility
check; install the updated lockfile. No SQL changes are required.

```bash
npm ci
npm run typecheck
node scripts/test-welcome.cjs
node scripts/test-bundled-images.cjs
```

The configured Android package and iOS bundle identifier are both
`gr.gnosi.learning`. This is a proposed identifier, not a claim of store
reservation. If you want another identifier, change both before the first
distributed build. Keep it stable afterward so updates target the same app.

## 2. Link your Expo project

Run these commands in your local Git project, not in an extracted patch folder:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Use your Expo account and create/link the project when prompted. Keep and commit
the `extra.eas.projectId` written into `app.json`. Do not replace it with a
placeholder, and preserve it when applying future configuration changes.
Then configure and validate updates:

```bash
npm run beta:updates:setup
npm run beta:check:config
node scripts/test-beta-build.cjs
node scripts/test-beta-updates.cjs
```

The included `eas.json` already defines:

| Profile | Purpose | Environment |
| --- | --- | --- |
| `preview` | Internal standalone Android APK | `preview` |
| `beta` | Store-signed build for iPhone TestFlight, or an Android AAB later | `preview` |

Both use remote, automatically incremented native build numbers. The Android
preview build receives the `preview` update channel; the future TestFlight build
receives the separate `beta` channel. No development server is required.

## 3. Configure the cloud build environment

Your ignored local `.env` is not automatically available on the EAS server.
Set these two variables in the linked Expo project's **preview** environment,
using the values from your already-working local Supabase configuration:

```bash
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_SUPABASE_URL --type string --visibility plaintext
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --type string --visibility plaintext
```

The CLI prompts for each value. These are client-public configuration values;
do not substitute an SMTP password, Supabase secret key or service-role key.
The same variables can instead be set in the Expo project's Environment
Variables dashboard, with environment `preview` and visibility `plaintext`.

Keep the matching values in your local `.env` or `.env.local`, then run:

```bash
npm run beta:check
```

The check prints missing setting names, never their values. It checks identifier
and profile configuration, Expo project-ID shape and required backend values.
It does not verify hosted database migrations, network access or live signup.
The EAS post-install hook runs the corresponding check against the remote build
environment to prevent accidental local-only account behaviour in the beta.

This update does not enable SMTP, change email confirmation or apply SQL. Keep
the working private-beta auth setting already tested. If confirmation is
enabled, email delivery must be verified before inviting testers.

## 4. Build and install the Android APK

```bash
npm run beta:android
```

If this is the first Android build and there is no existing signing key, let EAS
generate the Android keystore when prompted. If you already distributed an app
with this package, keep its existing signing credentials instead.

When EAS finishes, use its download/install link on an Android phone. Android
may ask you to allow installation from that browser. The APK is separate from
Expo Go and will not inherit its local guest progress. Existing account progress
can be loaded by signing in to the same account.

Test it yourself before sharing:

1. Fresh start → see both ways to play → choose daily interests → finish on the
   homepage. Open a guided lesson or start the daily challenge from there.
2. Finish with some wrong answers → use mistake practice → open the next lesson.
3. Verify later lessons are locked and the first lesson of another path is open.
4. Close/reopen mid-lesson; also test a completed lesson and saved articles.
5. Create/sign into an account, sign out, and check account/guest separation.
6. Test offline reading and progress, then reconnect. Current lesson covers and
   inline illustrations are bundled JPEG/PNG assets and should load offline;
   external source/credit links and future unbundled images still need network.
7. Submit one test content report and verify it arrives in the private inbox.

Start with 5–10 testers after those checks pass. Share the actual EAS build link,
not the Expo Go development QR. Ask which screen confused them, which lesson
held their attention and whether they wanted another. For a general bug, collect
the phone/OS, build, steps and screenshot. No messages or invitations are sent
automatically. Compatible code, content and asset changes can now be published through EAS
Update. Native changes still require a new build; see the update workflow below.

## Automatic updates after the one-time APK installation

This patch includes the complete bundled-image fix. Apply it to the working
project, then run:

```bash
npm ci
npm run beta:updates:setup
npm run typecheck
node scripts/test-beta-build.cjs
node scripts/test-beta-updates.cjs
node scripts/test-bundled-images.cjs
npm run beta:check
npm run beta:android
```

The setup command edits your existing app.json: it reads and preserves your
linked `extra.eas.projectId`, app identifiers, icons and other settings. This
patch deliberately does not include a replacement app.json. Commit the resulting
config along with the package lockfile. No new Supabase variables or SQL are
needed; use the already-configured preview environment.

Install the new APK over the old one using the same package and signing key.
Everyone using a previous APK must install this version once: those earlier
builds cannot gain the native update module through an over-the-air update.
The build command is a cloud build; this patch does not itself create an APK.

For subsequent compatible Android changes, test them and publish:

```bash
npm run typecheck
npm run beta:check
npm run beta:update:android -- --message "Describe this update"
```

Publishing is an explicit action by the project owner. Saving files, committing
or applying a patch does not publish it. The update command uses the `preview`
EAS environment, including the public Supabase URL and key, and targets only
Android installations on the `preview` channel with a matching runtime.

The installed app checks on a cold launch, downloads a compatible update in the
background and applies it on a subsequent cold launch. It does not force a
reload during a lesson or quiz, and opening the app offline still uses its
embedded or previously downloaded version. A return from the background is not
necessarily a cold launch. For QA, open the installed release APK online, allow
the download to finish, close it fully, then reopen it. Expo Go does not test
this release-update path.

The `fingerprint` runtime policy derives compatibility from native project
inputs. Adding/upgrading native libraries, changing permissions or other native
configuration can change that fingerprint: create and install a new APK in
that case. JavaScript, Greek lesson text, layout and image assets can normally
be updated without an APK when their native requirements remain compatible.
Launcher icons and splash/native configuration need a new build. Keep the
project's dependencies and lockfile consistent between the build and updates.

Verify one small visible update on your own installed APK before relying on OTA
for the tester group. Account/guest progress, resume and scoring must still work.
No cloud update has been published by this patch. EAS Update usage is subject
to the owner's Expo plan limits; check the Expo dashboard as testing grows.

After TestFlight is available, the equivalent command for its separate channel
is `npm run beta:update:ios -- --message "Describe this update"`.

## 5. iPhone beta after Apple membership

After enrolling in Apple Developer, create the App Store Connect app with the
matching bundle identifier and complete its required setup. Then:

```bash
npm run beta:ios
npx eas-cli@latest submit --platform ios --profile beta --latest
```

Follow EAS's Apple authentication/signing prompts on your computer. After Apple
processes the upload, configure the TestFlight testing group in App Store
Connect. External TestFlight testing may require Beta App Review. This is beta
distribution, not an automatic public App Store release. Never paste signing
credentials or account passwords into chat.

## Verification completed locally

TypeScript, lint, onboarding interactions, recommendation/lock handling,
release-configuration tests and existing progress/review/sync regressions are
checked locally. The EAS CLI schema accepts both profiles. An Expo Android bundle
export is also checked. Native interaction tests use mocked views; these checks
do not replace installing the signed APK on a phone.

The native launcher icons are still the Expo starter assets. They work for this
private build; custom ΓΝΩΣΗ branding remains a public-release polish task.

## Official references

- [EAS Update setup](https://docs.expo.dev/eas-update/getting-started/)
- [SDK 58 update behavior](https://docs.expo.dev/versions/v58.0.0/sdk/updates/)
- [Runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/)
- [First EAS build](https://docs.expo.dev/build/setup/)
- [Internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Remote version management](https://docs.expo.dev/build-reference/app-versions/)
- [iOS submission and TestFlight](https://docs.expo.dev/submit/ios/)
