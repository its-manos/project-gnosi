# Astronomy guided path

An original Greek introduction for general readers, following the editorial approach established in architecture. This expands the existing `science / space` subcategory; it does not create a second astronomy category.

## Curriculum

The scope draws inspiration from the progression of introductory university astronomy: nearby systems, gravitational motion, observing methods, stars, galaxies and cosmology. Reference: [MIT 8.282J syllabus](https://ocw.mit.edu/courses/8-282j-introduction-to-astronomy-spring-2006/pages/syllabus/). The prose, examples and questions are original, and the university course's calculus prerequisites are not carried into this general-reader adaptation.

| Order | Lesson | Checkpoints | Purpose |
| --- | --- | ---: | --- |
| 1 | Εισαγωγή στην αστρονομία | 4 | Observation versus explanation; systems, projected positions and light travel time |
| 2 | Ο ουρανός κινείται — ή εμείς; | 4 | Daily rotation, annual motion and seasons; controlled observation |
| 3 | Ποιος «κόβει» τη Σελήνη; | 4 | Phases versus eclipses; a dated observation diary |
| 4 | Το Ηλιακό Σύστημα χωρίς τη βιτρίνα | 4 | Planet families, scale, atmosphere and comparative reasoning |
| 5 | Ο κόκκινος πλανήτης με τα γαλάζια ηλιοβασιλέματα | 4 | Surface dust, image processing, composition and changing landscapes |
| 6 | Γιατί αιωρούνται οι αστροναύτες; | 4 | Orbits, common free fall and reference frames |
| 7 | Πώς διαβάζουμε το φως ενός άστρου | 5 | Collection, spectra, flux, parallax and image interpretation |
| 8 | Τα άστρα δεν έχουν όλα την ίδια ζωή | 5 | Fusion, mass, lifetime, remnants and testing evolutionary models |
| 9 | Μέσα σε μια πόλη από άστρα | 4 | Mapping from inside, distributed mass and limits of dark-matter evidence |
| 10 | Ένα σύμπαν που αλλάζει κλίμακα | 5 | Cosmological redshift, expansion, CMB and observational horizons |
| 11 | Φάκελος εξωπλανήτη: βρες τον αόρατο κόσμο | 6 | Integrated fictional investigation: prediction, transit depth, radial velocity, false positives and selection effects |

Eight new lessons and 37 new questions join the three expanded existing articles and their 12 unchanged questions: 11 lessons, 49 checkpoints. New articles range from roughly 520 to 820 Greek words; reading estimates exclude quiz time. Each pair of body paragraphs teaches the material for its checkpoint. Article length follows the subject rather than a fixed template.

## Scientific and editorial checks

Each lesson includes direct primary-source links. Core sources are NASA's solar-system, Earth, Moon, stars, galaxies and Hubble/Webb spectroscopy resources, plus the existing ESA/NASA Mars references. Source statements were compared with the teaching claims; the content validator only checks structure and is not a fact checker.

- Nearby light-year examples are separated from cosmological distance/lookback complications.
- Rotation, annual sky changes and axial-tilt seasons are separated. Hemisphere seasons are a test of the explanation.
- Phases are not Earth's shadow; eclipse alignment includes orbital inclination.
- Solar-system montages are labelled as lacking a single size/distance scale.
- Gravity remains significant in low Earth orbit. The orbit lesson distinguishes free fall from absent gravity.
- Spectra are line-pattern measurements, not merely photograph colours. Parallax is geometrical; measured flux differs from intrinsic luminosity.
- Stellar surface temperature, radius, mass and lifetime are kept distinct. The Sun's expected remnant is a white dwarf.
- Approximately flat outer orbital *speeds* are not equal angular speeds. Dark-matter gravitational evidence is not particle identification; the central black hole does not alone govern the whole galaxy.
- Expansion is a large-scale description, not an instruction that bound objects expand. The CMB is from about 380,000 years into the early thermal history, not an image of the initial instant. An observational horizon is not a demonstrated spatial edge.
- The capstone's data are explicitly fictional. Dips on days 5/35/65 imply a 30-day interval and predict day 95 in the stated simple model. A 1% depth implies a 10% radius ratio only with the stated disk assumptions, and does not establish mass. The quiz transfers those methods to a second scenario (days 8/38/68, next 98; a 4% dip, 20% radius ratio). Non-detection is not proof of absence; a habitable-zone location is not detection of water or life.

## Images

Eight new raster assets are bundled and fully decoded during verification. Seven inline placements use existing cover assets at full aspect ratio where viewing the complete image matters. The three older covers and existing Mars figure remain in place. Credits, licence links and resizing notes are in [ASTRONOMY-ATTRIBUTION.md](../assets/lesson-images/ASTRONOMY-ATTRIBUTION.md).

The CMB map is labelled as a temperature map; the spectrum is a schematic; the Kepler-186f cover is labelled as an artist's concept and separated from the fictional case. These are retrieved images, not generated scientific evidence.

## Compatibility and verification

Existing lesson IDs, category links, quizzes, answer ordering, explanations and compatible quiz keys are retained. `astronomyRevisions` only permits prose/reading metadata changes. The old 53-item catalogue order remains, with eight new items appended; `lessonPath.ts` supplies the explicit learning order. Existing completions and partial attempts remain accessible even when introductory lessons are inserted ahead of them.

`node scripts/test-astronomy-path.cjs` checks historical hashes for all 53 pre-update lessons (full content outside the three revised astronomy articles, exact questions inside them), old persisted completion/partial progress and review eligibility, sequential unlocking even after a zero score, all 49 reachable checkpoints, incomplete-attempt rejection, offline persistence and the sixth question's weekly-review eligibility.

Also run typecheck, content validation, the reader/editorial/path/architecture/image/sync/results/review regression scripts, lint and an Android export. Native phone appearance still needs an on-device pass. This content update adds no native dependency, config or database migration. It can be published through the existing preview update channel only for an installed build with a compatible runtime and Expo Updates configured.

Local verification completed 2026-10-30: typecheck, content structure validation, lint of changed code, and 14 regression scripts passed (astronomy, architecture, lesson path, reader, editorial compatibility, bundled images, article images, learning backup, automatic sync, home layout, reading discovery, lesson results, weekly review and daily challenge). The final Android export includes all 82 raster assets. Runtime fingerprint `a1d1355d85f2aab128743386fad4506ee050aa48` matches the prior OTA-enabled beta configuration. No signed build or update was published from this workspace.

See [guided-content-standard.md](guided-content-standard.md) for future categories.
