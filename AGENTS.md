# Repository contributor and agent notes

ΓΝΩΣΗ is a React Native / Expo SDK 58 / TypeScript app for Android and iOS. **Read the actual code and package.json before changing architecture or dependencies.** Keep published content, saved progress and supported beta builds compatible.

## Architecture: use what exists

- **index.ts** registers **App.tsx**. The app uses **src/navigation/AppNavigator.tsx** and **src/hooks/useLearningApp.ts** for **custom state-based navigation**, not Expo Router or React Navigation. Do not create **src/app/** routes or introduce a routing library in routine maintenance.
- Shared view components live in **src/components/**, screens in **src/screens/**, state and persistence in **src/state/**, hooks in **src/hooks/**, Supabase transports in **src/lib/** and content in **src/data/**.
- Questions and historical compatibility live in **src/quiz/**, XP in **src/gamification/** and knowledge reviews in **src/knowledge/**. Do not bypass the shared scoring/session model.
- The image pipeline is hybrid: **src/data/bundledLessonImages.ts** maps local Metro assets; **ResilientImage** and **ResolvedCommonsImage** handle remote loading and Android Wikimedia compatibility. Preserve attribution manifests.

## Visual identity

Use the approved faceted illustration language in **docs/visual-identity.md** for new UI artwork. Player characters and category objects share crisp silhouettes, restrained angular shading and the Midnight Atlas palette. Reuse **categoryIconMap** for category illustrations and bundle compact transparent WebP assets through the existing image renderer.

## Expo / native work

Expo SDKs change often. Before touching Expo, React Native or EAS APIs, check **package.json** and the versioned [Expo SDK 58 documentation](https://docs.expo.dev/versions/v58.0.0/). Expo's documentation index is [llms.txt](https://docs.expo.dev/llms.txt).

- Use **npm ci** for reproducible installation and **npx expo install PACKAGE** for SDK-compatible native packages.
- The checked-in **app.json** and **eas.json** configure the Expo project and Android/iOS EAS channels. Treat EAS IDs, fingerprints, plugin settings and package identifiers as release-sensitive.
- **ios/** and **android/** are generated native folders and are not tracked. Change native configuration through Expo config/plugins, not by inventing manually maintained native files.
- Expo Go is a development aid. A new native module, native permission or changed fingerprint compatibility requires a new installed build. Do not claim a mock test proves behavior on hardware.
- Use **npx eas-cli@latest** (not an assumed globally installed EAS CLI) for cloud operations.

## Validate before proposing changes

~~~bash
npm ci
npm run typecheck
npm run validate:content
npm run beta:check:config
npx expo-doctor@latest
for test in scripts/test-*.cjs; do node "$test" || exit 1; done
git diff --check
~~~

There are 83 Node regression scripts in **scripts/** at this writing. Many mock native code or use PGlite; run real-device checks as appropriate. There is no configured lint or **npm test** script in **package.json**; do not report either as passed without adding/configuring and actually running it.

Keep historical fixtures, Supabase migrations, quiz revision compatibility, content IDs, image rights metadata and all potentially referenced static assets. Never delete local **.env** files or secrets. Prefer small, reviewable commits and obtain approval before merging into **main**. See **README.md** and **docs/private-beta.md** for the current developer and build workflow.
