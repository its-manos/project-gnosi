# Image delivery regression — Wikimedia Commons HTTP 403

**Date:** 2026-11-02 · **Branch:** `content/curriculum-v1` · **Status:** code change integrated; device/HTTP verification required before release.

## Report

Android Expo bundled successfully, but `ResilientImage` logged repeated `Unexpected HTTP code 403` responses for dozens of Ancient Greece covers and inline pictures. The requests all used `commons.wikimedia.org/wiki/Special:FilePath/...jpg?width=1200` or `...png?width=1200`. The failures are widespread rather than specific to lessons 2–5 or their revised prose.

## Likely cause and evidence

Wikimedia standardized production thumbnail widths during 2026, and requests for **nonstandard** sizes are now blocked or heavily rate-limited. The old requested width **1200** is not a standard Wikimedia production thumbnail bucket. Approved sizes include **960** and **1280** pixels:

- Wikimedia official reference: https://www.mediawiki.org/wiki/Common_thumbnail_sizes
- Wikimedia technical announcement (January 2026): https://lists.wikimedia.org/hyperkitty/list/wikitech-l@lists.wikimedia.org/thread/LS2NVZTBZPQDK2W7IP66SHUXP2J54435/
- Official Commons image hotlinking/redirect instructions: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/technical/en
- Wikimedia User-Agent policy: https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy

This is the **strongest supported root cause**, but no physical Android/iOS or live HTTP verification was possible from the repository connector. A second CDN or network policy may still apply.

## Scoped code change

- `src/utils/commonsImage.ts`: remote-only candidate generator for Commons `Special:FilePath` sources, normalizing request width to **960** without modifying lesson metadata or source URLs. Includes descriptive `User-Agent` / `Api-User-Agent` headers for the native network request.
- `src/components/ResilientImage.tsx`: checks `bundledLessonImages` first. On unbundled Commons image failure, retries once through the documented `w/index.php?title=Special:Redirect/file/...&width=960` path. After both fail, shows the existing user-facing fallback and logs one diagnostic warning.
- The zoom viewer and article figure already use the shared `ResilientImage`, so they inherit the same handling. Non-Wikimedia URLs are left unchanged. Credit/caption and file-page licence/source links are unaffected. App progress, content ID and question versions unaffected.
- `scripts/test-commons-image-delivery.cjs`: Node-only checks for standard thumbnail widths, supported redirect path, headers, local asset priority, finite retry and visible fallback.

**Why preserve catalogue `?width=1200` URLs?** Existing `src/data/bundledLessonImages.ts` maps many of those exact URL strings to local `require(...)` images. Bulk-editing catalogue URLs without updating the map would break offline images. Normalizing only *unbundled network requests* preserves release asset lookups.

## Run and verify

```bash
cd ~/Documents/project-gnosi
git switch content/curriculum-v1
git pull --ff-only origin content/curriculum-v1
npm run typecheck
npm run validate:content
node scripts/test-commons-image-delivery.cjs
node scripts/test-article-images.cjs
node scripts/test-reader-pilot.cjs
npx expo start --clear
```

On Android Expo Go, open Ancient Greece lesson covers (especially Athens house, Themistocles decree, western Aegean, Poliochne) and an inline image. Zoom them and verify proper caption and credit link. Compare iOS if available; check logs for HTTP 403s. **Do not mark fixed based only on Node/mock tests**; a live native fetch is required.

If 960px requests still fail due rate limits, mobile-client policy or redirect behavior, the production-grade fallback is to download and package the remaining licensed Commons images (with correct attribution and attribution URLs) as local assets, then add them to `bundledLessonImages.ts`. This is particularly appropriate for the fixed educational catalogue and avoids run-time Wikimedia dependency. Do not proxy image bytes from Commons on every user request.
