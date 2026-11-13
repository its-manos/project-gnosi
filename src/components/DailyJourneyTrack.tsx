import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const TOTAL_STATIONS = 7;
const route = Array.from({ length: TOTAL_STATIONS }, (_, index) => index);
type Props =
  | { mode: "question"; answeredCount: number; currentIndex: number; shared?: boolean }
  | { mode: "result"; correctMask: readonly (boolean | null)[]; shared?: boolean };

function DailyJourneyTrack(props: Props) {
  const isResult = props.mode === "result";
  const count = isResult ? TOTAL_STATIONS : Math.min(TOTAL_STATIONS, Math.max(0, props.answeredCount));
  const activeIndex = isResult ? -1 : Math.min(TOTAL_STATIONS - 1, Math.max(0, props.currentIndex));
  const label = isResult ? "Η ΔΙΑΔΡΟΜΗ ΣΟΥ" : "ΠΡΟΟΔΟΣ ΑΠΟΣΤΟΛΗΣ";
  const value = isResult ? "07 / 07" : `${String(activeIndex + 1).padStart(2, "0")} / 07`;
  const resultsKnown = isResult && props.correctMask.length === TOTAL_STATIONS &&
    props.correctMask.every(value => typeof value === "boolean");
  const correctTotal = isResult ? props.correctMask.filter(value => value === true).length : 0;
  const routeAnnouncement = isResult
    ? resultsKnown
      ? `Αποτελέσματα: ${correctTotal} σωστές, ${TOTAL_STATIONS - correctTotal} λανθασμένες απαντήσεις.`
      : "Η διαδρομή ολοκληρώθηκε. Δεν υπάρχουν αναλυτικά αποτελέσματα για κάθε ερώτηση."
    : `Απαντημένες: ${count} από ${TOTAL_STATIONS} ερωτήσεις.`;

  return <View testID={isResult ? "daily-result-route" : "daily-question-route"} style={styles.wrap}>
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.counter}>{value}</Text>
    </View>
    <View style={styles.route} accessible accessibilityRole="progressbar"
      accessibilityLabel={routeAnnouncement}
      accessibilityValue={{ min: 0, max: TOTAL_STATIONS, now: count }}>
      <View pointerEvents="none" style={styles.rail}/>
      {route.map(index => {
        const completed = index < count;
        const current = index === activeIndex && !completed;
        const correctness = isResult ? props.correctMask[index] : null;
        // For legacy daily attempts, do not imply the new 2/3/2 tier order.
        const tier = props.shared === false ? "neutral"
          : index < 2 ? "easy" : index < 5 ? "medium" : "hard";
        return <View testID={`daily-journey-stop-${index + 1}`} key={index} style={styles.stopSlot}>
          <View style={[styles.stop,completed&&styles.completed,current&&styles.current,
            isResult&&correctness===true&&styles.correct,
            isResult&&correctness===false&&styles.incorrect,
            !isResult&&current&&(tier==="easy"?styles.easy:
              tier==="hard"?styles.hard:styles.medium)]}>
            <Text style={[styles.glyph,completed&&styles.completedGlyph,
              isResult&&correctness===true&&styles.correctGlyph,
              isResult&&correctness===false&&styles.incorrectGlyph]}>
              {isResult&&correctness===true?"✓":isResult&&correctness===false?"×":
                current?"✦":completed?"•":"·"}
            </Text>
          </View>
        </View>;
      })}
    </View>
  </View>;
}

export default memo(DailyJourneyTrack);

const styles = StyleSheet.create({
  wrap:{gap:9},
  heading:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},
  eyebrow:{color:"#BFB3ED",fontSize:10,lineHeight:16,fontWeight:"900",letterSpacing:0.9},
  counter:{color:colors.text,fontSize:12,lineHeight:18,fontWeight:"900",letterSpacing:0.7},
  route:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",position:"relative",height:29},
  rail:{position:"absolute",height:2,backgroundColor:"#41455F",left:"6%",right:"6%",top:14},
  stopSlot:{flex:1,alignItems:"center",justifyContent:"center"},
  stop:{width:21,height:21,borderRadius:11,alignItems:"center",justifyContent:"center",
    backgroundColor:"#242B3F",borderWidth:1,borderColor:"#454960"},
  current:{width:27,height:27,borderRadius:14,backgroundColor:"#353352",
    borderWidth:2,borderColor:"#B1A5FF"},
  completed:{backgroundColor:"#585182",borderColor:"#AEA0F0"},
  easy:{borderColor:"#84D0CE",backgroundColor:"#21464C"},
  medium:{borderColor:"#B1A5FF",backgroundColor:"#353352"},
  hard:{borderColor:"#E0BC84",backgroundColor:"#4A3C43"},
  correct:{backgroundColor:"#214B42",borderColor:"#73C8AC"},
  incorrect:{backgroundColor:"#4B303C",borderColor:"#DD98A8"},
  glyph:{fontSize:14,lineHeight:18,fontWeight:"900",color:"#9B9BB0"},
  completedGlyph:{color:"#F5EDFF"},
  correctGlyph:{color:"#9DE2C7"},
  incorrectGlyph:{color:"#F1A8B6"},
});
