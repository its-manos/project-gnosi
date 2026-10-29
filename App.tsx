
import { StatusBar } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import AppNavigator from "./src/navigation/AppNavigator";
import { colors } from "./src/theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
        edges={["top", "right", "bottom", "left"]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />

        <AppNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
