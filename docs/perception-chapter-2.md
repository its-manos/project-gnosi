# ΓΝΩΣΗ — Εγκέφαλος και Ψευδαισθήσεις · Chapter II

Status: four complete lessons integrated on the curriculum branch · 2026-10-31.

## What this chapter teaches

«Όσα η προσοχή αφήνει έξω» continues directly after the original five perception lessons.

| Order within path | Lesson id | Title | Learning outcome |
| --- | --- | --- | --- |
| 6 | `perception-inattentional-blindness` | Πώς γίνεται να μην προσέξεις κάτι μπροστά σου; | Distinguish visual input, selective attention, awareness and later recall |
| 7 | `perception-expectations` | Βλέπουμε αυτό που περιμένουμε να δούμε; | Explain how visual priors and immediate context help interpret ambiguity |
| 8 | `perception-multitasking` | Μπορεί ο εγκέφαλος να κάνει δύο πράγματα ταυτόχρονα; | Distinguish task-switching, simultaneous activity and task interference |
| 9 | `perception-hidden-whole` | Πώς καταλαβαίνουμε κάτι όταν βλέπουμε μόνο ένα μέρος του; | Explain how partial occlusion leads to amodal perceptual completion |

All four records are in `src/data/perceptionAttentionLessons.ts`. The shared `lessons` array now appends them immediately after `perceptionLessons` and before `geologyLessons`. The existing lesson ids, quiz data and reading behavior remain unchanged.

Each lesson provides original Greek prose, an introduction, four sections (eight paragraphs), four applied questions with explanations, two academic/institutional references, and a credited visual. Lessons have the standard existing 3–5 minute reading target; there are **no arbitrary total-path lesson limits**.

## Scientific reference mapping

1. Simons & Chabris, *Gorillas in Our Midst* (1999): https://pubmed.ncbi.nlm.nih.gov/10694957/ ; Most et al. *What You See Is What You Set* (2005): https://pubmed.ncbi.nlm.nih.gov/15631594/
2. *Learning What to Expect (in Visual Perception)* (2013): https://pmc.ncbi.nlm.nih.gov/articles/PMC3807544/ ; Yale PSYC 110: https://oyc.yale.edu/introduction-psychology/psyc-110
3. APA, *Multitasking: Switching Costs*: https://www.apa.org/topics/research/multitasking ; CDC, *Distracted Driving*: https://www.cdc.gov/distracted-driving/about/index.html
4. *Amodal Completion Revisited* (2020): https://pmc.ncbi.nlm.nih.gov/articles/PMC7466902/ ; *Occluded Information Is Restored at Preview but Not During Visual Search* (2018): https://pmc.ncbi.nlm.nih.gov/articles/PMC6181188/

**Accuracy/ethics notes:** Do not imply the gorilla result applies to all people or all tasks, that expectations make physical reality change, or that multitasking is impossible in every circumstance. Avoid unsafe suggested tests while driving. The last lesson distinguishes an occluded object from the physiological blind spot already covered in Chapter I.

## Cover visual provenance and rights

Four existing assets (not generated) were chosen, mainly landscape-oriented, with accurate links inside each `Lesson`.

| Lesson | Commons page | Author and license | Aspect |
| --- | --- | --- | --- |
| 6 | [Shibuya Crossing in Tokyo.jpg](https://commons.wikimedia.org/wiki/File:Shibuya_Crossing_in_Tokyo.jpg) | Christophe95, CC BY-SA 4.0 | 5067×3801 (4:3) |
| 7 | [Duck-Rabbit.png](https://commons.wikimedia.org/wiki/File:Duck-Rabbit.png) | Historical 1892 figure from Fliegende Blätter, public domain | 4249×2657 (1.6:1) |
| 8 | [Person works on laptop while holding smartphone in living room.jpg](https://commons.wikimedia.org/wiki/File:Person_works_on_laptop_while_holding_smartphone_in_living_room.jpg) | Shixart1985, CC BY 2.0 | 6048×4032 (3:2) |
| 9 | [Masjid Al-Iman at Bukit Panjang.jpg](https://commons.wikimedia.org/wiki/File:Masjid_Al-Iman_at_Bukit_Panjang.jpg) | Muhammad Adrian, CC BY 2.0 | 4096×2304 (16:9) |

They use the existing `Special:FilePath/...?width=1200` delivery and the existing cover dimensions, without modifying image components, scaling logic, progress/quiz sounds, or app architecture. The art is educationally illustrative and not experimental evidence. For the illusion, test that both rabbit and duck interpretations remain apparent on a cropped mobile cover. Licensed images should eventually be bundled locally for offline reliability; when bundling or transforming CC BY / BY-SA images, preserve credits and relevant licence requirements.

## Validation

- [x] Four unique new lesson ids; correct existing `science / brain-perception` location.
- [x] Four sections with two paragraphs apiece, four unique four-choice questions each, valid answer indexes, explanations and valid HTTPS sources.
- [x] Imported `perceptionAttentionLessons` and ordered path correctly after Chapter I.
- [x] Static GitHub-content verification passed for structural integrity and unchanged Chapter I and geology arrays.
- [ ] Run `npm run typecheck` on a local checkout.
- [ ] Run `npm run validate:content` on a local checkout.
- [ ] Test the four new lessons in Expo Go on Android/iOS, including cover crop, image zoom, questions, XP/sound, saved lessons, resume and completion.
- [ ] For production/beta with offline capability, bundle raster files and record licence/attribution in asset manifest.

The GitHub integration provides editing but no execution in an Expo/React Native runtime. The assistant attempted a local git checkout, but network access to GitHub from the execution container was unavailable, so these native tests were **not** run here.

## Continue next

Chapter III: «Η μνήμη δεν είναι βίντεο» — encoding, retrieval failures, reconstructive memory, memory changes across recall, and the limits of eyewitness confidence. Research into false memories requires carefully worded claims and primary studies; this is a separate learning objective from the attentive perception topics in Chapters I–II.
