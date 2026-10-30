import type { Category, Lesson, Subcategory } from "../data/lessons";
import ReaderLessonScreen from "./ReaderLessonScreen";

export type Props = {
  category: Category;
  subcategory: Subcategory;
  lesson: Lesson;
  isSaved: boolean;
  bookmarksLoaded: boolean;
  onToggleSaved: (lessonId: string) => void;
  checkpointAnswers: Record<number, number>;
  onAnswerCheckpoint: (questionIndex: number, answerIndex: number, correctIndex: number) => void;
  onFinishLesson: () => void;
  onBack: () => void;
};

export default function LessonScreen(props: Props) {
  return <ReaderLessonScreen key={props.lesson.id} {...props} />;
}
