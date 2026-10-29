# ΓΝΩΣΗ — Ο Άτλας της Γνώσης

A Greek-language mobile micro-learning app built with React Native, Expo, and TypeScript. Readers explore a fantasy atlas of knowledge, choose a topic, read an illustrated article with sources, answer short checkpoints throughout the article, and build a local learning history.

> **Status:** early MVP. The app is intentionally account-free; learning progress and bookmarks are stored on the device.

## Features

- Dynamic fantasy atlas for categories and subcategories
- Greek-language articles split into sections and paragraphs
- Hero and inline illustrations with captions and attribution links
- Sources and further-reading links for each article
- Multiple-choice checkpoints after pairs of paragraphs
- Progressive reading: the next passage unlocks after an answer
- Instant feedback and lesson results
- Local persistence of completed lessons and unfinished checkpoint attempts
- Resume card for the most recent in-progress lesson
- Local article bookmarks
- Full-text search across titles, summaries, categories, article content, and source titles
- Bottom navigation and a warning before leaving an unfinished lesson
- Dark navy/violet visual theme and iOS safe-area support

## Technology

- Expo SDK 58
- React Native 0.88
- React 19.3
- TypeScript with strict mode
- AsyncStorage for device-local progress and bookmarks
- `react-native-safe-area-context` for display cutouts and home indicator insets
- `react-native-svg` for the fantasy atlas and SVG illustrations

Expo SDK 58's documented minimum Node version is 22.13.x. Use a compatible Node 22 release when developing with this project.

## Run locally

```bash
npm install
npx expo start
```

Open the app with Expo Go on a compatible device. The phone and development computer generally need to be on the same network. If Expo behaves as though it has stale code, use `npx expo start -c`.

For Android builds, install the SDK-compatible system UI package so the `userInterfaceStyle: "dark"` setting is applied:

```bash
npx expo install expo-system-ui
```

## Project structure

```text
App.tsx                            # Safe-area provider, app root and status bar
app.json                           # Expo config and app branding
src/
├── components/                     # Reusable UI components
│   ├── ActionButton.tsx
│   ├── AnswerOption.tsx             # Used by the legacy standalone quiz
│   ├── AppHeader.tsx
│   ├── ArticleFigure.tsx
│   ├── BottomNavigation.tsx
│   ├── FantasyMap.tsx
│   ├── InlineQuestionCard.tsx
│   ├── LessonCard.tsx
│   ├── ProgressBar.tsx              # Used by the legacy standalone quiz
│   ├── SourceLink.tsx
│   └── ...
├── data/
│   ├── lessons.ts                   # Categories, subcategories and base lesson
│   ├── additionalLessons.ts         # Additional lesson catalogue
│   ├── articleMedia.ts              # Inline figures and attribution metadata
│   └── questions.ts                 # Reserved general-knowledge question bank
├── hooks/
│   ├── useLearningApp.ts            # Navigation, checkpoints and local progress
│   └── useSavedLessons.ts           # Bookmark state and persistence
├── navigation/
│   └── AppNavigator.tsx             # Routes the current screen and leave warnings
├── screens/
│   ├── HomeScreen.tsx
│   ├── CategoryScreen.tsx
│   ├── SubcategoryScreen.tsx
│   ├── LessonScreen.tsx
│   ├── ResultsScreen.tsx
│   ├── SearchScreen.tsx
│   ├── SavedLessonsScreen.tsx
│   └── QuizScreen.tsx               # Legacy standalone quiz; not the main flow
├── utils/
│   └── lessonProgress.ts            # Shared paragraph/checkpoint calculations
└── theme.ts                         # Shared design tokens
```

## Content model

- **Category**: a top-level country in the fantasy atlas.
- **Subcategory**: a region within a category.
- **Lesson**: title, summary, introduction, image and credits, sections/paragraphs, sources, and questions.
- **Inline checkpoint**: one of a lesson's questions, displayed after every two paragraphs until the reader answers.

Add lessons in `src/data/lessons.ts` or `src/data/additionalLessons.ts`. Keep IDs unique and stable; each lesson's `categoryId` and `subcategoryId` must match existing entries. Keep image attribution with each remote figure and verify image licences before public release.

## Local persistence behavior

- Completed lesson IDs are stored under `@gnosi/completed-lesson-ids`.
- Unfinished inline-question attempts are stored under `@gnosi/in-progress-lesson-attempts`.
- Bookmarks are stored under `@gnosi/saved-lesson-ids`.
- Reopening an unfinished lesson restores answered checkpoints and opens near the paragraph before the next unanswered question.
- Opening a previously completed lesson starts a new reading attempt while preserving its completion record. If the reader answers a checkpoint and leaves, that replay can also be resumed.
- Data is not synced across devices or backed up to an account. Reinstalling the app may remove it.

## Known limitations / next work

- There is no account system, backend, cross-device sync, or cloud backup.
- The main learning journey uses inline checkpoints. `QuizScreen.tsx`, `questions.ts`, `AnswerOption.tsx`, and `ProgressBar.tsx` are legacy/reserved code and should either be brought into use intentionally or removed in a dedicated cleanup.
- Remote images require a network connection and can change or become unavailable; an image fallback would improve resilience.
- Some SVG map labels are very small on compact screens. Add an accessible category/region list alternative and review text scaling before public release.
- There is no automated test suite or CI pipeline yet. Test the resume, completion, bookmark, and leave-warning flows manually after changes.
- Article facts, references, source URLs and image licences need a final editorial review before public release.

## Suggested validation commands

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

Run these after installing dependencies and fix any warnings relevant to the project before publishing.
