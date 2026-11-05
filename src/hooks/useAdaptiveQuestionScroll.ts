import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { stableLayoutHeight } from "../utils/screenLayout";

/** A question is a fixed page whenever it fits. Large type, long Greek
 * explanations and short phones can still scroll rather than clip controls. */
export function useAdaptiveQuestionScroll() {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setViewportHeight(previous => stableLayoutHeight(previous, next));
  }, []);
  const onContentSizeChange = useCallback((_width: number, height: number) => {
    setContentHeight(previous => stableLayoutHeight(previous, height));
  }, []);
  return {
    onLayout,
    onContentSizeChange,
    // Subpixel rendering differences must not turn a screen-fitting page into
    // a frustrating two-pixel scroller.
    scrollEnabled: viewportHeight > 0 && contentHeight > viewportHeight + 3,
  };
}
