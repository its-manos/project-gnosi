import { StyleSheet, Text, View } from "react-native";
import type { dailyResultAnalysis } from "../utils/dailyResults";
import ActionButton from "./ActionButton";
import SourceLink from "./SourceLink";
import ReportContentButton from "./ReportContentButton";
import { dailyReportTarget } from "../utils/contentReports";
import { colors } from "../theme";
export default function DailyAnswerReview({rows,legacy,onDone}:{rows:ReturnType<typeof dailyResultAnalysis>['rows'];legacy:boolean;onDone:()=>void}) {
  return <View style={styles.container}>
    <Text style={styles.eyebrow}>ΟΙ ΑΠΑΝΤΗΣΕΙΣ ΣΟΥ</Text>
    <Text style={styles.title}>Η γνώση πίσω από το σκορ</Text>
    <Text style={styles.body}>Δες τι κράτησες και τι αξίζει μια δεύτερη ματιά. Το αποτέλεσμα και τα XP διατηρούνται.</Text>
    {legacy?<Text style={styles.note}>Παλιότερη προσπάθεια χωρίς αναλυτικό αρχείο: οι εξηγήσεις αφορούν την τρέχουσα έκδοση. Το αρχικό σκορ διατηρείται, αλλά δεν αποδίδουμε εκ των υστέρων σωστές ή λάθος επιλογές.</Text>:null}
    {rows.map(row=><View key={row.id} style={styles.card}>
      <Text style={[styles.status,row.correct===true?styles.correct:styles.wrong]}>{row.index+1}. {row.correct===null?(row.question?'Τρέχουσα έκδοση':'Παλαιότερη έκδοση'):row.correct?'✓ Σωστά':'↻ Για επανάληψη'}</Text>
      {row.question?<>
        <Text style={styles.question}>{row.question.question}</Text>
        {!legacy?<Text style={styles.body}>Η απάντησή σου: {row.question.answers[row.selectedAnswer]}</Text>:null}
        <Text style={styles.answer}>Σωστή απάντηση: {row.question.answers[row.question.correctIndex]}</Text>
        <Text style={styles.body}>{row.question.explanation}</Text>
        <SourceLink source={{title:row.question.sourceTitle,url:row.question.sourceUrl,publisher:'Πηγή ερώτησης'}} />
        <ReportContentButton target={dailyReportTarget(row.question)} />
      </>:<Text style={styles.body}>Η ερώτηση έχει αλλάξει ή δεν είναι διαθέσιμη. Το αποθηκευμένο σκορ διατηρείται· δεν εμφανίζουμε μια νεότερη εξήγηση ως μέρος της παλιάς προσπάθειας.</Text>}
    </View>)}
    <ActionButton label="Επιστροφή στο αποτέλεσμα" onPress={onDone} />
  </View>;
}
const styles=StyleSheet.create({
  container:{gap:14,paddingTop:16},eyebrow:{color:colors.accentLight,fontSize:10,fontWeight:'900',letterSpacing:1.1},
  title:{color:colors.text,fontSize:27,lineHeight:35,fontWeight:'900'},body:{color:colors.textBody,fontSize:14,lineHeight:23},
  note:{color:colors.textMuted,fontSize:12,lineHeight:20},card:{padding:18,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,gap:10},
  status:{fontSize:12,fontWeight:'800',lineHeight:20},correct:{color:colors.success},wrong:{color:colors.accentLight},
  question:{color:colors.text,fontSize:18,lineHeight:27,fontWeight:'800'},answer:{color:colors.text,fontSize:14,lineHeight:23,fontWeight:'700'},
});
