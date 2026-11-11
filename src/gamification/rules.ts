/** Version 3. Never rewrite earned ledger entries when changing future rules. */
export const REWARD_RULES = Object.freeze({ lesson: 60, correct: { easy: 10, medium: 15, hard: 20 }, dailyCorrect: 5, daily: 20, review: 10, perfectDaily: 10, category: 25, comboStep: 2, comboCap: 6 });
export const GAME_REWARD_RULES = Object.freeze({ hangman: { reward: 10, dailyCap: 30 }, quick: { reward: 2, dailyCap: 20 } });
export function playerTitle(level: number): string {
  return level >= 15 ? "Σοφός" : level >= 10 ? "Ερευνητής" : level >= 5 ? "Εξερευνητής" : level >= 2 ? "Μαθητευόμενος" : "Αρχάριος";
}

/** Compatibility only: these values credit existing v1 activity once. */
export const LEGACY_REWARD_RULES = Object.freeze({ lesson: 40, lessonAccuracy: 40, daily: 20, dailyCorrect: 10, recall: 15, category: 25 });
