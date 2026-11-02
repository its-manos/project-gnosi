import type { AnswerEvaluation, ChoiceContent, MatchingContent, MultipleSelectContent, OrderingContent, QuestionHandlers, QuestionToken, QuizMode, QuizQuestion, QuizSession, QuizTransition } from "./types";

export const LEGACY_QUIZ_POINTS = { lessonCorrect: 1, dailyCorrect: 100 } as const;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const safeId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_:.\/-]{1,240}$/.test(value) && !["__proto__", "constructor", "prototype"].includes(value);
function choiceContent(value: unknown): value is ChoiceContent {
  return object(value) && Array.isArray(value.answers) && value.answers.length >= 2 && value.answers.length <= 100 &&
    value.answers.every(a => typeof a === "string" && a.trim().length > 0) && Number.isInteger(value.correctIndex) &&
    (value.correctIndex as number) >= 0 && (value.correctIndex as number) < value.answers.length;
}
export function evaluateChoice(content: unknown, answer: unknown): AnswerEvaluation {
  const valid = choiceContent(content) && typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < content.answers.length;
  return { valid, correct: valid && choiceContent(content) && answer === content.correctIndex };
}
/**
 * Multi-select answers are a non-empty set of distinct option indices.
 * The order in which the user taps options has no bearing on correctness.
 */
function multipleSelectContent(value: unknown): value is MultipleSelectContent {
  return object(value) && Array.isArray(value.answers) && value.answers.length >= 2 && value.answers.length <= 100 &&
    value.answers.every(a => typeof a === "string" && a.trim().length > 0) &&
    Array.isArray(value.correctIndices) && value.correctIndices.length >= 1 && value.correctIndices.length <= value.answers.length &&
    value.correctIndices.every(i => Number.isInteger(i) && i >= 0 && i < value.answers.length) &&
    new Set(value.correctIndices).size === value.correctIndices.length;
}
export function evaluateMultipleSelect(content: unknown, answer: unknown): AnswerEvaluation {
  if (!multipleSelectContent(content) || !Array.isArray(answer)) return { valid: false, correct: false };
  const valid = answer.length >= 1 && answer.length <= content.answers.length &&
    answer.every(i => Number.isInteger(i) && i >= 0 && i < content.answers.length) &&
    new Set(answer).size === answer.length;
  return { valid, correct: valid && answer.length === content.correctIndices.length &&
    answer.every(i => content.correctIndices.includes(i)) };
}

/** Order is represented by stable item IDs, never display positions or labels. */
function orderingContent(value: unknown): value is OrderingContent {
  if (!object(value) || !Array.isArray(value.items) || value.items.length < 2 || value.items.length > 12 ||
    !value.items.every(item => object(item) && safeId(item.id) && typeof item.label === "string" && item.label.trim())) return false;
  const ids = value.items.map(item => item.id);
  return new Set(ids).size === ids.length && Array.isArray(value.correctOrder) &&
    value.correctOrder.length === ids.length && value.correctOrder.every(id => ids.includes(id)) &&
    new Set(value.correctOrder).size === ids.length;
}
export function evaluateOrdering(content: unknown, answer: unknown): AnswerEvaluation {
  if (!orderingContent(content) || !Array.isArray(answer)) return { valid: false, correct: false };
  const ids = content.items.map(item => item.id);
  const valid = answer.length === ids.length && answer.every(id => typeof id === "string" && ids.includes(id)) &&
    new Set(answer).size === ids.length;
  return { valid, correct: valid && answer.every((id, index) => id === content.correctOrder[index]) };
}

/**
 * Matching answers map every left ID to one right ID; both sides are bijective.
 * Correctness is derived from the authored pairs, not persisted answer flags.
 */
function matchingContent(value: unknown): value is MatchingContent {
  if (!object(value) || !Array.isArray(value.pairs) || value.pairs.length < 2 || value.pairs.length > 12 ||
    !value.pairs.every(pair => object(pair) && safeId(pair.leftId) && safeId(pair.rightId) &&
      typeof pair.leftLabel === "string" && pair.leftLabel.trim() &&
      typeof pair.rightLabel === "string" && pair.rightLabel.trim())) return false;
  return new Set(value.pairs.map(pair => pair.leftId)).size === value.pairs.length &&
    new Set(value.pairs.map(pair => pair.rightId)).size === value.pairs.length;
}
export function evaluateMatching(content: unknown, answer: unknown): AnswerEvaluation {
  if (!matchingContent(content) || !object(answer)) return { valid: false, correct: false };
  const left = content.pairs.map(pair => pair.leftId), right = content.pairs.map(pair => pair.rightId);
  const values = Object.values(answer);
  const valid = Object.keys(answer).length === left.length && left.every(id => own(answer, id)) &&
    values.length === right.length && values.every(id => typeof id === "string" && right.includes(id)) &&
    new Set(values).size === right.length;
  return { valid, correct: valid && content.pairs.every(pair => answer[pair.leftId] === pair.rightId) };
}

