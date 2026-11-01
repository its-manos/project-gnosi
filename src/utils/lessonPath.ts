import type { Lesson } from "../data/lessons";

// Stable editorial order. New lessons are appended until explicitly placed here.
export const lessonPaths: Record<string, readonly string[]> = {
  "ancient-greece": ["ancient-athens", "greek-world-not-a-country", "greek-history-through-evidence", "greek-chronology", "greek-geography-seas", "aegean-bronze-age", "minoan-crete", "mycenaean-palaces", "linear-b-decipherment", "palace-collapse", "geometric-greece", "rise-of-polis", "athens-who-voted", "antikythera-gears"],
  "world-history": ["world-introduction", "world-universe-earth", "world-life", "world-humans", "world-farming", "world-cities-writing", "world-bronze-networks", "world-empires", "pompeii-everyday-life", "world-beliefs", "silk-roads-ideas", "world-medieval-networks", "world-many-centres", "world-mongols-plague", "world-ocean-connections", "world-slavery-capital", "world-ideas-revolutions", "world-industry", "world-imperialism-resistance", "world-world-wars", "world-cold-war-decolonization", "world-connected-present"],
  "brain-perception": ["perception-eyes-not-cameras", "perception-blind-spot", "perception-color-context", "perception-depth-two-eyes", "perception-gestalt-whole", "perception-inattentional-blindness", "perception-expectations", "perception-multitasking", "perception-hidden-whole"],
  "geology-hidden-earth": ["geology-introduction", "geology-what-is-rock", "geology-rock-cycle", "geology-deep-time", "geology-fossil-evidence"],
  mythology: ["osiris-afterlife"],
  space: ["astronomy-introduction", "astronomy-sky-motion", "moon-phases-not-shadow", "astronomy-solar-system", "why-mars-is-red", "orbit-continuous-fall", "astronomy-light", "astronomy-stars", "astronomy-galaxies", "astronomy-expanding-universe", "astronomy-exoplanet-evidence"],
  "human-body": ["sleep-and-memory", "dna-cell-instructions"],
  physics: ["sound-to-brain", "blue-sky-red-sunset"],
  wildlife: ["octopus-intelligence", "migration-rest-stops"],
  oceans: ["life-at-hydrothermal-vents", "corals-are-animals", "whales-nutrient-pump"],
  ecosystems: ["flowers-hidden-couriers", "fungi-under-forest"],
  "artificial-intelligence": ["how-language-models-generate-text", "ai-bias-context"],
  internet: ["what-happens-when-you-open-a-website", "dns-address-book", "public-private-keys"],
  inventions: ["printing-before-gutenberg", "transistor-small-switch"],
  architecture: ["architecture-introduction", "architecture-reading-drawings", "architecture-space-light", "architecture-structure", "architecture-materials", "architecture-climate", "architecture-city", "architecture-reuse"],
  "visual-arts": ["impressionism-and-light", "lascaux-looking-back"],
  music: ["jazz-conversation", "blues-beyond-sadness"],
  cinema: ["editing-builds-meaning", "foley-invisible-performance"],
  countries: ["iceland-two-plates", "netherlands-room-for-water"],
  "unusual-places": ["dead-sea-changing-lake", "caves-water-carves"],
  societies: ["uruk-city-landscape", "city-boundaries-counting"],
  "genocide-memory": ["holocaust-evidence-exclusion"],
  "colonialism-slavery": ["atlantic-slavery-records", "congo-colonial-memory"],
  "power-exclusion": ["eugenics-scientific-authority", "dictatorship-censorship-greece"],
};

export function getSubcategoryPath(catalogue: readonly Lesson[], subcategoryId: string): Lesson[] {
  const order = lessonPaths[subcategoryId] ?? [];
  const rank = (id: string) => { const index = order.indexOf(id); return index < 0 ? order.length : index; };
  return catalogue.filter(l => l.subcategoryId === subcategoryId)
    .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

export function getLessonAccess(lesson: Lesson, catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[] = []) {
  const path = getSubcategoryPath(catalogue, lesson.subcategoryId);
  const index = path.findIndex(l => l.id === lesson.id);
  const prerequisite = index > 0 ? path[index - 1] : null;
  // Keep existing completions and unfinished attempts accessible. Bookmarks are
  // not progress. Unlocks derive from the same account-scoped backup.
  const unlocked = index >= 0 && (!prerequisite || completed.includes(prerequisite.id) || completed.includes(lesson.id) || inProgress.includes(lesson.id));
  return { unlocked, prerequisite, position: index + 1, total: path.length };
}

export function getNextPathLesson(current: Lesson, catalogue: readonly Lesson[], completed: readonly string[], inProgress: readonly string[] = []): Lesson | null {
  const path = getSubcategoryPath(catalogue, current.subcategoryId);
  const index = path.findIndex(l => l.id === current.id);
  if (index < 0) return null;
  const candidates = [...path.slice(index + 1), ...path.slice(0, index)];
  return candidates.find(l => !completed.includes(l.id) && getLessonAccess(l, catalogue, completed, inProgress).unlocked) ?? null;
}
