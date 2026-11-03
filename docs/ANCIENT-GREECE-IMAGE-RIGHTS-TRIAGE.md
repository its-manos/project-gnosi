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

- Lesson: `greek-science-knowledge`; source: `src/data/articleMedia.ts`.
- [Commons image](https://commons.wikimedia.org/wiki/File:P.Penn._Museum_inv._E02748_Euclid%27s_Elements_2.5.jpg) credits University of Pennsylvania Museum and declares **CC BY-SA 4.0**. The file was uploaded in July **2025** by a Commons user from Penn OPenn.
- [Original object/digitization record at OPenn](https://openn.library.upenn.edu/Data/0016/html/e2748.html) (separate institutional page) dates papyrus to the **third–fourth century CE**, independently supporting that this is a later copy rather than Euclid's autograph.
- **Conflict documented on original record:** OPenn's Images licensing text simultaneously says “Attribution ShareAlike License version **4.0**”, embeds an unrelated “**CC-BY-2.0**” phrase/link, and supplies a **BY-SA 2.0** legalcode URL. Commons file's embedded EXIF usage terms instead mention **ShareAlike 2.0** with another inconsistent `CC-BY-2.0` wording; the *Commons license box* says **BY-SA 4.0**.
- **Exact current app credit:** `University of Pennsylvania Museum / Wikimedia Commons · CC BY-SA 4.0 (Commons page; source metadata differs) · ψηφιοποίηση 2004`. This **accurately discloses** the discrepancy, but disclosure is not a confirmed grant.
- **Finding: BLOCKED FOR FINAL VERSION-SPECIFIC CLEARANCE.** Ask Penn's rights/contact point to clarify the image's controlling licence, or source a truly independently verifiable public-domain/open image for the same papyrus. Do not infer that a more permissive licence automatically governs simply because Commons declares it. Do not silently change the app's `4.0` to `2.0` or its source image without a separately documented fact/quality review. Existing lesson text/caption is historically appropriately cautious and does not need change.

## Legal implementation reminder

Creative Commons **BY-SA 4.0** expressly permits commercial copying and adaptations **subject to attribution and ShareAlike for adaptations**. The [Creative Commons deed](https://creativecommons.org/licenses/by-sa/4.0/) calls for the author's proper credit, licence link and change indication where applicable. Merely placing the shorthand `CC BY-SA 4.0` beside an app image does not necessarily fulfill all conditions. An entire proprietary app is not automatically re-licensed as BY-SA solely because it presents an unmodified CC BY-SA image; distinguish collections, embedded originals and adaptations, and seek counsel if modifications or mobile distribution mechanisms complicate reuse.

## Systematic remaining 86+ record checks

The pre-existing ledger helper already produces **88** rows, initially UNVERIFIED:

```bash
node scripts/audit-ancient-greece-image-rights.cjs --csv > /tmp/gnosi-ancient-greece-image-rights.csv
```

The new **read-only network checker** queries current Wikimedia Commons image metadata, compares the licence **short label**, and leaves **all** statuses UNVERIFIED:

```bash
node scripts/audit-ancient-greece-commons-online.cjs
node scripts/audit-ancient-greece-commons-online.cjs --csv > /tmp/gnosi-ancient-greece-commons-screen.csv
```

The network checker was **syntax-checked**, but a remote GitHub connector does not provide this workstation's outbound Commons access, so it has **not yet run successfully here**. If Commons is blocked, it may flag network failures and exit 1; this is a test limitation, not proof of bad rights. Results should be examined for missing files, short-label mismatches, custom grants and institution conflicts. **An API matching label is not a licence certificate.**

### Human sign-off fields

For each row, record: file page and stable revision; creator identity and underlying object; primary upstream authorisation where relevant; commercial-use permission; licence version/URL; ShareAlike/adaptations if modified; attribution exactly as displayed in app; caption and source tap; original image loaded and pinch/double-tap behavior on Android and iPhone; reviewer/date and explicit reason. Escalate ambiguity, no source, institutional rights disputes or noncommercial terms before release.

**No status promotion** from Integrated; nothing merged into `main`.
