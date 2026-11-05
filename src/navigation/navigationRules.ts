import type { AppScreen } from "../hooks/useLearningApp";

export type BackOrigins = {
  account: "home" | "progress" | "profile";
  profile: "home" | "progress";
  knowledge: "home" | "progress";
  lesson: AppScreen;
};

/** Resolve Android hardware Back destinations without changing the leave guard. */
export function backDestination(screen: AppScreen, origins: BackOrigins): AppScreen {
  switch (screen) {
    case "account": return origins.account;
    case "profile": return origins.profile;
    case "player-stats": return "profile";
    case "knowledge-review": return origins.knowledge;
    case "learning-insights":
    case "weekly-review": return "progress";
    case "lesson":
    case "results": return origins.lesson;
    case "quiz": return "lesson";
    case "subcategory": return "category";
    default: return "home";
  }
}

/** Quiz -> lesson is an internal transition, not an abandoned attempt. */
export function requiresLearningExitConfirmation(current: AppScreen, destination: AppScreen): boolean {
  return (current === "lesson" || current === "quiz") &&
    destination !== "lesson" && destination !== "quiz";
}
