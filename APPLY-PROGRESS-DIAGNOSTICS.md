# Local progress loading diagnostics

Apply after the daily-sync update. This package replaces only src/state/DailyStore.ts.

Stop Expo with Ctrl+C, then run these commands from your existing Gnosi project root:

```bash
unzip -o ~/Downloads/gnosi-progress-load-diagnostics.zip -d .
npm run typecheck
npx expo start -c
```

Open Gnosi on your phone using the new Expo session. If the recovery screen returns, press Retry once and send the displayed code (for example D06/VALIDATION). Retry clears the error and shows the existing loading spinner while the operation runs. Fast failures may return immediately.

The original exception is also logged with the prefix "Could not load local daily progress". Device logs may be visible in React Native DevTools rather than the terminal. The on-screen code works without those logs.

No cache is deleted, repaired, or replaced by a fallback after a failed read/validation. Successful reads continue using the existing persistence path. No dependency install or SQL migration is required.

Diagnostic stages: D01 device-ID read; D02 device-ID write; D03 daily-cache read; D04 JSON parsing; D05 cache envelope validation; D06 daily-document validation; D07 legacy-key reads; D08 legacy migration; D09 initial cache write.

Verified with an isolated Node harness: malformed JSON, invalid envelope, invalid document, read/write failures, original cache preservation, loading-state emission, and successful retry after temporary storage failures. TypeScript syntax was transformed successfully. Full project typecheck, lint, and a phone run were not available in this workspace; run the typecheck command above against your complete project before launching.
