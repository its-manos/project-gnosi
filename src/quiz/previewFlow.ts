import { advanceQuizSession, evaluateAnswer, questionToken, submitQuizAnswer } from "./engine";
import type { QuizSession } from "./types";
import type { PracticeCueKind } from "../play/soundStatus";

type PreviewTransition = { session: QuizSession; changed: boolean; cue: PracticeCueKind | null };

/** Pure preview transitions: only accepted user actions request an audible cue. */
export function submitPreviewAnswer(session: QuizSession, value: unknown): PreviewTransition {
  const question = session.questions[session.currentIndex];
  const next = submitQuizAnswer(session, questionToken(session), value);
  return { session: next.session, changed: next.changed,
    cue: next.changed ? (evaluateAnswer(question, value).correct ? "correct" : "incorrect") : null };
}
export function advancePreview(session: QuizSession): PreviewTransition {
  const next = advanceQuizSession(session, questionToken(session));
  return { session: next.session, changed: next.changed,
    cue: next.changed && next.session.completed ? "complete" : null };
}
