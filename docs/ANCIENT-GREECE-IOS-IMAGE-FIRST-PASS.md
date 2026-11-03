# Ancient Greece — iPhone image first-pass report

**Recorded:** 2026-11-03  
**Reported by:** product owner, in-chat confirmation ("they passed") following request to repeat the Android five-check image viewer protocol on iPhone  
**Branch context:** `audit/ancient-greece-curriculum-30`  
**Report type:** owner-reported first-pass check, **not** full image-by-image device verification.

## First-pass results (owner-reported)

The user confirmed that the five requested iPhone image viewer checks **passed**:

| Shared viewer check | iPhone result |
|---|---|
| Images load | **PASS** |
| Pinch-to-zoom and double-tap | **PASS** |
| Captions readable | **PASS** |
| Photographer and licence credits correct | **PASS** |
| Source links open | **PASS** |

The corresponding [Android first-pass report](ANCIENT-GREECE-ANDROID-IMAGE-FIRST-PASS.md) also records five passes.

## Evidence limitations

No device model, OS version, Expo/dev-build version, per-image list, screenshot, image-delivery logs or exact repository SHA were provided. The user answered a follow-up invitation to test priority images (#27, #29 and #19/#20/#30), but did **not** enumerate individual placements. It would overstate the evidence to mark all 88 individual images verified on iPhone or Android.

**Status:** Android/iPhone image viewer first-pass **PASS, owner-reported**; full **88 × 2 per-placement verification**, final copyright/licence attribution and commercial release sign-off **PENDING**. Retain custom Dall'Orto and Penn item metadata review flags.

All 30 lessons remain **Integrated**, not independently Validated or Approved. No application logic, media assets or course progression were modified by this report.
