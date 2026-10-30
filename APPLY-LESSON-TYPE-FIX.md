# Restore lesson metadata types

Stop Expo. From the existing Gnosi project root:

```bash
unzip -o ~/Downloads/gnosi-lesson-type-fix.zip -d .
node scripts/fix-lesson-metadata.cjs
npm run typecheck
```

The script adds missing optional contentNote, coverKind and editorialReviewedAt fields inside the Lesson type in src/data/lessons.ts. It preserves all article data and existing type fields and can be run again safely.

After typecheck succeeds:

```bash
npx expo start -c
```

Open the new Expo session on the phone. If the local-progress error returns, send the code displayed by the previous diagnostic update (for example D06/VALIDATION). These TypeScript errors do not identify the original local-storage failure.
