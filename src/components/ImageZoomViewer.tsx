import { useRef, useState } from 'react';
import { Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { containSize, FIT_ZOOM, ImageZoomController, MAX_IMAGE_ZOOM, type Point, type Size } from '../utils/imageZoom';
import ResilientImage from './ResilientImage';
import { colors } from '../theme';
export type ZoomImage = { uri: string; caption: string; credit: string; creditUrl: string };
export default function ImageZoomViewer({ image, onClose }: { image: ZoomImage; onClose: () => void }) {
  const { height: windowHeight } = useWindowDimensions();
  const viewport = useRef<Size>({ width: 0, height: 0 }), natural = useRef<Size>({ width: 0, height: 0 });
  const controller = useRef(new ImageZoomController({ viewport: viewport.current, image: natural.current }));
  const [transform, setTransform] = useState({ ...FIT_ZOOM });
  const [layout, setLayout] = useState(viewport.current), [dimensions, setDimensions] = useState(natural.current);
  const ready = dimensions.width > 0 && dimensions.height > 0 && layout.width > 0 && layout.height > 0;
  function configure() { setTransform(controller.current.configure({ viewport: viewport.current, image: natural.current })); }
  function points(event: GestureResponderEvent): Point[] {
    // All rendered image children have pointerEvents=none; touch coordinates
    // therefore stay relative to this untransformed viewport, not the bitmap.
    return Array.from(event.nativeEvent.touches).map(t => ({ x: t.locationX, y: t.locationY }));
  }
  const readyRef = useRef(false); readyRef.current = ready;
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => readyRef.current,
    onMoveShouldSetPanResponder: () => readyRef.current,
    onPanResponderGrant: event => controller.current.begin(points(event), Date.now()),
    onPanResponderStart: event => { if (event.nativeEvent.touches.length > 1) controller.current.begin(points(event), Date.now(), false); },
    onPanResponderMove: event => setTransform(controller.current.move(points(event), Date.now())),
    onPanResponderEnd: event => setTransform(controller.current.end(points(event), Date.now())),
    onPanResponderRelease: event => setTransform(controller.current.end(points(event), Date.now())),
    onPanResponderTerminate: () => setTransform(controller.current.cancel()),
    onPanResponderTerminationRequest: () => false,
  }));
  function zoomBy(factor: number) { setTransform(controller.current.zoom(controller.current.state.scale * factor)); }
  function reset() { setTransform(controller.current.reset()); }
  const fit = containSize(dimensions, layout);
  return <Modal visible animationType="fade" presentationStyle="fullScreen" hardwareAccelerated
    supportedOrientations={['portrait', 'landscape-left', 'landscape-right']} onRequestClose={onClose}>
    <SafeAreaProvider style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top','bottom','left','right']} accessibilityViewIsModal onAccessibilityEscape={onClose}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>Εικόνα</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Κλείσιμο εικόνας" onPress={onClose} style={styles.button}><Text style={styles.link}>Κλείσιμο ×</Text></Pressable>
        </View>
        <View testID="image-zoom-viewport" style={styles.viewport} {...responder.panHandlers}
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            if (width === viewport.current.width && height === viewport.current.height) return;
            viewport.current = { width, height }; setLayout(viewport.current); configure();
          }}
          accessible accessibilityRole="adjustable" accessibilityLabel={image.caption}
          accessibilityHint="Μεγέθυνε με δύο δάχτυλα ή με τα κουμπιά. Διπλό άγγιγμα για μεγέθυνση ή επαναφορά."
          accessibilityValue={{ min: 100, max: 600, now: Math.round(transform.scale * 100), text: `${Math.round(transform.scale * 100)}%` }}
          accessibilityActions={[{ name: 'increment', label: 'Μεγέθυνση' }, { name: 'decrement', label: 'Σμίκρυνση' }, { name: 'activate', label: 'Επαναφορά' }]}
          onAccessibilityAction={event => { if (!ready) return; if (event.nativeEvent.actionName === 'increment') zoomBy(1.5); else if (event.nativeEvent.actionName === 'decrement') zoomBy(1 / 1.5); else reset(); }}>
          <View pointerEvents="none" style={[styles.imagePosition, { width: ready ? fit.width : '100%', height: ready ? fit.height : '100%', transform: [{ translateX: transform.x }, { translateY: transform.y }, { scale: transform.scale }] }]}>
            <ResilientImage uri={image.uri} resizeMode="contain" style={styles.image}
              onDimensions={size => {
                if (size.width === natural.current.width && size.height === natural.current.height) return;
                natural.current = size; setDimensions(size); configure();
              }} />
          </View>
        </View>
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Σμίκρυνση εικόνας" disabled={!ready || transform.scale <= 1.001} accessibilityState={{ disabled: !ready || transform.scale <= 1.001 }} onPress={() => zoomBy(1 / 1.5)} style={[styles.button, (!ready || transform.scale <= 1.001) && styles.disabled]}><Text style={styles.controlText}>−</Text></Pressable>
          <Text style={styles.percent} accessibilityLiveRegion="polite">{Math.round(transform.scale * 100)}%</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Μεγέθυνση εικόνας" disabled={!ready || transform.scale >= MAX_IMAGE_ZOOM} accessibilityState={{ disabled: !ready || transform.scale >= MAX_IMAGE_ZOOM }} onPress={() => zoomBy(1.5)} style={[styles.button, (!ready || transform.scale >= MAX_IMAGE_ZOOM) && styles.disabled]}><Text style={styles.controlText}>+</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Επαναφορά εικόνας" onPress={reset} style={styles.button}><Text style={styles.link}>Επαναφορά</Text></Pressable>
        </View>
        {windowHeight >= 450 ? <Text style={styles.hint}>Δύο δάχτυλα για μεγέθυνση · σύρε για μετακίνηση</Text> : null}
        <ScrollView style={[styles.metadata, { maxHeight: Math.min(125, windowHeight * 0.22) }]} contentContainerStyle={styles.metadataContent}>
          <Text style={styles.caption}>{image.caption}</Text>
          {image.creditUrl ? <Pressable accessibilityRole="link" accessibilityLabel={`Άνοιγμα πηγής εικόνας: ${image.credit}`} style={styles.creditButton}
            onPress={() => void Linking.openURL(image.creditUrl).catch(() => {})}><Text style={styles.link}>Εικόνα: {image.credit} ↗</Text></Pressable> : null}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070910' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, gap: 12 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  button: { minWidth: 44, minHeight: 48, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  link: { color: colors.accentLight, fontSize: 13, lineHeight: 21 },
  controlText: { color: colors.text, fontSize: 27, lineHeight: 34 },
  viewport: { flex: 1, minHeight: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imagePosition: { flexShrink: 0 }, image: { width: '100%', height: '100%' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 8 },
  percent: { color: colors.textBody, fontSize: 13, minWidth: 52, textAlign: 'center' },
  hint: { color: colors.textMuted, textAlign: 'center', fontSize: 11, lineHeight: 18, marginBottom: 6, paddingHorizontal: 12 },
  metadata: { flexGrow: 0, maxHeight: 125 }, metadataContent: { paddingHorizontal: 18, paddingBottom: 14, gap: 8 },
  caption: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  creditButton: { minHeight: 44, justifyContent: 'center' }, disabled: { opacity: 0.35 },
});
