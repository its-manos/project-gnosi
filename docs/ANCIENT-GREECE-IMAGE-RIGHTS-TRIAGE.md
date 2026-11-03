# Ancient Greece — Image rights: first independent source triage

**Date:** 2026-11-03  
**Branch:** `audit/ancient-greece-curriculum-30`  
**Coverage:** two priority image records independently opened and compared with the exact app credit strings; rest of the 88-image inventory has metadata-only screening **pending live Commons comparison and manual upstream confirmation**. This is a documentary audit, not legal advice or production permission certification. No production image/text changed.

## Record A — Painted funerary stele of Diogenes (#27 / inline-2)

- Lesson: `greek-images-sculpture`; source: `src/data/articleMedia.ts`.
- [Wikimedia Commons file](https://commons.wikimedia.org/wiki/File:7550_-_Piraeus_Arch._Museum%2C_Athens_-_Painted_stele_-_Photo_by_Giovanni_Dall%27Orto%2C_Nov_14_2009.jpg).
- Image subject: painted funerary stele of **Diogenes son of Apollonides**, from Pyrrha, Lesbos, approximately mid-fourth century BCE, photographed at Piraeus archaeological museum, 14 November 2009.
- Source author/photographer: **Giovanni Dall'Orto**. File page's permission reads: "**The copyright holder of this file allows anyone to use it for any purpose, provided that the copyright holder is properly attributed. Redistribution, derivative work, commercial use, and all other use is permitted.**" This is a **custom attribution-based grant** on Commons, not a CC BY-SA 4.0 licence. The Commons file history names user `G.dallorto`.
- **Exact current app credit:** `Giovanni Dall'Orto / Wikimedia Commons · ελεύθερη εμπορική χρήση με αναφορά δημιουργού · φωτογραφία 2009`. It names the photographer, describes custom commercial reuse and links to the original Commons file. That is consistent with the permission's main condition.
- **Finding:** **original file-page grant independently confirmed**. No need to replace merely for being non-standard. **Still pending:** final evidence capture (source-page screenshot/permanent revision), any museum/object-use considerations applicable to the deployment, confirmation that app *actually* displays credit/source/link in Android/iOS and no misleading downstream licence substitution. Do not mark complete rights release solely from this report.
- No conflicting upstream restriction was observed on the Commons page consulted. No claim is made that a separate museum licence was requested or obtained.

## Record B — Euclid papyrus P.Oxy. I 29 / Penn E02748 (#29 / inline-1)

**Updated 2026-11-03 — original rights-holder collection grant located.** Supersedes the earlier instruction not to modify this credit until the source was checked.

- Lesson: `greek-science-knowledge`; source: `src/data/articleMedia.ts`; image unchanged, still fetched from [Commons file](https://commons.wikimedia.org/wiki/File:P.Penn._Museum_inv._E02748_Euclid%27s_Elements_2.5.jpg).
- Original provider: University of Pennsylvania Museum of Archaeology and Anthropology, OPenn collection [0016](https://openn.library.upenn.edu/html/0016.html). **Its dedicated image-licensing section explicitly states that all images hosted there are released with permission of Penn Museum under [CC BY-SA 2.0 Generic](https://creativecommons.org/licenses/by-sa/2.0/).** The collection includes [this exact E02748 manuscript](https://openn.library.upenn.edu/Data/0016/html/e2748.html) (P.Oxy. I 29; ancient copy, third–fourth century CE).
- The particular object page's prose is internally inconsistent (“version 4.0” + “CC-BY-2.0”), but its **Images licence URL points to BY-SA 2.0 legalcode**. Original digitized file's Commons-displayed EXIF `Copyright holder`, `Usage terms`, and `Online copyright statement` also specify **CC BY-SA 2.0** with a matching legalcode URL (and a stray mistaken abbreviation “CC-BY-2.0”). Commons **file license box and structured data**, by contrast, say **BY-SA 4.0**. The Commons 4.0 display alone is **not evidence that the original provider separately granted 4.0**. Sources: [OPenn repository 0016](https://openn.library.upenn.edu/html/0016.html), [E02748 item](https://openn.library.upenn.edu/Data/0016/html/e2748.html), [Commons metadata](https://commons.wikimedia.org/wiki/File:P.Penn._Museum_inv._E02748_Euclid%27s_Elements_2.5.jpg).
- **Conclusion for Gnosi:** the *primary institution's explicitly published CC BY-SA 2.0 grant* provides documented permission to use the photograph under **2.0**, including commercial uses when the actual terms are observed. The in-app credit has therefore been corrected to:
  `University of Pennsylvania Museum / OPenn / Wikimedia Commons · CC BY-SA 2.0 (άδεια αρχικής συλλογής) · ψηφιοποίηση 2004`
- **No image, image URL, lesson question, caption, XP/completion or history was changed.** A single `credit` string changed. The Commons API comparison necessarily shows `2.0` versus `4.0`; the screening tool recognizes only this one exact source-backed mismatch and **retains the human-review flag** `UPSTREAM_PENN_RIGHTS_CONFLICT_REVIEW` so the original record's inconsistent 4.0 wording is not forgotten.
- **Release gate still open:** verify that users see the photo's authoring institution, manuscript identity/title, original image source and applicable [CC BY-SA 2.0 licence link](https://creativecommons.org/licenses/by-sa/2.0/) on Android and iPhone; ensure any adaptations and end-user distribution satisfy its ShareAlike and attribution conditions. The app currently offers an image-source `creditUrl` to Commons, not a separate clickable licence URL. Add explicit licence links or a stable attributions view before signing off. If legal sign-off insists on definitive clarification of the object's inconsistent catalogue text, ask Penn or substitute an independently rights-cleared image.

## Legal implementation reminder

Creative Commons **BY-SA 2.0** (as well as 4.0) permits commercial copying and adaptations **subject to attribution and ShareAlike for adaptations**. The [Creative Commons 2.0 deed](https://creativecommons.org/licenses/by-sa/2.0/) calls for the author's proper credit, licence link and change indication where applicable. Merely placing the shorthand `CC BY-SA 2.0` beside an app image does not necessarily fulfill all conditions. An entire proprietary app is not automatically re-licensed as BY-SA solely because it presents an unmodified CC BY-SA image; distinguish collections, embedded originals and adaptations, and seek counsel if modifications or mobile distribution mechanisms complicate reuse.

## Five API mismatches resolved as multi-licensing (2026-11-03)

[Review of the five exact Commons file pages](ANCIENT-GREECE-COMMONS-MULTILICENSE-REVIEW.md) confirms that every allegedly mismatched image **offers the existing Gnosi-credited licence as an alternative licence grant**. A single `imageinfo.extmetadata.LicenseShortName` is not a complete list of grants. **No app credit or image URL was changed.** These five are separated from the custom Dall'Orto and source-backed Penn E02748 2.0 case in the revised checker. The Penn *4.0 versus 2.0 metadata wording* still needs documented reviewer acceptance, but its original institution's CC BY-SA 2.0 grant has been identified; none is yet device/release-signed-off.

## Systematic remaining 86+ record checks

The pre-existing ledger helper already produces **88** rows, initially UNVERIFIED:

```bash
node scripts/audit-ancient-greece-image-rights.cjs --csv > /tmp/gnosi-ancient-greece-image-rights.csv
```

The new **read-only network checker** queries current Wikimedia Commons image metadata, compares the licence **short label**, and applies only five **source-page verified, exact-title multi-licence exceptions**; **all** statuses remain UNVERIFIED:

```bash
node scripts/audit-ancient-greece-commons-online.cjs
node scripts/audit-ancient-greece-commons-online.cjs --csv > /tmp/gnosi-ancient-greece-commons-screen.csv
```

**Owner run on 2026-11-03:** the live checker completed successfully for **88 unique Commons files**, yielding **81 short-label matches, 5 exact-file multi-licence grants, and 2 human-review flags**. This is metadata screening, not rights clearance. The product owner also reported **PASS on all five Android shared image-viewer first-pass checks** ([manual report](ANCIENT-GREECE-ANDROID-IMAGE-FIRST-PASS.md)); that does **not** certify every individual Android placement and does not cover iPhone. **An API matching label is not a licence certificate.**

### Human sign-off fields

For each row, record: file page and stable revision; creator identity and underlying object; primary upstream authorisation where relevant; commercial-use permission; licence version/URL; ShareAlike/adaptations if modified; attribution exactly as displayed in app; caption and source tap; original image loaded and pinch/double-tap behavior on Android and iPhone; reviewer/date and explicit reason. Escalate ambiguity, no source, institutional rights disputes or noncommercial terms before release.

**No status promotion** from Integrated; nothing merged into `main`.
