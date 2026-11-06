import type { LessonQuestion } from "../data/lessons";
import type { QuestionStageAction } from "../hooks/useQuestionStageAction";
import type { ReportTarget } from "../utils/contentReports";
import SingleChoiceQuestionCard from "./SingleChoiceQuestionCard";

type Props = {
  combo?: number;
  question: LessonQuestion;
  questionNumber: number;
  hideQuestionNumber?: boolean;
  selectedAnswer: number | undefined;
  onSelectAnswer: (answerIndex: number, correctIndex: number) => void;
  readingSize?: number;
  compactAnswered?: boolean;
  onActionChange?: (action: QuestionStageAction | null) => void;
  reportTarget?: ReportTarget;
};

/** Thin compatibility bridge: existing numeric lesson answers and XP stay
 * parent-owned, while the exact same UI is shared across all single-choice
 * questions. The choice is saved only after explicit confirmation. */
export default function InlineQuestionCard({
  combo = 0, question, questionNumber, hideQuestionNumber = false, selectedAnswer,
  onSelectAnswer, readingSize, compactAnswered = false, onActionChange, reportTarget,
}: Props) {
  return <SingleChoiceQuestionCard
    id={question.id ?? `${reportTarget?.itemId ?? "lesson"}:q${questionNumber}`}
    question={question.question}
    answers={question.answers}
    correctIndex={question.correctIndex}
    explanation={question.explanation}
    questionNumber={hideQuestionNumber ? undefined : questionNumber}
    answer={selectedAnswer}
    onConfirm={index => onSelectAnswer(index, question.correctIndex)}
    readingSize={readingSize}
    compactAnswered={compactAnswered}
    onActionChange={onActionChange}
    badgeLabel="ΜΙΑ ΕΠΙΛΟΓΗ"
    combo={combo}
    reportTarget={reportTarget}
    testID="lesson-question-card"
    testPrefix="lesson-question"
  />;
}
