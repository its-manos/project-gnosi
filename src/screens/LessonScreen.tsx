import type { Category, Lesson, Subcategory } from "../data/lessons";
import type { QuizAnswer } from "../quiz/types";
import ReaderLessonScreen from "./ReaderLessonScreen";

export type Props = {
  category: Category;
  subcategory: Subcategory;
  lesson: Lesson;
  isSaved: boolean;
  bookmarksLoaded: boolean;
  onToggleSaved: (lessonId: string) => void;
  checkpointAnswers: Record<number, number>;
  typedCheckpointAnswers?: Record<number, QuizAnswer>;
  /** Dev-only local article pilots should never report synthetic content. */
  enableReporting?: boolean;
  onAnswerCheckpoint: (questionIndex: number, answerIndex: number, correctIndex: number, typedValue?: unknown) => void;
  onFinishLesson: () => void;
  onBack: () => void;
};

export default function LessonScreen(props: Props) {
  return <ReaderLessonScreen key={props.lesson.id} {...props} />;
}
