import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ImageZoomViewer from './ImageZoomViewer';
import type { ZoomImage } from './ImageZoomViewer';
/** Only lesson-reader images opt in; catalogue cards keep their navigation tap. */
export default function ZoomableLessonImage({ image, children }: { image: ZoomImage; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const valid = Boolean(image.uri?.trim());
  return <>
    <Pressable disabled={!valid} onPress={() => setOpen(true)} style={styles.frame}
      accessibilityRole="button" accessibilityLabel={`Μεγέθυνση εικόνας: ${image.caption}`}
      accessibilityHint="Ανοίγει την πλήρη εικόνα με χειριστήρια μεγέθυνσης." accessibilityState={{ disabled: !valid }}>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{children}</View>
      {valid ? <View pointerEvents="none" style={styles.badge} accessible={false}><Text style={styles.badgeText}>⤢</Text></View> : null}
    </Pressable>
    {open && valid ? <ImageZoomViewer key={image.uri} image={image} onClose={() => setOpen(false)} /> : null}
  </>;
}
const styles = StyleSheet.create({
  frame: { position: 'relative', overflow: 'hidden', borderRadius: 16 },
  badge: { position: 'absolute', right: 9, bottom: 9, minWidth: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(7,9,16,0.82)', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#E5E0FF', fontSize: 23, lineHeight: 28 },
});
