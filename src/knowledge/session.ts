import { restoreLegacySession } from "../quiz/compatibility";
import { knowledgeById } from "./model";
import type { KnowledgeSession } from "./records";
/** IDs and scored revisions stay pinned across reloads and content updates. */
export function restoreKnowledgeQuiz(session: KnowledgeSession) {
  const questions = session.questionIds.map((id, i) => {
    const q = knowledgeById.get(id)?.question;
    if (!q || q.version !== session.questionVersions[i]) throw new Error("knowledge_content_changed");
    return q;
  });
  return restoreLegacySession(session.id, "review", questions, session.answers, session.currentIndex, session.completed);
}
