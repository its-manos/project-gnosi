# Gnosi: optimized image CDN rollout

**Branch:** feat/image-cdn-cache, based on content/curriculum-v1.
**Status:** source implementation committed; Cloudflare domain/upload, Expo Image lockfile and native verification remain pending. **Do not merge yet.**

## Why the old bundle command failed

The 2026-11-02 report shows 81 unbundled Commons image URLs. Three succeeded; 78 were blocked by our own overly strict redirect check, which disallowed the legitimate Wikimedia host **thumb.wikimedia.org**. It does not prove 78 images are missing. The old packaging script is now retired to avoid increasing the app binary as lessons grow.

## New approach

- Convert original Wikimedia images into a **480 px WebP preview** and a **1280 px WebP full-size** version on the development machine.
- Upload optimized images to public object storage such as **Cloudflare R2 with a custom CDN domain**, not to the Expo app bundle.
- Preserve original Commons URLs and credit metadata in the existing lessons; generate a mapping to CDN objects only once the remote files have been verified.
- Render with Expo Image, disk cache, small previews on covers/inline reader and full images in zoom.
- A non-migrated source falls back to its existing bundled or Commons source; a CDN load can fall back to a pre-existing packaged image if present.
- No R2 credentials, API secrets or signed upload tokens are used in the mobile app.

The previous 157 local packaged-image keys are intentionally left in place for reliability. **The size of the installation will not shrink until a separately tested cleanup removes those redundant assets.** New CDN images do not enlarge the app.

## 0. Preserve the partial old download if present

Check the working tree first:

    cd ~/Documents/project-gnosi
    git status --short

If the old command created three binary files and modified the bundle map, stash only those generated changes:

    git stash push --include-untracked -m "partial Commons bulk bundle before CDN migration" -- assets/lesson-images/commons src/data/bundledLessonImages.ts
    git fetch origin
    git switch feat/image-cdn-cache
    git pull --ff-only origin feat/image-cdn-cache

Do not discard unrelated local changes.

## 1. Finish native dependency setup

This feature branch declares Expo Image for SDK 58. Since repository editing occurred through GitHub without npm registry access, **the package lock has not been regenerated**. Run this locally **before npm ci**:

    npx expo install expo-image
    npm run typecheck
    node scripts/test-image-cdn.cjs
    node scripts/test-commons-image-delivery.cjs
    node scripts/test-article-images.cjs
    node scripts/test-reader-pilot.cjs

For Expo SDK 58 the recommended compatible version is approximately 58.0.18. Expo Image supports WebP on Android and iOS and supports disk caching.

## 2. Set up Cloudflare R2 (manual account steps)

1. Create a bucket (example: gnosi-images).
2. Under Settings → Public access → Custom Domains, attach a domain you control (for example images.yourdomain.gr). Cloudflare explains that a custom domain enables caching; its r2.dev development URL does not.
3. Create an object read/write token scoped to that bucket and configure an **rclone S3 remote** with Cloudflare provider and your account endpoint. Keep credentials solely in the developer machine's private rclone config, never in .env, EXPO_PUBLIC variables, GitHub or chat.
4. Serve the images publicly with Content-Type image/webp and a suitable cache lifetime.

Documentation:
- https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/
- https://developers.cloudflare.com/r2/examples/rclone/
- https://developers.cloudflare.com/r2/objects/upload-objects/

## 3. Prepare and upload a four-image pilot

On Ubuntu:

    sudo apt install imagemagick rclone
    npm run images:cdn:status
    npm run images:cdn:prepare -- --limit=4

Confirm ImageMagick has WebP support if conversion fails:

    convert -list format | grep -i WEBP

Generated WebP bytes are saved under .image-cdn-build/objects/commons/. This folder is gitignored and not included in Metro.

Upload to the configured R2 bucket:

    rclone copy .image-cdn-build/objects r2:gnosi-images --progress

Validate public objects with your actual custom CDN domain:

    npm run images:cdn:verify -- --cdn=https://images.yourdomain.gr
    npm run images:cdn:publish -- --cdn=https://images.yourdomain.gr

Both commands verify the uploaded files via HTTP HEAD (200 status, image/webp content type). Publish only creates the TypeScript manifest after successful verification.

Add the **public hostname only** to the existing local .env:

    EXPO_PUBLIC_IMAGE_CDN_BASE_URL=https://images.yourdomain.gr

Then restart:

    npx expo start --clear

Check on Android and iOS: cover and inline images, full-screen zoom, correct credits, no CDN 403, repeated visit with Wi-Fi disabled to exercise the cache. The public image domain/manifest are static Expo build inputs. Image objects can be updated remotely, but **new catalogue entries still need a JS update**.

## 4. Expand if the pilot passes

    npm run images:cdn:prepare
    rclone copy .image-cdn-build/objects r2:gnosi-images --progress
    npm run images:cdn:verify -- --cdn=https://images.yourdomain.gr
    npm run images:cdn:publish -- --cdn=https://images.yourdomain.gr
    npm run typecheck
    npm run validate:content
    node scripts/test-image-cdn.cjs
    node scripts/test-commons-image-delivery.cjs
    node scripts/test-article-images.cjs

The generator skips already-prepared images. All Commons redirects permit thumb.wikimedia.org; other hosts remain blocked. Individual failures are reported without deleting earlier successful image files.

Original image URLs are used as stable identity keys for the generated CDN object names. To change a published image, change its source URL/version key rather than silently overwrite a long-lived cached URL.

At the end, commit only verified image mappings and the updated package lock:

    git add package.json package-lock.json src/data/cdnImageManifest.ts
    git commit -m "feat(images): activate verified CDN mapping and Expo Image dependency"
    git push origin feat/image-cdn-cache

Never commit .image-cdn-build/ or any private credentials. Review Commons licence and derivative attribution obligations before release.

## Remaining gates

- Expo Image lockfile updated and TypeScript/Node tests pass.
- Public CDN attached, WebP objects uploaded and HEAD-verified.
- Android and iOS cover/reader/zoom/offline behavior tested.
- Full library uploaded and licensed attribution reviewed.
- Only then safely remove now-redundant bundled photographs to reduce installation size, retaining the original Gnosi diagrams and required non-Commons art.
- Merge after native QA, not merely after structural/mock tests.
