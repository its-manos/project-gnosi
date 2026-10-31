import { categories, lessons, subcategories } from "../data/lessons";
import { questions } from "../data/questions";
import { adaptDailyQuestion, adaptLessonQuestion } from "../quiz/adapters";
import type { ChoiceQuestion } from "../quiz/types";
import type { DailyDocument } from "../utils/dailySyncDocument";
import { getAthensDateKey } from "../utils/dailyChallenge";
import { lessonQuizMatches, shiftDateKey, type CompletionEvents } from "../utils/learningActivity";
import { getInlineQuestionCount } from "../utils/lessonProgress";
import type { WeeklyAnswers } from "../utils/weeklyReview";
import type { KnowledgeReviews, MasteryState } from "./records";

export const MASTERY_LABELS: Record<MasteryState, string> = { new: "Νέο", learning: "Μαθαίνεται", familiar: "Οικείο", mastered: "Κατακτημένο" };
export type KnowledgeItem = { question: ChoiceQuestion; topicId: string; topicTitle: string };
const topicNames: Record<string, string> = { architecture: "Αρχιτεκτονική", space: "Διάστημα", geography: "Γεωγραφία", biology: "Βιολογία", physics: "Φυσική", chemistry: "Χημεία", sports: "Αθλητισμός", mathematics: "Μαθηματικά", languages: "Γλώσσες", technology: "Τεχνολογία", culture: "Πολιτισμός", general: "Γενικές γνώσεις" };
export const knowledgeCatalogue: KnowledgeItem[] = [
  ...lessons.flatMap(lesson => lesson.questions.slice(0, getInlineQuestionCount(lesson)).map((_, i) => ({ question: adaptLessonQuestion(lesson, i), topicId: `unit:${lesson.id}`, topicTitle: lesson.title }))),
  ...questions.map(q => ({ question: adaptDailyQuestion(q), topicId: `daily-topic:${q.categoryId}:${q.subcategoryId}`, topicTitle: subcategories.find(s => s.id === q.subcategoryId && s.categoryId === q.categoryId)?.title ?? topicNames[q.subcategoryId] ?? categories.find(c => c.id === q.categoryId)?.title ?? "Γενικές γνώσεις" })),
];
export const knowledgeById = new Map(knowledgeCatalogue.map(item => [item.question.id, item]));
type Observation = { date: string; at: number; correct: boolean | null; recall: boolean; priority: number };
export type QuestionKnowledge = KnowledgeItem & { state: MasteryState; successes: number; due: string | null; lastDate: string | null; reviewedToday: boolean };
export type KnowledgeInput = { completedIds: string[]; activity: CompletionEvents; weeklyReviews: WeeklyAnswers; knowledgeReviews?: KnowledgeReviews };
/** Calendar-day heuristic. Three successes at successively longer due dates are required. */
export function scheduleQuestion(item: KnowledgeItem, observations: Observation[], weakExposure: boolean, today: string): QuestionKnowledge {
  let state: MasteryState = weakExposure ? "learning" : "new", successes = 0, due: string | null = weakExposure ? today : null, lastDate: string | null = null;
  const byDate = new Map<string, Observation>();
  for (const row of observations.filter(o => o.date <= today).sort((a, b) => a.date.localeCompare(b.date) || a.priority - b.priority || a.at - b.at)) if (!byDate.has(row.date)) byDate.set(row.date, row);
  for (const row of byDate.values()) {
    if (lastDate === null) {
      state = "learning"; due = shiftDateKey(row.date, row.correct && item.question.difficulty === "easy" ? 2 : 1);
    } else if (row.recall) {
      if (row.correct === false) { successes = 0; state = "learning"; due = shiftDateKey(row.date, 1); }
      else if (row.correct === true && due !== null && row.date >= due) {
        successes = Math.min(3, successes + 1); state = successes === 3 ? "mastered" : "familiar";
        const base = [1, 3, 7, 14][successes], factor = item.question.difficulty === "hard" ? .75 : item.question.difficulty === "easy" ? 1.25 : 1;
        due = shiftDateKey(row.date, Math.max(1, Math.round(base * factor)));
      }
    }
    lastDate = row.date;
  }
  return { ...item, state, successes, due, lastDate, reviewedToday: byDate.has(today) };
}
export function buildKnowledgeModel(input: KnowledgeInput, daily: DailyDocument, today: string) {
  const evidence = new Map<string, Observation[]>(), weak = new Set<string>(), datedLessons = new Set<string>();
  const add = (id: string, row: Observation) => { evidence.set(id, [...(evidence.get(id) ?? []), row]); };
  for (const event of Object.values(input.activity)) {
    const lesson = lessons.find(l => l.id === event.lessonId); if (!lesson) continue;
    datedLessons.add(lesson.id);
    if (!lessonQuizMatches(lesson, event.quizKey)) continue;
    for (let i = 0; i < Math.min(event.questionCount, getInlineQuestionCount(lesson)); i++) add(adaptLessonQuestion(lesson, i).id, { date: getAthensDateKey(new Date(event.at)), at: event.at, correct: event.missedQuestionIndices ? !event.missedQuestionIndices.includes(i) : event.correctCount === event.questionCount ? true : null, recall: false, priority: 0 });
  }
  for (const lesson of lessons.filter(l => input.completedIds.includes(l.id) && !datedLessons.has(l.id))) for (let i = 0; i < getInlineQuestionCount(lesson); i++) weak.add(adaptLessonQuestion(lesson, i).id);
  for (const day of Object.values(daily.days)) {
    if (!day.history || day.record.dateKey > today) continue;
    day.record.questionIds.forEach((id, i) => {
      const normalizedId = `daily:${id}`, item = knowledgeById.get(normalizedId); if (!item) return;
      if (!day.details) { weak.add(normalizedId); return; }
      if (day.details.questionVersions[i] !== item.question.version) return;
      add(normalizedId, { date: day.record.dateKey, at: 0, correct: day.details.correctMask[i], recall: true, priority: 0 });
    });
  }
  for (const answer of Object.values(input.weeklyReviews)) {
    const source = input.activity[answer.sourceId], lesson = source && lessons.find(l => l.id === source.lessonId);
    if (!lesson || !lessonQuizMatches(lesson, source.quizKey) || !lesson.questions[answer.questionIndex]) continue;
    const q = adaptLessonQuestion(lesson, answer.questionIndex);
    if (answer.answerIndex >= q.content.answers.length) continue;
    add(q.id, { date: getAthensDateKey(new Date(answer.at)), at: answer.at, correct: answer.answerIndex === q.content.correctIndex, recall: true, priority: 1 });
  }
  for (const [id, dates] of Object.entries(input.knowledgeReviews ?? {})) {
    const q = knowledgeById.get(id)?.question; if (!q) continue;
    for (const [date, fact] of Object.entries(dates)) if (fact.version === q.version && fact.answerIndex < q.content.answers.length) add(id, { date, at: fact.at, correct: fact.answerIndex === q.content.correctIndex, recall: true, priority: 2 });
  }
  const items = knowledgeCatalogue.map(item => scheduleQuestion(item, evidence.get(item.question.id) ?? [], weak.has(item.question.id), today));
  const due = items.filter(i => i.state !== "new" && i.due && i.due <= today && !i.reviewedToday).sort((a, b) => a.due!.localeCompare(b.due!) || a.successes - b.successes || a.question.id.localeCompare(b.question.id));
  const practice = items.filter(i => i.state !== "new").sort((a, b) => (a.lastDate ?? "").localeCompare(b.lastDate ?? "") || a.question.id.localeCompare(b.question.id));
  const topics = [...new Set(items.map(i => i.topicId))].map(id => {
    const rows = items.filter(i => i.topicId === id), state: MasteryState = rows.every(i => i.state === "mastered") ? "mastered" : rows.every(i => ["familiar", "mastered"].includes(i.state)) ? "familiar" : rows.some(i => i.state !== "new") ? "learning" : "new";
    return { id, title: rows[0].topicTitle, categoryId: rows[0].question.categoryId, state, total: rows.length, mastered: rows.filter(i => i.state === "mastered").length };
  });
  const subjectId = (i: QuestionKnowledge) => i.question.subcategoryId === "architecture" ? "architecture" : i.question.categoryId;
  const categoryProgress = [...new Set(items.map(subjectId))].map(id => {
    const rows = items.filter(i => subjectId(i) === id), rank = { new: 0, learning: 1, familiar: 2, mastered: 3 };
    return { id, title: categories.find(c => c.id === id)?.title ?? topicNames[id] ?? "Γενικές γνώσεις", percent: Math.round(rows.reduce((sum, i) => sum + rank[i.state], 0) / (rows.length * 3) * 100), mastered: rows.filter(i => i.state === "mastered").length, total: rows.length };
  });
  return { items, due, practice, topics, categories: categoryProgress, recalled: items.filter(i => i.successes > 0).length };
}
