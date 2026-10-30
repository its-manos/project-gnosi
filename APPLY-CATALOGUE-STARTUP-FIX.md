# Catalogue and startup correction

The writing update accidentally replaced the catalogue entry file with an older version. This omitted the 35 expanded lessons, the difficult-history category and its three subcategories, and the metadata type fields. Saved sync documents referring to an omitted lesson then fail validation with unknown_catalogue.

This package restores that wiring while retaining the rewritten main article. The existing additionalLessons.ts and catalogueExpansion.ts contain the rest of the rewritten content and are used unchanged. Both startup stores now show a loading state on retry and identify failures on screen: L codes for article progress, D codes for daily progress. Cache validation remains strict; no fallback resets saved progress.

Stop Expo, then run from your existing project root:

```bash
unzip -o ~/Downloads/gnosi-catalogue-startup-fix.zip -d .
npm run typecheck
```

If typecheck passes, restart Expo:

```bash
npx expo start -c
```

Open the new session on your phone. Verify Home has all seven categories, including Ταμπού της Ιστορίας. If the recovery screen remains, send its L or D code and any warning. No dependency installation or database migration is required. This supersedes the previous diagnostics and lesson-type patches; do not apply an older lesson-writing archive afterward.

Verification: evaluated the actual lesson modules (45 unique lessons; valid category/subcategory routes; all prior lesson IDs retained). Reproduced unknown_catalogue using the actual sync parser with a saved expansion-lesson bookmark and verified that restoring the catalogue permits it to load. The backup parser was stubbed in that focused test. Full application typecheck/lint and device execution are not available in this workspace; run typecheck against your complete project above.
