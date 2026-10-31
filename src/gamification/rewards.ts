import type { ChoiceQuestion } from "../quiz/types";
import { evaluateChoice } from "../quiz/engine";
import { REWARD_RULES } from "./rules";
export type RewardLedger = Record<string, number>;
export type RewardDomain = "learning" | "daily";
export const hasReward = (ledger: RewardLedger, key: string) => Object.prototype.hasOwnProperty.call(ledger, key);
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
function limit(key: string, domain?: RewardDomain): number {
  if (/^seen:[a-zA-Z0-9_:./-]{1,240}$/.test(key)) return 0;
  if (domain !== 'daily') {
    if (/^lesson:[a-zA-Z0-9_-]{1,100}$/.test(key)) return 3030;
    if (/^category:[a-zA-Z0-9_-]{1,100}$/.test(key)) return 25;
    if (/^recall:[a-zA-Z0-9_-]{1,100}:[0-9]{1,2}$/.test(key)) return 30;
    if (key.startsWith('review:') && validDate(key.slice(7))) return 10;
  }
  if (domain !== 'learning' && key.startsWith('day:') && validDate(key.slice(4))) return 250;
  return -1;
}
export function parseRewardLedger(raw: unknown, domain?: RewardDomain): RewardLedger {
  if (raw === undefined) return {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid_rewards');
  const result: RewardLedger = {};
  for (const [key, xp] of Object.entries(raw).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (!Number.isSafeInteger(xp) || (xp as number) < 0 || (xp as number) > limit(key, domain)) throw new Error('invalid_rewards');
    result[key] = xp as number;
  }
  return result;
}
/** A bounded entitlement per identity; never sum duplicate offline submissions. */
export function mergeRewardLedgers(a: RewardLedger = {}, b: RewardLedger = {}): RewardLedger {
  const result = { ...a };
  for (const [id, xp] of Object.entries(b)) result[id] = Math.max(result[id] ?? 0, xp);
  return parseRewardLedger(result);
}
export const totalRewardXP = (ledger: RewardLedger) => Object.values(ledger).reduce((sum, xp) => sum + xp, 0);
export function quizRewardSummary(questions: readonly ChoiceQuestion[], answers: Readonly<Record<string, unknown>>, mode: 'daily' | 'lesson' | 'review', ledger: RewardLedger = {}, completed = false) {
  let combo = 0, highestCombo = 0, answerXP = 0, comboXP = 0, correct = 0, answered = 0;
  const rows: { baseXP: number; comboXP: number; correct: boolean; eligible: boolean }[] = [];
  for (let i = 0; i < questions.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(answers, String(i))) break;
    const result = evaluateChoice(questions[i].content, answers[i]);
    if (!result.valid) break;
    answered++;
    if (result.correct) { combo++; correct++; highestCombo = Math.max(highestCombo, combo); } else combo = 0;
    const eligible = !hasReward(ledger, `seen:${questions[i].id}`);
    const base = eligible ? result.correct ? REWARD_RULES.correct[questions[i].difficulty] : mode === 'daily' ? REWARD_RULES.dailyWrong : 0 : 0;
    const bonus = eligible && result.correct ? Math.min(REWARD_RULES.comboCap, Math.max(0, combo - 1) * REWARD_RULES.comboStep) : 0;
    answerXP += base; comboXP += bonus;
    rows.push({ baseXP: base, comboXP: bonus, correct: result.correct, eligible });
  }
  const finished = completed && answered === questions.length && questions.length > 0;
  const completionXP = finished ? mode === 'daily' ? REWARD_RULES.daily : mode === 'lesson' ? REWARD_RULES.lesson : REWARD_RULES.review : 0;
  const perfectXP = finished && mode === 'daily' && correct === questions.length ? REWARD_RULES.perfectDaily : 0;
  return { combo, highestCombo, answerXP, comboXP, completionXP, perfectXP, totalXP: answerXP + comboXP + completionXP + perfectXP, rows };
}
export function awardQuiz(ledger: RewardLedger, key: string, questions: readonly ChoiceQuestion[], answers: Readonly<Record<string, unknown>>, mode: 'daily' | 'lesson'): RewardLedger {
  if (hasReward(ledger, key)) return ledger;
  const summary = quizRewardSummary(questions, answers, mode, ledger, true);
  if (summary.rows.length !== questions.length || !questions.length) throw new Error('incomplete_quiz');
  const next = { ...ledger, [key]: summary.totalXP };
  for (const question of questions) next[`seen:${question.id}`] = 0;
  return parseRewardLedger(next);
}
