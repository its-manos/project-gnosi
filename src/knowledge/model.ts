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
import { masteryConcepts, type ConceptDefinition } from "./concepts";

export const MASTERY_LABELS: Record<MasteryState, string> = { new: "Νέο", learning: "Μαθαίνεται", familiar: "Οικείο", mastered: "Κατακτημένο" };
export type KnowledgeItem = { question: ChoiceQuestion; topicId: string; topicTitle: string; conceptId?: string; isAssessment?: boolean };
const topicNames: Record<string, string> = { architecture: "Αρχιτεκτονική", space: "Διάστημα", geography: "Γεωγραφία", biology: "Βιολογία", physics: "Φυσική", chemistry: "Χημεία", sports: "Αθλητισμός", mathematics: "Μαθηματικά", languages: "Γλώσσες", technology: "Τεχνολογία", culture: "Πολιτισμός", general: "Γενικές γνώσεις" };
export const sourceCatalogue: KnowledgeItem[] = [
  ...lessons.flatMap(lesson => lesson.questions.slice(0, getInlineQuestionCount(lesson)).map((_, i) => ({ question: adaptLessonQuestion(lesson, i), topicId: `unit:${lesson.id}`, topicTitle: lesson.title }))),
  ...questions.map(q => ({ question: adaptDailyQuestion(q), topicId: `daily-topic:${q.categoryId}:${q.subcategoryId}`, topicTitle: subcategories.find(s => s.id === q.subcategoryId && s.categoryId === q.categoryId)?.title ?? topicNames[q.subcategoryId] ?? categories.find(c => c.id === q.categoryId)?.title ?? "Γενικές γνώσεις" })),
];
export const knowledgeCatalogue: KnowledgeItem[] = [...sourceCatalogue, ...masteryConcepts.flatMap(c => c.variants.map(question => ({ question, topicId: `concept:${c.id}`, topicTitle: c.title, conceptId: c.id, isAssessment: true })))];
const sourceItemsByConcept = new Map(masteryConcepts.map(c => [c.id, sourceCatalogue.filter(i => c.lessonIds.some(id => i.topicId === `unit:${id}`) || c.sourceQuestionIds.includes(i.question.id))]));
const conceptSources = (c: ConceptDefinition) => sourceItemsByConcept.get(c.id)!;
export const knowledgeById = new Map(knowledgeCatalogue.map(item => [item.question.id, item]));
export type KnowledgeInput = { completedIds: string[]; activity: CompletionEvents; weeklyReviews: WeeklyAnswers; knowledgeReviews?: KnowledgeReviews };
export type EvidenceStatus = "new" | "completed" | "assessing" | "needs-evidence" | "mastered";
export type QuestionKnowledge = KnowledgeItem & { state: MasteryState; successes: number; due: string | null; lastDate: string | null; reviewedToday: boolean; novel: boolean; evidenceStatus: EvidenceStatus };
export type ConceptKnowledge = { definition: ConceptDefinition; state: MasteryState; successes: number; due: string | null; lastDate: string | null; reviewedToday: boolean; novelIds: string[]; evidenceStatus: EvidenceStatus; active: boolean };
type Exposure = { date: string | null };
type Recall = { id: string; date: string; at: number; correct: boolean };

/** Version 2 evidence is distinct transfer scenarios, not repetitions of lesson items.
 * First undated exposure needs a dated baseline. Subsequent due successes must use
 * different variants. Only the earliest scenario per concept/date is scored. A
 * mastered concept is retired from routine reviews; exhausted banks wait for new
 * editorial evidence instead of recycling answers. All old records remain intact. */
