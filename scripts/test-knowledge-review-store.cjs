const assert=require('node:assert/strict'),{load}=require('./helpers/load-typescript.cjs');
const {LearningStore}=load('src/state/LearningStore.ts'),{emptyDailyDocument}=load('src/utils/dailySyncDocument.ts');
const {knowledgeById}=load('src/knowledge/model.ts'),{restoreKnowledgeQuiz}=load('src/knowledge/session.ts'),{questionToken}=load('src/quiz/engine.ts');
const {parseSyncDocument,mergeSyncDocuments}=load('src/utils/syncDocument.ts'),{lessons}=load('src/data/lessons.ts');
const data=new Map(),storage={getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{data.set(k,v);}};
const daily=emptyDailyDocument();
(async()=>{
 let store=new LearningStore(null,storage);await store.start();
 assert.equal(store.startKnowledgeReview('scheduled',daily),false,'fresh account has no invented due work');
 for(const lesson of lessons.slice(0,2))store.complete(lesson.id);
 assert.equal(store.startKnowledgeReview('scheduled',daily),true);let saved=store.getSnapshot().knowledgeSession;assert.ok(saved.questionIds.length<=5);
 const id=saved.id,first=questionToken(restoreKnowledgeQuiz(saved)),correct=knowledgeById.get(first.id).question.content.correctIndex;
 assert.equal(store.advanceKnowledgeReview(id,first),false,'answer required');assert.equal(store.answerKnowledgeReview(id,first,99,daily),false);
 assert.equal(store.answerKnowledgeReview(id,first,correct,daily),true);assert.equal(store.answerKnowledgeReview(id,first,correct,daily),false,'duplicate tap');
 await store.flushLocal();store.stop();assert.equal(store.advanceKnowledgeReview(id,first),false,'stopped account scope rejects old callbacks');
 store=new LearningStore(null,storage);await store.start();assert.equal(store.getSnapshot().knowledgeSession.id,id,'restart resumes pinned session');
 assert.equal(store.startKnowledgeReview('practice',daily),true);assert.equal(store.getSnapshot().knowledgeSession.mode,'scheduled','opening practice cannot overwrite unfinished scheduled work');
 assert.equal(store.advanceKnowledgeReview(id,first),true);assert.equal(store.advanceKnowledgeReview(id,first),false,'stale Next cannot skip');
 while(!store.getSnapshot().knowledgeSession.completed){saved=store.getSnapshot().knowledgeSession;const token=questionToken(restoreKnowledgeQuiz(saved)),q=knowledgeById.get(token.id).question;store.answerKnowledgeReview(id,token,q.content.correctIndex,daily);store.advanceKnowledgeReview(id,token);}
 saved=store.getSnapshot().knowledgeSession;assert.equal(saved.earnedXP,10);assert.equal(store.advanceKnowledgeReview(id,first),false);
 const initialXP=JSON.stringify(store.getSnapshot().rewards),facts=JSON.stringify(store.getSnapshot().knowledgeReviews);
 store.closeKnowledgeReview();assert.equal(store.startKnowledgeReview('practice',daily),true);
 saved=store.getSnapshot().knowledgeSession;const practiceId=saved.id;
 while(!store.getSnapshot().knowledgeSession.completed){saved=store.getSnapshot().knowledgeSession;const token=questionToken(restoreKnowledgeQuiz(saved)),q=knowledgeById.get(token.id).question;store.answerKnowledgeReview(practiceId,token,q.content.correctIndex,daily);store.advanceKnowledgeReview(practiceId,token);}
 assert.equal(JSON.stringify(store.getSnapshot().rewards),initialXP,'practice never farms XP');for(const [key,value] of Object.entries(JSON.parse(facts)))assert.deepEqual(JSON.parse(JSON.stringify(store.getSnapshot().knowledgeReviews[key])),value,'same-day practice cannot rewrite first answers');
 await store.flushLocal();const local=JSON.parse(data.get(store.key)).doc,old={...local};delete old.knowledgeReviews;delete old.knowledgeSession;
 assert.deepEqual(mergeSyncDocuments(parseSyncDocument(old),parseSyncDocument(local)).knowledgeReviews,parseSyncDocument(local).knowledgeReviews,'old-client omission preserves recall');
 const tombstone={...local,clock:local.clock+1,knowledgeSession:{stamp:[local.clock+1,'test'],value:null}};
 assert.equal(mergeSyncDocuments(parseSyncDocument(local),parseSyncDocument(tombstone)).knowledgeSession.value,null);
 // Same-stamp conflicts converge independent of object property order.
 const tie=JSON.parse(JSON.stringify(local));tie.knowledgeSession.value.earnedXP=10;
 assert.deepEqual(mergeSyncDocuments(parseSyncDocument(local),parseSyncDocument(tie)),mergeSyncDocuments(parseSyncDocument(tie),parseSyncDocument(local)));
 const account=new LearningStore('account',storage);await account.start();assert.equal(account.getSnapshot().knowledgeSession,null);assert.deepEqual(Object.keys(account.getSnapshot().knowledgeReviews),[]);
 await account.importGuest(store.getSnapshot().backup,{}, {},{},store.getSnapshot().knowledgeReviews);assert.ok(Object.keys(account.getSnapshot().knowledgeReviews).length);assert.equal(account.getSnapshot().knowledgeSession,null,'explicit import merges evidence, not another scope’s active session');
 await assert.rejects(account.resetGuestProgress());await store.resetGuestProgress();assert.equal(store.getSnapshot().knowledgeSession,null);assert.equal(Object.keys(store.getSnapshot().knowledgeReviews).length,0);
 store.stop();account.stop();console.log('Knowledge store passed: atomic first answers, offline restart, pinned resume, invalid/duplicate/stale taps, one-day reward, free practice, old-client merge, tombstones, scoped callbacks, account isolation and explicit guest import.');
})().catch(e=>{console.error(e);process.exitCode=1;});
