"use strict";
/**
 * Ancient Greece image-rights ledger (read-only/static).
 * Run: node scripts/audit-ancient-greece-image-rights.cjs --csv > /tmp/gnosi-image-rights.csv
 * Or:  node scripts/audit-ancient-greece-image-rights.cjs --json
 *
 * NEVER treat a rights label in the app as verification of the original grant.
 * This script does NOT access Commons, validate legal rights or check device delivery.
 */
const fs = require("node:fs");
const ts = require("typescript");
const root = require("node:path").resolve(__dirname, "..");
require.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f,"utf8"),{
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true},
  fileName:f,
}).outputText, f);
const {lessons} = require(root + "/src/data/lessons.ts");
const {lessonPaths} = require(root + "/src/utils/lessonPath.ts");
const {inlineArticleMedia} = require(root + "/src/data/articleMedia.ts");
const ids = lessonPaths["ancient-greece"] || [];
const byId = new Map(lessons.filter(l=>l.subcategoryId==="ancient-greece").map(l=>[l.id,l]));
function licence(credit) {
  const s = String(credit || "");
  let match = s.match(/\b(CC BY-SA)\s*([0-9]+(?:\.[0-9]+)?)\b/i);
  if(match) return match[1].toUpperCase()+" "+match[2];
  match = s.match(/\b(CC BY)\s*([0-9]+(?:\.[0-9]+)?)\b/i);
  if(match) return match[1].toUpperCase()+" "+match[2];
  if(/\bCC0\b|CC0\s*1\.0/i.test(s)) return "CC0";
  if(/public domain|κοινό κτήμα/i.test(s)) return "public-domain-declared";
  if(/ελεύθερη εμπορική χρήση/i.test(s)) return "special-commercial-permission-declared";
  return "UNKNOWN";
}
const rows = [], errors = [];
for (const [i,id] of ids.entries()) {
  const lesson = byId.get(id);
  if(!lesson) { errors.push("Missing lesson: "+id); continue; }
  const media = [
    {url:lesson.imageUrl,credit:lesson.imageCredit,creditUrl:lesson.imageCreditUrl,caption:lesson.imageCaption,kind:"cover",anchor:"before-first-paragraph"},
    ...(inlineArticleMedia[id]||[]).map((m,j)=>({
      url:m.url,credit:m.credit,creditUrl:m.creditUrl,caption:m.caption,
      kind:"inline-"+(j+1),anchor:m.afterParagraphId||("after-paragraph-"+m.afterParagraphCount)
    }))
  ];
  for(const image of media) {
    const declaredLicence = licence(image.credit);
    const reviewNotes = [];
    if(id==="greek-science-knowledge" && image.kind!=="cover" &&
       /E02748|P\.Penn/i.test(image.url+" "+image.creditUrl)) {
      reviewNotes.push("UPSTREAM LICENCE-VERSION CONFLICT: Penn Museum OPenn repository grants CC BY-SA 2.0; Commons file labels 4.0; item text mixes versions; confirm credit/display");
    }
    if(id==="greek-images-sculpture" && declaredLicence==="special-commercial-permission-declared") {
      reviewNotes.push("CUSTOM RIGHTS GRANT: retain original permission page and full credit");
    }
    if(!image.url || !image.credit || !image.creditUrl) errors.push("Missing metadata: "+id+"/"+image.kind);
    if(declaredLicence==="UNKNOWN") reviewNotes.push("No recognized licence phrase in app credit");
    rows.push({
      slot:i+1,lessonId:id,imageKind:image.kind,paragraphAnchor:image.anchor,
      caption:image.caption||"",sourcePage:image.creditUrl||"",requestUrl:image.url||"",
      appCredit:image.credit||"",declaredLicence,
      status:"UNVERIFIED",
      notes:reviewNotes.join("; "),
      actualFilePageLicence:"",upstreamGrantVerified:"",creatorVerified:"",
      commercialUseVerified:"",shareAlikeAndAdaptationReviewed:"",
      androidImageZoomAndCredit:"",iosImageZoomAndCredit:"",
      reviewer:"",reviewDate:""
    });
  }
}
const columns = Object.keys(rows[0]||{});
function csvValue(value) {
  const s=String(value ?? "");
  return '"'+s.replace(/"/g,'""')+'"';
}
if(process.argv.includes("--csv")){
  process.stdout.write(columns.map(csvValue).join(",")+"\n");
  for(const row of rows) process.stdout.write(columns.map(x=>csvValue(row[x])).join(",")+"\n");
}else if(process.argv.includes("--json")) {
  console.log(JSON.stringify({rows,errors,notice:"All rights initially UNVERIFIED. Credits are NOT commercial reuse clearance."},null,2));
}else {
  console.log("Ancient Greece image-rights ledger: "+rows.length+" placements across "+ids.length+" lessons.");
  console.log("Declared licence labels in app credits (not externally verified):");
  const stats = {};
  for(const row of rows) stats[row.declaredLicence]=(stats[row.declaredLicence]||0)+1;
  for(const [k,v] of Object.entries(stats).sort()) console.log("  "+k+": "+v);
  console.log("\nPriority records:");
  for(const row of rows.filter(x=>x.notes)) console.log("  "+row.lessonId+"/"+row.imageKind+": "+row.notes);
  console.log("\nAll "+rows.length+" are UNVERIFIED; inspect source licence, creator, upstream permissions and both devices.");
  console.log("Create a CSV for manual review with --csv or machine-readable output with --json.");
}
if(rows.length!==88) {
  errors.push("Expected 88 image placements, saw "+rows.length);
}
for(const e of errors) console.error("ERROR: "+e);
if(errors.length) process.exitCode=1;
