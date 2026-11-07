import { adaptDailyQuestion, adaptInteractiveLessonQuestion, adaptLessonQuestion, restoreInteractiveLessonAnswer } from "../quiz/adapters";
import { evaluateAnswer } from "../quiz/engine";
import { lessons } from "../data/lessons";
import { questions } from "../data/questions";
import { lessonQuizMatches, type CompletionEvents } from "../utils/learningActivity";
import type { LearningBackup } from "../utils/learningBackup";
import type { DailyDocument } from "../utils/dailySyncDocument";
import type { WeeklyAnswers } from "../utils/weeklyReview";
import { mergeMistakes, mistakeKey, type Mistakes } from "./mistakes";
const lessonById = new Map(lessons.map(l => [l.id, l]));
const dailyById = new Map(questions.map(q => [q.id, q]));
/** Recover facts, never invent an old selected answer. Completion-only saves cannot identify mistakes. */
export function collectMistakeHistory(backup: LearningBackup, activity: CompletionEvents, weekly: WeeklyAnswers, daily: DailyDocument, known: Mistakes = {}): Mistakes {
  const records: Mistakes = {};
  const add = (row: import("./mistakes").Mistake) => {
    const key = mistakeKey({ id: row.questionId, version: row.version });
    // New answers already carry their exact timestamp and selection. A later
    // completion/scroll timestamp must never replace them with inferred history.
    if (known[key]) return;
    records[key] = mergeMistakes(records[key] ? { [key]: records[key] } : {}, { [key]: row })[key];
  };
  const answer = (q: import("../quiz/types").QuizQuestion, value: unknown, at: number) => {
    const result = evaluateAnswer(q, value);
    if (result.valid) add({ questionId: q.id, version: q.version, wrong: result.correct ? null : { at, value }, correctAt: result.correct ? at : 0 });
  };
  for (const event of Object.values(activity)) {
    const lesson = lessonById.get(event.lessonId);
    if (!lesson || !lessonQuizMatches(lesson, event.quizKey) || !event.missedQuestionIndices) continue;
    for (let i = 0; i < Math.min(event.questionCount, lesson.questions.length); i++) {
      const q = adaptInteractiveLessonQuestion(lesson, i) ?? adaptLessonQuestion(lesson, i);
      const wrong = event.missedQuestionIndices.includes(i);
      add({ questionId: q.id, version: q.version, wrong: wrong ? { at: event.at, value: null } : null, correctAt: wrong ? 0 : event.at });
    }
  }
  for (const [id, attempt] of Object.entries(backup.attempts)) {
    const lesson = lessonById.get(id);
    if (!lesson || !attempt.quizKey || !lessonQuizMatches(lesson, attempt.quizKey)) continue;
    for (const [index, numeric] of Object.entries(attempt.checkpointAnswers)) {
      const i = Number(index), q = adaptInteractiveLessonQuestion(lesson, i) ?? adaptLessonQuestion(lesson, i);
      const value = restoreInteractiveLessonAnswer(lesson, i, numeric, attempt.typedCheckpointAnswers?.[i]);
      if (value !== undefined) answer(q, value, attempt.updatedAt);
    }
  }
  for (const fact of Object.values(weekly)) {
    const source = activity[fact.sourceId], lesson = source && lessonById.get(source.lessonId);
    if (!lesson || !lessonQuizMatches(lesson, source.quizKey)) continue;
    // Historical weekly answers use numeric projections, not typed selections.
    const i = fact.questionIndex, q = adaptInteractiveLessonQuestion(lesson, i) ?? adaptLessonQuestion(lesson, i);
    const correct = fact.answerIndex === lesson.questions[i].correctIndex;
    add({ questionId: q.id, version: q.version, wrong: correct ? null : { at: fact.at, value: q.type === "multiple-choice" ? fact.answerIndex : null }, correctAt: correct ? fact.at : 0 });
  }
  for (const day of Object.values(daily.days)) {
    for (const [slot, value] of Object.entries(day.record.answers)) {
      const i = Number(slot), raw = dailyById.get(day.record.questionIds[i]);
      if (!raw) continue;
      const q = adaptDailyQuestion(raw), version = day.record.questionVersions?.[i] ?? day.details?.questionVersions[i];
      if (version !== q.version) continue;
      // Date-only history gets a conservative start-of-day time. Fresh answers are captured directly.
      const at = Date.parse(`${day.record.dateKey}T00:00:00+02:00`);
      answer(q, value, at);
    }
  }
  return records;
}
