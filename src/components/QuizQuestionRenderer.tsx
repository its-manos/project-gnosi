import { StyleSheet, Text, View } from "react-native";
import type { BuiltinQuizQuestion } from "../quiz/types";
import { colors } from "../theme";
import AnswerOption from "./AnswerOption";
import MatchingQuestionCard from "./MatchingQuestionCard";
import MultipleSelectQuestionCard from "./MultipleSelectQuestionCard";
import OrderingQuestionCard from "./OrderingQuestionCard";
import QuizReveal from "./QuizReveal";

type Props = {
  question: BuiltinQuizQuestion;
  questionNumber: number;
  answer?: unknown;
  onSubmit: (answer: unknown) => void;
  readingSize?: number;
};

/** Single typed dispatch for built-in question formats. The caller owns session state. */
export default function QuizQuestionRenderer({ question, questionNumber, answer, onSubmit, readingSize }: Props) {
  switch (question.type) {
    case "multiple-select":
      return <MultipleSelectQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} answer={Array.isArray(answer) ? answer as number[] : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "ordering":
      return <OrderingQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} answer={Array.isArray(answer) ? answer as string[] : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "matching":
      return <MatchingQuestionCard key={question.id} question={question} questionNumber={questionNumber}
        readingSize={readingSize} answer={answer && typeof answer === "object" && !Array.isArray(answer) ? answer as Record<string, string> : undefined}
        onSubmit={value => onSubmit(value)} />;
    case "multiple-choice": {
      const selected = typeof answer === "number" ? answer : undefined;
      return <View style={styles.card} testID="choice-question-card">
        <Text style={styles.counter}>ΕΡΩΤΗΣΗ {questionNumber}</Text>
        <Text style={styles.question}>{question.prompt}</Text>
        <View style={styles.options}>
          {question.content.answers.map((label, index) =>
            <AnswerOption key={index} label={label} index={index} selected={selected === index}
              correct={index === question.content.correctIndex} locked={selected !== undefined}
              onPress={() => onSubmit(index)} />)}
        </View>
        {selected !== undefined ? <QuizReveal><View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>{selected === question.content.correctIndex ? "Σωστά!" : "Μια νέα γνώση!"}</Text>
          <Text style={styles.feedbackText}>{question.explanation}</Text>
        </View></QuizReveal> : null}
      </View>;
    }
  }
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    padding: 18, marginVertical: 12, borderRadius: 19 },
  counter: { color: colors.accentLight, fontSize: 11, fontWeight: "900" },
  question: { color: colors.text, fontSize: 18, lineHeight: 27, fontWeight: "700", marginVertical: 16 },
  options: { gap: 8 },
  feedback: { backgroundColor: colors.successSurface, marginTop: 12, padding: 12, borderRadius: 12, gap: 5 },
  feedbackTitle: { color: colors.text, fontWeight: "800" },
  feedbackText: { color: colors.textBody, lineHeight: 22 },
});
