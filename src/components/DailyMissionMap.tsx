import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

// The shared daily selection is intentionally 2 easy, 3 medium, 2 hard.
// This illustration is static native UI, not an animated SVG or an interactive map.
const stations = ["easy", "easy", "medium", "medium", "medium", "hard", "hard"] as const;

function DailyMissionMap({ compact = false }: { compact?: boolean }) {
  return <View testID="daily-mission-map" style={[styles.card,compact&&styles.cardCompact]}>
    <View pointerEvents="none" style={styles.rim}/>
    <View style={styles.topRow}>
      <View style={styles.captionRow}>
        <Text style={styles.tinyStar}>✦</Text>
        <Text style={styles.heading}>Ο ΧΑΡΤΗΣ ΤΗΣ ΗΜΕΡΑΣ</Text>
      </View>
      <View style={styles.countPill}>
        <Text style={styles.countText}>07 ΣΤΑΣΕΙΣ</Text>
      </View>
    </View>

    <View style={[styles.route,compact&&styles.routeCompact]} accessible={false} pointerEvents="none">
      <View style={styles.rail}/>
      {stations.map((tier,index)=><View key={index} testID={`daily-route-station-${index+1}`} style={styles.stationSlot}>
        <View style={[styles.stationHalo,tier==="easy"&&styles.easyHalo,
          tier==="medium"&&styles.mediumHalo,tier==="hard"&&styles.hardHalo]}>
          <Text style={[styles.stationStar,tier==="easy"&&styles.easyStar,
            tier==="medium"&&styles.mediumStar,tier==="hard"&&styles.hardStar]}>
            {index===0?"✦":"✧"}
          </Text>
        </View>
      </View>)}
    </View>

    <View style={styles.tierRow}>
      <View style={styles.tier}>
        <View style={[styles.tierDot,styles.easyDot]}/>
        <Text style={styles.tierText}>2 εύκολες</Text>
      </View>
      <View style={styles.tier}>
        <View style={[styles.tierDot,styles.mediumDot]}/>
        <Text style={styles.tierText}>3 μεσαίες</Text>
      </View>
      <View style={styles.tier}>
        <View style={[styles.tierDot,styles.hardDot]}/>
        <Text style={styles.tierText}>2 δύσκολες</Text>
      </View>
    </View>

    <View style={styles.footer}>
      <View style={styles.footerItem}>
        <Text style={styles.footerIcon}>✦</Text>
        <Text style={styles.footerHighlight}>100 πόντοι / σωστή</Text>
      </View>
      <Text style={styles.footerMuted}>Συνέχισε όποτε θέλεις</Text>
    </View>
  </View>;
}

export default memo(DailyMissionMap);

const styles=StyleSheet.create({
  card:{paddingHorizontal:18,paddingTop:17,paddingBottom:15,backgroundColor:"#192137",
    borderWidth:1,borderColor:"#444567",borderRadius:22,overflow:"hidden",gap:13},
  cardCompact:{paddingTop:14,paddingBottom:12,gap:10},
  rim:{position:"absolute",left:22,right:22,top:0,height:2,backgroundColor:"#9B8DDD"},
  topRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},
  captionRow:{flexDirection:"row",alignItems:"center",gap:7,flexShrink:1},
  tinyStar:{fontSize:12,color:"#AFA2FF"},
  heading:{fontSize:10,lineHeight:15,fontWeight:"900",letterSpacing:.95,color:"#C9BFFF",flexShrink:1},
  countPill:{paddingVertical:5,paddingHorizontal:9,backgroundColor:"#2B2A49",borderWidth:1,
    borderColor:"#4F4772",borderRadius:10},
  countText:{fontSize:10,fontWeight:"900",letterSpacing:.55,color:"#D3C8FF"},
  route:{height:74,flexDirection:"row",alignItems:"center",justifyContent:"space-between",position:"relative"},
  routeCompact:{height:62},
  rail:{position:"absolute",left:14,right:14,top:"50%",height:2,backgroundColor:"#515170"},
  stationSlot:{flex:1,alignItems:"center",justifyContent:"center"},
  stationHalo:{width:31,height:31,borderRadius:16,alignItems:"center",justifyContent:"center",
    borderWidth:1.5,backgroundColor:"#253049"},
  easyHalo:{borderColor:"#69B4B6",backgroundColor:"#1B3A47"},
  mediumHalo:{borderColor:"#A99BFF",backgroundColor:"#363052"},
  hardHalo:{borderColor:"#D4AE7E",backgroundColor:"#3A3240"},
  stationStar:{fontSize:18,lineHeight:23,fontWeight:"800"},
  easyStar:{color:"#8BD1CB"},
  mediumStar:{color:"#CEC3FF"},
  hardStar:{color:"#F1CB96"},
  tierRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:6},
  tier:{flexDirection:"row",alignItems:"center",justifyContent:"center",flex:1,gap:5},
  tierDot:{width:6,height:6,borderRadius:3},
  easyDot:{backgroundColor:"#69B4B6"},
  mediumDot:{backgroundColor:"#A99BFF"},
  hardDot:{backgroundColor:"#D4AE7E"},
  tierText:{color:colors.textBody,fontSize:11,lineHeight:17,fontWeight:"700",textAlign:"center"},
  footer:{borderTopWidth:1,borderTopColor:"#343A57",paddingTop:12,
    flexDirection:"row",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7},
  footerItem:{flexDirection:"row",alignItems:"center",gap:6},
  footerIcon:{color:colors.accentLight,fontSize:14},
  footerHighlight:{color:"#CCBFFF",fontSize:11,lineHeight:16,fontWeight:"900"},
  footerMuted:{color:colors.textMuted,fontSize:11,lineHeight:16},
});
