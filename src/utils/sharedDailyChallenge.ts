import { questions, DAILY_CHALLENGE_SIZE, type GeneralKnowledgeQuestion } from "../data/questions";
import { SHARED_DAILY_POOL_VERSION, SHARED_DAILY_QUESTION_IDS, SHARED_DAILY_QUESTION_VERSIONS } from "../data/sharedDailyPool";
import { adaptDailyQuestion } from "../quiz/adapters";
import type { DailyChallengeRecord } from "./dailyChallenge";
export type DailyRecordMetadata = { selectionVersion?: string; questionVersions?: string[] };
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s+'T12:00:00Z')) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const hash = (s: string) => { let n=2166136261; for(let i=0;i<s.length;i++) n=Math.imul(n^s.charCodeAt(i),16777619); return n>>>0; };
/** Frozen ID manifest + independent per-ID ranks: array order/additions do not change v1. */
export function selectSharedDailyQuestions(date: string, bank: readonly GeneralKnowledgeQuestion[] = questions): GeneralKnowledgeQuestion[] {
  if (!validDate(date)) return [];
  const allowed = new Set(SHARED_DAILY_QUESTION_IDS), seen = new Set<string>();
  const pool = bank.filter(q => {if(!allowed.has(q.id)||seen.has(q.id))return false;seen.add(q.id);return true;});
  if(pool.length!==SHARED_DAILY_QUESTION_IDS.length || pool.length<DAILY_CHALLENGE_SIZE || pool.some(q=>adaptDailyQuestion(q).version!==SHARED_DAILY_QUESTION_VERSIONS[q.id])) return [];
  const rank = (id: string) => hash(`${SHARED_DAILY_POOL_VERSION}|${date}|${id}`);
  const order = (a: string,b: string) => rank(a)-rank(b) || (a<b?-1:a>b?1:0);
  const categories = [...new Set(pool.map(q=>q.categoryId))].sort(order).slice(0,4);
  const difficulties = ['easy','easy','medium','medium','medium','hard','hard'];
  const chosen: GeneralKnowledgeQuestion[] = [], used = new Set<string>(), counts = new Map<string,number>();
  for(let i=0;i<DAILY_CHALLENGE_SIZE;i++) {
    const category = categories[i%categories.length], difficulty = difficulties[i];
    const priority = (q: GeneralKnowledgeQuestion) => {
      const bounded = (counts.get(q.categoryId)??0)<2;
      if(q.categoryId===category && q.difficulty===difficulty && bounded) return 0;
      if(q.difficulty===difficulty && bounded && categories.includes(q.categoryId)) return 1;
      if(q.difficulty===difficulty && bounded) return 2;
      if(q.categoryId===category && bounded) return 3;
      return bounded ? 4 : 5;
    };
    const next = pool.filter(q=>!used.has(q.id)).sort((a,b)=>priority(a)-priority(b)||order(a.id,b.id))[0];
    chosen.push(next); used.add(next.id); counts.set(next.categoryId,(counts.get(next.categoryId)??0)+1);
  }
  return chosen;
}
export function createSharedDailyRecord(date: string, bank: readonly GeneralKnowledgeQuestion[] = questions): DailyChallengeRecord | null {
  const selected = selectSharedDailyQuestions(date,bank);
  return selected.length===DAILY_CHALLENGE_SIZE ? { dateKey:date, questionIds:selected.map(q=>q.id), questionVersions:selected.map(q=>adaptDailyQuestion(q).version), selectionVersion:SHARED_DAILY_POOL_VERSION, currentIndex:0, answers:{}, started:true, completed:false } : null;
}
export function readDailyMetadata(raw: Record<string,unknown>): DailyRecordMetadata {
  const result: DailyRecordMetadata = {};
  if(raw.selectionVersion!==undefined) {
    if(typeof raw.selectionVersion!=='string' || !/^shared-v[1-9][0-9]{0,3}$/.test(raw.selectionVersion) || raw.started!==true || raw.questionVersions===undefined) throw new Error('invalid_daily');
    result.selectionVersion = raw.selectionVersion as string;
  }
  if(raw.questionVersions!==undefined) {
    if(raw.started!==true || !Array.isArray(raw.questionVersions) || raw.questionVersions.length!==7 || !raw.questionVersions.every(v=>typeof v==='string'&&/^[a-zA-Z0-9_:./-]{1,240}$/.test(v))) throw new Error('invalid_daily');
    result.questionVersions = [...raw.questionVersions];
  }
  return result;
}
export function dailyQuestionsCompatible(record: DailyChallengeRecord, bank: readonly GeneralKnowledgeQuestion[] = questions): boolean {
  return record.questionIds.length===7 && record.questionIds.every((id,i)=>{const q=bank.find(q=>q.id===id);return q && (!record.questionVersions || adaptDailyQuestion(q).version===record.questionVersions[i]);});
}
