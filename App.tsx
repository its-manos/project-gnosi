import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppNavigator from "./src/navigation/AppNavigator";
import { colors } from "./src/theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />
        <AppNavigator />
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