export function scheduleConcept(definition: ConceptDefinition, exposure: Exposure | undefined, reviews: KnowledgeReviews, today: string): ConceptKnowledge {
  const consumed = new Set<string>(), recalls: Recall[] = [];
  for (const question of definition.variants) {
    const facts = Object.entries(reviews[question.id] ?? {}).filter(([date]) => date <= today).sort(([a, x], [b, y]) => a.localeCompare(b) || x.at - y.at);
    if (facts.length) consumed.add(question.id);
    // One first-ever attempt per scenario. Repetition or a revised answer key can
    // never turn a previously exposed scenario into fresh transfer evidence.
    const first = facts[0];
    if (first && first[1].mode === "scheduled" && first[1].version === question.version && first[1].answerIndex < question.content.answers.length) recalls.push({ id: question.id, date: first[0], at: first[1].at, correct: first[1].answerIndex === question.content.correctIndex });
  }
  const active = !!exposure || consumed.size > 0;
  let state: MasteryState = active ? "learning" : "new", successes = 0;
  let due: string | null = active ? exposure?.date ? shiftDateKey(exposure.date, 1) : today : null;
  let lastDate: string | null = exposure?.date ?? null;
  const dates = new Set<string>();
  for (const row of recalls.sort((a, b) => a.date.localeCompare(b.date) || a.at - b.at || a.id.localeCompare(b.id))) {
    if (dates.has(row.date) || (exposure?.date && row.date < exposure.date)) continue;
    dates.add(row.date);
    if (lastDate === null) { due = shiftDateKey(row.date, 1); }
    else if (!row.correct) { successes = 0; state = "learning"; due = shiftDateKey(row.date, 1); }
    else if (due && row.date >= due) {
      successes = Math.min(3, successes + 1); state = successes === 3 ? "mastered" : "familiar";
      const q = definition.variants.find(q => q.id === row.id)!;
      const factor = q.difficulty === "hard" ? .75 : q.difficulty === "easy" ? 1.25 : 1;
      due = state === "mastered" ? null : shiftDateKey(row.date, Math.max(1, Math.round([1, 3, 7][successes] * factor)));
    }
    lastDate = row.date;
  }
  const novelIds = definition.variants.filter(q => !consumed.has(q.id)).map(q => q.id);
  const evidenceStatus: EvidenceStatus = !active ? "new" : state === "mastered" ? "mastered" : !novelIds.length ? "needs-evidence" : "assessing";
  if (evidenceStatus === "needs-evidence") due = null;
  return { definition, state, successes, due, lastDate, reviewedToday: recalls.some(r => r.date === today), novelIds, evidenceStatus, active };
}

