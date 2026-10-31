import type { GeneralKnowledgeQuestion } from "../data/questions";
import type { DailyChallengeRecord } from "../utils/dailyChallenge";
import type { QuizMode, QuizQuestion, QuizSession } from "./types";
import { adaptDailyQuestion } from "./adapters";
import { parseQuizSession } from "./engine";

/** Bridge legacy numeric slots to IDs, retaining the existing wire format. */
export function restoreLegacySession(id: string, mode: QuizMode, questions: QuizQuestion[], answers: Readonly<Record<string, unknown>>, currentIndex?: number, completed = false): QuizSession {
  const mapped: QuizSession["answers"] = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!/^(0|[1-9][0-9]*)$/.test(key)) throw new Error("invalid_quiz_session");
    const question = questions[Number(key)];
    if (!question) throw new Error("invalid_quiz_session");
    mapped[question.id] = { questionVersion: question.version, value };
  }
  let firstUnanswered = 0;
  while (firstUnanswered < questions.length && Object.prototype.hasOwnProperty.call(answers, String(firstUnanswered))) firstUnanswered++;
  return parseQuizSession({ schemaVersion: 1, id, mode, questions, answers: mapped,
    currentIndex: currentIndex ?? Math.min(firstUnanswered, questions.length - 1), completed });
}
export function legacyAnswerSlots(session: QuizSession): Record<string, number> {
  return Object.fromEntries(session.questions.flatMap((q, index) => Object.prototype.hasOwnProperty.call(session.answers, q.id) ? [[String(index), session.answers[q.id].value as number]] : []));
}
export function dailyRecordSession(record: DailyChallengeRecord, bank: readonly GeneralKnowledgeQuestion[]): QuizSession | null {
  if (!record.started) return null;
  const questions = record.questionIds.map(id => {
    const question = bank.find(q => q.id === id);
    if (!question) throw new Error("unknown_question");
    return adaptDailyQuestion(question);
  });
  return restoreLegacySession(`daily:${record.dateKey}`, "daily", questions, record.answers, record.currentIndex, record.completed);
}
export function updateDailyRecord(record: DailyChallengeRecord, session: QuizSession): DailyChallengeRecord {
  if (session.id !== `daily:${record.dateKey}` || session.mode !== "daily" || session.questions.length !== record.questionIds.length ||
    session.questions.some((q, i) => q.id !== `daily:${record.questionIds[i]}`)) throw new Error("invalid_quiz_session");
  return { ...record, answers: legacyAnswerSlots(session), currentIndex: session.currentIndex, completed: session.completed };
}
