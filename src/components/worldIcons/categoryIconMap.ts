/**
 * One visual identity per knowledge world, shared by Home and Category header.
 * Purely decorative 32pt icons; card/route/progress behavior lives elsewhere.
 */
import HistoryWorldIcon from "./HistoryWorldIcon";
import {
  CultureWorldIcon, DifficultHistoryWorldIcon, GeographyWorldIcon,
  NatureWorldIcon, ScienceWorldIcon, TechnologyWorldIcon,
} from "./OtherWorldIcons";

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
