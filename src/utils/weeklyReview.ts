import { lessons, type Lesson } from "../data/lessons";
import { getAthensDateKey } from "./dailyChallenge";
import { mondayOf, quizFingerprint, type CompletionEvents } from "./learningActivity";

export type WeeklyAnswer = { sourceId: string; questionIndex: number; week: string; answerIndex: number; at: number };
export type WeeklyAnswers = Record<string, WeeklyAnswer>;
export type WeeklyItem = { id: string; sourceId: string; lesson: Lesson; questionIndex: number; week: string };
export const weeklyId = (week: string, lessonId: string, quizKey: string, index: number) => `${week}_${lessonId}_${quizKey}_${index}`;

export function parseWeeklyAnswers(raw: unknown, events: CompletionEvents): WeeklyAnswers {
  if (raw === undefined) return {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid_sync");
  const result: WeeklyAnswers = {};
  for (const [id, value] of Object.entries(raw).sort(([a], [b]) => a.localeCompare(b))) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_sync");
    const v = value as WeeklyAnswer, source = events[v.sourceId];
    if (Object.keys(v).length !== 5 || typeof v.sourceId !== "string" || !source || !source.missedQuestionIndices?.includes(v.questionIndex) ||
      !Number.isInteger(v.questionIndex) || !Number.isInteger(v.answerIndex) || v.answerIndex < 0 || v.answerIndex > 99 ||
      typeof v.week !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.week) ||
      !Number.isSafeInteger(v.at) || v.at < 946684800000 || v.at > 4102444800000 ||
      mondayOf(getAthensDateKey(new Date(v.at))) !== v.week || getAthensDateKey(new Date(source.at)) >= v.week ||
      id !== weeklyId(v.week, source.lessonId, source.quizKey, v.questionIndex)) throw new Error("invalid_sync");
    result[id] = { sourceId: v.sourceId, questionIndex: v.questionIndex, week: v.week, answerIndex: v.answerIndex, at: v.at };
  }
  return result;
}

/** A question gets one scored answer per Athens calendar week, on all devices. */
export function mergeWeeklyAnswers(a: WeeklyAnswers = {}, b: WeeklyAnswers = {}): WeeklyAnswers {
  const result = { ...a };
  for (const [id, incoming] of Object.entries(b)) {
    const current = result[id];
    // Earliest answer wins offline conflicts. Deterministic tie-break, never best-answer wins.
    if (!current || incoming.at < current.at || (incoming.at === current.at && (incoming.sourceId < current.sourceId || (incoming.sourceId === current.sourceId && incoming.answerIndex < current.answerIndex)))) result[id] = incoming;
  }
  return result;
}

function evidence(lesson: Lesson, events: CompletionEvents, answers: WeeklyAnswers, before = "9999-12-31") {
  const key = quizFingerprint(lesson.questions), known = new Set<number>();
  const matching = Object.entries(events).filter(([, e]) => e.lessonId === lesson.id && e.quizKey === key && getAthensDateKey(new Date(e.at)) < before);
  for (const [, event] of matching) {
    if (event.missedQuestionIndices || event.correctCount === event.questionCount) {
      for (let i = 0; i < event.questionCount; i++) if (!event.missedQuestionIndices?.includes(i)) known.add(i);
    }
  }
  for (const answer of Object.values(answers)) {
    const source = events[answer.sourceId];
    if (answer.week < before && source?.lessonId === lesson.id && source.quizKey === key && lesson.questions[answer.questionIndex]?.correctIndex === answer.answerIndex) known.add(answer.questionIndex);
  }
  return { matching, known };
}

export function lessonScores(lesson: Lesson, events: CompletionEvents, answers: WeeklyAnswers = {}) {
  const { matching, known } = evidence(lesson, events, answers);
  const best = matching.length ? Math.max(...matching.map(([, e]) => e.correctCount)) : null;
  return { best, mastered: known.size, total: lesson.questions.length, hasDetails: matching.some(([, e]) => e.missedQuestionIndices !== undefined || e.correctCount === e.questionCount) };
}

/** Freeze eligibility at Monday: this week's lessons/practice cannot refill the quiz. */
export function weeklyPlan(events: CompletionEvents, answers: WeeklyAnswers = {}, today = getAthensDateKey()): WeeklyItem[] {
  const week = mondayOf(today), candidates: (WeeklyItem & { priority: string })[] = [];
  for (const lesson of lessons) {
    const { matching, known } = evidence(lesson, events, answers, week);
    const seen = new Set<number>();
    matching.sort(([aId, a], [bId, b]) => a.at - b.at || aId.localeCompare(bId));
    for (const [sourceId, event] of matching) for (const questionIndex of event.missedQuestionIndices ?? []) {
      if (known.has(questionIndex) || seen.has(questionIndex)) continue;
      seen.add(questionIndex);
      const id = weeklyId(week, lesson.id, event.quizKey, questionIndex);
      const lastWeek = Object.values(answers).filter(a => a.week < week && events[a.sourceId]?.lessonId === lesson.id && events[a.sourceId]?.quizKey === event.quizKey && a.questionIndex === questionIndex).map(a => a.week).sort().pop() ?? "0000-00-00";
      candidates.push({ id, sourceId, lesson, questionIndex, week, priority: `${lastWeek}_${quizFingerprint([{ question: `${week}_${id}`, answers: [], correctIndex: 0 }])}` });
    }
  }
  // Keep answered items even if an older offline attempt arrives midweek.
  const answered: WeeklyItem[] = Object.entries(answers).filter(([, a]) => a.week === week).flatMap(([id, a]) => {
    const source = events[a.sourceId], lesson = lessons.find(l => l.id === source?.lessonId);
    return lesson && source.quizKey === quizFingerprint(lesson.questions) ? [{ id, sourceId: a.sourceId, lesson, questionIndex: a.questionIndex, week }] : [];
  });
  const used = new Set(answered.map(item => item.id));
  return [...answered.sort((a, b) => a.id.localeCompare(b.id)), ...candidates.filter(c => !used.has(c.id)).sort((a, b) => a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id)).slice(0, Math.max(0, 10 - answered.length))];
}

export function shuffledIndices(length: number, seed: string): number[] {
  const result = Array.from({ length }, (_, i) => i);
  let state = Number.parseInt(quizFingerprint([{ question: seed, answers: [], correctIndex: 0 }]).slice(2), 16);
  for (let i = length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1); [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
