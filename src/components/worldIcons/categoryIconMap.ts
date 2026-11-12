/**
 * One visual identity per knowledge world, shared by Home and the Category header.
 * Bundled faceted artwork; card, route, and progress behavior live elsewhere.
 */
import {
  CultureWorldIcon,
  DifficultHistoryWorldIcon,
  GeographyWorldIcon,
  HistoryWorldIcon,
  NatureWorldIcon,
  ScienceWorldIcon,
  TechnologyWorldIcon,
  type WorldIconId,
} from "./CategoryArtworkIcons";

export const categoryWorldIcons: Record<WorldIconId, typeof HistoryWorldIcon> = {
  history: HistoryWorldIcon,
  science: ScienceWorldIcon,
  nature: NatureWorldIcon,
  technology: TechnologyWorldIcon,
  culture: CultureWorldIcon,
  geography: GeographyWorldIcon,
  "difficult-history": DifficultHistoryWorldIcon,
};

export function getCategoryWorldIcon(categoryId: string) {
  return Object.prototype.hasOwnProperty.call(categoryWorldIcons, categoryId)
    ? categoryWorldIcons[categoryId as WorldIconId]
    : undefined;
}
