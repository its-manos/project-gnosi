export const TROPHY_RANKS = ['I', 'II', 'III', 'IV', 'V'] as const;
export type TrophyFamily = 'lessons' | 'worlds' | 'daily' | 'streak' | 'revision' | 'hangman';
export type Trophy = { id: string; family: TrophyFamily; title: string; description: string; current: number; target: number; tier: number; unlocked: boolean };
export type TrophyMetrics = Record<TrophyFamily, number>;
const families: { family: TrophyFamily; title: string; description: string; targets: number[] }[] = [
  { family: 'lessons', title: 'Ανακαλύψεις', description: 'Ολοκλήρωσε διαφορετικά μαθήματα', targets: [1, 5, 15, 30, 60] },
  { family: 'worlds', title: 'Ανοιχτοί ορίζοντες', description: 'Ολοκλήρωσε ένα μάθημα σε διαφορετικούς κόσμους', targets: [1, 3, 5] },
  { family: 'daily', title: 'Καθημερινή περιέργεια', description: 'Ολοκλήρωσε Daily Quiz σε διαφορετικές ημέρες', targets: [1, 7, 30, 100] },
  { family: 'streak', title: 'Σταθερά βήματα', description: 'Πέτυχε συνεχόμενες ημέρες Daily Quiz', targets: [3, 7, 14, 30] },
  { family: 'revision', title: 'Δεύτερη ματιά', description: 'Ολοκλήρωσε επανάληψη σε διαφορετικές ημέρες', targets: [1, 10, 25, 50] },
  { family: 'hangman', title: 'Λέξεις που κέρδισες', description: 'Κέρδισε Κρεμάλα με ανταμοιβή XP (έως 3 ανά ημέρα)', targets: [1, 10, 25, 50] },
];
export function playerTrophies(metrics: TrophyMetrics): Trophy[] {
  return families.flatMap(group => group.targets.map((target, index) => ({
    id: `${group.family}:${target}`, family: group.family, title: group.title,
    description: group.description, current: Math.max(0, metrics[group.family]), target,
    tier: index + 1, unlocked: metrics[group.family] >= target,
  })));
}
export function nextTrophy(trophies: readonly Trophy[]) {
  return trophies.filter(t => !t.unlocked).sort((a, b) =>
    b.current / b.target - a.current / a.target || a.target - b.target)[0];
}
export const PLAYER_CLASSES = [
  { id: 'novice', level: 1, title: 'Αρχάριος' },
  { id: 'apprentice', level: 2, title: 'Μαθητευόμενος' },
  { id: 'explorer', level: 5, title: 'Εξερευνητής' },
  { id: 'researcher', level: 10, title: 'Ερευνητής' },
  { id: 'sage', level: 15, title: 'Σοφός' },
] as const;
export function playerClass(level: number) {
  return [...PLAYER_CLASSES].reverse().find(item => level >= item.level) ?? PLAYER_CLASSES[0];
}
