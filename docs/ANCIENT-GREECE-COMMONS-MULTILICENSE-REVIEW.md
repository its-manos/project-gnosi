# Ancient Greece — Five Commons multi-licence false positives

**Verified 2026-11-03**, independently from the *visible licensing sections* of the five actual Wikimedia Commons file pages, following the product owner's live screening output. Each current Gnosi credit chooses **a licence expressly offered** by the file page. **No content correction was warranted.** This is licence-page evidence only, not comprehensive commercial-release acceptance.

| Placement | Current Gnosi credit | Single Commons API `LicenseShortName` | Alternative grant on original file page | Evidence |
|---|---|---|---|---|
| #19 `persian-wars-greek-world/cover` | CC BY-SA **2.5** | CC BY-SA **3.0** | File page explicitly offers CC BY-SA **2.5**, 2.0 and 1.0 in addition to a separately listed 3.0 GFDL migration grant | [Philippe Chavin (Simorg), Persepolis stairs](https://commons.wikimedia.org/wiki/File:Persepolis-Darius_palace-stairs_relief.jpg) |
| #20 `athenian-empire/cover` | CC BY-SA **3.0** | CC BY **2.5** | Creator Marsyas **multi-licensed** under CC BY-SA 3.0 **and** CC BY 2.5; “You may select the license of your choice” | [Athenian tribute list first stele](https://commons.wikimedia.org/wiki/File:EPMA-IGI(3)259-272-Tribute_list-1.JPG) |
| #20 `athenian-empire/inline-2` | CC BY-SA **3.0** | CC BY **2.5** | Same explicit author-granted alternatives, separately displayed on this second file | [Second tribute stele](https://commons.wikimedia.org/wiki/File:EPMA-IGI(3)273-280-Tribute_list_2-2.JPG) |
| #30 `antikythera-gears/inline-1` | CC BY-SA **3.0** | CC BY **2.5** | Marsyas' own photo of Fragment B lists both licences; select CC BY-SA 3.0 | [Mechanism fragment](https://commons.wikimedia.org/wiki/File:NAMA_Machine_d%27Anticyth%C3%A8re_2.jpg) |
| #30 `antikythera-gears/inline-2` | CC BY-SA **3.0** | CC BY **2.5** | Marsyas' own photo of the **modern replica** lists both; choose 3.0. The caption already correctly calls this a reconstruction, not a surviving ancient front | [Derek de Solla Price replica](https://commons.wikimedia.org/wiki/File:NAMA_Machine_d%27Anticyth%C3%A8re_5.jpg) |

## Cause of the screening warning

The MediaWiki Commons `action=query&prop=imageinfo&iiprop=extmetadata` endpoint provides one `LicenseShortName` in the metadata object. Some Commons file pages contain **multiple simultaneously available licensing declarations**. A difference from the single API label is therefore **a review trigger, not proof of an erroneous in-app attribution**.

To avoid blanket allowances, the online checker now contains **five narrowly enumerated known cases**, each requiring the exact normalized Commons file title, actual selected app licence and current API short label. It records a separate `MULTI_LICENCE_PAGE_CHECKED` tally and `reviewBasis`, rather than treating them as `LABEL_MATCH_ONLY`; **status remains UNVERIFIED**. A new, different label or different image filename is not silently excused. The whitelist represents a source-page reading **as of the review date**, not continuous automatic verification of the full licensing text.

### Expected next diagnostic output after pulling the update

```text
Commons online screening: 88 placements, 88 unique file titles.
Results: {"LABEL_MATCH_ONLY":81,"MULTI_LICENCE_PAGE_CHECKED":5,"FLAGGED_FOR_HUMAN_REVIEW":2}; all statuses remain UNVERIFIED.
```

The final two flags should be **`CUSTOM_PERMISSION_REVIEW`** for the Giovanni Dall'Orto painted stele and **`UPSTREAM_PENN_RIGHTS_CONFLICT_REVIEW`** for the Euclid papyrus. If the numbers differ, inspect the raw `--csv`/ `--json` output; network issues or new source edits can change results.

## Remaining permission and release gates

**#27** Giovanni Dall'Orto (Diogenes stele) has a direct custom original-photographer grant for commercial use subject to attribution, documented in [priority rights triage](ANCIENT-GREECE-IMAGE-RIGHTS-TRIAGE.md). Need to confirm the credit and link actually display on both phones.

**#29** Penn E02748 papyrus remains **unresolved**: Commons lists CC BY-SA 4.0, while the source file's embedded text and Penn upstream licence line contain contradicting versions/labels (2.0 versus 4.0). Do **not** auto-update the app to any one version or mark commercially approved; clarify with Penn or use a separately verifiable substitute.

The other **81** only match one current Commons short label. That still does **not** verify upstream original licence, creator identity, image integrity, proper display of licence links/attribution, additional venue constraints or Android/iOS network delivery. Complete the per-placement human licence ledger and device checks. **No production lesson/media content changed.**
