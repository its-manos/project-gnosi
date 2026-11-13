/** Public multiplayer snapshots never contain future questions or unrevealed solutions. */
export const PVP_TOPICS = [
  { id: "all", label: "Όλες οι κατηγορίες" },
  { id: "history", label: "Ιστορία" }, { id: "science", label: "Επιστήμη" },
  { id: "nature", label: "Φύση" }, { id: "technology", label: "Τεχνολογία" },
  { id: "culture", label: "Πολιτισμός" }, { id: "geography", label: "Γεωγραφία" },
  { id: "sports", label: "Αθλητισμός" }, { id: "everyday", label: "Καθημερινές γνώσεις" },
] as const;
export type PvpTopic = typeof PVP_TOPICS[number]["id"];
export type PvpSettings = { category: PvpTopic; count: 5 | 10; seconds: 15 | 30 };
export type PvpPlayer = {
  id: string; name: string; ready: boolean; connected: boolean; left: boolean;
  reconnectUntil?: string; score: number; answered: boolean; answer: number | null; selection?: number | null;
};
export type PvpQuestion = {
  id: string; version: string; prompt: string; categoryId: string; answers: string[];
  correctIndex?: number; explanation?: string;
  sources?: { title: string; url: string; publisher?: string }[];
};
export type PvpRoom = {
  id: string; code: string; matchId: string; hostId: string;
  status: "lobby" | "question" | "reveal" | "finished" | "closed";
  settingsVersion?: number; category: PvpTopic; count: number; seconds: number; index: number;
  serverNow: string; startsAt: string | null; deadline: string | null;
  revealUntil: string | null; endedEarly: boolean;
  question: PvpQuestion | null; players: PvpPlayer[];
};

export type PvpReview = {
  matchId: string; endedEarly: boolean; finishedAt: string;
  items: { question: PvpQuestion; answer: number | null; correct: boolean }[];
};

export function normalizeRoomCode(value: string): string {
  return value.trim().replace(/\s/g, "").toUpperCase();
}
export function validRoomCode(value: string): boolean {
  return /^[A-F0-9]{6}$/.test(normalizeRoomCode(value));
}
export function pvpStandings(players: readonly PvpPlayer[]) {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "el") || a.id.localeCompare(b.id));
  return ordered.map(player => ({ ...player, rank: 1 + players.filter(other => other.score > player.score).length }));
}
/** Offset is estimated at the request midpoint; only the server accepts/ends rounds. */
export function pvpClockOffset(serverNow: string, sentAt: number, receivedAt: number) {
  return Date.parse(serverNow) - (sentAt + receivedAt) / 2;
}
export function pvpSecondsLeft(until: string | null, now: number, offset: number) {
  return until ? Math.max(0, Math.ceil((Date.parse(until) - now - offset) / 1000)) : 0;
}
export function pvpErrorMessage(error: { message?: string; code?: string } | unknown): string {
  const value = error as { message?: string; code?: string } | null;
  const messages: Record<string, string> = {
    pvp_auth_required: "Συνδέσου στον λογαριασμό σου για να παίξεις με φίλους.",
    pvp_invalid_name: "Γράψε ένα όνομα με 1–24 χαρακτήρες.",
    pvp_invalid_settings: "Επίλεξε έγκυρες ρυθμίσεις παιχνιδιού.",
    pvp_not_found: "Δεν βρέθηκε ενεργό δωμάτιο με αυτόν τον κωδικό.",
    pvp_room_full: "Το δωμάτιο έχει ήδη 4 παίκτες.",
    pvp_already_started: "Το παιχνίδι έχει ξεκινήσει. Μπες στον επόμενο γύρο.",
    pvp_not_member: "Δεν βρίσκεσαι πλέον σε αυτό το δωμάτιο.",
    pvp_host_only: "Αυτή η ενέργεια είναι διαθέσιμη μόνο στον οικοδεσπότη.",
    pvp_stale_settings: "Οι ρυθμίσεις άλλαξαν. Πάτησε ανανέωση και δήλωσε ξανά έτοιμος.",
    pvp_review_unavailable: "Η ανασκόπηση δεν είναι διαθέσιμη ή το δωμάτιο έχει λήξει.",
    pvp_not_ready: "Χρειάζονται τουλάχιστον 2 παίκτες και όλοι να είναι έτοιμοι.",
    pvp_stale_round: "Η ερώτηση έχει αλλάξει. Ανανεώνουμε το παιχνίδι…",
    pvp_invalid_answer: "Αυτή η απάντηση δεν είναι έγκυρη.",
    pvp_already_in_room: "Έχεις ήδη ενεργό δωμάτιο. Πάτησε ανανέωση για να επιστρέψεις.",
    pvp_rate_limit: "Έγιναν πολλές προσπάθειες. Περίμενε ένα λεπτό και δοκίμασε ξανά.",
  };
  if (value?.code === "PGRST202" || value?.code === "42883") return "Το παιχνίδι με φίλους δεν είναι ακόμη διαθέσιμο. Δοκίμασε αργότερα.";
  return messages[value?.message ?? ""] ?? "Δεν έγινε σύνδεση με το παιχνίδι. Έλεγξε το διαδίκτυο και δοκίμασε ξανά.";
}
