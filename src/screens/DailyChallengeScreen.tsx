import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import { quizFlowStyles as styles } from "../components/quizFlowStyles";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import ProfileSectionHeader from "../components/ProfileSectionHeader";
import DailyMissionMap from "../components/DailyMissionMap";
import DailyJourneyTrack from "../components/DailyJourneyTrack";
import DailyMistakeReview from "../components/DailyMistakeReview";
import DailyAnswerReview from "../components/DailyAnswerReview";
import QuizReveal from "../components/QuizReveal";
import AppBackground from "../components/AppBackground";
import { useAdaptiveQuestionScroll } from "../hooks/useAdaptiveQuestionScroll";
import { useQuestionStageAction } from "../hooks/useQuestionStageAction";
import QuestionStageFooter from "../components/QuestionStageFooter";
import { dailyReportTarget } from "../utils/contentReports";
import { DAILY_CHALLENGE_SIZE, questions } from "../data/questions";
import { lessons } from "../data/lessons";
import { DAILY_CHALLENGE_TOPICS, CHALLENGE_DIFFICULTIES, type DailyChallengePreferences } from "../data/dailyChallengeTopics";
import { dailyResultAnalysis, recommendDailyLesson } from "../utils/dailyResults";
import { selectSharedDailyQuestions } from "../utils/sharedDailyChallenge";
import { dailyXP } from "../utils/knowledgeScoring";
import { useDailyChallenge } from "../hooks/useDailyChallenge";
import { requestPracticeCue } from "../play/soundStatus";
import { colors } from "../theme";

type Props={onHome:()=>void;onOpenPreferences:()=>void;preferences:DailyChallengePreferences;preferencesLoaded:boolean;
  completedLessonIds?:string[];inProgressLessonIds?:string[];onOpenLesson?:(id:string)=>void;onWeeklyReview?:()=>void;
  /** Read-only dev preview: show the real intro even when today's attempt is underway. */
  previewIntro?:boolean;onPreviewContinue?:()=>void};
