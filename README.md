# ΓΝΩΣΗ — Greek Micro-Learning App

A Greek-language mobile learning app built with React Native, Expo, and TypeScript. Users browse categories and subcategories, read short illustrated lessons with sources, and take a quiz based on the lesson.

> **Current stage:** early MVP/prototype. Only the Ancient Athens lesson is populated. Most other topics are placeholders.

## Features currently implemented

- Dark, modern visual identity with violet accents
- Category and subcategory browsing
- Article screen with sections, an image/caption/credit, and source links
- Quiz tied to each lesson, with answer feedback and a results screen
- In-session completed-lesson count
- Works without account registration

## Technology

- React Native
- Expo
- TypeScript
- `react-native-safe-area-context`

## Run locally

From the project root:

```bash
npm install
npx expo start
```

Open the project using Expo Go on a compatible phone, or use an available emulator. The phone and development computer generally need to be on the same network.

## Project structure

```text
App.tsx                         # App entry point and SafeAreaProvider
src/
├── components/                 # Reusable UI building blocks
│   ├── ActionButton.tsx
│   ├── AnswerOption.tsx
│   ├── AppHeader.tsx
│   ├── CategoryCard.tsx
│   ├── LessonCard.tsx
│   ├── ProgressBar.tsx
│   ├── SourceLink.tsx
│   └── SubcategoryCard.tsx
├── data/
│   └── lessons.ts              # Categories, subcategories, lesson content and quizzes
├── hooks/
│   └── useLearningApp.ts       # Screen selection, quiz state and navigation actions
├── navigation/
│   └── AppNavigator.tsx        # Chooses which screen is displayed
├── screens/
│   ├── CategoryScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LessonScreen.tsx
│   ├── QuizScreen.tsx
│   ├── ResultsScreen.tsx
│   └── SubcategoryScreen.tsx
└── theme.ts                    # Shared colors and design tokens
```

The supplied refactor pack intentionally **does not include `src/data/lessons.ts`**. Keep your existing file so you don't lose the lesson text, sources, image details, or questions. The existing file needs to export `categories`, `subcategories`, `lessons`, and the types `Category`, `Subcategory`, and `Lesson` using the fields in the current app.

## Apply the refactor to your existing project

1. Commit or push your current working version first.
2. Extract this refactor pack into the root of your existing project, allowing it to replace `App.tsx` and add the new files/folders.
3. **Keep your existing `src/data/lessons.ts`**. The archive deliberately excludes it so your lesson text, image information, sources, and quiz questions are not overwritten.
4. Start Expo again with `npx expo start` and test Home → Category → Subcategory → Article → Quiz → Results.
5. If your `lessons.ts` does not export the `Category`, `Subcategory`, and `Lesson` types and the `categories`, `subcategories`, and `lessons` arrays, reconcile those names before running.

The archive is a source-code refactor, not a complete standalone Expo project: keep your existing `package.json`, app configuration, assets, and lockfile.

## Content model

- A **category** groups related subjects (e.g. Ιστορία).
- A **subcategory** groups lessons within a category (e.g. Αρχαία Ελλάδα).
- A **lesson** contains an intro, sections/paragraphs, image metadata, sources and its own questions.
- A **question** contains answer choices, a correct-answer index and an explanation.

Add or edit lesson content in `src/data/lessons.ts`. Keep IDs stable and unique; a lesson's `categoryId` and `subcategoryId` must match existing records.

## Architecture conventions

This project uses React's component-based architecture rather than classical class-based object-oriented programming. Each file has a focused responsibility:

- **Screens** arrange complete views and accept their data/actions through props.
- **Components** are reusable interface elements.
- **The hook** owns navigation and quiz state.
- **The navigator** connects state to the appropriate screen.
- **Data** describes the content and its relationships.
- **Theme** centralizes shared visual tokens.

Keep business logic out of screen components where practical. Prefer small components and explicit props over a very large `App.tsx`.

## Current limitations / next milestones

- Progress is in memory only and resets when the app restarts.
- Only a small sample content set exists.
- No accounts, backend, or cloud sync yet.
- No search, bookmarks, content filters, or daily streak persistence yet.
- Before publication, fact-check all lessons, verify source URLs, and confirm image licensing/attribution.

Suggested next steps: test the refactored navigation, add a few manually reviewed lessons, persist reading/quiz progress locally, then consider accounts and cloud sync.

## Suggested commit message

```text
refactor: modularize learning flow and document MVP
```

If this commit also introduces the feature work that has not yet been committed, use:

```text
feat: add category-based micro-learning experience
```
