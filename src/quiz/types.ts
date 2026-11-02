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
export type MultipleSelectContent = { answers: readonly string[]; correctIndices: readonly number[] };
export type OrderingItem = { id: string; label: string };
export type OrderingContent = { items: readonly OrderingItem[]; correctOrder: readonly string[] };
export type MatchingPair = { leftId: string; leftLabel: string; rightId: string; rightLabel: string };
export type MatchingContent = { pairs: readonly MatchingPair[] };
export type MultipleSelectQuestion = QuizQuestion & { type: "multiple-select"; content: MultipleSelectContent };
export type OrderingQuestion = QuizQuestion & { type: "ordering"; content: OrderingContent };
export type MatchingQuestion = QuizQuestion & { type: "matching"; content: MatchingContent };
/** Each option is one complete factual claim about the subject in question.prompt. */
export type MistakeOption = { id: string; text: string };
export type SpotMistakeContent = {
  options: readonly MistakeOption[];
  incorrectOptionId: string;
  correction: string;
};
export type SpotMistakeQuestion = QuizQuestion & { type: "spot-the-mistake"; content: SpotMistakeContent };
/** One blank is filled by selecting a word-bank tile; answer is its stable ID. */
export type FillBlankOption = { id: string; text: string };
export type FillBlankContent = {
  before: string;
  after: string;
  options: readonly FillBlankOption[];
  correctOptionId: string;
};
export type FillBlankQuestion = QuizQuestion & { type: "fill-in-the-blank"; content: FillBlankContent };
/** Supported built-in formats; external handlers may extend QuizQuestion. */
export type BuiltinQuizQuestion = ChoiceQuestion | MultipleSelectQuestion | OrderingQuestion | MatchingQuestion | SpotMistakeQuestion | FillBlankQuestion;
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
