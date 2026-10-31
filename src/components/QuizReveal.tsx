import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated } from "react-native";
/** One short native opacity transition; never delays interaction or scoring. */
export default function QuizReveal({children}:{children:ReactNode}) {
  const [opacity]=useState(()=>new Animated.Value(1));
  useEffect(()=>{
    let mounted=true,changed=false,animation:Animated.CompositeAnimation|undefined;
    const apply=(reduced:boolean)=>{
      animation?.stop();
      if(reduced){opacity.setValue(1);return;}
      opacity.setValue(0);
      animation=Animated.timing(opacity,{toValue:1,duration:140,useNativeDriver:true,isInteraction:false});
      animation.start();
    };
    const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',reduced=>{changed=true;if(mounted&&reduced){animation?.stop();opacity.setValue(1);}});
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced=>{if(mounted&&!changed)apply(reduced);}).catch(()=>{if(mounted)opacity.setValue(1);});
    return()=>{mounted=false;subscription.remove();animation?.stop();};
  },[opacity]);
  return <Animated.View style={{opacity}}>{children}</Animated.View>;
}