export const DEFAULT_QUESTION_HANDLERS: QuestionHandlers = Object.freeze({
  "multiple-choice": { validateContent: choiceContent, evaluate: evaluateChoice },
  "multiple-select": { validateContent: multipleSelectContent, evaluate: evaluateMultipleSelect },
  ordering: { validateContent: orderingContent, evaluate: evaluateOrdering },
  matching: { validateContent: matchingContent, evaluate: evaluateMatching },
});
function handlerFor(type: string, handlers: QuestionHandlers) {
  return own(handlers, type) ? handlers[type] : undefined;
}
export function evaluateAnswer(question: QuizQuestion, answer: unknown, handlers = DEFAULT_QUESTION_HANDLERS): AnswerEvaluation {
  const handler = handlerFor(question.type, handlers);
  return handler?.validateContent(question.content) ? handler.evaluate(question.content, answer) : { valid: false, correct: false };
}

/** Automatic scored-content revision. Does not replace historical quiz aliases. */
export function contentVersion(prompt: string, content: unknown, editorialVersion = "1"): string {
  const text = JSON.stringify([prompt, content]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `${editorialVersion}:${(hash >>> 0).toString(16)}`;
}

/** Same answer rules for legacy banks, result calculations and store validation. */
export function calculateChoiceResults(questions: readonly ChoiceContent[], answers: Readonly<Record<string, unknown>>) {
  const incorrectIndices: number[] = [], missingIndices: number[] = [], invalidIndices: number[] = [];
  let correctCount = 0, answeredCount = 0;
  questions.forEach((question, index) => {
    const key = String(index);
    if (!own(answers, key)) { missingIndices.push(index); return; }
    const result = evaluateChoice(question, answers[key]);
    if (!result.valid) { invalidIndices.push(index); return; }
    answeredCount++;
    if (result.correct) correctCount++; else incorrectIndices.push(index);
  });
  return { questionCount: questions.length, answeredCount, correctCount, incorrectIndices, missingIndices, invalidIndices,
    complete: questions.length > 0 && answeredCount === questions.length,
    accuracyPercent: questions.length ? Math.round(correctCount / questions.length * 100) : 0 };
}

function validateQuestion(raw: unknown, handlers: QuestionHandlers): raw is QuizQuestion {
  if (!object(raw) || !safeId(raw.id) || typeof raw.type !== "string" || !safeId(raw.version) ||
    !safeId(raw.categoryId) || !safeId(raw.subcategoryId) || !Array.isArray(raw.conceptIds) || !raw.conceptIds.length ||
    !raw.conceptIds.every(safeId) || new Set(raw.conceptIds).size !== raw.conceptIds.length ||
    !["easy", "medium", "hard"].includes(String(raw.difficulty)) ||
    !["editorial", "legacy-default"].includes(String(raw.difficultyOrigin)) ||
    typeof raw.prompt !== "string" || !raw.prompt.trim() || typeof raw.explanation !== "string" || !raw.explanation.trim() ||
    !Array.isArray(raw.sources) || !raw.sources.every(s => object(s) && typeof s.title === "string" && typeof s.url === "string" && (s.publisher === undefined || typeof s.publisher === "string"))) return false;
  if (raw.media !== undefined && (!object(raw.media) || typeof raw.media.uri !== "string" || typeof raw.media.alt !== "string" ||
    (raw.media.caption !== undefined && typeof raw.media.caption !== "string") || (raw.media.credit !== undefined && typeof raw.media.credit !== "string"))) return false;
  return handlerFor(raw.type, handlers)?.validateContent(raw.content) === true;
}

/** Parse untrusted local bytes. Stored correctness/results are always recomputed. */
export function parseQuizSession(raw: unknown, handlers = DEFAULT_QUESTION_HANDLERS): QuizSession {
  if (!object(raw) || raw.schemaVersion !== 1 || !safeId(raw.id) || !["daily", "lesson", "review", "challenge"].includes(String(raw.mode)) ||
    !Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 100 ||
    !raw.questions.every(q => validateQuestion(q, handlers)) || new Set(raw.questions.map(q => q.id)).size !== raw.questions.length ||
    !object(raw.answers) || !Number.isInteger(raw.currentIndex) || (raw.currentIndex as number) < 0 ||
    (raw.currentIndex as number) >= raw.questions.length || typeof raw.completed !== "boolean") throw new Error("invalid_quiz_session");
  const questions = raw.questions as QuizQuestion[], currentIndex = raw.currentIndex as number;
  const answers: QuizSession["answers"] = {};
  for (const [id, answer] of Object.entries(raw.answers)) {
    const index = questions.findIndex(q => q.id === id), question = questions[index];
    if (index < 0 || index > currentIndex || !object(answer) || answer.questionVersion !== question.version ||
      !own(answer, "value") || !evaluateAnswer(question, answer.value, handlers).valid) throw new Error("invalid_quiz_session");
    answers[id] = { questionVersion: question.version, value: answer.value };
  }
  for (let i = 0; i < currentIndex; i++) if (!own(answers, questions[i].id)) throw new Error("invalid_quiz_session");
  if (raw.completed && (currentIndex !== questions.length - 1 || Object.keys(answers).length !== questions.length)) throw new Error("invalid_quiz_session");
  // Own the snapshot: callers cannot mutate the input question bank through it.
  return JSON.parse(JSON.stringify({ schemaVersion: 1, id: raw.id, mode: raw.mode, questions, answers, currentIndex, completed: raw.completed })) as QuizSession;
}
export function createQuizSession(id: string, mode: QuizMode, questions: readonly QuizQuestion[], handlers = DEFAULT_QUESTION_HANDLERS): QuizSession {
  return parseQuizSession({ schemaVersion: 1, id, mode, questions, answers: {}, currentIndex: 0, completed: false }, handlers);
}
export function serializeQuizSession(session: QuizSession, handlers = DEFAULT_QUESTION_HANDLERS): string {
  return JSON.stringify(parseQuizSession(session, handlers));
}
export function restoreQuizSession(bytes: string, handlers = DEFAULT_QUESTION_HANDLERS): QuizSession {
  return parseQuizSession(JSON.parse(bytes), handlers);
}
export function questionToken(session: QuizSession): QuestionToken {
  const question = session.questions[session.currentIndex];
  return { id: question.id, version: question.version };
}
function rejected(session: QuizSession, reason: QuizTransition["reason"]): QuizTransition { return { session, changed: false, reason }; }
export function submitQuizAnswer(session: QuizSession, token: QuestionToken, value: unknown, handlers = DEFAULT_QUESTION_HANDLERS): QuizTransition {
  const current = questionToken(session);
  if (token.id !== current.id || token.version !== current.version) return rejected(session, "stale-question");
  if (session.completed) return rejected(session, "completed");
  if (own(session.answers, token.id)) return rejected(session, "duplicate");
  if (!evaluateAnswer(session.questions[session.currentIndex], value, handlers).valid) return rejected(session, "invalid-answer");
  return { session: parseQuizSession({ ...session, answers: { ...session.answers, [token.id]: { questionVersion: token.version, value } } }, handlers), changed: true, reason: "accepted" };
}
export function advanceQuizSession(session: QuizSession, token: QuestionToken): QuizTransition {
  const current = questionToken(session);
  if (token.id !== current.id || token.version !== current.version) return rejected(session, "stale-question");
  if (session.completed) return rejected(session, "completed");
  if (!own(session.answers, token.id)) return rejected(session, "answer-required");
  const last = session.currentIndex === session.questions.length - 1;
  return { session: { ...session, currentIndex: last ? session.currentIndex : session.currentIndex + 1, completed: last }, changed: true, reason: "accepted" };
}
export function calculateQuizResults(session: QuizSession, pointsPerCorrect: number = LEGACY_QUIZ_POINTS.lessonCorrect, handlers = DEFAULT_QUESTION_HANDLERS) {
  if (!Number.isSafeInteger(pointsPerCorrect) || pointsPerCorrect < 0) throw new Error("invalid_scoring_policy");
  let correctCount = 0, answeredCount = 0;
  const incorrectQuestionIds: string[] = [];
  for (const question of session.questions) {
    if (!own(session.answers, question.id)) continue;
    const result = evaluateAnswer(question, session.answers[question.id].value, handlers);
    if (!result.valid) continue;
    answeredCount++;
    if (result.correct) correctCount++; else incorrectQuestionIds.push(question.id);
  }
  return { correctCount, answeredCount, total: session.questions.length, accuracyPercent: Math.round(correctCount / session.questions.length * 100),
    points: correctCount * pointsPerCorrect, incorrectQuestionIds, completed: session.completed };
}
