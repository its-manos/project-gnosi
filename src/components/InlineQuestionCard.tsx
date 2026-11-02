import type { LessonQuestion } from "../data/lessons";
import type { ReportTarget } from "../utils/contentReports";
import SingleChoiceQuestionCard from "./SingleChoiceQuestionCard";

type Props = {
  combo?: number;
  question: LessonQuestion;
  questionNumber: number;
  selectedAnswer: number | undefined;
  onSelectAnswer: (answerIndex: number, correctIndex: number) => void;
  readingSize?: number;
  reportTarget?: ReportTarget;
};

/** Thin compatibility bridge: existing numeric lesson answers and XP stay
 * parent-owned, while the exact same UI is shared across all single-choice
 * questions. The choice is saved only after explicit confirmation. */
export default function InlineQuestionCard({
  combo = 0, question, questionNumber, selectedAnswer,
  onSelectAnswer, readingSize, reportTarget,
}: Props) {
  return <SingleChoiceQuestionCard
    id={question.id ?? `lesson-q-${questionNumber}`}
    question={question.question}
    answers={question.answers}
    correctIndex={question.correctIndex}
    explanation={question.explanation}
    questionNumber={questionNumber}
    answer={selectedAnswer}
    onConfirm={index => onSelectAnswer(index, question.correctIndex)}
    readingSize={readingSize}
    badgeLabel="ΣΤΑΣΗ ΓΝΩΣΗΣ"
    combo={combo}
    reportTarget={reportTarget}
    testID="lesson-question-card"
    testPrefix="lesson-question"
  />;
}
