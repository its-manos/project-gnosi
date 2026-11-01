# Lesson research and media audit — `perception-eyes-not-cameras`
**Date:** 2026-10-31 · **Chapter:** I · Πώς φτιάχνεται αυτό που βλέπουμε · **Editorial status:** Integrated, QA and human approval pending.

## Educational promise
A reader will distinguish incoming light, neural representation and perception; demonstrate uneven retinal acuity; explain roles of rods/cones and early retinal computation; interpret, without overgeneralizing, a classic retinal-image stabilization experiment. Narrative: a reading observation → optics → photoreceptor distribution → retinal circuits → deliberate image stabilization → what “seeing” means.

## Claim-to-source map
1. **Cornea, pupil, iris, lens, retina, phototransduction** — National Eye Institute, “How the Eyes Work” (updated 2022), https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work ; independent corroboration: American Academy of Ophthalmology, “Eye Anatomy: Parts of the Eye and How We See”, https://www.aao.org/eye-health/anatomy/parts-of-eye
2. **Fovea, central acuity versus periphery** — NEI, “About the Eye” (updated December 10, 2025), https://www.nei.nih.gov/eye-health-information/healthy-vision/nei-for-kids/about-eye ; see also NEI June 4, 2025 neuroscience report https://www.nei.nih.gov/research-and-training/research-news/nih-researchers-identify-brain-circuits-responsible-visual-acuity . This is not a claim that peripheral vision has *no* detail or a fixed pixel resolution.
3. **Rods/cones distribution, signal pathways, contrast channels and center-surround** — Helga E. Kolb & Ralph F. Nelson, “How the Retina Works”, *Webvision*, originally 2003, updated July 4, 2025, https://www.ncbi.nlm.nih.gov/books/NBK610611/ . Source specifies circuitry and ON/OFF channels. Avoid the misconception that retinal output consists *only* of edges or that rods categorically cannot respond to anything except “black and white”.
4. **Stabilized retinal image disappearance** — Lorrin A. Riggs, Floyd Ratliff, Janet C. Cornsweet, Tom N. Cornsweet, “The Disappearance of Steadily Fixated Visual Test Objects”, *Journal of the Optical Society of America* 43 (1953), 495–501, DOI https://doi.org/10.1364/JOSA.43.000495 ; verified original study and abstract via https://pubmed.ncbi.nlm.nih.gov/13070111/ . After stabilization, fine lines started fading within seconds; not a universal statement that “a still gaze makes the world vanish.”
5. **Eye/brain processing pathways** — Kolb & Nelson (above); NEI report of June 4, 2025 (above). Avoid an imaginary “inner screen” as if it were a literal neuroanatomical object.

## Evidence limits and editorial choices
- Early retinal transformations are established. Larger debates about predictive coding and *how* experience arises are outside this introductory lesson and are **not** asserted as settled.
- Retinal-image stabilization experiments isolate a particular kind of sensory adaptation. Eye movements also serve sampling and fixation; do not imply a single cause of all stable vision.
- No claims about a false or fabricated external world. What reaches awareness is processed, yet perceptual systems are useful and constrained by evidence.
- **Duplication boundary:** Don't explain blind-spot anatomy or completion here (lesson 2); do not preempt detailed color constancy (lesson 3), stereopsis (lesson 4), Gestalt grouping (lesson 5), attention (Chapter II).

## Image and licensing ledger
**Cover** (intro, before section I):
- File URL: https://commons.wikimedia.org/wiki/Special:FilePath/Anatomy%20of%20eye%20of%20human%20being.jpg?width=1200
- Source/rights: https://commons.wikimedia.org/wiki/File:Anatomy_of_eye_of_human_being.jpg ; own work by Aliyu Mohammed Aliyu, 12 Nov 2025, **CC0 1.0**; original **721 × 721 JPEG**.
- Caption: «Εκπαιδευτικό σχέδιο της τομής του ματιού, όχι φωτογραφία. Ο κερατοειδής και ο φακός εστιάζουν το φως στον αμφιβληστροειδή.»
- Layout: deliberately `contain` for this square diagram in the existing landscape cover box; never globally alter crop handling. **Device rendering not yet verified.** A future properly licensed landscape replacement can be considered if needed.

**Inline scientific graph** (after paragraph ID `retina-fovea`, section II, paragraph 7 overall):
- URL: https://commons.wikimedia.org/wiki/Special:FilePath/Human%20photoreceptor%20distribution.svg?width=1200
- Source/rights: https://commons.wikimedia.org/wiki/File:Human_photoreceptor_distribution.svg ; author **Cmglee**; **CC BY-SA 3.0** (also GFDL dual-licensed); **512 × 512 SVG**, raster preview **960 × 960**.
- The chart is based on Brian A. Wandell's *Foundations of Vision*, not a direct patient photograph or new experimental measurement. Greek caption explains the two curves and invites zooming; `contain` prevents clipped axes/labels.
- **Open issue:** English labels and 218px inline display may be too small on phones; tap-to-zoom must be tested, and a translated credited redraw is preferable if editorially justified. Confirm Commons redirect to raster thumbnail on both platforms; do not claim it was tested.

## Delivery QA
- New question IDs (stable): `eyes-fovea`, `eyes-retina-computes`, `eyes-stabilized-vision`.
- Stable placement anchors: `peripheral-value` (**paragraph 4**), `brain-route` (**paragraph 10**), `adaptation-limit` (**paragraph 13**); 15 total paragraphs, no fixed two-paragraph cadence.
- Old completions/bookmarks and historical reward ledger stay in place; material question rewrites change fingerprint and make incompatible mistake-review scores non-transferable.
- New in-progress attempts carry a quiz fingerprint; old unversioned attempts for **this** lesson restart rather than reusing numerically indexed answers. Affected users should have this behavior surfaced in release notes.
- No native test was executed in the repository-writing environment. Run the checks in the tracker and record device results before promotion to `Validated` or `Approved`.
