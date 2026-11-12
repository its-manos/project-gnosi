import { StyleSheet, Text } from "react-native";
import { gameRewardXP, type RewardGame } from "../gamification/rewards";
import { GAME_REWARD_RULES } from "../gamification/rules";
import { useAthensDate } from "../hooks/useAthensDate";
import { useLearningDataSnapshot } from "../state/LearningSession";
import { colors } from "../theme";

export default function GameXpStatus({ game, earnedXP = 0 }: { game: RewardGame; earnedXP?: number }) {
  const { rewards } = useLearningDataSnapshot();
  const date = useAthensDate();
  const xp = gameRewardXP(rewards, game, date);
  const cap = GAME_REWARD_RULES[game].dailyCap;
  return <Text testID={`${game}-xp`} accessibilityLiveRegion="polite" style={styles.text}>
    {earnedXP > 0 ? `+${earnedXP} XP · ` : ""}
    {xp >= cap ? `Κέρδισες τα σημερινά XP ${game === "hangman" ? "της Κρεμάλας" : "του Γρήγορου Κουίζ"}.` : `${xp} / ${cap} XP σήμερα`}
  </Text>;
}

const styles = StyleSheet.create({ text: { color: colors.accentLight, fontSize: 12, lineHeight: 18, textAlign: "center" } });
