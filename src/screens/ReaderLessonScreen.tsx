import { RewardToastHost } from "../play/RewardToast";
import ScreenEntrance from "../components/ScreenEntrance";
import { readerLessonStyles as styles } from "./readerLessonStyles";
import { motionAllowed, playPreferences } from "../play/preferences";
import { quizRewardSummary } from "../gamification/rewards";
import { adaptInteractiveLessonQuestion, adaptLessonQuestion, projectInteractiveLessonAnswer, restoreInteractiveLessonAnswer } from "../quiz/adapters";
import ZoomableLessonImage from "../components/ZoomableLessonImage";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { requestPracticeCue } from "../play/soundStatus";
import { Linking, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import type { ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import type { Props } from "./LessonScreen";
import ActionButton from "../components/ActionButton";
import ArticleFigure from "../components/ArticleFigure";
import ExpandableImageCaption from "../components/ExpandableImageCaption";
import InlineQuestionCard from "../components/InlineQuestionCard";
import QuizQuestionRenderer from "../components/QuizQuestionRenderer";
import QuizReveal from "../components/QuizReveal";
import AppBackground from "../components/AppBackground";
import { useAdaptiveQuestionScroll } from "../hooks/useAdaptiveQuestionScroll";
import { useQuestionStageAction } from "../hooks/useQuestionStageAction";
import ProfileSectionHeader from "../components/ProfileSectionHeader";
import QuestionStageProgress from "../components/QuestionStageProgress";
import QuestionStageFooter from "../components/QuestionStageFooter";
import LessonCover from "../components/LessonCover";
import NextImageWarmup from "../components/NextImageWarmup";
import SourceLink from "../components/SourceLink";
import ReportContentButton from "../components/ReportContentButton";
import { lessonReportTarget } from "../utils/contentReports";
import { inlineArticleMedia } from "../data/articleMedia";
import { nextPendingFigureUrl } from "../utils/nextFigureWarmup";
import { colors } from "../theme";
import { readerTextSize, READER_TEXT_SIZE_MIN, READER_TEXT_SIZE_MAX } from "../state/ReaderTextSize";
import { getParagraphCount, getParagraphId, getParagraphText, getReadingQuestionPlacements, getReadingVisibleParagraphLimit } from "../utils/lessonProgress";
import { getReaderResumeAnchor, resolveReaderScrollY, type ReaderScrollAnchor } from "../utils/readerScrollPosition";

/** Shared article reader. Checkpoint placement, persistence and completion use the existing learning flow. */
export default function ReaderLessonScreen({ category, subcategory, lesson, isSaved, bookmarksLoaded,
  onToggleSaved, checkpointAnswers, typedCheckpointAnswers = {}, enableReporting = true, onAnswerCheckpoint, onFinishLesson, onBack }: Props) {
  const { analytics } = useBetaAnalytics();
  const safeArea = useSafeAreaInsets();
  const quizViewport = useAdaptiveQuestionScroll();
  const lastSeenParagraph = useRef(0);
  const readingSize = useSyncExternalStore(readerTextSize.subscribe, readerTextSize.getSnapshot, readerTextSize.getSnapshot);
  const readingSizeReady = useSyncExternalStore(readerTextSize.subscribe, readerTextSize.getReadySnapshot, readerTextSize.getReadySnapshot);
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const compactWidth = windowWidth < 370;
  const compactHeadings = compactWidth && fontScale < 1.4;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // This is presentation state only; canonical answers and lesson progress stay parent-owned.
  const [activeBoundary, setActiveBoundary] = useState<number | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const stageAction = useQuestionStageAction(`${lesson.id}:${activeQuestionIndex ?? "closed"}`);
  const openingQuestion = useRef(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sectionPositions = useRef<Record<number, number>>({});
  const paragraphPositions = useRef<Record<number, { sectionIndex: number; y: number }>>({});
  const checkpointPositions = useRef<Record<number, number>>({});
  const finishPosition = useRef<number | null>(null);
  const pendingScroll = useRef<ReaderScrollAnchor | null>(null);
  const restored = useRef(false);
  const restoreQueued = useRef(false);
  const paragraphCount = useMemo(() => getParagraphCount(lesson), [lesson]);
  const placements = useMemo(() => getReadingQuestionPlacements(lesson), [lesson]);
  const questionCount = placements.length;
  const answeredCount = Array.from({ length: questionCount }, (_, i) => i)
    .filter(i => checkpointAnswers[i] !== undefined).length;
  const firstPending = placements.find(p => checkpointAnswers[p.questionIndex] === undefined) ?? null;
  const pendingGroup = firstPending === null ? [] : placements
    .filter(p => p.afterParagraphNumber === firstPending.afterParagraphNumber)
    .map(p => p.questionIndex);
  const activeGroup = activeBoundary === null ? [] : placements
    .filter(p => p.afterParagraphNumber === activeBoundary)
    .map(p => p.questionIndex);
  const activeAnswered = activeQuestionIndex !== null && checkpointAnswers[activeQuestionIndex] !== undefined;
  const questionScroll = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (activeAnswered) questionScroll.current?.scrollTo({ y: 0, animated: false });
  }, [activeQuestionIndex, activeAnswered]);
  const visibleLimit = getReadingVisibleParagraphLimit(lesson, checkpointAnswers);
  const upcomingFigureUrl = nextPendingFigureUrl(lesson, visibleLimit);
  const complete = answeredCount === questionCount;
  const resumeTarget = useRef(getReaderResumeAnchor(lesson, checkpointAnswers));
  const sections = useMemo(() => {
    let start = 1;
    return lesson.sections.map(section => {
      const positioned = { ...section, start };
      start += section.paragraphs.length;
      return positioned;
    });
  }, [lesson]);
  const sectionStarts = useMemo(() => sections.map(section => section.start), [sections]);
  const textStyle = { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.7) };

  // Opening is intentionally an explicit learner action; scrolling never starts a quiz.
  function openQuestions(boundary: number, questionIndex: number) {
    if (activeBoundary !== null || openingQuestion.current || checkpointAnswers[questionIndex] !== undefined ||
        firstPending?.questionIndex !== questionIndex || firstPending.afterParagraphNumber !== boundary) return;
    openingQuestion.current = true;
    setActiveBoundary(boundary);
    setActiveQuestionIndex(questionIndex);
    requestPracticeCue("question-open");
  }

  function advanceQuestion() {
    if (activeBoundary === null || activeQuestionIndex === null || !activeAnswered) return;
    const next = activeGroup.find(i => i > activeQuestionIndex && checkpointAnswers[i] === undefined);
    if (next !== undefined) {
      setActiveQuestionIndex(next);
      requestPracticeCue("question-open");
      return;
    }
    const boundary = activeBoundary;
    openingQuestion.current = false;
    setActiveQuestionIndex(null);
    setActiveBoundary(null);
    restored.current = true;
    pendingScroll.current = boundary < paragraphCount
      ? { kind: "paragraph", number: boundary + 1 } : { kind: "finish" };
    requestAnimationFrame(flushScroll);
  }

  function scrollY(anchor: ReaderScrollAnchor) {
    return resolveReaderScrollY(anchor, {
      sectionStarts,
      sectionPositions: sectionPositions.current,
      paragraphPositions: paragraphPositions.current,
      checkpointPositions: checkpointPositions.current,
      finishPosition: finishPosition.current,
    });
  }

  function flushScroll() {
    if (pendingScroll.current !== null) {
      const y = scrollY(pendingScroll.current);
      if (y !== undefined && scrollRef.current) {
        pendingScroll.current = null;
        scrollRef.current.scrollTo({ y, animated: motionAllowed(playPreferences.getSnapshot()) });
      }
      return;
    }
    if (restored.current || restoreQueued.current || !readingSizeReady || resumeTarget.current === null) return;

    // OnLayout callbacks can arrive before the preceding paragraphs and
    // captions have finished reflowing. Resolve the latest coordinates in
    // the next frame, after font preferences have hydrated.
    restoreQueued.current = true;
    requestAnimationFrame(() => {
      restoreQueued.current = false;
      if (restored.current || resumeTarget.current === null || !scrollRef.current) return;
      const y = scrollY(resumeTarget.current);
      if (y === undefined) return;
      restored.current = true;
      scrollRef.current.scrollTo({ y, animated: false });
    });
  }

  useEffect(() => {
    // A cached font preference may finish loading after the first layout.
    // Retry restoration even when that preference leaves dimensions unchanged.
    if (readingSizeReady) requestAnimationFrame(flushScroll);
  }, [readingSizeReady]);

  return (
    <ScreenEntrance style={styles.root} testID="article-reader">
      <View style={styles.chrome}>
        <View style={styles.topbar}>
          <Pressable style={styles.control} onPress={onBack} accessibilityRole="button" accessibilityLabel="Επιστροφή στα άρθρα">
            <Text style={styles.controlText}>‹ Πίσω</Text>
          </Pressable>
          <View style={styles.brandMark} accessible={false}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>ΑΝΑΓΝΩΣΗ</Text>
          </View>
          <View style={styles.tools}>
            {enableReporting ? <ReportContentButton target={lessonReportTarget(lesson)} iconOnly /> : null}
            <Pressable style={[styles.control, settingsOpen && styles.active]} onPress={() => setSettingsOpen(v => !v)}
              accessibilityRole="button" accessibilityLabel="Ρυθμίσεις ανάγνωσης" accessibilityState={{ expanded: settingsOpen }}>
              <Text style={styles.controlText}>Αα</Text>
            </Pressable>
            <Pressable style={[styles.control, isSaved && styles.active]} disabled={!bookmarksLoaded} onPress={() => onToggleSaved(lesson.id)}
              accessibilityRole="button" accessibilityLabel={isSaved ? "Αφαίρεση αποθηκευμένου άρθρου" : "Αποθήκευση άρθρου"}
              accessibilityState={{ disabled: !bookmarksLoaded, selected: isSaved }}>
              <Svg width={20} height={24} viewBox="0 0 20 24" style={!bookmarksLoaded ? styles.disabled : undefined} accessible={false}>
                <Path d="M4 2h12v19l-6-4-6 4Z" fill={isSaved ? colors.accentLight : "none"} stroke={colors.accentLight} strokeWidth={1.7} strokeLinejoin="round" />
              </Svg>
            </Pressable>
          </View>
        </View>
        {settingsOpen ? <View style={styles.settings}>
          <Text style={styles.small}>Μέγεθος κειμένου</Text>
          <View style={styles.tools}>
            <Pressable style={styles.control} accessibilityRole="button" accessibilityLabel="Μικρότερο κείμενο άρθρου"
              disabled={readingSize <= READER_TEXT_SIZE_MIN} accessibilityState={{ disabled: readingSize <= READER_TEXT_SIZE_MIN }}
              onPress={() => readerTextSize.adjust(-2)}>
              <Text style={[styles.controlText, readingSize <= READER_TEXT_SIZE_MIN && styles.disabled]}>Α−</Text>
            </Pressable>
            <Text style={styles.small} accessibilityLiveRegion="polite">{readingSize}</Text>
            <Pressable style={styles.control} accessibilityRole="button" accessibilityLabel="Μεγαλύτερο κείμενο άρθρου"
              disabled={readingSize >= READER_TEXT_SIZE_MAX} accessibilityState={{ disabled: readingSize >= READER_TEXT_SIZE_MAX }}
              onPress={() => readerTextSize.adjust(2)}>
              <Text style={[styles.controlText, readingSize >= READER_TEXT_SIZE_MAX && styles.disabled]}>Α+</Text>
            </Pressable>
          </View>
        </View> : null}
        <View style={styles.progressLine}>
          <Text style={styles.small}>Στάσεις γνώσης</Text>
          <Text style={styles.small} accessibilityLiveRegion="polite">{answeredCount} / {questionCount}</Text>
        </View>
        <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel="Απαντημένες στάσεις γνώσης"
          accessibilityValue={{ min: 0, max: questionCount, now: answeredCount, text: `${answeredCount} από ${questionCount} ερωτήσεις` }}>
          <View style={[styles.fill, { width: `${questionCount ? answeredCount / questionCount * 100 : 0}%` }]} />
        </View>
      </View>
      <ScrollView ref={scrollRef} style={styles.viewport} contentContainerStyle={[styles.content, compactWidth && styles.contentCompact]}
        scrollEnabled={activeBoundary === null}
        showsVerticalScrollIndicator={false} onContentSizeChange={flushScroll} scrollEventThrottle={500}
        onScrollBeginDrag={() => { restored.current = true; }}
        onScroll={event => {
          const bottom = event.nativeEvent.contentOffset.y + event.nativeEvent.layoutMeasurement.height;
          const seen = Object.entries(paragraphPositions.current).filter(([, pos]) => {
            const sectionY = sectionPositions.current[pos.sectionIndex];
            return sectionY !== undefined && sectionY + pos.y < bottom;
          }).map(([number]) => Number(number));
          const last = Math.max(0, ...seen);
          if (last > lastSeenParagraph.current) { lastSeenParagraph.current = last; void analytics.progress({ last_paragraph: last }); }
        }}>
        <View style={styles.articleLabel}>
          <View style={styles.articleLabelDot} accessible={false} />
          <Text style={styles.eyebrow}>{category.title} / {subcategory.title}</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, compactHeadings && styles.titleCompact]}>{lesson.title}</Text>
        <View style={styles.metadata}>
          <Text style={styles.small}>{lesson.readingMinutes}′ ανάγνωση · {sections.length} ενότητες</Text>
          <Pressable style={styles.sourceControl} onPress={() => setSourcesOpen(v => !v)} accessibilityRole="button"
            accessibilityLabel="Πηγές άρθρου" accessibilityState={{ expanded: sourcesOpen }}>
            <Text style={styles.link}>{lesson.sources.length} πηγές {sourcesOpen ? "−" : "+"}</Text>
          </Pressable>
        </View>
        <View style={styles.titleRule} accessible={false} />
        {sourcesOpen ? <View style={styles.sources} testID="reader-sources">
          <ReaderSources lesson={lesson} />
        </View> : null}
        {lesson.contentNote ? <View style={styles.note}><Text style={styles.cardTitle}>Πριν διαβάσεις</Text><Text style={[styles.noteText, textStyle]}>{lesson.contentNote}</Text></View> : null}
        <View style={styles.coverBlock}>
          {lesson.coverKind !== "editorial" ? <ZoomableLessonImage image={{ uri: lesson.imageUrl, caption: lesson.imageCaption, credit: lesson.imageCredit, creditUrl: lesson.imageCreditUrl }}>
            <LessonCover lesson={lesson} style={styles.cover} />
          </ZoomableLessonImage> : <LessonCover lesson={lesson} style={styles.cover} />}
          <ExpandableImageCaption key={lesson.id} caption={lesson.imageCaption} />
          {lesson.coverKind !== "editorial" ? <Pressable style={styles.creditControl} accessibilityRole="link"
            accessibilityLabel={`Πηγή φωτογραφίας: ${lesson.imageCredit}`}
            onPress={() => void Linking.openURL(lesson.imageCreditUrl).catch(() => {})}>
            <Text style={styles.link}>Φωτογραφία: {lesson.imageCredit} ↗</Text>
          </Pressable> : null}
        </View>
        {sections.map((section, sectionIndex) => section.start > visibleLimit ? null : (
          <View key={section.title} style={styles.section} onLayout={event => {
            sectionPositions.current[sectionIndex] = event.nativeEvent.layout.y;
            flushScroll();
          }}>
            <View style={styles.sectionKicker}>
              <View style={styles.sectionPin} accessible={false} />
              <Text style={styles.sectionNumber}>ΕΝΟΤΗΤΑ {sectionIndex + 1} / {sections.length}</Text>
            </View>
            <Text accessibilityRole="header" style={[styles.sectionTitle, compactHeadings && styles.sectionTitleCompact]}>{section.title}</Text>
            {section.paragraphs.map((paragraph, i) => {
              const number = section.start + i;
              if (number > visibleLimit) return null;
              const paragraphId = getParagraphId(paragraph, number);
              // Only a checkpoint gate lives in the article. Questions and feedback
              // render exclusively inside the full-screen Modal below.
              const hasGate = firstPending?.afterParagraphNumber === number;
              return <View key={number} testID={`reader-paragraph-${number}`} onLayout={event => {
                paragraphPositions.current[number] = { sectionIndex, y: event.nativeEvent.layout.y };
                flushScroll();
              }}>
                <Text selectable style={[styles.paragraph, textStyle]}>{getParagraphText(paragraph)}</Text>
                {(inlineArticleMedia[lesson.id] ?? []).filter(f => f.afterParagraphId ? f.afterParagraphId === paragraphId : f.afterParagraphCount === number)
                  .map(figure => <ArticleFigure key={`${lesson.id}-${number}-${figure.url}`} figure={figure} />)}
                {hasGate ? <View testID={`reader-checkpoint-${firstPending.questionIndex}`}
                  style={styles.checkpoint} onLayout={event => {
                    checkpointPositions.current[number] = event.nativeEvent.layout.y;
                    flushScroll();
                  }}>
                  <View style={styles.checkpointKicker}>
                    <View style={styles.checkpointDot} accessible={false} />
                    <Text style={styles.checkpointEyebrow}>ΣΤΑΣΗ ΓΝΩΣΗΣ</Text>
                  </View>
                  <Text style={styles.gateTitle}>Έτοιμος να δοκιμάσεις όσα έμαθες;</Text>
                  <Text style={styles.checkpointHint}>
                    Μπορείς να ξαναδιαβάσεις πριν ξεκινήσεις.
                    {pendingGroup.length > 1 ? ` Σε περιμένουν ${pendingGroup.length} ερωτήσεις.` : ""}
                  </Text>
                  <ActionButton label="Έτοιμος για ερωτήσεις →" style={styles.checkpointButton}
                    onPress={() => openQuestions(number, firstPending.questionIndex)} />
                </View> : null}
              </View>;
            })}
          </View>
        ))}
        {complete ? <View style={styles.finish} testID="reader-finish" onLayout={event => { finishPosition.current = event.nativeEvent.layout.y; flushScroll(); }}>
          <Text style={styles.eyebrow}>Η ΔΙΑΔΡΟΜΗ ΕΦΤΑΣΕ ΣΤΟ ΤΕΛΟΣ</Text>
          <Text accessibilityRole="header" style={styles.cardTitle}>Τι κρατάς από αυτή την ιστορία;</Text>
          <Text style={[styles.finishBody, textStyle]}>{lesson.summary}</Text>
          <Text style={styles.readingHint}>Απάντησες σε όλες τις στάσεις γνώσης. Ολοκλήρωσε το άρθρο για να αποθηκευτεί η ολοκλήρωσή του, να δεις τη βαθμολογία σου και να βρεις τι θα διαβάσεις μετά.</Text>
          <ActionButton label="Ολοκλήρωση & επόμενο ανάγνωσμα →" onPress={onFinishLesson} disabled={questionCount === 0} />
          <View style={styles.endSources}><ReaderSources lesson={lesson} /></View>
        </View> : <Text style={styles.locked} testID="reader-locked">Η συνέχεια ανοίγει μετά την παραπάνω ερώτηση. Δεν χρειάζεται να απαντήσεις σωστά για να προχωρήσεις.</Text>}
      </ScrollView>
      <NextImageWarmup uri={upcomingFigureUrl} />
      {activeQuestionIndex !== null && activeGroup.includes(activeQuestionIndex) ? <Modal
        visible animationType="slide" presentationStyle="fullScreen"
        statusBarTranslucent navigationBarTranslucent onRequestClose={onBack}>
        <View style={[styles.quizScreen, { paddingTop: safeArea.top, paddingLeft: safeArea.left, paddingRight: safeArea.right }]}
          testID="reader-question-screen">
          <AppBackground />
          <View style={styles.quizHeader}>
            <ProfileSectionHeader title="Ερωτήσεις"
              actionLabel="‹ Έξοδος" actionAccessibilityLabel="Έξοδος από το μάθημα" onAction={onBack} />
            <QuestionStageProgress current={activeQuestionIndex + 1} total={questionCount} />
          </View>
          <ScrollView key={`${lesson.id}:${activeQuestionIndex}`} ref={questionScroll} style={styles.quizViewport}
            testID="reader-question-viewport"
            contentContainerStyle={styles.quizContent}
            onLayout={quizViewport.onLayout}
            onContentSizeChange={quizViewport.onContentSizeChange}
            scrollEnabled={quizViewport.scrollEnabled} bounces={quizViewport.scrollEnabled}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <QuizReveal><View testID={`reader-modal-question-${activeQuestionIndex}`}>
              {(() => {
                const questionIndex = activeQuestionIndex;
                const question = lesson.questions[questionIndex];
                const interactive = adaptInteractiveLessonQuestion(lesson, questionIndex);
                const answered = checkpointAnswers[questionIndex] !== undefined;
                return interactive ? <>
                  <QuizQuestionRenderer question={interactive}
                    readingSize={readingSize} compactAnswered onActionChange={stageAction.onActionChange}
                    answer={restoreInteractiveLessonAnswer(lesson, questionIndex, checkpointAnswers[questionIndex], typedCheckpointAnswers[questionIndex])}
                    onSubmit={value => {
                      const answerIndex = projectInteractiveLessonAnswer(lesson, questionIndex, value);
                      if (answerIndex === null || answered || activeQuestionIndex !== questionIndex) return;
                      if (interactive.type === "spot-the-mistake" || interactive.type === "fill-in-the-blank") {
                        onAnswerCheckpoint(questionIndex, answerIndex, question.correctIndex);
                      } else {
                        onAnswerCheckpoint(questionIndex, answerIndex, question.correctIndex, value);
                      }
                    }} />
                  {enableReporting ? <ReportContentButton target={lessonReportTarget(lesson, questionIndex)} /> : null}
                </> : <InlineQuestionCard
                  combo={quizRewardSummary(lesson.questions.slice(0, questionIndex + 1)
                    .map((_, i) => adaptLessonQuestion(lesson, i)), checkpointAnswers, "lesson").combo}
                  question={question} questionNumber={questionIndex + 1} hideQuestionNumber
                  selectedAnswer={checkpointAnswers[questionIndex]}
                  reportTarget={enableReporting ? lessonReportTarget(lesson, questionIndex) : undefined}
                  readingSize={readingSize} compactAnswered onActionChange={stageAction.onActionChange}
                  onSelectAnswer={(answerIndex, correctIndex) => {
                    if (!answered && activeQuestionIndex === questionIndex) {
                      onAnswerCheckpoint(questionIndex, answerIndex, correctIndex);
                    }
                  }} />;
              })()}
            </View></QuizReveal>
          </ScrollView>
          <QuestionStageFooter bottomInset={safeArea.bottom} action={activeAnswered ? {
            label: activeGroup.some(i => i > activeQuestionIndex && checkpointAnswers[i] === undefined)
              ? "Επόμενη ερώτηση →" : "Συνέχεια ανάγνωσης →",
            disabled: false, onPress: advanceQuestion,
          } : stageAction.action} />
          <RewardToastHost />
        </View>
      </Modal> : null}
    </ScreenEntrance>
  );
}

function ReaderSources({ lesson }: { lesson: Props["lesson"] }) {
  return <View style={styles.sourceList}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Πηγές & περαιτέρω ανάγνωση</Text>
    <Text style={styles.small}>Τα τεκμήρια πίσω από το άρθρο. Οι σύνδεσμοι ανοίγουν εκτός εφαρμογής.</Text>
    {lesson.editorialReviewedAt ? <Text style={styles.small}>Έλεγχος πηγών: {new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${lesson.editorialReviewedAt}T12:00:00Z`))}</Text> : null}
    {lesson.sources.map(source => <SourceLink key={source.url} source={source} />)}
  </View>;
}