const topicTitle=(id:string)=>DAILY_CHALLENGE_TOPICS.find(t=>t.id===id)?.title??'Άλλη θεματική';
const difficultyTitle=(id:string)=>CHALLENGE_DIFFICULTIES.find(d=>d.id===id)?.title??'Μεσαίο';
// Avoid a new empty array on every render when the caller omits optional progress.
const EMPTY_LESSON_IDS: string[] = [];
export default function DailyChallengeScreen({onHome,onOpenPreferences,preferences,preferencesLoaded,completedLessonIds=EMPTY_LESSON_IDS,inProgressLessonIds=EMPTY_LESSON_IDS,onOpenLesson,onWeeklyReview,previewIntro=false,onPreviewContinue}:Props) {
  const {record,rewardSummary,rewardXP,isLoading,currentQuestion,selectedAnswer,correctCount,resultDetails,questionsCompatible=true,startChallenge,answerQuestion,nextQuestion}=useDailyChallenge(preferences,preferencesLoaded);
  const [sourceError,setSourceError]=useState(false),scrollRef=useRef<ComponentRef<typeof ScrollView>>(null),sourceRequest=useRef(0);
  const [review,setReview]=useState<{date:string;mode:'answers'|'mistakes'}|null>(null);
  const quizViewport=useAdaptiveQuestionScroll();
  const insets=useSafeAreaInsets();
  const {height:windowHeight,fontScale}=useWindowDimensions();
  const compactIntro=windowHeight<900||fontScale>=1.2;
  const denseIntro=windowHeight<740||fontScale>=1.4;
  const stageAction=useQuestionStageAction(currentQuestion?.id??"inactive");
  // A source-link failure or footer update must not recompute the whole
  // frozen seven-question result and sort the lesson catalogue.
  const analysis=useMemo(
    ()=>dailyResultAnalysis(record,questions,correctCount,resultDetails),
    [record,correctCount,resultDetails],
  );
  const resultMask=useMemo(()=>analysis.rows.map(row=>row.correct),[analysis.rows]);
  const recommendation=useMemo(
    ()=>record.completed&&!previewIntro
      ? recommendDailyLesson(analysis.rows,lessons,completedLessonIds,inProgressLessonIds,preferences)
      : null,
    [record.completed,previewIntro,analysis.rows,completedLessonIds,inProgressLessonIds,preferences],
  );
  const reviewing=record.completed&&review?.date===record.dateKey;
  const answeredCount=Object.keys(record.answers).length;
  const scrollTop=()=>scrollRef.current?.scrollTo({y:0,animated:false});
  const showReview=(mode:'answers'|'mistakes')=>{setReview({date:record.dateKey,mode});sourceRequest.current++;setSourceError(false);scrollTop();};
  const closeReview=()=>{setReview(null);scrollTop();};
  async function openSource(url:string){const request=++sourceRequest.current;try{await Linking.openURL(url);if(request===sourceRequest.current)setSourceError(false);}catch{if(request===sourceRequest.current)setSourceError(true);}}
  // Selecting the shared set is only needed before the attempt starts.
  const canStart=useMemo(
    ()=>!record.started&&selectSharedDailyQuestions(record.dateKey).length===DAILY_CHALLENGE_SIZE,
    [record.dateKey,record.started],
  );
  const activeQuiz=!previewIntro&&record.started&&!record.completed&&currentQuestion!==null&&questionsCompatible&&!isLoading;
  // Sound on each newly visible unanswered question, including resuming after
  // leaving the quiz. Intro, completed results and answered cards stay quiet.
  const openingQuestionId=activeQuiz&&selectedAnswer===null&&currentQuestion
    ? `${record.dateKey}:${record.currentIndex}:${currentQuestion.id}` : null;
  useEffect(()=>{
    if(openingQuestionId) requestPracticeCue("question-open");
  },[openingQuestionId]);
  return <View style={styles.root}><AppBackground />
    <View style={styles.pageChrome}>
      <ProfileSectionHeader
        title={previewIntro?"Ημερήσιο quiz":reviewing?"Ανασκόπηση":record.completed?"Αποτέλεσμα":"Ημερήσιο quiz"}
        actionLabel={previewIntro?"‹ Εργαλεία":reviewing?"‹ Αποτέλεσμα":"‹ Αρχική"}
        actionAccessibilityLabel={previewIntro?"Πίσω στα εργαλεία δοκιμών":reviewing?"Πίσω στο αποτέλεσμα":"Επιστροφή στην αρχική"}
        onAction={reviewing?closeReview:onHome} style={styles.pageHeader}/>
    </View>
    <ScrollView testID="daily-quiz-viewport" ref={scrollRef} style={styles.viewport}
      contentContainerStyle={[styles.content,activeQuiz&&styles.activeContent,!activeQuiz&&styles.pageContent]}
      onLayout={quizViewport.onLayout} onContentSizeChange={quizViewport.onContentSizeChange}
      scrollEnabled={quizViewport.scrollEnabled}
      bounces={quizViewport.scrollEnabled}
      showsVerticalScrollIndicator={false}>
    {!previewIntro&&isLoading?<View style={styles.centerState}><ActivityIndicator color={colors.accentLight} size="large"/><Text style={styles.note}>Φόρτωση της σημερινής πρόκλησης…</Text></View>
    :!previewIntro&&record.completed&&review?.date===record.dateKey&&review.mode==='answers'?<DailyAnswerReview rows={analysis.rows} legacy={analysis.legacy} onDone={closeReview}/>
    :!previewIntro&&record.completed&&review?.date===record.dateKey&&review.mode==='mistakes'?<DailyMistakeReview key={`${record.dateKey}-${record.questionIds.join('-')}`} questions={analysis.practiceQuestions} onDone={closeReview} onAdvance={scrollTop}/>
    :!previewIntro&&record.completed?<QuizReveal><View testID="daily-results" style={[styles.resultContainer,compactIntro&&styles.resultContainerCompact]}>
      <View style={[styles.resultHero,compactIntro&&styles.resultHeroCompact]}>
        <View style={styles.resultHeroCopy}>
          <Text style={styles.eyebrow}>Η ΔΙΑΔΡΟΜΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
          <Text style={[styles.title,compactIntro&&styles.resultTitleCompact]}>{correctCount===7?'Τα πέτυχες όλα!':correctCount>=5?'Πολύ καλή διαδρομή!':'Κάθε απάντηση είναι μια νέα γνώση.'}</Text>
        </View>
        <View style={[styles.resultSeal,compactIntro&&styles.resultSealCompact]} accessible={false}>
          <View style={styles.resultSealOrbit}/>
          <Text style={styles.resultStar}>✦</Text>
        </View>
      </View>
      <View style={[styles.scoreCard,compactIntro&&styles.scoreCardCompact]}>
        <View pointerEvents="none" style={styles.cardRim}/>
        <View style={styles.resultScoreRow}>
          <View style={styles.resultScoreCopy}>
            <Text style={styles.scoreLabel}>Η ΣΗΜΕΡΙΝΗ ΕΠΙΔΟΣΗ</Text>
            <Text style={styles.scoreHint}>Σωστές απαντήσεις</Text>
          </View>
          <Text style={[styles.bigScore,compactIntro&&styles.bigScoreCompact]}>{correctCount}<Text style={styles.scoreDenominator}> / 7</Text></Text>
        </View>
        <View style={styles.resultRoute}>
          <DailyJourneyTrack mode="result" shared={Boolean(record.selectionVersion)}
            correctMask={resultMask}/>
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricValue}>{analysis.accuracyPercent}%</Text><Text style={styles.metricLabel}>Ακρίβεια</Text></View>
          <View style={styles.metricDivider}/>
          <View style={styles.metric}><Text style={styles.metricValue}>{rewardXP??dailyXP(correctCount)}</Text><Text style={styles.metricLabel}>XP ημέρας</Text></View>
          <View style={styles.metricDivider}/>
          <View style={styles.metric}><Text style={styles.metricValue}>{analysis.highestCombo??'—'}</Text><Text style={styles.metricLabel}>Καλύτερο σερί</Text></View>
        </View>
        {analysis.highestCombo===null?<Text style={styles.legacyNote}>Δεν υπάρχει αποθηκευμένη ανάλυση σερί για αυτή την παλιότερη προσπάθεια.</Text>:null}
      </View>
      {analysis.strongest?<View style={styles.highlightRow}>
        <View style={styles.highlightMark}><Text style={styles.highlightStar}>✦</Text></View>
        <View style={styles.highlightCopy}>
          <Text style={styles.eyebrow}>Η ΘΕΜΑΤΙΚΗ ΠΟΥ ΞΕΧΩΡΙΣΕΣ</Text>
          <Text style={styles.highlightTitle}>{topicTitle(analysis.strongest.id)}</Text>
          <Text style={styles.highlightDetail}>Σωστές απαντήσεις: {analysis.strongest.correct} από {analysis.strongest.total}</Text>
        </View>
      </View>:null}
      <View style={styles.actionGroup}>
        <ActionButton label="Δες όλες τις απαντήσεις →" onPress={()=>showReview('answers')} style={styles.actionPrimary}/>
        {analysis.practiceQuestions.length?<Pressable testID="daily-mistake-action"
          accessibilityRole="button"
          accessibilityLabel={analysis.legacy?"Εξάσκηση στην τρέχουσα έκδοση":`Επανάληψη ${analysis.practiceQuestions.length} λαθών`}
          onPress={()=>showReview('mistakes')} style={({pressed})=>[styles.mistakeAction,pressed&&styles.linkPressed]}>
          <Text style={styles.mistakeActionText}>{analysis.legacy?"Εξάσκηση στην τρέχουσα έκδοση":`Επανάληψη λαθών (${analysis.practiceQuestions.length})`}  ›</Text>
        </Pressable>:null}
      </View>
      {recommendation&&onOpenLesson?<Pressable testID="daily-recommendation"
        onPress={()=>onOpenLesson(recommendation.id)} accessibilityRole="button"
        accessibilityLabel={`${inProgressLessonIds.includes(recommendation.id)?'Συνέχισε':'Άνοιξε'} το μάθημα: ${recommendation.title}`}
        style={({pressed})=>[styles.recommendCard,pressed&&styles.recommendPressed]}>
        <View style={styles.recommendCopy}>
          <Text style={styles.eyebrow}>Η ΕΠΟΜΕΝΗ ΑΝΑΚΑΛΥΨΗ</Text>
          <Text style={styles.cardTitle}>{recommendation.title}</Text>
        </View>
        <View style={styles.recommendArrow}><Text style={styles.recommendArrowText}>›</Text></View>
      </Pressable>:onWeeklyReview?<ActionButton label="Επανάληψη λαθών →" onPress={onWeeklyReview} secondary style={styles.actionSecondary}/>:null}
      <Text style={styles.tomorrow}>Νέο σετ αύριο · ώρα Ελλάδας</Text>
    </View></QuizReveal>
    :previewIntro||!record.started?<View testID="daily-intro" style={[styles.introContainer,denseIntro&&styles.introDense]}><QuizReveal>
      <View style={[styles.introBody,compactIntro&&styles.introBodyCompact]}>
        <View style={styles.introLead}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>Η ΣΗΜΕΡΙΝΗ ΣΟΥ ΕΞΕΡΕΥΝΗΣΗ</Text>
            <Text style={[styles.introTitle,denseIntro&&styles.introTitleDense]}>7 στάσεις γνώσης.</Text>
            <Text style={styles.introSubtitle}>Μία νέα αποστολή κάθε μέρα.</Text>
          </View>
          <View style={[styles.heroMark,denseIntro&&styles.heroMarkDense]} accessible={false}>
            <View style={styles.heroOrbitOuter}/>
            <View style={styles.heroOrbitInner}/>
            <View style={styles.heroCore}><Text style={styles.heroGlyph}>✦</Text></View>
            <View style={styles.heroSatellite}/>
            <Text style={styles.heroSmallStar}>✧</Text>
          </View>
        </View>
        <Text style={styles.sharedNote}>Το ίδιο σετ για όλους, με ερωτήσεις από διαφορετικούς κόσμους.</Text>
        <DailyMissionMap compact={compactIntro}/>
        {!previewIntro&&!canStart?<Text style={styles.errorText}>Δεν υπάρχουν αρκετές διαθέσιμες ερωτήσεις για σήμερα.</Text>:null}
        <View style={styles.introActions}>
          <ActionButton label={previewIntro
              ? record.completed?"Δες το αποτέλεσμα →":record.started?"Συνέχισε την πρόκληση →":"Άνοιξε την πραγματική πρόκληση →"
              : "Ξεκίνα την πρόκληση →"}
            onPress={()=>{if(previewIntro){onPreviewContinue?.();return;}setSourceError(false);sourceRequest.current++;void startChallenge();}}
            disabled={previewIntro?!onPreviewContinue:!canStart} style={styles.actionPrimary}/>
          <Pressable testID="daily-interests-link" style={({pressed})=>[styles.interestsLink,pressed&&styles.interestsPressed]}
            onPress={onOpenPreferences} accessibilityRole="button" accessibilityLabel="Ρύθμιση ενδιαφερόντων">
            <Text style={styles.interestsText}>Τα ενδιαφέροντά μου  ›</Text>
          </Pressable>
          <Text style={styles.introNote}>Τα ενδιαφέροντά σου επηρεάζουν το Γρήγορο Κουίζ και τις προτάσεις μαθημάτων, όχι τις σημερινές ερωτήσεις.</Text>
        </View>
      </View>
    </QuizReveal></View>
    :currentQuestion&&questionsCompatible?<QuizReveal key={`${record.dateKey}-${currentQuestion.id}`}><View>
      <DailyJourneyTrack mode="question" answeredCount={answeredCount}
        currentIndex={record.currentIndex} shared={Boolean(record.selectionVersion)}/>
      <SingleChoiceQuestionCard
        key={`${record.dateKey}:${currentQuestion.id}`}
        id={`${record.dateKey}:${currentQuestion.id}`}
        question={currentQuestion.question}
        questionNumber={record.currentIndex + 1}
        answers={currentQuestion.answers}
        correctIndex={currentQuestion.correctIndex}
        explanation={currentQuestion.explanation}
        badgeLabel={`${topicTitle(currentQuestion.categoryId)} · ${difficultyTitle(currentQuestion.difficulty)}`}
        answer={selectedAnswer === null ? undefined : selectedAnswer}
        onConfirm={index => answerQuestion(index)}
        onActionChange={stageAction.onActionChange}
        combo={rewardSummary?.combo ?? 0}
        feedbackExtra={selectedAnswer !== null ? <>
          {rewardSummary?.rows[record.currentIndex]?.eligible === false ?
            <Text style={styles.note}>Η απάντηση έχει ήδη ανταμειφθεί.</Text> : null}
          {(rewardSummary?.rows[record.currentIndex]?.comboXP ?? 0) > 0 ?
            <Text style={styles.combo}>+{rewardSummary?.rows[record.currentIndex]?.comboXP ?? 0} XP μπόνους</Text> : null}
          <Pressable onPress={() => void openSource(currentQuestion.sourceUrl)}
            accessibilityRole="link" style={styles.sourceLink}>
            <Text style={styles.sourceLinkText}>Πηγή: {currentQuestion.sourceTitle} ↗</Text>
          </Pressable>
          {sourceError ? <Text style={styles.errorText}>Δεν ήταν δυνατό το άνοιγμα της πηγής.</Text> : null}
        </> : undefined}
        compactAnswered
        reportTarget={dailyReportTarget(currentQuestion)}
        testID="daily-choice-card"
        testPrefix="daily-choice"
      />
    </View></QuizReveal>
    :<View style={styles.centerState}><Text style={styles.errorText}>{questionsCompatible?'Δεν ήταν δυνατή η φόρτωση της πρόκλησης.':'Οι ερωτήσεις ενημερώθηκαν από τότε που ξεκίνησες. Οι απαντήσεις σου διατηρήθηκαν· αυτή η έκδοση δεν μπορεί να συνεχίσει με διαφορετικές ερωτήσεις.'}</Text><ActionButton label="Επιστροφή στην αρχική" onPress={onHome}/></View>}
    </ScrollView>
    {activeQuiz ? <QuestionStageFooter bottomInset={insets.bottom} action={selectedAnswer!==null ? {
      label: record.currentIndex===6 ? "Δες το αποτέλεσμα →" : "Επόμενη ερώτηση →",
      disabled: false,
      onPress: () => { sourceRequest.current++; setSourceError(false); void nextQuestion(); scrollTop(); },
    } : stageAction.action} /> : null}
  </View>;
}
