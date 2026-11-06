import type { GeneralKnowledgeQuestion } from "../data/questions";
import type { DailyChallengeRecord } from "./dailyChallenge";
import type { DailyChallengeHistoryEntry } from "./dailyChallengeHistory";
import type { DailyRecordMetadata } from "./sharedDailyChallenge";
import type { DailyChallengePreferences } from "../data/dailyChallengeTopics";
import type { Lesson } from "../data/lessons";
import { adaptDailyQuestion } from "../quiz/adapters";
import { evaluateChoice } from "../quiz/engine";
import { createLessonAccessLookup } from "./lessonPath";

/** Compact evidence, not seven copies of question text per day. */
export type DailyResultDetails = { version:1; questionVersions:string[]; correctMask:boolean[]; categoryIds:string[]; subcategoryIds:string[] };
export function highestCorrectCombo(mask: readonly boolean[]): number {
  let run=0,highest=0;for(const correct of mask){run=correct?run+1:0;highest=Math.max(highest,run);}return highest;
}
export function createDailyResultDetails(record: DailyChallengeRecord, bank: readonly GeneralKnowledgeQuestion[]): DailyResultDetails {
  const selected = record.questionIds.map(id=>bank.find(q=>q.id===id));
  if(!record.completed || selected.length!==7 || selected.some(q=>!q)) throw new Error('invalid_daily');
  const known = selected as GeneralKnowledgeQuestion[];
  if(record.questionVersions && known.some((q,i)=>adaptDailyQuestion(q).version!==record.questionVersions![i])) throw new Error('question_revision_changed');
  const evaluations=known.map((q,i)=>evaluateChoice(q,record.answers[i]));
  if(evaluations.some(e=>!e.valid)) throw new Error('invalid_daily');
  return {version:1,questionVersions:known.map(q=>adaptDailyQuestion(q).version),correctMask:evaluations.map(e=>e.correct),categoryIds:known.map(q=>q.categoryId),subcategoryIds:known.map(q=>q.subcategoryId)};
}
export function parseDailyResultDetails(raw: unknown, correctCount: number): DailyResultDetails {
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('invalid_daily');
  const v=raw as DailyResultDetails;
  if(v.version!==1 || !Array.isArray(v.correctMask) || v.correctMask.length!==7 || !v.correctMask.every(b=>typeof b==='boolean') || v.correctMask.filter(Boolean).length!==correctCount ||
    !Array.isArray(v.questionVersions) || v.questionVersions.length!==7 || !v.questionVersions.every(s=>typeof s==='string'&&/^[a-zA-Z0-9_:./-]{1,240}$/.test(s)) ||
    ![v.categoryIds,v.subcategoryIds].every(a=>Array.isArray(a)&&a.length===7&&a.every(s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(s)))) throw new Error('invalid_daily');
  return {version:1,correctMask:[...v.correctMask],questionVersions:[...v.questionVersions],categoryIds:[...v.categoryIds],subcategoryIds:[...v.subcategoryIds]};
}
export function dailyResultAnalysis(record: DailyChallengeRecord, bank: readonly GeneralKnowledgeQuestion[], frozenCorrectCount: number, details?: DailyResultDetails) {
  const versions=details?.questionVersions??record.questionVersions;
  const selected=record.questionIds.map(id=>bank.find(q=>q.id===id));
  const legacyConsistent = !versions && selected.every(Boolean) && selected.filter((q,i)=>q && record.answers[i]===q.correctIndex).length===frozenCorrectCount;
  const rows=record.questionIds.map((id,i)=>{
    const question=selected[i],compatible=Boolean(question && (versions ? adaptDailyQuestion(question).version===versions[i] : legacyConsistent));
    return {id,index:i,question:compatible?question:null,correct:details?.correctMask[i]??(versions&&compatible?record.answers[i]===question!.correctIndex:null),selectedAnswer:record.answers[i],categoryId:details?.categoryIds[i]??question?.categoryId??null,subcategoryId:details?.subcategoryIds[i]??question?.subcategoryId??null};
  });
  const categories=details ? [...new Set(details.categoryIds)].map(id=>({id,total:details.categoryIds.filter(v=>v===id).length,correct:details.categoryIds.filter((v,i)=>v===id&&details.correctMask[i]).length})) : [];
  const ranked=categories.filter(c=>c.total>=2).sort((a,b)=>b.correct/b.total-a.correct/a.total || b.total-a.total || (a.id<b.id?-1:1));
  const top=ranked[0],runner=ranked[1];
  const strongest = top && top.correct>0 && (!runner || top.correct/top.total>runner.correct/runner.total) ? top : null;
  return {rows,categories,strongest,highestCombo:details?highestCorrectCombo(details.correctMask):null,accuracyPercent:Math.round(frozenCorrectCount/7*100),reviewable:rows.some(r=>r.question),practiceQuestions:rows.filter(r=>r.question&&(r.correct===false||(!versions&&legacyConsistent&&record.answers[r.index]!==r.question.correctIndex))).map(r=>r.question!),legacy:!details};
}
export function recommendDailyLesson(rows: ReturnType<typeof dailyResultAnalysis>['rows'], catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[], preferences: DailyChallengePreferences): Lesson | null {
  const wrong = rows.filter(row => row.correct === false);
  const subcategories = new Set(wrong.map(row => row.subcategoryId));
  const categories = new Set(wrong.map(row => row.categoryId));
  const rank = (lesson: Lesson) => {
    if (subcategories.has(lesson.subcategoryId)) return 0;
    if (categories.has(lesson.categoryId)) return 1;
    return preferences.topicIds.includes(lesson.categoryId) ? 2 : 3;
  };
  const getAccess = createLessonAccessLookup(catalogue, completed, inProgress);
  const candidates: { lesson: Lesson; rank: number; inProgress: boolean; position: number }[] = [];

  for (const lesson of catalogue) {
    if (completed.includes(lesson.id)) continue;
    const { unlocked, position } = getAccess(lesson);
    if (unlocked) {
      candidates.push({ lesson, rank: rank(lesson), inProgress: inProgress.includes(lesson.id), position });
    }
  }

  candidates.sort((a, b) =>
    a.rank - b.rank ||
    Number(b.inProgress) - Number(a.inProgress) ||
    a.position - b.position ||
    (a.lesson.id < b.lesson.id ? -1 : 1)
  );
  return candidates[0]?.lesson ?? null;
}
/** Metadata can enrich the same winning attempt, never replace its answers/score. */
export function enrichDailyDay<T extends {run:[number,string];record:DailyChallengeRecord;history:DailyChallengeHistoryEntry|null;details?:DailyResultDetails}>(selected:T, other:T):T {
  if(JSON.stringify(selected.run)!==JSON.stringify(other.run)||JSON.stringify(selected.record.questionIds)!==JSON.stringify(other.record.questionIds)) return selected;
  const metadata:DailyRecordMetadata={};
  const source=selected.record.questionVersions?selected:other;
  if(source.record.questionVersions){metadata.questionVersions=source.record.questionVersions;if(source.record.selectionVersion)metadata.selectionVersion=source.record.selectionVersion;}
  let details=selected.details;
  if(!details && JSON.stringify(selected.history)===JSON.stringify(other.history) && selected.record.completed && other.details &&
    (!metadata.questionVersions||JSON.stringify(metadata.questionVersions)===JSON.stringify(other.details.questionVersions))) details=other.details;
  return {...selected,record:{...selected.record,...metadata},...(details?{details}:{})};
}
