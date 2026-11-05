import type { BuiltinQuizQuestion } from "../quiz/types";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import SingleChoiceQuestionCard from "./SingleChoiceQuestionCard";
import MatchingQuestionCard from "./MatchingQuestionCard";
import FillBlankQuestionCard from "./FillBlankQuestionCard";
import SpotMistakeQuestionCard from "./SpotMistakeQuestionCard";
import MultipleSelectQuestionCard from "./MultipleSelectQuestionCard";
import OrderingQuestionCard from "./OrderingQuestionCard";

type Props = {
  question: BuiltinQuizQuestion;
  questionNumber: number;
  answer?: unknown;
  onSubmit: (answer: unknown) => void;
  readingSize?: number;
  compactAnswered?: boolean;
  onActionChange?: (action: QuestionStageAction | null) => void;
};

/** Single typed dispatch for built-in question formats. The caller owns session state. */
export default function QuizQuestionRenderer({ question, questionNumber, answer, onSubmit, readingSize, compactAnswered = false, onActionChange }: Props) {
  switch (question.type) {
    case "multiple-select":
      return <MultipleSelectQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} onActionChange={onActionChange} answer={Array.isArray(answer) ? answer as number[] : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "ordering":
      return <OrderingQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} onActionChange={onActionChange} answer={Array.isArray(answer) ? answer as string[] : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "matching":
      return <MatchingQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} onActionChange={onActionChange} answer={answer && typeof answer === "object" && !Array.isArray(answer) ? answer as Record<string, string> : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "spot-the-mistake":
      return <SpotMistakeQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} onActionChange={onActionChange} answer={typeof answer === "string" ? answer : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "fill-in-the-blank":
      return <FillBlankQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} onActionChange={onActionChange} answer={typeof answer === "string" ? answer : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "multiple-choice":
      return <SingleChoiceQuestionCard key={question.id}
        id={question.id} question={question.prompt} answers={question.content.answers}
        correctIndex={question.content.correctIndex} explanation={question.explanation}
        questionNumber={questionNumber} answer={typeof answer === "number" ? answer : undefined}
        readingSize={readingSize} compactAnswered={compactAnswered} onActionChange={onActionChange} onConfirm={onSubmit} />;
  }
}
