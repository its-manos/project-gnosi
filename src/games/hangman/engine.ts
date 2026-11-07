import { hangmanWords, type HangmanWord } from "./words";

export const GREEK_ALPHABET = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ";
export const MAX_MISTAKES = 6;
export type HangmanGame = {
  word: HangmanWord;
  guesses: readonly string[];
  remaining: readonly HangmanWord[];
  round: number;
  wins: number;
};
export type HangmanStatus = "playing" | "won" | "lost";

// NFD handles tonos/dialytika. Uppercasing unifies σ and final ς.
export function normalizeGreek(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}
export function hangmanMistakes(game: HangmanGame): number {
  const word = normalizeGreek(game.word.word);
  return game.guesses.filter(letter => !word.includes(letter)).length;
}
export function hangmanStatus(game: HangmanGame): HangmanStatus {
  const letters = [...normalizeGreek(game.word.word)].filter(letter => GREEK_ALPHABET.includes(letter));
  if (letters.every(letter => game.guesses.includes(letter))) return "won";
  return hangmanMistakes(game) >= MAX_MISTAKES ? "lost" : "playing";
}
function shuffle(bank: readonly HangmanWord[], random: () => number): HangmanWord[] {
  const deck = [...bank];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function startHangman(random = Math.random): HangmanGame {
  const [word, ...remaining] = shuffle(hangmanWords, random);
  return { word, remaining, guesses: [], round: 1, wins: 0 };
}
export function guessHangman(game: HangmanGame, round: number, input: string): HangmanGame {
  const letter = normalizeGreek(input);
  if (round !== game.round || hangmanStatus(game) !== "playing" || letter.length !== 1 ||
    !GREEK_ALPHABET.includes(letter) || game.guesses.includes(letter)) return game;
  const next = { ...game, guesses: [...game.guesses, letter] };
  return hangmanStatus(next) === "won" ? { ...next, wins: game.wins + 1 } : next;
}
export function nextHangman(game: HangmanGame, round: number, random = Math.random): HangmanGame {
  if (round !== game.round || hangmanStatus(game) === "playing") return game;
  const deck = game.remaining.length ? [...game.remaining] : shuffle(hangmanWords, random);
  // Do not repeat the final word at the next deck's boundary.
  if (deck.length > 1 && deck[0].id === game.word.id) [deck[0], deck[1]] = [deck[1], deck[0]];
  const [word, ...remaining] = deck;
  return { word, remaining, guesses: [], round: game.round + 1, wins: game.wins };
}
