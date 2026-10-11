import type { LLM } from "./gameLevels";

export type ScoreEntry = {
  id: string;
  initials: string;
  score: number;
  model: LLM;
  createdAt: number;
};

/*
 * Scores are stored in this browser's localStorage for now.
 * Every function is async so this module can be swapped for
 * a cloud database (e.g. Firestore) without changing the screens.
 */
const STORAGE_KEY = "token-blast-leaderboard";

// Cap storage; far more than the top 10 + top 3s we display.
const MAX_STORED = 500;

function readAll(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: ScoreEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage blocked or full; the score just won't persist.
  }
}

/*
 * Highest score first; ties go to whoever got there first.
 */
function byRank(a: ScoreEntry, b: ScoreEntry) {
  return b.score - a.score || a.createdAt - b.createdAt;
}

/*
 * Uppercase letters only, max 3.
 */
export function cleanInitials(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

export async function getScores(): Promise<ScoreEntry[]> {
  return readAll().sort(byRank);
}

export async function saveScore(
  initials: string,
  score: number,
  model: LLM
): Promise<ScoreEntry> {
  const entry: ScoreEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    initials: cleanInitials(initials),
    score,
    model,
    createdAt: Date.now(),
  };

  const entries = [...readAll(), entry]
    .sort(byRank)
    .slice(0, MAX_STORED);

  writeAll(entries);

  return entry;
}

/*
 * Wipes every saved score (researcher panel only).
 */
export async function clearScores() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked; nothing to clear
  }
}

/*
 * Top `count` entries, optionally for a single model.
 * Expects entries already sorted by getScores().
 */
export function topScores(
  entries: ScoreEntry[],
  count: number,
  model?: LLM
) {
  return entries
    .filter((entry) => !model || entry.model === model)
    .slice(0, count);
}
