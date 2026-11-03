/* Development-only lesson bypass; must not alter production progression or data. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const root=path.resolve(__dirname,'..');
const before=global.__DEV__;
try {
  global.__DEV__=true;
  const {lessons,subcategories}=require(root+'/src/data/lessons.ts');
  const paths=require(root+'/src/utils/lessonPath.ts');
  const {devLessonsUnlocked,setDevLessonUnlockAll}=require(root+'/src/utils/devLessonAccess.ts');
  const {getHomeDiscovery}=require(root+'/src/utils/readingDiscovery.ts');
  const first=paths.getSubcategoryPath(lessons,'ancient-greece')[0],last=paths.getSubcategoryPath(lessons,'ancient-greece').at(-1);
  assert.equal(devLessonsUnlocked(),false,'must default to normal progression');
  assert.equal(paths.getLessonAccess(first,lessons,[]).unlocked,true);
  assert.equal(paths.getLessonAccess(last,lessons,[]).unlocked,false);
  setDevLessonUnlockAll(true);
  assert.equal(devLessonsUnlocked(),true);
  for(const sub of subcategories){
    const list=paths.getSubcategoryPath(lessons,sub.id);
    assert.ok(list.every(lesson=>paths.getLessonAccess(lesson,lessons,[]).unlocked),'all published lessons unlocked in '+sub.id);
  }
  assert.equal(paths.getNextPathLesson(first,lessons,[])?.id,paths.getSubcategoryPath(lessons,'ancient-greece')[1].id);
  // Unlocking is not a simulated completion, and read-only discovery can see later lessons.
  assert.equal(paths.getLessonAccess(last,lessons,[]).prerequisite?.id,'greek-science-knowledge');
  const picks=getHomeDiscovery(lessons,[],[],'2026-11-02');
  assert.ok(picks.featured&&paths.getLessonAccess(picks.featured,lessons,[]).unlocked);
  setDevLessonUnlockAll(false);
  assert.equal(devLessonsUnlocked(),false);
  assert.equal(paths.getLessonAccess(last,lessons,[]).unlocked,false,'normal prerequisite chain restored');
  global.__DEV__=false;
  setDevLessonUnlockAll(true);
  assert.equal(devLessonsUnlocked(),false,'production cannot enable bypass');
  assert.equal(paths.getLessonAccess(last,lessons,[]).unlocked,false);
  global.__DEV__=true;
  assert.equal(devLessonsUnlocked(),false,'production request must not leave an enabled flag');
  console.log('DEV lesson unlock passed: controlled bypass, all-subcategory access, navigation/discovery, normal rollback, production guard (Node only).');
} finally { global.__DEV__=before; }
