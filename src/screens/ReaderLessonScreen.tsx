import ZoomableLessonImage from "../components/ZoomableLessonImage";
import { useBetaAnalytics } from "../state/BetaAnalytics";
import { useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Props } from "./LessonScreen";
import ActionButton from "../components/ActionButton";
import ArticleFigure from "../components/ArticleFigure";
import InlineQuestionCard from "../components/InlineQuestionCard";
import LessonCover from "../components/LessonCover";
import SourceLink from "../components/SourceLink";
import ReportContentButton from "../components/ReportContentButton";
import { lessonReportTarget } from "../utils/contentReports";
import { inlineArticleMedia } from "../data/articleMedia";
import { colors, reading } from "../theme";
import { getInlineQuestionCount, getParagraphCount, getResumeParagraphNumber } from "../utils/lessonProgress";

/** Shared article reader. Checkpoint placement, persistence and completion use the existing learning flow. */
export default function ReaderLessonScreen({ category, subcategory, lesson, isSaved, bookmarksLoaded,
  onToggleSaved, checkpointAnswers, onAnswerCheckpoint, onFinishLesson, onBack }: Props) {
  const { analytics } = useBetaAnalytics();
  const lastSeenParagraph = useRef(0);
  const [readingSize, setReadingSize] = useState(18);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sectionPositions = useRef<Record<number, number>>({});
  const paragraphPositions = useRef<Record<number, { sectionIndex: number; y: number }>>({});
  const finishPosition = useRef<number | null>(null);
  const pendingScroll = useRef<number | "finish" | null>(null);
  const restored = useRef(false);
  const paragraphCount = getParagraphCount(lesson);
  const questionCount = getInlineQuestionCount(lesson);
  const answeredCount = Array.from({ length: questionCount }, (_, i) => i)
    .filter(i => checkpointAnswers[i] !== undefined).length;
  const firstUnanswered = Array.from({ length: questionCount }, (_, i) => i)
    .find(i => checkpointAnswers[i] === undefined);
  const visibleLimit = firstUnanswered === undefined ? paragraphCount : (firstUnanswered + 1) * 2;
  const complete = answeredCount === questionCount;
  const resumeTarget = useRef(getResumeParagraphNumber(lesson, checkpointAnswers));
  const sections = lesson.sections.map((section, index) => ({
    ...section,
    start: 1 + lesson.sections.slice(0, index).reduce((count, previous) => count + previous.paragraphs.length, 0),
  }));
  const textStyle = { fontSize: readingSize, lineHeight: Math.round(readingSize * 1.75) };

  function paragraphY(number: number) {
    const position = paragraphPositions.current[number];
    if (!position) return undefined;
    const sectionY = sectionPositions.current[position.sectionIndex];
    if (sectionY === undefined) return undefined;
    // Keep the heading visible when continuing into a new section. Parent and
    // child layout events can arrive in either order.
    return sections[position.sectionIndex].start === number ? sectionY : sectionY + position.y;
  }

  function flushScroll() {
    const target = pendingScroll.current;
    if (target !== null) {
      const y = target === "finish" ? finishPosition.current : paragraphY(target);
      if (y !== undefined && y !== null) {
        pendingScroll.current = null;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      }
      return;
    }
    if (restored.current || resumeTarget.current === null) return;
    const resumeSection = sections.findIndex(s => resumeTarget.current !== null && s.start >= resumeTarget.current && s.start <= visibleLimit);
    const y = resumeSection >= 0 ? sectionPositions.current[resumeSection] : paragraphY(resumeTarget.current);
    if (y === undefined) return;
    restored.current = true;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: false }));
  }

  return (
    <View style={styles.root} testID="article-reader">
      <View style={styles.chrome}>
        <View style={styles.topbar}>
          <Pressable style={styles.control} onPress={onBack} accessibilityRole="button" accessibilityLabel="Επιστροφή στα άρθρα">
            <Text style={styles.controlText}>‹ Πίσω</Text>
          </Pressable>
          <Text style={styles.brand}>ΑΝΑΓΝΩΣΗ</Text>
          <View style={styles.tools}>
            <ReportContentButton target={lessonReportTarget(lesson)} iconOnly />
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
              disabled={readingSize <= 16} accessibilityState={{ disabled: readingSize <= 16 }}
              onPress={() => setReadingSize(v => Math.max(16, v - 2))}>
              <Text style={[styles.controlText, readingSize <= 16 && styles.disabled]}>Α−</Text>
            </Pressable>
            <Text style={styles.small} accessibilityLiveRegion="polite">{readingSize}</Text>
            <Pressable style={styles.control} accessibilityRole="button" accessibilityLabel="Μεγαλύτερο κείμενο άρθρου"
              disabled={readingSize >= 24} accessibilityState={{ disabled: readingSize >= 24 }}
              onPress={() => setReadingSize(v => Math.min(24, v + 2))}>
              <Text style={[styles.controlText, readingSize >= 24 && styles.disabled]}>Α+</Text>
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
      <ScrollView ref={scrollRef} style={styles.viewport} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false} onContentSizeChange={flushScroll} scrollEventThrottle={500}
        onScroll={event => {
          const bottom = event.nativeEvent.contentOffset.y + event.nativeEvent.layoutMeasurement.height;
          const seen = Object.entries(paragraphPositions.current).filter(([, pos]) => {
            const sectionY = sectionPositions.current[pos.sectionIndex];
            return sectionY !== undefined && sectionY + pos.y < bottom;
          }).map(([number]) => Number(number));
          const last = Math.max(0, ...seen);
          if (last > lastSeenParagraph.current) { lastSeenParagraph.current = last; void analytics.progress({ last_paragraph: last }); }
        }}>
        <Text style={styles.eyebrow}>{category.title} / {subcategory.title}</Text>
        <Text accessibilityRole="header" style={styles.title}>{lesson.title}</Text>
        <View style={styles.metadata}>
          <Text style={styles.small}>{lesson.readingMinutes}′ ανάγνωση · {sections.length} ενότητες</Text>
          <Pressable style={styles.sourceControl} onPress={() => setSourcesOpen(v => !v)} accessibilityRole="button"
            accessibilityLabel="Πηγές άρθρου" accessibilityState={{ expanded: sourcesOpen }}>
            <Text style={styles.link}>{lesson.sources.length} πηγές {sourcesOpen ? "−" : "+"}</Text>
          </Pressable>
        </View>
        {sourcesOpen ? <View style={styles.sources} testID="reader-sources">
          <ReaderSources lesson={lesson} />
        </View> : null}
        {lesson.contentNote ? <View style={styles.note}><Text style={styles.cardTitle}>Πριν διαβάσεις</Text><Text style={[styles.noteText, textStyle]}>{lesson.contentNote}</Text></View> : null}
        <Text style={[styles.intro, textStyle]}>{lesson.intro}</Text>
        <View style={styles.coverBlock}>
          {lesson.coverKind !== "editorial" ? <ZoomableLessonImage image={{ uri: lesson.imageUrl, caption: lesson.imageCaption, credit: lesson.imageCredit, creditUrl: lesson.imageCreditUrl }}>
            <LessonCover lesson={lesson} style={styles.cover} />
          </ZoomableLessonImage> : <LessonCover lesson={lesson} style={styles.cover} />}
          <Text style={styles.caption}>{lesson.imageCaption}</Text>
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
            <Text style={styles.sectionNumber}>ΕΝΟΤΗΤΑ {sectionIndex + 1} / {sections.length}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, i) => {
              const number = section.start + i;
              if (number > visibleLimit) return null;
              const questionIndex = number % 2 === 0 ? number / 2 - 1 : -1;
              const question = questionIndex >= 0 && questionIndex < questionCount ? lesson.questions[questionIndex] : undefined;
              const answered = checkpointAnswers[questionIndex] !== undefined;
              return <View key={number} testID={`reader-paragraph-${number}`} onLayout={event => {
                paragraphPositions.current[number] = { sectionIndex, y: event.nativeEvent.layout.y };
                flushScroll();
              }}>
                <Text selectable style={[styles.paragraph, textStyle]}>{paragraph}</Text>
                {(inlineArticleMedia[lesson.id] ?? []).filter(f => f.afterParagraphCount === number)
                  .map(figure => <ArticleFigure key={`${lesson.id}-${number}`} figure={figure} />)}
                {question ? <View style={styles.checkpoint}>
                  <InlineQuestionCard question={question} questionNumber={questionIndex + 1} selectedAnswer={checkpointAnswers[questionIndex]} reportTarget={lessonReportTarget(lesson, questionIndex)}
                    readingSize={readingSize} onSelectAnswer={(answerIndex, correctIndex) => onAnswerCheckpoint(questionIndex, answerIndex, correctIndex)} />
                  {answered ? <ActionButton label={number < paragraphCount ? "Συνέχεια ανάγνωσης ↓" : "Στο κλείσιμο του άρθρου ↓"} secondary onPress={() => {
                    restored.current = true;
                    pendingScroll.current = number < paragraphCount ? number + 1 : "finish";
                    flushScroll();
                  }} /> : <Text style={styles.small}>Διάλεξε μια απάντηση για να συνεχίσεις.</Text>}
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
    </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: reading.background },
  chrome: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, borderBottomWidth: 1, borderColor: reading.border, backgroundColor: reading.background },
  topbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 4 },
  brand: { color: reading.muted, fontSize: 10, letterSpacing: 1.2, flexShrink: 1 },
  tools: { flexDirection: "row", alignItems: "center", gap: 6 },
  control: { minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: "center", alignItems: "center", borderRadius: 10 },
  controlText: { color: reading.heading, fontSize: 16, fontWeight: "600" },
  active: { backgroundColor: reading.surface },
  disabled: { opacity: 0.4 },
  settings: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 6 },
  small: { color: reading.muted, fontSize: 12, lineHeight: 20 },
  progressLine: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginTop: 4, marginBottom: 6 },
  track: { height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: reading.border },
  fill: { height: 3, backgroundColor: "#C3B79B" },
  viewport: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 44, width: "100%", maxWidth: 640, alignSelf: "center" },
  eyebrow: { color: "#C7B899", fontSize: 11, lineHeight: 19, letterSpacing: 0.5, marginBottom: 12 },
  title: { color: reading.heading, fontSize: 32, lineHeight: 41, fontWeight: "700", letterSpacing: -0.3, marginBottom: 12 },
  metadata: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 },
  sourceControl: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  link: { color: colors.accentLight, fontSize: 12, lineHeight: 20 },
  intro: { color: reading.heading, marginBottom: 26 },
  sources: { backgroundColor: reading.surface, borderRadius: 16, borderWidth: 1, borderColor: reading.border, padding: 16, marginBottom: 24, gap: 8 },
  cardTitle: { color: reading.heading, fontSize: 22, lineHeight: 31, fontWeight: "700" },
  note: { backgroundColor: "#292720", padding: 16, borderRadius: 12, marginBottom: 24, gap: 8 },
  noteText: { color: "#D2C8B7" },
  coverBlock: { marginBottom: 20 },
  cover: { width: "100%", height: 210, borderRadius: 14 },
  caption: { color: reading.muted, fontSize: 12, lineHeight: 20, marginTop: 10 },
  creditControl: { minHeight: 44, justifyContent: "center", paddingVertical: 8 },
  readingHint: { color: reading.muted, fontSize: 14, lineHeight: 23, marginBottom: 26 },
  section: { paddingTop: 20, borderTopWidth: 1, borderColor: reading.border, marginBottom: 20 },
  sectionNumber: { color: "#C7B899", fontSize: 10, lineHeight: 18, letterSpacing: 1, marginBottom: 8 },
  sectionTitle: { color: reading.heading, fontSize: 25, lineHeight: 34, fontWeight: "600", marginBottom: 22 },
  paragraph: { color: reading.text, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", marginBottom: 24 },
  checkpoint: { marginBottom: 28 },
  finish: { borderTopWidth: 1, borderColor: reading.border, paddingTop: 26, gap: 10 },
  finishBody: { color: reading.text, marginTop: 8, marginBottom: 8 },
  endSources: { marginTop: 28 },
  sourceList: { gap: 8 },
  locked: { color: reading.muted, fontSize: 13, lineHeight: 22, paddingTop: 12, paddingBottom: 20 },
});
