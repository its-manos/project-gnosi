/** Content contracts are independent of React, storage, and the question banks. */
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionSource = { title: string; url: string; publisher?: string };
export type QuestionMedia = { uri: string; alt: string; caption?: string; credit?: string };
export type QuestionMetadata = {
  id?: string;
  conceptIds?: string[];
  difficulty?: QuestionDifficulty;
  version?: string;
  media?: QuestionMedia;
  sources?: QuestionSource[];
};
export type QuizQuestion = {
  id: string;
  type: string;
  version: string;
  categoryId: string;
  subcategoryId: string;
  conceptIds: string[];
  difficulty: QuestionDifficulty;
  difficultyOrigin: "editorial" | "legacy-default";
  prompt: string;
  explanation: string;
  sources: QuestionSource[];
  media?: QuestionMedia;
  content: unknown;
};
export type ChoiceContent = { answers: readonly string[]; correctIndex: number };
export type ChoiceQuestion = QuizQuestion & { type: "multiple-choice"; content: ChoiceContent };
export type AnswerEvaluation = { valid: boolean; correct: boolean };
/** New formats provide a handler; progression and persistence stay unchanged. */
export type QuestionHandler = {
  validateContent: (content: unknown) => boolean;
  evaluate: (content: unknown, answer: unknown) => AnswerEvaluation;
};
export type QuestionHandlers = Readonly<Record<string, QuestionHandler>>;
export type QuizMode = "daily" | "lesson" | "review" | "challenge";
export type QuizAnswer = { questionVersion: string; value: unknown };
export type QuizSession = {
  schemaVersion: 1;
  id: string;
  mode: QuizMode;
  questions: QuizQuestion[];
  answers: Record<string, QuizAnswer>;
  currentIndex: number;
  completed: boolean;
};
export type QuestionToken = { id: string; version: string };
export type QuizTransition = {
  session: QuizSession;
  changed: boolean;
  reason: "accepted" | "duplicate" | "stale-question" | "invalid-answer" | "answer-required" | "completed";
};
