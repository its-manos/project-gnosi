import type { ChoiceQuestion } from "../quiz/types";
import { evaluateChoice } from "../quiz/engine";
import { GAME_REWARD_RULES, REWARD_RULES } from "./rules";
export type RewardGame = keyof typeof GAME_REWARD_RULES;
const gameReceipt = /^game:(hangman|quick):(\d{4}-\d{2}-\d{2}):([a-zA-Z0-9_:-]{1,100})$/;
export type RewardLedger = Record<string, number>;
export type RewardDomain = "learning" | "daily";
export const hasReward = (ledger: RewardLedger, key: string) => Object.prototype.hasOwnProperty.call(ledger, key);
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
function limit(key: string, domain?: RewardDomain): number {
  if (/^seen:[a-zA-Z0-9_:./-]{1,240}$/.test(key)) return 0;
  if (domain !== 'daily') {
    const game = gameReceipt.exec(key);
    if (game && validDate(game[2])) return GAME_REWARD_RULES[game[1] as RewardGame].reward;
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
/** Clamp each game's date bucket after unioning receipts. Concurrent offline wins
 * remain distinct, while merging devices can never exceed the daily allowance. */
export function totalRewardXP(ledger: RewardLedger): number {
  let total = 0;
  const buckets = new Map<string, number>();
  for (const [key, xp] of Object.entries(ledger)) {
    const match = gameReceipt.exec(key);
    if (!match) { total += xp; continue; }
    const bucket = `${match[1]}:${match[2]}`;
    const previous = buckets.get(bucket) ?? 0;
    const next = Math.min(GAME_REWARD_RULES[match[1] as RewardGame].dailyCap, previous + xp);
    total += next - previous;
    buckets.set(bucket, next);
  }
  return total;
}
export function gameRewardXP(ledger: RewardLedger, game: RewardGame, date: string): number {
  const prefix = `game:${game}:${date}:`;
  return totalRewardXP(Object.fromEntries(Object.entries(ledger).filter(([key]) => key.startsWith(prefix))));
}
/** First attempts only for Quick Quiz; Hangman calls this only on a win.
 * Zero receipts retain wrong first attempts; no further writes at the cap. */
export function awardGame(ledger: RewardLedger, game: RewardGame, date: string, id: string, success: boolean): RewardLedger {
  const key = `game:${game}:${date}:${id}`;
  if (!gameReceipt.test(key) || !validDate(date)) throw new Error('invalid_game_reward');
  if (hasReward(ledger, key)) return ledger;
  const rules = GAME_REWARD_RULES[game];
  if (gameRewardXP(ledger, game, date) >= rules.dailyCap) return ledger;
  const xp = success ? rules.reward : 0;
  return parseRewardLedger({ ...ledger, [key]: xp }, 'learning');
}
export function quizRewardSummary(questions: readonly ChoiceQuestion[], answers: Readonly<Record<string, unknown>>, mode: 'daily' | 'lesson' | 'review', ledger: RewardLedger = {}, completed = false) {
  let combo = 0, highestCombo = 0, answerXP = 0, comboXP = 0, correct = 0, answered = 0;
  const rows: { baseXP: number; comboXP: number; correct: boolean; eligible: boolean }[] = [];
  for (let i = 0; i < questions.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(answers, String(i))) break;
    const result = evaluateChoice(questions[i].content, answers[i]);
    if (!result.valid) break;
    answered++;
    if (result.correct) { combo++; correct++; highestCombo = Math.max(highestCombo, combo); } else combo = 0;
    const eligible = mode === 'daily' || !hasReward(ledger, `seen:${questions[i].id}`);
    const base = eligible && result.correct ? mode === 'daily' ? REWARD_RULES.dailyCorrect : REWARD_RULES.correct[questions[i].difficulty] : 0;
    // Delayed recall retains its established one-time combo rewards.
    const bonus = mode !== 'daily' && eligible && result.correct ? Math.min(mode === 'review' ? 10 : REWARD_RULES.comboCap, Math.max(0, combo - 1) * REWARD_RULES.comboStep) : 0;
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
