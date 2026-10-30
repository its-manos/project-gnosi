import { useSupabaseLifecycle } from "./src/hooks/useSupabaseLifecycle";
import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LearningSession from "./src/state/LearningSession";
import AppNavigator from "./src/navigation/AppNavigator";
import { colors } from "./src/theme";

export default function App() {
  useSupabaseLifecycle();
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LearningSession><AppNavigator /></LearningSession>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
