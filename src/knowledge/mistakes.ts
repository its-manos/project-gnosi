import { categories, lessons } from "../data/lessons";
import { questions } from "../data/questions";
import { quickQuizQuestions } from "../data/quickQuizQuestions";
import { adaptDailyQuestion, adaptInteractiveLessonQuestion, adaptLessonQuestion } from "../quiz/adapters";
import { evaluateAnswer, parseQuizSession } from "../quiz/engine";
import type { BuiltinQuizQuestion, QuizQuestion, QuizSession } from "../quiz/types";
import { knowledgeSessionTie, safeKnowledgeId } from "./records";

export type Mistake = { questionId: string; version: string; wrong: { at: number; value: unknown } | null; correctAt: number };
export type Mistakes = Record<string, Mistake>;
export type MistakeSession = { quiz: QuizSession; earnedXP: number };
export const mistakeKey = (q: Pick<QuizQuestion, "id" | "version">) => `${q.id}::${q.version}`;
export const mistakeCatalogue = [
  ...lessons.flatMap(lesson => lesson.questions.map((_, index) => ({
    question: adaptInteractiveLessonQuestion(lesson, index) ?? adaptLessonQuestion(lesson, index),
    title: lesson.title, lesson, index,
  }))),
  ...questions.map(q => ({ question: adaptDailyQuestion(q), title: "Καθημερινό κουίζ", lesson: null, index: 0 })),
  ...quickQuizQuestions.map(question => ({ question, title: "Γρήγορο κουίζ", lesson: null, index: 0 })),
];
export const mistakeById = new Map(mistakeCatalogue.map(item => [item.question.id, item]));
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const time = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= 4102444800000;
export function parseMistakes(raw: unknown): Mistakes {
  if (raw === undefined) return {};
  if (!object(raw) || Object.keys(raw).length > 5000) throw new Error("invalid_sync");
  const result: Mistakes = {};
  for (const key of Object.keys(raw).sort()) {
    const row = raw[key];
    if (!object(row) || Object.keys(row).length !== 4 || !safeKnowledgeId(row.questionId) || !safeKnowledgeId(row.version) ||
      key !== mistakeKey({ id: row.questionId, version: row.version }) || !time(row.correctAt) ||
      !(row.wrong === null || (object(row.wrong) && Object.keys(row.wrong).length === 2 && time(row.wrong.at) && row.wrong.at > 0 &&
        Object.hasOwn(row.wrong, "value") && JSON.stringify(row.wrong.value).length <= 4096))) throw new Error("invalid_sync");
    if (row.wrong && object(row.wrong) && row.wrong.value !== null) {
      const current = mistakeById.get(row.questionId)?.question;
      if (current?.version === row.version) {
        const answer = evaluateAnswer(current, row.wrong.value);
        if (!answer.valid || answer.correct) throw new Error("invalid_sync");
      }
    }
    result[key] = JSON.parse(JSON.stringify(row)) as Mistake;
  }
  return result;
}
/** Two monotonic facts per scored revision; retries never create duplicate rows.
 * A tied wrong answer wins conservatively. Merge order cannot resurrect an older mistake. */
export function mergeMistakes(a: Mistakes = {}, b: Mistakes = {}): Mistakes {
  const result = { ...a };
  for (const [key, row] of Object.entries(b)) {
    const old = result[key];
    const wrong = !old?.wrong ? row.wrong : !row.wrong ? old.wrong :
      old.wrong.at > row.wrong.at ? old.wrong : row.wrong.at > old.wrong.at ? row.wrong :
      knowledgeSessionTie(old.wrong.value) >= knowledgeSessionTie(row.wrong.value) ? old.wrong : row.wrong;
    result[key] = { ...row, wrong, correctAt: Math.max(old?.correctAt ?? 0, row.correctAt) };
  }
  return parseMistakes(result);
}
export function recordMistakeAnswer(records: Mistakes, question: QuizQuestion, value: unknown, at: number): Mistakes {
  const result = evaluateAnswer(question, value);
  if (!result.valid) return records;
  return mergeMistakes(records, { [mistakeKey(question)]: { questionId: question.id, version: question.version,
    wrong: result.correct ? null : { at, value }, correctAt: result.correct ? at : 0 } });
}
export function buildMistakeModel(records: Mistakes = {}) {
  // Old scored revisions stay in history, but never ask users to answer an obsolete question.
  const rows = Object.values(records).filter(row => row.wrong).map(row => {
    const item = mistakeById.get(row.questionId);
    const available = item?.question.version === row.version;
    return { ...row, item: available ? item : undefined, revised: row.correctAt > row.wrong!.at, available };
  });
  const pending = rows.filter(row => !row.revised && row.available).sort((a, b) => a.wrong!.at - b.wrong!.at || a.questionId.localeCompare(b.questionId));
  const revised = rows.filter(row => row.revised).length;
  const unavailable = rows.filter(row => !row.revised && !row.available).length;
  const subjects = categories.map(category => {
    const items = rows.filter(row => row.item?.question.categoryId === category.id);
    return { ...category, total: items.length, revised: items.filter(row => row.revised).length };
  }).filter(row => row.total);
  return { rows, pending, revised, total: rows.length, unavailable, subjects };
}
export function parseMistakeSession(raw: unknown): MistakeSession | null {
  if (raw === null) return null;
  if (!object(raw) || Object.keys(raw).length !== 2 || ![0, 10].includes(raw.earnedXP as number)) throw new Error("invalid_sync");
  const quiz = parseQuizSession(raw.quiz);
  if (quiz.mode !== "review" || !quiz.id.startsWith("mr1:") || quiz.questions.length > 5 || (!quiz.completed && raw.earnedXP !== 0)) throw new Error("invalid_sync");
  return { quiz, earnedXP: raw.earnedXP as number };
}
export function currentMistakeSession(session: MistakeSession) {
  return session.quiz.questions.every(q => mistakeById.get(q.id)?.question.version === q.version);
}
export const asBuiltinQuestion = (q: QuizQuestion) => q as BuiltinQuizQuestion;

/** Human-readable saved selections; never show an invented answer for legacy facts. */
export function describeMistakeAnswer(question: BuiltinQuizQuestion, value: unknown): string {
  if (value === null || value === undefined) return "Η παλιότερη επιλογή δεν είχε αποθηκευτεί.";
  switch (question.type) {
    case "multiple-choice": return question.content.answers[value as number] ?? "";
    case "multiple-select": return (value as number[]).map(i => question.content.answers[i]).join(" · ");
    case "ordering": return (value as string[]).map(id => question.content.items.find(i => i.id === id)?.label).join(" → ");
    case "matching": return Object.entries(value as Record<string, string>).map(([left, right]) => `${question.content.pairs.find(p => p.leftId === left)?.leftLabel} → ${question.content.pairs.find(p => p.rightId === right)?.rightLabel}`).join(" · ");
    case "spot-the-mistake": case "fill-in-the-blank": return question.content.options.find(o => o.id === value)?.text ?? "";
  }
}
