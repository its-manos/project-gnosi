/**
 * One visual identity per knowledge world, shared by Home and the Category header.
 * Lightweight bundled Style C artwork; card/route/progress behavior lives elsewhere.
 */
import {
  CultureWorldIcon, DifficultHistoryWorldIcon, GeographyWorldIcon,
  HistoryWorldIcon, NatureWorldIcon, ScienceWorldIcon, TechnologyWorldIcon,
} from "./CategoryArtworkIcons";

export const categoryWorldIcons: Record<string, typeof HistoryWorldIcon> = {
  history: HistoryWorldIcon,
  science: ScienceWorldIcon,
  nature: NatureWorldIcon,
  technology: TechnologyWorldIcon,
  culture: CultureWorldIcon,
  geography: GeographyWorldIcon,
  "difficult-history": DifficultHistoryWorldIcon,
};

export function getCategoryWorldIcon(categoryId: string) {
  return categoryWorldIcons[categoryId];
}
