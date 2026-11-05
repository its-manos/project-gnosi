import { useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import SingleChoiceQuestionCard from "../components/SingleChoiceQuestionCard";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
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
  completedLessonIds?:string[];inProgressLessonIds?:string[];onOpenLesson?:(id:string)=>void;onWeeklyReview?:()=>void};
const topicTitle=(id:string)=>DAILY_CHALLENGE_TOPICS.find(t=>t.id===id)?.title??'Άλλη θεματική';
const difficultyTitle=(id:string)=>CHALLENGE_DIFFICULTIES.find(d=>d.id===id)?.title??'Μεσαίο';
export default function DailyChallengeScreen({onHome,onOpenPreferences,preferences,preferencesLoaded,completedLessonIds=[],inProgressLessonIds=[],onOpenLesson,onWeeklyReview}:Props) {
  const {record,rewardSummary,rewardXP,isLoading,currentQuestion,selectedAnswer,correctCount,resultDetails,questionsCompatible=true,startChallenge,answerQuestion,nextQuestion}=useDailyChallenge(preferences,preferencesLoaded);
  const [sourceError,setSourceError]=useState(false),scrollRef=useRef<ComponentRef<typeof ScrollView>>(null),sourceRequest=useRef(0);
  const [review,setReview]=useState<{date:string;mode:'answers'|'mistakes'}|null>(null);
  const quizViewport=useAdaptiveQuestionScroll();
  const insets=useSafeAreaInsets();
  const {height:windowHeight,fontScale}=useWindowDimensions();
  const compactIntro=windowHeight<900||fontScale>=1.2;
  const denseIntro=windowHeight<740||fontScale>=1.4;
  const stageAction=useQuestionStageAction(currentQuestion?.id??"inactive");
  const analysis=dailyResultAnalysis(record,questions,correctCount,resultDetails);
  const recommendation=recommendDailyLesson(analysis.rows,lessons,completedLessonIds,inProgressLessonIds,preferences);
  const reviewing=record.completed&&review?.date===record.dateKey;
  const answeredCount=Object.keys(record.answers).length;
  const scrollTop=()=>scrollRef.current?.scrollTo({y:0,animated:false});
  const showReview=(mode:'answers'|'mistakes')=>{setReview({date:record.dateKey,mode});sourceRequest.current++;setSourceError(false);scrollTop();};
  const closeReview=()=>{setReview(null);scrollTop();};
  async function openSource(url:string){const request=++sourceRequest.current;try{await Linking.openURL(url);if(request===sourceRequest.current)setSourceError(false);}catch{if(request===sourceRequest.current)setSourceError(true);}}
  const canStart=selectSharedDailyQuestions(record.dateKey).length===DAILY_CHALLENGE_SIZE;
  const activeQuiz=record.started&&!record.completed&&currentQuestion!==null&&questionsCompatible&&!isLoading;
  return <View style={styles.root}><ProgressGradientBackground />
    {activeQuiz ? <View style={styles.stageTop}>
      <AppHeader onBack={onHome} backLabel="ΑΡΧΙΚΗ" style={styles.stageHeader} />
    </View> : null}
    <ScrollView ref={scrollRef} style={styles.viewport}
      contentContainerStyle={[styles.content,activeQuiz&&styles.activeContent,!activeQuiz&&styles.pageContent]}
      onLayout={quizViewport.onLayout} onContentSizeChange={quizViewport.onContentSizeChange}
      scrollEnabled={quizViewport.scrollEnabled}
      bounces={quizViewport.scrollEnabled}
      showsVerticalScrollIndicator={false}>
    {!activeQuiz ? <AppHeader style={styles.pageHeader} onBack={reviewing?closeReview:onHome} backLabel={reviewing?'ΑΠΟΤΕΛΕΣΜΑ':'ΑΡΧΙΚΗ'} /> : null}
    {isLoading?<View style={styles.centerState}><ActivityIndicator color={colors.accentLight} size="large"/><Text style={styles.note}>Φόρτωση της σημερινής πρόκλησης…</Text></View>
    :record.completed&&review?.date===record.dateKey&&review.mode==='answers'?<DailyAnswerReview rows={analysis.rows} legacy={analysis.legacy} onDone={closeReview}/>
    :record.completed&&review?.date===record.dateKey&&review.mode==='mistakes'?<DailyMistakeReview key={`${record.dateKey}-${record.questionIds.join('-')}`} questions={analysis.practiceQuestions} onDone={closeReview} onAdvance={scrollTop}/>
    :record.completed?<QuizReveal><View testID="daily-results" style={styles.resultContainer}>
      <View style={styles.resultHero}>
        <View style={styles.resultSeal}><Text style={styles.resultStar}>✦</Text></View>
        <Text style={styles.eyebrow}>Η ΑΠΟΣΤΟΛΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
        <Text style={styles.title}>{correctCount===7?'Τα πέτυχες όλα!':correctCount>=5?'Πολύ καλή διαδρομή!':'Κάθε απάντηση είναι μια νέα γνώση.'}</Text>
      </View>
      <View style={styles.scoreCard}>
        <View pointerEvents="none" style={styles.cardRim}/>
        <Text style={styles.scoreLabel}>ΣΩΣΤΕΣ ΑΠΑΝΤΗΣΕΙΣ</Text>
        <Text style={styles.bigScore}>{correctCount}<Text style={styles.scoreDenominator}> / 7</Text></Text>
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
          <Text style={styles.eyebrow}>ΚΑΛΥΤΕΡΗ ΕΠΙΔΟΣΗ ΣΗΜΕΡΑ</Text>
          <Text style={styles.highlightTitle}>{topicTitle(analysis.strongest.id)} · {analysis.strongest.correct}/{analysis.strongest.total}</Text>
        </View>
      </View>:null}
      <View style={styles.actionGroup}>
        <ActionButton label="Δες όλες τις απαντήσεις →" onPress={()=>showReview('answers')} style={styles.actionPrimary}/>
        {analysis.practiceQuestions.length?<ActionButton label={analysis.legacy?"Εξάσκηση στην τρέχουσα έκδοση →":`Επανάληψη λαθών (${analysis.practiceQuestions.length}) →`} onPress={()=>showReview('mistakes')} secondary style={styles.actionSecondary}/>:null}
      </View>
      {recommendation&&onOpenLesson?<View style={styles.recommendCard}>
        <Text style={styles.eyebrow}>Η ΕΠΟΜΕΝΗ ΑΝΑΚΑΛΥΨΗ</Text>
        <Text style={styles.cardTitle}>{recommendation.title}</Text>
        <ActionButton label={inProgressLessonIds.includes(recommendation.id)?'Συνέχισε το μάθημα →':'Άνοιξε το μάθημα →'} onPress={()=>onOpenLesson(recommendation.id)} secondary style={styles.inlineAction}/>
      </View>:onWeeklyReview?<ActionButton label="Εβδομαδιαία επανάληψη →" onPress={onWeeklyReview} secondary style={styles.actionSecondary}/>:null}
      <Text style={styles.tomorrow}>Νέο σετ αύριο, με την αλλαγή της ημέρας στην Ελλάδα.</Text>
      <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} secondary style={styles.returnAction}/>
    </View></QuizReveal>
    :!record.started?<View testID="daily-intro" style={[styles.introContainer,denseIntro&&styles.introDense]}><QuizReveal><View style={[styles.introBody,compactIntro&&styles.introBodyCompact]}>
      <View style={[styles.missionHeader,compactIntro&&styles.missionHeaderCompact]}>
        <View style={[styles.heroMark,compactIntro&&styles.heroMarkCompact,denseIntro&&styles.heroMarkDense]} accessible={false}>
          <View style={styles.heroOrbit}/>
          <View style={styles.heroCore}><Text style={styles.heroGlyph}>✦</Text></View>
          <View style={styles.heroSatellite}/>
        </View>
        <Text style={styles.eyebrow}>Η ΚΟΙΝΗ ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
        <Text style={[styles.title,styles.introTitle,denseIntro&&styles.introTitleDense]}>7 ερωτήσεις. Μια νέα ανακάλυψη.</Text>
        <Text style={[styles.body,styles.introSubtitle]}>Ίδιες ερωτήσεις για όλους. Νέα θέματα κάθε μέρα.</Text>
      </View>
      <View style={[styles.missionCard,compactIntro&&styles.missionCardCompact]}>
        <View pointerEvents="none" style={styles.cardRim}/>
        <Text style={styles.missionLabel}>Η ΣΗΜΕΡΙΝΗ ΔΙΑΔΡΟΜΗ</Text>
        <View style={styles.difficultyRow}>
          <View style={styles.difficultyItem}><Text style={styles.difficultyCount}>2</Text><Text style={styles.difficultyLabel}>ΕΥΚΟΛΕΣ</Text></View>
          <View style={styles.difficultyDivider}/>
          <View style={styles.difficultyItem}><Text style={styles.difficultyCount}>3</Text><Text style={styles.difficultyLabel}>ΜΕΣΑΙΕΣ</Text></View>
          <View style={styles.difficultyDivider}/>
          <View style={styles.difficultyItem}><Text style={styles.difficultyCount}>2</Text><Text style={styles.difficultyLabel}>ΔΥΣΚΟΛΕΣ</Text></View>
        </View>
        <View style={styles.missionFooter}>
          <Text style={styles.bonusText}>✦  100 πόντοι / σωστή</Text>
          <Text style={styles.note}>Η πρόοδος αποθηκεύεται</Text>
        </View>
      </View>
      {!canStart?<Text style={styles.errorText}>Δεν υπάρχουν αρκετές διαθέσιμες ερωτήσεις για σήμερα.</Text>:null}
      <View style={styles.introActions}>
        <ActionButton label="Ξεκίνα την πρόκληση →" onPress={()=>{setSourceError(false);sourceRequest.current++;void startChallenge();}} disabled={!canStart} style={styles.actionPrimary}/>
        <Pressable testID="daily-interests-link" style={({pressed})=>[styles.interestsLink,pressed&&styles.interestsPressed]}
          onPress={onOpenPreferences} accessibilityRole="button" accessibilityLabel="Ρύθμιση ενδιαφερόντων">
          <Text style={styles.interestsText}>Τα ενδιαφέροντά μου  ›</Text>
        </Pressable>
      </View>
      <Text style={styles.introNote}>Τα ενδιαφέροντά σου βοηθούν στις προτάσεις μαθημάτων, όχι στην επιλογή του σημερινού σετ.</Text>
    </View></QuizReveal></View>
    :currentQuestion&&questionsCompatible?<QuizReveal key={`${record.dateKey}-${currentQuestion.id}`}><View>
      <View style={styles.stageProgress}>
        <Text style={styles.eyebrow}>{record.selectionVersion?'ΗΜΕΡΗΣΙΑ ΑΠΟΣΤΟΛΗ':'ΑΠΟΘΗΚΕΥΜΕΝΗ ΑΠΟΣΤΟΛΗ'}</Text>
        <Text style={styles.stageCounter}>ΕΡΩΤΗΣΗ {String(record.currentIndex+1).padStart(2,'0')} / 07</Text>
      </View>
      <ProgressBar progress={answeredCount/7*100} label="Απαντημένες ερωτήσεις" />
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
  stageTop:{paddingHorizontal:16,paddingTop:6},
  stageHeader:{marginBottom:2},
  content:{width:'100%',maxWidth:720,alignSelf:'center',paddingHorizontal:20,paddingTop:10,paddingBottom:24},
  pageContent:{flexGrow:1},
  pageHeader:{marginBottom:6},
  activeContent:{flexGrow:1,justifyContent:'center',paddingHorizontal:16,paddingTop:8,paddingBottom:14},
  centerState:{alignItems:'center',justifyContent:'center',paddingTop:60,gap:16},
  eyebrow:{color:colors.accentLight,fontSize:10,lineHeight:16,fontWeight:'900',letterSpacing:1.05},
  title:{color:colors.text,fontSize:27,lineHeight:35,fontWeight:'900',textAlign:'center'},
  body:{color:colors.textBody,fontSize:14,lineHeight:21,textAlign:'center'},
  note:{color:colors.textMuted,fontSize:11,lineHeight:16},
  introContainer:{flexGrow:1,justifyContent:'center',paddingVertical:6},
  introDense:{paddingVertical:0},
  introBody:{gap:13},
  introBodyCompact:{gap:10},
  missionHeader:{alignItems:'center',gap:8},
  missionHeaderCompact:{gap:6},
  introTitle:{fontSize:25,lineHeight:33,maxWidth:440},
  introTitleDense:{fontSize:23,lineHeight:30},
  introSubtitle:{maxWidth:380,fontSize:13,lineHeight:19},
  heroMark:{width:70,height:70,justifyContent:'center',alignItems:'center'},
  heroMarkCompact:{transform:[{scale:.85}],marginVertical:-5},
  heroMarkDense:{transform:[{scale:.75}],marginVertical:-9},
  heroOrbit:{position:'absolute',width:76,height:76,borderRadius:38,borderWidth:1,borderColor:'#625986',transform:[{rotate:'-25deg'}]},
  heroCore:{width:56,height:56,borderRadius:20,alignItems:'center',justifyContent:'center',
    backgroundColor:'#343052',borderWidth:1,borderColor:'#696196'},
  heroGlyph:{color:'#D9CEFF',fontSize:31,fontWeight:'700'},
  heroSatellite:{position:'absolute',right:2,top:12,width:9,height:9,borderRadius:5,backgroundColor:'#81BBC1',
    borderWidth:2,borderColor:'#141C2B'},
  missionCard:{backgroundColor:'#1A2032',borderColor:'#3D4361',borderWidth:1,borderRadius:20,
    paddingHorizontal:17,paddingTop:16,paddingBottom:13,gap:10,overflow:'hidden'},
  missionCardCompact:{paddingTop:13,paddingBottom:11,gap:8},
  cardRim:{position:'absolute',top:0,left:20,right:20,height:2,backgroundColor:'#8376B9'},
  missionLabel:{color:'#B4A8E6',fontSize:10,fontWeight:'900',letterSpacing:1.15},
  difficultyRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  difficultyItem:{flex:1,alignItems:'center',gap:2},
  difficultyDivider:{height:32,width:1,backgroundColor:'#394057'},
  difficultyCount:{color:colors.text,fontSize:25,lineHeight:30,fontWeight:'900'},
  difficultyLabel:{color:colors.textMuted,fontSize:10,lineHeight:14,fontWeight:'800',letterSpacing:.4},
  missionFooter:{borderTopWidth:1,borderTopColor:'#343B53',paddingTop:9,
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6,flexWrap:'wrap'},
  bonusText:{color:'#C7BAFF',fontSize:11,lineHeight:17,fontWeight:'800'},
  introActions:{gap:1},
  interestsLink:{minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:12},
  interestsPressed:{backgroundColor:'#272D44'},
  interestsText:{color:'#BDB0FF',fontSize:13,lineHeight:19,fontWeight:'800'},
  introNote:{color:colors.textMuted,fontSize:11,lineHeight:16,textAlign:'center',paddingHorizontal:6},
  actionPrimary:{marginTop:0},
  actionSecondary:{marginTop:0},
  resultContainer:{gap:14,paddingTop:12,paddingBottom:8},
  resultHero:{alignItems:'center',gap:8},
  resultSeal:{width:50,height:50,alignItems:'center',justifyContent:'center',borderRadius:17,
    backgroundColor:'#302B4A',borderWidth:1,borderColor:'#655C92'},
  resultStar:{color:'#D0C5FF',fontSize:26},
  scoreCard:{alignItems:'center',padding:18,paddingTop:20,gap:4,borderRadius:22,overflow:'hidden',
    backgroundColor:'#1A2032',borderColor:'#444361',borderWidth:1},
  scoreLabel:{color:'#C0B3F2',fontSize:10,lineHeight:15,fontWeight:'900',letterSpacing:1.2},
  bigScore:{color:colors.text,fontSize:51,lineHeight:60,fontWeight:'900'},
  scoreDenominator:{color:colors.textMuted,fontSize:24,fontWeight:'700'},
  metrics:{flexDirection:'row',alignItems:'center',alignSelf:'stretch',marginTop:8,paddingTop:14,
    borderTopWidth:1,borderTopColor:'#373C54'},
  metric:{flex:1,alignItems:'center',gap:3},
  metricDivider:{width:1,height:32,backgroundColor:'#3A4059'},
  metricValue:{color:colors.accentLight,fontSize:22,lineHeight:29,fontWeight:'900'},
  metricLabel:{color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center'},
  legacyNote:{color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center',paddingTop:8},
  highlightRow:{backgroundColor:'#1A2030',borderRadius:16,borderWidth:1,borderColor:'#363C55',
    padding:13,flexDirection:'row',alignItems:'center',gap:11},
  highlightMark:{width:31,height:31,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'#302B4A'},
  highlightStar:{color:colors.accentLight,fontSize:17},
  highlightCopy:{flex:1,gap:4},
  highlightTitle:{color:colors.text,fontSize:15,lineHeight:21,fontWeight:'800'},
  actionGroup:{gap:9},
  recommendCard:{padding:15,gap:7,borderRadius:18,backgroundColor:'#191F30',borderWidth:1,borderColor:'#363B54'},
  cardTitle:{color:colors.text,fontSize:17,lineHeight:24,fontWeight:'800'},
  inlineAction:{marginTop:3},
  tomorrow:{color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center'},
  returnAction:{marginTop:0},
  stageProgress:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:12},
  stageCounter:{color:colors.text,fontSize:11,lineHeight:16,fontWeight:'900',letterSpacing:.6},
  combo:{color:colors.accentLight,fontSize:13,lineHeight:21,fontWeight:'800'},
  sourceLink:{paddingVertical:10},
  sourceLinkText:{color:colors.accentLight,fontSize:12,lineHeight:19,textDecorationLine:'underline'},
  errorText:{color:colors.error,fontSize:13,lineHeight:21,textAlign:'center'},
});
