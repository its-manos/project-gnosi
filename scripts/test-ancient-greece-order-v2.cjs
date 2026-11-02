/* Approved Ancient Greece Phase 1 reorder, 2026-11-02: path-only contract.
 * Requires npm ci; Node-only verification, not Android/iOS QA.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'..');
const {lessons}=require(root+'/src/data/lessons.ts');
const {lessonPaths,getSubcategoryPath,getLessonAccess,getNextPathLesson}=require(root+'/src/utils/lessonPath.ts');
const {parseLearningBackup}=require(root+'/src/utils/learningBackup.ts');
const prefix=[
  "ancient-athens",
  "greek-world-not-a-country",
  "greek-history-through-evidence",
  "greek-chronology",
  "greek-geography-seas",
  "aegean-bronze-age",
  "minoan-crete",
  "mycenaean-palaces",
  "linear-b-decipherment",
  "palace-collapse",
  "geometric-greece",
  "rise-of-polis",
  "greek-settlements-networks",
  "sparta-society",
  "athens-who-voted",
  "athens-law-courts",
  "greek-war-hoplites",
  "greek-sanctuaries-games",
  "persian-wars-greek-world",
  "athenian-empire",
  "peloponnesian-war",
  "greek-crises-fourth-century",
  "macedon-philip",
  "alexander-conquests-context"
];
const finalSix=[
  "hellenistic-kingdoms-cities",
  "greek-stage-tragedy",
  "greek-images-sculpture",
  "greek-philosophy-in-context",
  "greek-science-knowledge",
  "antikythera-gears"
];
const expected=[...prefix,...finalSix];
assert.equal(new Set(expected).size,30,'30 unique immutable lesson IDs');
assert.deepEqual(Array.from(lessonPaths['ancient-greece']),expected,'the approved 30-slot editorial order is canonical');
const seq=getSubcategoryPath(lessons,'ancient-greece');
assert.deepEqual(seq.map(x=>x.id),expected,'catalogue resolves the same IDs exactly once');
assert.deepEqual(getSubcategoryPath([...lessons].reverse(),'ancient-greece').map(x=>x.id),expected,'path independent of catalogue ordering');
for(let i=0;i<seq.length;i++){
 const l=seq[i];
 const access=getLessonAccess(l,lessons,[]);
 assert.equal(access.position,i+1,'slot '+(i+1));
 assert.equal(access.total,30);
 assert.equal(access.prerequisite?.id,seq[i-1]?.id??undefined,'prerequisite for '+l.id);
 assert.equal(access.unlocked,i===0,'locked without prerequisites except first');
 assert.ok(getLessonAccess(l,lessons,[l.id]).unlocked,'previously completed lesson remains open: '+l.id);
 if(i>0){
  assert.ok(getLessonAccess(l,lessons,[seq[i-1].id]).unlocked,'preceding lesson unlocks: '+l.id);
  assert.equal(getNextPathLesson(seq[i-1],lessons,[seq[i-1].id])?.id,l.id,'next lesson from '+seq[i-1].id);
 }
}
// An account that completed the old route through original #28 must retain its
// stable completed IDs. Its next unfinished destination is now Hellenistic #25.
const formerlyCompleted=[...prefix,'greek-stage-tragedy','greek-philosophy-in-context','greek-science-knowledge','greek-images-sculpture'];
const backup=parseLearningBackup({schemaVersion:1,completedIds:formerlyCompleted,savedIds:['hellenistic-kingdoms-cities','antikythera-gears'],attempts:{}});
for(const id of formerlyCompleted){
 assert.ok(backup.completedIds.includes(id),'historical completion retained: '+id);
 assert.ok(getLessonAccess(lessons.find(l=>l.id===id),lessons,backup.completedIds).unlocked,'completed lesson accessible: '+id);
}
assert.deepEqual(backup.savedIds.slice().sort(),['antikythera-gears','hellenistic-kingdoms-cities'].sort());
assert.ok(getLessonAccess(seq[24],lessons,backup.completedIds).unlocked,'new Hellenistic slot unlocked by prior Alexander completion');
assert.equal(getNextPathLesson(seq[23],lessons,backup.completedIds)?.id,'hellenistic-kingdoms-cities','old pathway progresses into the first uncompleted new slot');
assert.ok(getLessonAccess(seq[26],lessons,[],['greek-images-sculpture']).unlocked,'previously in-progress lesson stays accessible');
// No lesson content, question IDs, XP, saved records, or sync payloads are transformed.
console.log('Ancient Greece Phase 1 order contract passed: 30 stable IDs, 24 unchanged prefix, six reordered, unlocks, next steps and old completions/saves.');
