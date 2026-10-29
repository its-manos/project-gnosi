export type ChallengeDifficulty = "easy" | "medium" | "hard";

export type DailyChallengePreferences = {
  topicIds: string[];
  difficulty: ChallengeDifficulty;
};

export type DailyChallengeTopic = {
  id: string;
  title: string;
  emoji: string;
  description: string;
};

export const DAILY_CHALLENGE_TOPICS: DailyChallengeTopic[] = [
  { id: "history", title: "Ιστορία", emoji: "🏛️", description: "Πολιτισμοί, γεγονότα και πρόσωπα" },
  { id: "science", title: "Επιστήμη", emoji: "🔬", description: "Διάστημα, φυσική και ανακαλύψεις" },
  { id: "geography", title: "Γεωγραφία", emoji: "🌍", description: "Χώρες, τόποι και φυσικά χαρακτηριστικά" },
  { id: "technology", title: "Τεχνολογία", emoji: "💡", description: "Υπολογιστές, διαδίκτυο και εφευρέσεις" },
  { id: "culture", title: "Πολιτισμός", emoji: "🎨", description: "Τέχνη, λογοτεχνία και μουσική" },
  { id: "nature", title: "Φύση", emoji: "🌿", description: "Ζώα, φυτά και οικοσυστήματα" },
  { id: "sports", title: "Αθλητισμός", emoji: "🏅", description: "Αθλήματα, κανόνες και διοργανώσεις" },
  { id: "everyday", title: "Καθημερινές γνώσεις", emoji: "🧠", description: "Πρακτικά στοιχεία και μικρές απορίες" },
];

export const CHALLENGE_DIFFICULTIES: { id: ChallengeDifficulty; title: string; description: string }[] = [
  { id: "easy", title: "Εύκολο", description: "Για μια χαλαρή καθημερινή πρόκληση" },
  { id: "medium", title: "Μεσαίο", description: "Λίγη σκέψη και γενικές γνώσεις" },
  { id: "hard", title: "Δύσκολο", description: "Για όσους θέλουν μεγαλύτερη πρόκληση" },
];

export const DEFAULT_DAILY_CHALLENGE_PREFERENCES: DailyChallengePreferences = {
  topicIds: ["history", "science", "geography", "nature", "culture"],
  difficulty: "medium",
};

const TOPIC_IDS = new Set(DAILY_CHALLENGE_TOPICS.map((topic) => topic.id));
const DIFFICULTIES = new Set<ChallengeDifficulty>(["easy", "medium", "hard"]);

export function normalizeDailyChallengePreferences(
  value: unknown,
): DailyChallengePreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...DEFAULT_DAILY_CHALLENGE_PREFERENCES, topicIds: [...DEFAULT_DAILY_CHALLENGE_PREFERENCES.topicIds] };
  }

  const candidate = value as Record<string, unknown>;
  const rawTopicIds = Array.isArray(candidate.topicIds) ? candidate.topicIds : [];
  const topicIds = [...new Set(rawTopicIds.filter(
    (topicId): topicId is string => typeof topicId === "string" && TOPIC_IDS.has(topicId),
  ))];
  const difficulty = typeof candidate.difficulty === "string" && DIFFICULTIES.has(candidate.difficulty as ChallengeDifficulty)
    ? candidate.difficulty as ChallengeDifficulty
    : DEFAULT_DAILY_CHALLENGE_PREFERENCES.difficulty;

  if (topicIds.length < 3 || topicIds.length > 5) {
    return {
      topicIds: [...DEFAULT_DAILY_CHALLENGE_PREFERENCES.topicIds],
      difficulty,
    };
  }

  return { topicIds, difficulty };
}

export function parseDailyChallengePreferences(value: string | null): DailyChallengePreferences {
  if (!value) {
    return normalizeDailyChallengePreferences(DEFAULT_DAILY_CHALLENGE_PREFERENCES);
  }

  try {
    return normalizeDailyChallengePreferences(JSON.parse(value) as unknown);
  } catch {
    return normalizeDailyChallengePreferences(DEFAULT_DAILY_CHALLENGE_PREFERENCES);
  }
}