export function buildKnowledgeModel(input: KnowledgeInput, daily: DailyDocument, today: string) {
  const exposures = new Map<string, Exposure>();
  const encounter = (id: string, date: string | null) => {
    const current = exposures.get(id);
    if (!current || (date && (!current.date || date < current.date))) exposures.set(id, { date });
  };
  for (const id of input.completedIds) { const l = lessons.find(l => l.id === id); if (l) for (let i = 0; i < getInlineQuestionCount(l); i++) encounter(adaptLessonQuestion(l, i).id, null); }
  // A recorded obsolete revision must not be silently reseeded from completion.
  const datedLessons = new Set<string>();
  for (const event of Object.values(input.activity)) {
    const date = getAthensDateKey(new Date(event.at)), lesson = lessons.find(l => l.id === event.lessonId);
    if (!lesson || date > today) continue;
    if (!datedLessons.has(lesson.id)) {
      datedLessons.add(lesson.id);
      for (let i = 0; i < getInlineQuestionCount(lesson); i++) exposures.delete(adaptLessonQuestion(lesson, i).id);
    }
    if (!lessonQuizMatches(lesson, event.quizKey)) continue;
    for (let i = 0; i < Math.min(event.questionCount, getInlineQuestionCount(lesson)); i++) encounter(adaptLessonQuestion(lesson, i).id, date);
  }
  for (const day of Object.values(daily.days)) {
    if (!day.history || day.record.dateKey > today) continue;
    day.record.questionIds.forEach((id, index) => {
      const q = knowledgeById.get(`daily:${id}`)?.question;
      if (q && (!day.details || day.details.questionVersions[index] === q.version)) encounter(q.id, day.details ? day.record.dateKey : null);
    });
  }
  const concepts = masteryConcepts.map(c => {
    const encountered = conceptSources(c).flatMap(i => exposures.has(i.question.id) ? [exposures.get(i.question.id)!] : []);
    const dates = encountered.flatMap(e => e.date ? [e.date] : []).sort();
    return scheduleConcept(c, encountered.length ? { date: dates[0] ?? null } : undefined, input.knowledgeReviews ?? {}, today);
  });
  const sourceConcept = new Map<string, ConceptKnowledge>();
  for (const c of concepts) for (const item of conceptSources(c.definition)) sourceConcept.set(item.question.id, c);
  const items: QuestionKnowledge[] = knowledgeCatalogue.map(item => {
    const c = item.conceptId ? concepts.find(c => c.definition.id === item.conceptId) : sourceConcept.get(item.question.id);
    const seen = exposures.get(item.question.id);
    return { ...item, conceptId: c?.definition.id, state: c?.state ?? (seen ? "learning" : "new"), successes: c?.successes ?? 0,
      due: c?.due ?? null, lastDate: c?.lastDate ?? seen?.date ?? null, reviewedToday: c?.reviewedToday ?? false,
      novel: item.isAssessment === true && (c?.novelIds.includes(item.question.id) ?? false), evidenceStatus: c?.evidenceStatus ?? (seen ? "completed" : "new") };
  });
  // Exactly one fresh scenario for each concept. A short batch cannot repeat one idea.
  const due = concepts.filter(c => c.active && c.due && c.due <= today && !c.reviewedToday && c.novelIds.length).sort((a, b) => a.due!.localeCompare(b.due!) || a.successes - b.successes || a.definition.id.localeCompare(b.definition.id)).map(c => items.find(i => i.question.id === c.novelIds[0])!);
  // Voluntary practice is explicitly familiar material. It cannot consume fresh
  // scenarios or change concept evidence, even on a later date.
  const practice = items.filter(i => !i.isAssessment ? exposures.has(i.question.id) : !!input.knowledgeReviews?.[i.question.id] && Object.keys(input.knowledgeReviews[i.question.id]).some(date => date <= today)).sort((a, b) => (a.lastDate ?? "").localeCompare(b.lastDate ?? "") || a.question.id.localeCompare(b.question.id));
  const topics = [...new Set(sourceCatalogue.map(i => i.topicId))].map(id => {
    const sources = sourceCatalogue.filter(i => i.topicId === id), related = concepts.filter(c => conceptSources(c.definition).some(i => i.topicId === id));
    const seen = sources.some(i => exposures.has(i.question.id)), active = seen || related.some(c => c.active);
    const state: MasteryState = related.length && related.every(c => c.state === "mastered") ? "mastered" : related.length && related.every(c => ["familiar", "mastered"].includes(c.state)) ? "familiar" : active ? "learning" : "new";
    const status = !active ? "Νέο" : !related.length ? (id.startsWith("unit:") ? "Ολοκληρώθηκε · χρειάζονται νέες δοκιμές" : "Συναντήθηκε · χρειάζονται νέες δοκιμές") : related.some(c => c.evidenceStatus === "needs-evidence") ? "Χρειάζονται περισσότερα στοιχεία" : MASTERY_LABELS[state];
    return { id, title: sources[0].topicTitle, categoryId: sources[0].question.categoryId, state, total: related.length, mastered: related.filter(c => c.state === "mastered").length, status, covered: related.length > 0 };
  });
  const subject = (c: ConceptDefinition) => c.subcategoryId === "architecture" ? "architecture" : c.categoryId;
  const ids = [...new Set([...sourceCatalogue.map(i => i.question.subcategoryId === "architecture" ? "architecture" : i.question.categoryId), ...concepts.map(c => subject(c.definition))])];
  const categoryProgress = ids.map(id => {
    const rows = concepts.filter(c => subject(c.definition) === id);
    return { id, title: categories.find(c => c.id === id)?.title ?? topicNames[id] ?? "Γενικές γνώσεις", percent: rows.length ? Math.round(rows.reduce((sum, c) => sum + c.successes, 0) / (rows.length * 3) * 100) : 0, mastered: rows.filter(c => c.state === "mastered").length, total: rows.length };
  });
  return { items, due, practice, topics, categories: categoryProgress, concepts, recalled: concepts.filter(c => c.successes > 0).length, needsEvidence: topics.filter(t => t.state !== "new" && (!t.covered || t.status === "Χρειάζονται περισσότερα στοιχεία")).length };
}
