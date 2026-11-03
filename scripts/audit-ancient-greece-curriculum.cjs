"use strict";
/* Read-only Ancient Greece curriculum diagnostics.
 * This does NOT verify historical claims, live URL rights, or device behaviour.
 * Run: node scripts/audit-ancient-greece-curriculum.cjs [--json]
 */
const fs = require("node:fs"), path = require("node:path"), ts = require("typescript");
require.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
  fileName: f,
}).outputText, f);
const root = path.resolve(__dirname, "..");
const {lessons} = require(root + "/src/data/lessons.ts");
const {lessonPaths} = require(root + "/src/utils/lessonPath.ts");
const {inlineArticleMedia} = require(root + "/src/data/articleMedia.ts");
const pathIds = lessonPaths["ancient-greece"] || [];
const byId = new Map(lessons.filter(x => x.subcategoryId === "ancient-greece").map(x => [x.id, x]));
const tokens = s => String(s || "").toLocaleLowerCase("el").match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) || [];
const paragraphs = x => x.sections.flatMap(s => s.paragraphs).map((p, i) =>
  ({id: typeof p === "string" ? "legacy-" + (i + 1) : p.id, text: typeof p === "string" ? p : p.text}));
const knownRights = s => /CC(?:0| BY)|κοινό κτήμα|public domain|attribution|ελεύθερη εμπορική/i.test(s || "");
const flags = [], rows = [], allParagraphs = [], kinds = {}, difficulty = {};
if (pathIds.length !== 30 || new Set(pathIds).size !== 30) flags.push("Path must contain exactly 30 unique IDs.");
for (const id of byId.keys()) if (!pathIds.includes(id)) flags.push("Catalogue lesson absent from path: " + id);
for (const [i, id] of pathIds.entries()) {
  const l = byId.get(id);
  if (!l) {flags.push("Path ID absent from catalogue: " + id); continue;}
  const pp = paragraphs(l), questions = l.questions || [], inline = inlineArticleMedia[id] || [];
  const wc = tokens([l.intro, ...pp.map(x => x.text)].join(" ")).length;
  const hard = questions.filter(q => q.difficulty === "hard").length;
  const images = [{url: l.imageUrl, credit: l.imageCredit, creditUrl: l.imageCreditUrl}, ...inline];
  images.forEach((im, n) => {
    if (!im.url || !im.credit || !im.creditUrl) flags.push(id + " image #" + (n+1) + " missing metadata");
    else if (!knownRights(im.credit)) flags.push(id + " image #" + (n+1) + " unfamiliar rights wording: " + im.credit);
  });
  questions.forEach(q => {
    const kind = q.presentation?.type || "multiple-choice", d = q.difficulty || "unlabelled";
    kinds[kind] = (kinds[kind] || 0) + 1;
    difficulty[d] = (difficulty[d] || 0) + 1;
  });
  pp.forEach(p => allParagraphs.push({lesson: id, ...p}));
  rows.push({
    slot:i+1,id,title:l.title,words:wc,paragraphs:pp.length,
    questions:questions.length,hard,readingMinutes:l.readingMinutes,
    readingOnlyAt190:Number((wc/190).toFixed(1)),
    illustrativeWithQuestions:Number((wc/190 + questions.length*0.5).toFixed(1)),
    sourceCount:l.sources.length,imageCount:images.length,editorialReviewedAt:l.editorialReviewedAt || null
  });
}
const shingles = s => {
  const t = tokens(s), grams = new Set();
  for (let i = 0; i <= t.length - 5; i++) grams.add(t.slice(i,i+5).join(" "));
  return grams;
};
const ps = allParagraphs.filter(p => tokens(p.text).length >= 35).map(p => ({...p,grams:shingles(p.text)}));
const inverted = new Map();
ps.forEach((p,i) => {for (const g of p.grams) {if(!inverted.has(g)) inverted.set(g,[]); inverted.get(g).push(i);}});
const overlaps = new Map();
for(const refs of inverted.values()) {
  if (refs.length > 12) continue;
  for (let i=0;i<refs.length;i++) for(let j=i+1;j<refs.length;j++) {
    if (ps[refs[i]].lesson === ps[refs[j]].lesson) continue;
    const key = refs[i] + ":" + refs[j]; overlaps.set(key,(overlaps.get(key)||0)+1);
  }
}
const repetitionCandidates = [...overlaps].map(([key,common])=>{
  const [a,b] = key.split(":").map(Number), pa=ps[a],pb=ps[b];
  return {a:pa.lesson+"/"+pa.id,b:pb.lesson+"/"+pb.id,commonSequences:common,
    containment:Number((common/Math.min(pa.grams.size||1,pb.grams.size||1)).toFixed(2))};
}).filter(x=>x.commonSequences>=6 && x.containment>=0.28)
  .sort((a,b)=>b.containment-a.containment||b.commonSequences-a.commonSequences).slice(0,30);
const totals = {
  lessons:rows.length,questions:rows.reduce((s,r)=>s+r.questions,0),
  hard:rows.reduce((s,r)=>s+r.hard,0),words:rows.reduce((s,r)=>s+r.words,0),
  sourceReferences:rows.reduce((s,r)=>s+r.sourceCount,0),
  imagePlacements:rows.reduce((s,r)=>s+r.imageCount,0),
  kinds,difficulty
};
const result = {note:"Static diagnostics only. All licences, historical claims, semantic overlaps and devices need independent checks.",
  totals,rows,flags,repetitionCandidates};
if (process.argv.includes("--json")) console.log(JSON.stringify(result,null,2));
else {
  console.log("# Ancient Greece — automated curriculum screening\n");
  console.log(JSON.stringify(totals,null,2));
  console.log("\n| # | Lesson ID | Words | Questions (hard) | Displayed min | Reading @190 wpm | Estimated incl. 30s/checkpoint* | Images |");
  console.log("|---:|---|---:|---:|---:|---:|---:|---:|");
  for(const r of rows) console.log("| "+r.slot+" | "+r.id+" | "+r.words+" | "+r.questions+" ("+r.hard+") | "+r.readingMinutes+" | "+r.readingOnlyAt190+" | "+r.illustrativeWithQuestions+" | "+r.imageCount+" |");
  console.log("\n*Illustrative, not measured; does not include feedback or reflection time.");
  console.log("\nPotential repeated passages (human-review candidates, NOT confirmed repetition):");
  if (!repetitionCandidates.length) console.log("  none above threshold");
  for(const x of repetitionCandidates.slice(0,15)) console.log("  "+x.a+" <> "+x.b+"; containment "+x.containment);
  console.log("\nMetadata flags ("+flags.length+"):");
  flags.forEach(x=>console.log("  - "+x));
  console.log("\nNo external rights/URL, historical, Supabase or Android/iOS tests were run.");
}
if(flags.some(x=>x.startsWith("Path must")||x.startsWith("Path ID")||x.startsWith("Catalogue lesson"))) process.exitCode=1;
