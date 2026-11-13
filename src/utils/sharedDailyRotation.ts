import type { GeneralKnowledgeQuestion } from "../data/questions";
import { SHARED_DAILY_V2_IDS, SHARED_DAILY_V2_START, SHARED_DAILY_V2_VERSIONS } from "../data/sharedDailyPoolV2";
import { SHARED_DAILY_V2_SCHEDULE } from "../data/sharedDailyScheduleV2";
import { adaptDailyQuestion } from "../quiz/adapters";

/** A repeating 48-day cycle guarantees no repeats in any rolling 30-day window,
 * including cycle boundaries, without device/account history or network access. */
export function selectDailyRotation(date: string, bank: readonly GeneralKnowledgeQuestion[]): GeneralKnowledgeQuestion[] {
  const byId = new Map(bank.map(q => [q.id, q]));
  for (const id of SHARED_DAILY_V2_IDS) {
    const question = byId.get(id);
    if (!question || adaptDailyQuestion(question).version !== SHARED_DAILY_V2_VERSIONS[id]) return [];
  }
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${SHARED_DAILY_V2_START}T12:00:00Z`)) / 86400000);
  const cycle = SHARED_DAILY_V2_SCHEDULE.length;
  return SHARED_DAILY_V2_SCHEDULE[((days % cycle) + cycle) % cycle].map(id => byId.get(id)!);
}
