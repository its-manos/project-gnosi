import { useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/ActionButton";
import AnswerOption from "../components/AnswerOption";
import AppHeader from "../components/AppHeader";
import ProgressBar from "../components/ProgressBar";
import DailyMistakeReview from "../components/DailyMistakeReview";
import DailyAnswerReview from "../components/DailyAnswerReview";
import QuizReveal from "../components/QuizReveal";
import KnowledgeProgress from "../components/KnowledgeProgress";
import ReportContentButton from "../components/ReportContentButton";
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
  const {record,rewardSummary,rewardXP,isLoading,currentQuestion,selectedAnswer,correctCount,accountScoped,resultDetails,questionsCompatible=true,startChallenge,answerQuestion,nextQuestion}=useDailyChallenge(preferences,preferencesLoaded);
  const [sourceError,setSourceError]=useState(false),scrollRef=useRef<ComponentRef<typeof ScrollView>>(null),sourceRequest=useRef(0);
  const [review,setReview]=useState<{date:string;mode:'answers'|'mistakes'}|null>(null);
  const analysis=dailyResultAnalysis(record,questions,correctCount,resultDetails);
  const recommendation=recommendDailyLesson(analysis.rows,lessons,completedLessonIds,inProgressLessonIds,preferences);
  const reviewing=record.completed&&review?.date===record.dateKey;
  const answeredCount=Object.keys(record.answers).length;
  const isCorrect=currentQuestion!==null&&selectedAnswer===currentQuestion.correctIndex;
  const scrollTop=()=>scrollRef.current?.scrollTo({y:0,animated:false});
  const showReview=(mode:'answers'|'mistakes')=>{setReview({date:record.dateKey,mode});sourceRequest.current++;setSourceError(false);scrollTop();};
  const closeReview=()=>{setReview(null);scrollTop();};
  async function openSource(url:string){const request=++sourceRequest.current;try{await Linking.openURL(url);if(request===sourceRequest.current)setSourceError(false);}catch{if(request===sourceRequest.current)setSourceError(true);}}
  const misses=analysis.rows.filter(r=>r.correct===false&&r.question);
  const canStart=selectSharedDailyQuestions(record.dateKey).length===DAILY_CHALLENGE_SIZE;
  return <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <AppHeader onBack={reviewing?closeReview:onHome} backLabel={reviewing?'ΑΠΟΤΕΛΕΣΜΑ':'ΑΡΧΙΚΗ'} />
    {accountScoped?<Text style={styles.note}>Η πρόοδός σου συγχρονίζεται στις συσκευές σου.</Text>:null}
    {isLoading?<View style={styles.centerState}><ActivityIndicator color={colors.accentLight} size="large"/><Text style={styles.note}>Φόρτωση της σημερινής πρόκλησης…</Text></View>
    :record.completed&&review?.date===record.dateKey&&review.mode==='answers'?<DailyAnswerReview rows={analysis.rows} legacy={analysis.legacy} onDone={closeReview}/>
    :record.completed&&review?.date===record.dateKey&&review.mode==='mistakes'?<DailyMistakeReview key={`${record.dateKey}-${record.questionIds.join('-')}`} questions={analysis.practiceQuestions} onDone={closeReview} onAdvance={scrollTop}/>
    :record.completed?<QuizReveal><View style={styles.resultContainer}>
      <Text style={styles.eyebrow}>Η ΣΗΜΕΡΙΝΗ ΑΝΑΚΑΛΥΨΗ ΟΛΟΚΛΗΡΩΘΗΚΕ</Text>
      <Text style={styles.title}>{correctCount===7?'Τα πέτυχες όλα!':correctCount>=5?'Γερή δόση γνώσης!':'Κράτησε κάτι νέο από σήμερα.'}</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.bigScore}>{correctCount} / 7</Text>
        <Text style={styles.scoreMeta}>{correctCount*100} / 700 πόντοι · {correctCount} σωστές απαντήσεις</Text>
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricValue}>{analysis.accuracyPercent}%</Text><Text style={styles.note}>Ακρίβεια</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{rewardXP??dailyXP(correctCount)}</Text><Text style={styles.note}>XP ημέρας</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{analysis.highestCombo??'—'}</Text><Text style={styles.note}>Καλύτερο σερί</Text></View>
        </View>
        <Text style={styles.scoreMeta}>XP ημέρας: {rewardXP??dailyXP(correctCount)} XP</Text>
        {analysis.highestCombo!==null?<Text style={styles.note}>Καλύτερο σερί: {analysis.highestCombo}</Text>:<Text style={styles.note}>Δεν υπάρχει αποθηκευμένη ανάλυση σερί για αυτή την παλιότερη προσπάθεια.</Text>}
      </View>
      {analysis.strongest?<View style={styles.card}><Text style={styles.eyebrow}>ΚΑΛΥΤΕΡΗ ΕΠΙΔΟΣΗ ΣΗΜΕΡΑ</Text><Text style={styles.cardTitle}>{topicTitle(analysis.strongest.id)} · {analysis.strongest.correct}/{analysis.strongest.total}</Text><Text style={styles.note}>Μια ένδειξη από το σημερινό μικρό δείγμα, όχι συνολική αξιολόγηση της γνώσης σου.</Text></View>:null}
      <ActionButton label="Δες όλες τις απαντήσεις →" onPress={()=>showReview('answers')}/>
      {analysis.practiceQuestions.length?<ActionButton label={analysis.legacy?"Εξάσκηση στην τρέχουσα έκδοση →":`Επανάληψη λαθών (${analysis.practiceQuestions.length}) →`} onPress={()=>showReview('mistakes')} secondary/>:null}
      {recommendation&&onOpenLesson?<View style={styles.card}>
        <Text style={styles.eyebrow}>Η ΕΠΟΜΕΝΗ ΑΝΑΚΑΛΥΨΗ ΣΟΥ</Text><Text style={styles.cardTitle}>{recommendation.title}</Text>
        <Text style={styles.body}>{misses.length?'Συνέχισε με μια σχετική διαδρομή ή ένα θέμα που σε ενδιαφέρει.':'Κράτησε την περιέργεια ζωντανή με ένα μάθημα στα ενδιαφέροντά σου.'}</Text>
        <ActionButton label={inProgressLessonIds.includes(recommendation.id)?'Συνέχισε το μάθημα →':'Άνοιξε το μάθημα →'} onPress={()=>onOpenLesson(recommendation.id)}/>
      </View>:onWeeklyReview?<ActionButton label="Συνέχισε με την εβδομαδιαία επανάληψη →" onPress={onWeeklyReview} secondary/>:null}
      {misses.length?<View style={styles.card}><Text style={styles.cardTitle}>Κράτησέ τα για την επόμενη φορά</Text>
        {misses.slice(0,2).map(row=><View key={row.id} style={styles.missedItem}><Text style={styles.bodyStrong}>{row.question!.question}</Text><Text style={styles.body}>{row.question!.explanation}</Text></View>)}
        {misses.length>2?<Text style={styles.note}>Και άλλες {misses.length-2} εξηγήσεις στην ανασκόπηση απαντήσεων.</Text>:null}
      </View>:null}
      <KnowledgeProgress compact/>
      <Text style={styles.tomorrow}>Νέο σετ αύριο, με την αλλαγή της ημέρας στην Ελλάδα.</Text>
      <ActionButton label="Επιστροφή στην αρχική" onPress={onHome} secondary/>
    </View></QuizReveal>
    :!record.started?<View style={styles.introContainer}>
      <View style={styles.heroMark}><Text style={styles.heroGlyph}>✦</Text></View>
      <Text style={styles.eyebrow}>Η ΚΟΙΝΗ ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ</Text>
      <Text style={styles.title}>7 ερωτήσεις. Μια νέα διαδρομή κάθε μέρα.</Text>
      <Text style={styles.body}>Το ίδιο σημερινό σετ για όλους: διαφορετικά θέματα, από εύκολες έως πιο απαιτητικές ερωτήσεις.</Text>
      <View style={styles.card}>
        <Text style={styles.bodyStrong}>2 εύκολες · 3 μεσαίες · 2 δύσκολες</Text>
        <Text style={styles.body}>100 πόντοι ανά σωστή απάντηση. Κάθε απάντηση ανοίγει μια εξήγηση. Τα σερί σωστών απαντήσεων δίνουν μπόνους XP σε νέες ερωτήσεις.</Text>
        <Text style={styles.note}>Αν σταματήσεις, συνεχίζεις από εκεί που έμεινες. Η ημέρα αλλάζει με την ώρα Ελλάδας.</Text>
      </View>
      {!canStart?<Text style={styles.errorText}>Δεν υπάρχουν αρκετές διαθέσιμες ερωτήσεις για σήμερα.</Text>:null}
      <ActionButton label="Ξεκίνα την πρόκληση →" onPress={()=>{setSourceError(false);sourceRequest.current++;void startChallenge();}} disabled={!canStart}/>
      <ActionButton label="Τα ενδιαφέροντά μου" onPress={onOpenPreferences} secondary/>
      <Text style={styles.note}>Τα ενδιαφέροντά σου βοηθούν στις προτάσεις μαθημάτων μετά το quiz.</Text>
      <ActionButton label="Όχι τώρα" onPress={onHome} secondary/>
    </View>
    :currentQuestion&&questionsCompatible?<QuizReveal key={`${record.dateKey}-${currentQuestion.id}`}><View>
      <Text style={styles.eyebrow}>{record.selectionVersion?'Η ΚΟΙΝΗ ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΚΛΗΣΗ':'Η ΑΠΟΘΗΚΕΥΜΕΝΗ ΠΡΟΚΛΗΣΗ ΣΟΥ'}</Text>
      <View style={styles.progressRow}><Text style={styles.note}>Απαντημένες: {answeredCount} / 7</Text><Text style={styles.counter}>Ερώτηση {record.currentIndex+1} / 7</Text></View>
      <ProgressBar progress={answeredCount/7*100}/>
      <View style={styles.dots} accessible accessibilityLabel={`${answeredCount} από 7 ερωτήσεις απαντήθηκαν`}>
        {record.questionIds.map((id,i)=>{const q=questions.find(q=>q.id===id),answered=record.answers[i]!==undefined,correct=answered&&record.answers[i]===q?.correctIndex;return <View key={id} style={[styles.dot,answered&&(correct?styles.dotCorrect:styles.dotWrong),i===record.currentIndex&&styles.dotCurrent]}><Text style={styles.dotText}>{answered?(correct?'✓':'×'):i+1}</Text></View>;})}
      </View>
      <View style={styles.questionCard}>
        <Text style={styles.eyebrow}>{topicTitle(currentQuestion.categoryId)} · {difficultyTitle(currentQuestion.difficulty)}</Text>
        <Text style={styles.question}>{currentQuestion.question}</Text>
      </View>
      <View style={styles.answers}>
        {currentQuestion.answers.map((answer,index)=><AnswerOption key={`${currentQuestion.id}-${index}`} label={answer} index={index} selected={selectedAnswer===index} correct={index===currentQuestion.correctIndex} locked={selectedAnswer!==null} onPress={()=>void answerQuestion(index)}/>)}
        <ReportContentButton key={currentQuestion.id} target={dailyReportTarget(currentQuestion)}/>
      </View>
      {selectedAnswer!==null?<QuizReveal><View style={styles.feedback} accessibilityLiveRegion="polite">
        <Text style={styles.feedbackTitle}>{isCorrect?'Σωστά — το κράτησες!':'Μια νέα γνώση για σήμερα.'}</Text>
        {!isCorrect?<Text style={styles.bodyStrong}>Σωστή απάντηση: {currentQuestion.answers[currentQuestion.correctIndex]}</Text>:null}
        <Text style={styles.body}>{currentQuestion.explanation}</Text>
        {rewardSummary&&rewardSummary.combo>1?<Text style={styles.combo}>ΣΕΡΙ {rewardSummary.combo} · +{rewardSummary.rows[record.currentIndex]?.comboXP??0} XP μπόνους</Text>:null}
        {rewardSummary?.rows[record.currentIndex]?.eligible===false?<Text style={styles.note}>Η ερώτηση έχει ήδη ανταμειφθεί. Συνεχίζει να μετρά στο σημερινό σκορ.</Text>:null}
        <Pressable onPress={()=>void openSource(currentQuestion.sourceUrl)} accessibilityRole="link" style={styles.sourceLink}><Text style={styles.sourceLinkText}>Πηγή: {currentQuestion.sourceTitle} ↗</Text></Pressable>
        {sourceError?<Text style={styles.errorText}>Δεν ήταν δυνατό το άνοιγμα της πηγής.</Text>:null}
        <ActionButton label={record.currentIndex===6?'Δες το αποτέλεσμα →':'Επόμενη ερώτηση →'} onPress={()=>{sourceRequest.current++;setSourceError(false);void nextQuestion();scrollTop();}}/>
        <Text style={styles.note}>Σωστές μέχρι τώρα: {correctCount} · {correctCount*100} πόντοι</Text>
      </View></QuizReveal>:null}
    </View></QuizReveal>
    :<View style={styles.centerState}><Text style={styles.errorText}>{questionsCompatible?'Δεν ήταν δυνατή η φόρτωση της πρόκλησης.':'Οι ερωτήσεις ενημερώθηκαν από τότε που ξεκίνησες. Οι απαντήσεις σου διατηρήθηκαν· αυτή η έκδοση δεν μπορεί να συνεχίσει με διαφορετικές ερωτήσεις.'}</Text><ActionButton label="Επιστροφή στην αρχική" onPress={onHome}/></View>}
  </ScrollView>;
}
const styles=StyleSheet.create({
  content:{width:'100%',maxWidth:720,alignSelf:'center',paddingHorizontal:20,paddingTop:12,paddingBottom:44},
  centerState:{alignItems:'center',justifyContent:'center',paddingTop:60,gap:16},introContainer:{paddingTop:20,gap:10},
  heroMark:{width:64,height:64,alignSelf:'center',alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:colors.accentSurface,marginBottom:14},heroGlyph:{color:colors.accentLight,fontSize:34},
  eyebrow:{color:colors.accentLight,fontSize:10,lineHeight:17,fontWeight:'900',letterSpacing:1.1},title:{color:colors.text,fontSize:29,lineHeight:38,fontWeight:'900',marginVertical:10},
  body:{color:colors.textBody,fontSize:14,lineHeight:23},bodyStrong:{color:colors.text,fontSize:14,lineHeight:23,fontWeight:'700'},note:{color:colors.textMuted,fontSize:12,lineHeight:20},
  card:{alignSelf:'stretch',gap:10,padding:18,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,marginVertical:8},cardTitle:{color:colors.text,fontSize:18,lineHeight:26,fontWeight:'800'},
  scoreCard:{alignSelf:'stretch',alignItems:'center',gap:8,padding:20,borderRadius:24,backgroundColor:colors.accentSurface,borderWidth:1,borderColor:colors.borderStrong,marginVertical:12},
  bigScore:{color:colors.text,fontSize:52,lineHeight:65,fontWeight:'900'},scoreMeta:{color:colors.textBody,fontSize:12,lineHeight:20,textAlign:'center'},
  metrics:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-around',gap:16,alignSelf:'stretch',paddingVertical:12},metric:{alignItems:'center',minWidth:72,gap:4},metricValue:{color:colors.accentLight,fontSize:23,lineHeight:31,fontWeight:'900'},
  resultContainer:{gap:10,paddingTop:18},tomorrow:{color:colors.textMuted,fontSize:12,lineHeight:20,textAlign:'center',marginVertical:8},missedItem:{borderTopWidth:1,borderTopColor:colors.border,paddingTop:12,gap:6},
  progressRow:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10,marginTop:16,marginBottom:8},counter:{color:colors.accentLight,fontSize:12,lineHeight:20,fontWeight:'800'},
  dots:{flexDirection:'row',justifyContent:'space-between',gap:6,marginTop:16},dot:{width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:colors.surfaceSoft,borderWidth:1,borderColor:colors.border},dotCurrent:{borderColor:colors.accentLight},dotCorrect:{backgroundColor:'#17372F'},dotWrong:{backgroundColor:'#40232E'},dotText:{color:colors.text,fontSize:11,fontWeight:'800'},
  questionCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:20,padding:20,gap:12,marginTop:22,marginBottom:18},question:{color:colors.text,fontSize:22,lineHeight:32,fontWeight:'800'},answers:{gap:10},
  feedback:{backgroundColor:colors.surfaceSoft,borderWidth:1,borderColor:colors.border,borderRadius:20,padding:18,gap:10,marginTop:18},feedbackTitle:{color:colors.text,fontSize:19,lineHeight:27,fontWeight:'900'},combo:{color:colors.accentLight,fontSize:13,lineHeight:21,fontWeight:'800'},
  sourceLink:{paddingVertical:10},sourceLinkText:{color:colors.accentLight,fontSize:12,lineHeight:19,textDecorationLine:'underline'},errorText:{color:colors.error,fontSize:13,lineHeight:22,marginVertical:12},
});
