# ΓΝΩΣΗ — Saved lessons update

This update adds local bookmarks and a Saved Articles screen to the existing modular Expo project.

## Files to copy

Copy the `src/` directory in this archive into your project root, merging directories and allowing replacements for these files:

- `src/components/ActionButton.tsx`
- `src/hooks/useSavedLessons.ts` (new)
- `src/navigation/AppNavigator.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/LessonScreen.tsx`
- `src/screens/SavedLessonsScreen.tsx` (new)

Keep your existing `src/data/lessons.ts`, other screens, theme, package.json, and assets.

## One-line manual change required

Open `src/hooks/useLearningApp.ts` and add `| "saved"` to the `AppScreen` union, for example:

```ts
export type AppScreen =
  | "home"
  | "category"
  | "subcategory"
  | "lesson"
  | "quiz"
  | "results"
  | "saved";
```

Do not replace your existing `useLearningApp.ts`: it contains the completed-lesson persistence you've already tested.

## Storage

Bookmarks use AsyncStorage key `@gnosi/saved-lesson-ids`, separate from completed progress. The update assumes you have already installed `@react-native-async-storage/async-storage`.

## Test

1. Start the app with `npx expo start`.
2. Open the Ancient Athens lesson and tap “Αποθήκευση άρθρου”.
3. Return to Home and open “Προβολή αποθηκευμένων”.
4. Open the saved lesson, remove it from saved, and check that it disappears from the saved list.
5. Fully restart the app and confirm the saved list is still correct.

## Commit message

`feat: add persistent saved lessons`
