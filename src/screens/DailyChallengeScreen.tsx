import { useMemo, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import ProfileSectionHeader, { profileSectionLayout } from "../components/ProfileSectionHeader";
import DailyMissionMap from "../components/DailyMissionMap";
import DailyJourneyTrack from "../components/DailyJourneyTrack";
import DailyMistakeReview from "../components/DailyMistakeReview";
import DailyAnswerReview from "../components/DailyAnswerReview";
import QuizReveal from "../components/QuizReveal";
import ProgressGradientBackground from "../components/ProgressGradientBackground";
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
  return <View style={styles.root}><ProgressGradientBackground />
    <View style={styles.pageChrome}>
      <ProfileSectionHeader
        title={previewIntro?"Ημερήσιο quiz":reviewing?"Ανασκόπηση":record.completed?"Αποτέλεσμα":"Ημερήσιο quiz"}
        actionLabel={previewIntro?"‹ Εργαλεία":reviewing?"‹ Αποτέλεσμα":"‹ Αρχική"}
        actionAccessibilityLabel={previewIntro?"Πίσω στα εργαλεία δοκιμών":reviewing?"Πίσω στο αποτέλεσμα":"Επιστροφή στην αρχική"}
        onAction={reviewing?closeReview:onHome} style={styles.pageHeader}/>
    </View>
    <ScrollView ref={scrollRef} style={styles.viewport}
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
      </Pressable>:onWeeklyReview?<ActionButton label="Εβδομαδιαία επανάληψη →" onPress={onWeeklyReview} secondary style={styles.actionSecondary}/>:null}
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
          {rewardSummary?.combo && rewardSummary.combo > 1 ?
            <Text style={styles.combo}>+{rewardSummary.rows[record.currentIndex]?.comboXP ?? 0} XP μπόνους</Text> : null}
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
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.background},
  viewport:{flex:1},
  pageChrome:{paddingHorizontal:profileSectionLayout.horizontal,paddingTop:profileSectionLayout.top},
  pageHeader:{marginBottom:7},
  content:{width:'100%',maxWidth:720,alignSelf:'center',paddingHorizontal:profileSectionLayout.horizontal,paddingTop:6,paddingBottom:22},
  pageContent:{flexGrow:1},
  activeContent:{flexGrow:1,justifyContent:'center',paddingHorizontal:16,paddingTop:8,paddingBottom:14},
  centerState:{alignItems:'center',justifyContent:'center',paddingTop:60,gap:16},
  eyebrow:{color:colors.accentLight,fontSize:10,lineHeight:16,fontWeight:'900',letterSpacing:1.05},
  title:{color:colors.text,fontSize:26,lineHeight:33,fontWeight:'900'},
  note:{color:colors.textMuted,fontSize:11,lineHeight:16},
  introContainer:{flexGrow:1,justifyContent:'center',paddingTop:10,paddingBottom:76},
  introDense:{paddingTop:0,paddingBottom:12},
  introBody:{gap:18},
  introBodyCompact:{gap:13},
  introLead:{flexDirection:'row',alignItems:'center',gap:10,minHeight:124},
  introCopy:{flex:1,minWidth:0,gap:7},
  introTitle:{color:colors.text,fontWeight:'900',fontSize:30,lineHeight:37,maxWidth:350},
  introTitleDense:{fontSize:25,lineHeight:32},
  introSubtitle:{color:'#D2D2DE',fontSize:14,lineHeight:21},
  heroMark:{width:124,height:124,alignItems:'center',justifyContent:'center',flexShrink:0},
  heroMarkDense:{transform:[{scale:.83}],marginHorizontal:-9},
  heroOrbitOuter:{position:'absolute',width:112,height:112,borderRadius:56,borderWidth:1,borderColor:'#565C82'},
  heroOrbitInner:{position:'absolute',width:88,height:88,borderRadius:44,borderWidth:1,borderColor:'#726A9B',transform:[{rotate:'24deg'}]},
  heroCore:{width:61,height:61,borderRadius:19,backgroundColor:'#383455',borderWidth:1,borderColor:'#8B7DC0',
    alignItems:'center',justifyContent:'center'},
  heroGlyph:{color:'#E0D4FF',fontSize:34,fontWeight:'800'},
  heroSatellite:{position:'absolute',right:9,top:19,width:10,height:10,borderRadius:5,backgroundColor:'#87C7C5',
    borderWidth:2,borderColor:'#192137'},
  heroSmallStar:{position:'absolute',left:3,bottom:13,color:'#D0B68F',fontSize:18},
  sharedNote:{color:colors.textBody,fontSize:13,lineHeight:20},
  introActions:{gap:1,marginTop:1},
  interestsLink:{minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:12},
  interestsPressed:{backgroundColor:'#272D44'},
  interestsText:{color:'#C5B7FF',fontSize:13,lineHeight:19,fontWeight:'800'},
  introNote:{color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center',paddingHorizontal:4},
  actionPrimary:{marginTop:0},
  actionSecondary:{marginTop:0},
  cardRim:{position:'absolute',top:0,left:20,right:20,height:2,backgroundColor:'#8376B9'},
  resultContainer:{gap:11,paddingTop:7,paddingBottom:6},
  resultContainerCompact:{gap:9,paddingTop:3},
  resultHero:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:4,minHeight:82},
  resultHeroCompact:{minHeight:68,paddingVertical:0},
  resultHeroCopy:{flex:1,minWidth:0,gap:6},
  resultTitleCompact:{fontSize:23,lineHeight:29},
  resultSeal:{width:64,height:64,alignItems:'center',justifyContent:'center',borderRadius:21,
    backgroundColor:'#302B4A',borderWidth:1,borderColor:'#796AAB',marginRight:4},
  resultSealCompact:{width:56,height:56,borderRadius:19,marginRight:2},
  resultSealOrbit:{position:'absolute',width:'116%',height:'116%',borderRadius:60,
    borderWidth:1,borderColor:'#54527D'},
  resultStar:{color:'#DCD0FF',fontSize:30},
  scoreCard:{alignItems:'stretch',padding:16,paddingTop:18,gap:4,borderRadius:21,overflow:'hidden',
    backgroundColor:'#1A2032',borderColor:'#444361',borderWidth:1},
  scoreCardCompact:{padding:13,paddingTop:16},
  resultScoreRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
  resultScoreCopy:{flex:1,minWidth:0,gap:4},
  scoreLabel:{color:'#C0B3F2',fontSize:10,lineHeight:15,fontWeight:'900',letterSpacing:1.0},
  scoreHint:{color:colors.textBody,fontSize:12,lineHeight:18},
  bigScore:{color:colors.text,fontSize:45,lineHeight:54,fontWeight:'900'},
  bigScoreCompact:{fontSize:42,lineHeight:50},
  scoreDenominator:{color:colors.textMuted,fontSize:19,fontWeight:'700'},
  resultRoute:{alignSelf:'stretch',marginTop:4,paddingHorizontal:2},
  metrics:{flexDirection:'row',alignItems:'center',alignSelf:'stretch',marginTop:5,paddingTop:10,
    borderTopWidth:1,borderTopColor:'#373C54'},
  metric:{flex:1,alignItems:'center',gap:1},
  metricDivider:{width:1,height:28,backgroundColor:'#3A4059'},
  metricValue:{color:colors.accentLight,fontSize:20,lineHeight:26,fontWeight:'900'},
  metricLabel:{color:colors.textMuted,fontSize:10,lineHeight:15,textAlign:'center'},
  legacyNote:{color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center',paddingTop:6},
  highlightRow:{backgroundColor:'#1A2030',borderRadius:16,borderWidth:1,borderColor:'#363C55',
    padding:10,flexDirection:'row',alignItems:'center',gap:10},
  highlightMark:{width:30,height:30,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:'#302B4A'},
  highlightStar:{color:colors.accentLight,fontSize:17},
  highlightCopy:{flex:1,gap:3},
  highlightTitle:{color:colors.text,fontSize:14,lineHeight:20,fontWeight:'800'},
  highlightDetail:{color:colors.textMuted,fontSize:12,lineHeight:18},
  actionGroup:{gap:3},
  mistakeAction:{minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:12},
  linkPressed:{backgroundColor:'#262B40'},
  mistakeActionText:{color:'#C6B7FF',fontSize:13,lineHeight:20,fontWeight:'800'},
  recommendCard:{minHeight:73,paddingHorizontal:13,paddingVertical:11,
    flexDirection:'row',alignItems:'center',gap:9,borderRadius:17,
    backgroundColor:'#191F30',borderWidth:1,borderColor:'#40435D'},
  recommendPressed:{backgroundColor:'#252A42'},
  recommendCopy:{flex:1,minWidth:0,gap:4},
  cardTitle:{color:colors.text,fontSize:15,lineHeight:21,fontWeight:'800'},
  recommendArrow:{width:31,height:31,borderRadius:11,backgroundColor:'#343050',
    borderWidth:1,borderColor:'#5F5587',alignItems:'center',justifyContent:'center'},
  recommendArrowText:{color:'#D0C4FF',fontSize:25,lineHeight:28,fontWeight:'800'},
  tomorrow:{color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center'},
  combo:{color:colors.accentLight,fontSize:13,lineHeight:21,fontWeight:'800'},
  sourceLink:{paddingVertical:10},
  sourceLinkText:{color:colors.accentLight,fontSize:12,lineHeight:19,textDecorationLine:'underline'},
  errorText:{color:colors.error,fontSize:13,lineHeight:21,textAlign:'center'},
});
