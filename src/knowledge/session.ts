import { restoreLegacySession } from "../quiz/compatibility";
import { knowledgeById } from "./model";
import type { KnowledgeSession } from "./records";
export const isCurrentKnowledgeSession = (session: KnowledgeSession) => session.id.startsWith("kr2:");
/** IDs and scored revisions stay pinned across reloads and content updates. */
export function restoreKnowledgeQuiz(session: KnowledgeSession) {
  const questions = session.questionIds.map((id, i) => {
    const q = knowledgeById.get(id)?.question;
    if (!q || q.version !== session.questionVersions[i]) throw new Error("knowledge_content_changed");
    return q;
  });
  if (isCurrentKnowledgeSession(session) && session.mode === "scheduled") {
    const items = session.questionIds.map(id => knowledgeById.get(id)!);
    if (items.some(i => !i.isAssessment) || new Set(items.map(i => i.conceptId)).size !== items.length) throw new Error("knowledge_content_changed");
  }
  return restoreLegacySession(session.id, "review", questions, session.answers, session.currentIndex, session.completed);
}
