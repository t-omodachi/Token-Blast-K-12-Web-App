/*
 * Research interaction logger.
 *
 * Every event is saved in this browser's localStorage and can be
 * exported as CSV from the researcher panel (Ctrl+Shift+L, or add
 * #researcher to the URL).
 *
 * - participant_id: random anonymous ID, remembered on this laptop
 *   until a researcher clicks "New participant". No names/initials.
 * - run: increases each time the participant starts a new
 *   play-through (PLAY or PLAY AGAIN).
 * - session_id: one per page load, to spot refreshes.
 *
 * Each session is stored under its own key, so logging an event only
 * rewrites the current session (keeps the game smooth even after
 * many classes of data). Exports combine every session.
 *
 * Kept separate from the leaderboard (lib/leaderboard.ts):
 * clearing research data never touches leaderboard scores.
 */

const PARTICIPANT_KEY = "token-blast-participant";
const LOG_PREFIX = "token-blast-research-log:";

export type LogFields = {
  model?: string;
  level?: number;
  word?: string;
  difficulty?: number;
  correct_split?: string;
  result?: string;
  duration_ms?: number;
  time_in_level_ms?: number;
  score?: number;
  level_points?: number;
  tokens_correct?: number;
  tokens_wrong_order?: number;
  tokens_distractor?: number;
  concept_accuracy?: number;
  hints_used?: number;
  detail?: string;
};

export type LogEvent = LogFields & {
  timestamp: string;
  participant_id: string;
  session_id: string;
  run: number;
  event: string;
};

// CSV column order
const COLUMNS: (keyof LogEvent)[] = [
  "timestamp",
  "participant_id",
  "session_id",
  "run",
  "event",
  "model",
  "level",
  "word",
  "difficulty",
  "correct_split",
  "result",
  "duration_ms",
  "time_in_level_ms",
  "score",
  "level_points",
  "tokens_correct",
  "tokens_wrong_order",
  "tokens_distractor",
  "concept_accuracy",
  "hints_used",
  "detail",
];

type Participant = {
  id: string;
  runs: number;
};

// No 0/O or 1/I/L, so IDs are easy to read and write down
const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(length: number) {
  let code = "";

  for (let i = 0; i < length; i++) {
    code += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }

  return code;
}

let sessionId: string | null = null;
let runStartedAt: number | null = null;

// This page load's events. Always kept in memory, so they still
// make it into an export even if saving fails (storage full).
let sessionEvents: LogEvent[] = [];
let storageFailed = false;

function sessionKey() {
  return LOG_PREFIX + (sessionId ?? "");
}

// Storage keys of every saved session's log
function logKeys() {
  const keys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key?.startsWith(LOG_PREFIX)) keys.push(key);
    }
  } catch {
    // Storage unavailable
  }

  return keys;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function makeParticipant(): Participant {
  const participant = { id: `TB-${randomCode(5)}`, runs: 0 };

  writeJson(PARTICIPANT_KEY, participant);

  return participant;
}

function getParticipant(): Participant {
  const stored = readJson<Participant | null>(PARTICIPANT_KEY, null);

  return stored?.id ? stored : makeParticipant();
}

/*
 * Starts the session once per page load (safe to call repeatedly).
 * Also called automatically by the first logged event.
 */
export function startSession() {
  if (sessionId) return;

  sessionId = randomCode(6);

  logEvent("session_start", {
    detail: `viewport ${window.innerWidth}x${window.innerHeight}`,
  });
}

export function logEvent(event: string, fields: LogFields = {}) {
  if (typeof window === "undefined") return;

  if (!sessionId && event !== "session_start") {
    startSession();
  }

  const participant = getParticipant();

  const entry: LogEvent = {
    timestamp: new Date().toISOString(),
    participant_id: participant.id,
    session_id: sessionId ?? "",
    run: participant.runs,
    event,
    ...fields,
  };

  sessionEvents.push(entry);

  storageFailed = !writeJson(sessionKey(), sessionEvents);
}

/*
 * Call when the player starts a new play-through.
 */
export function startRun(trigger: string) {
  if (typeof window === "undefined") return;

  const participant = getParticipant();

  participant.runs += 1;

  writeJson(PARTICIPANT_KEY, participant);

  runStartedAt = Date.now();

  logEvent("run_start", { detail: trigger });
}

/*
 * Milliseconds since a Date.now() timestamp.
 */
export function msSince(start: number) {
  return Date.now() - start;
}

/*
 * Milliseconds since the current run started.
 */
export function msSinceRunStart() {
  return runStartedAt === null ? undefined : Date.now() - runStartedAt;
}

// Fired when the participant changes, so the on-screen ID updates
export const PARTICIPANT_CHANGE_EVENT = "token-blast-participant-change";

/*
 * Current participant ID (creates one on first use).
 * Shown faintly on screen so students can copy it onto surveys.
 */
export function getParticipantId() {
  return getParticipant().id;
}

export function newParticipant() {
  const participant = makeParticipant();

  runStartedAt = null;

  logEvent("participant_new");

  window.dispatchEvent(new Event(PARTICIPANT_CHANGE_EVENT));

  return participant.id;
}

/*
 * Every event on this laptop, oldest first.
 */
export function getAllEvents(): LogEvent[] {
  const saved = logKeys()
    .filter((key) => key !== sessionKey())
    .flatMap((key) => readJson<LogEvent[]>(key, []));

  return [...saved, ...sessionEvents].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
}

export function clearResearchData() {
  for (const key of logKeys()) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clear
    }
  }

  sessionEvents = [];
  storageFailed = false;
}

export function getLogStatus() {
  const participant = getParticipant();

  // localStorage stores text as UTF-16 (2 bytes per character)
  let bytes = 0;

  for (const key of logKeys()) {
    try {
      bytes += (localStorage.getItem(key) ?? "").length * 2;
    } catch {
      // Storage unavailable
    }
  }

  return {
    participantId: participant.id,
    runs: participant.runs,
    eventCount: getAllEvents().length,
    storageKb: Math.round(bytes / 1024),
    storageFailed,
  };
}

function csvCell(value: unknown) {
  if (value === undefined || value === null) return "";

  const text = String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(
  rows: Record<string, unknown>[],
  columns: readonly string[]
) {
  const lines = rows.map((row) =>
    columns.map((column) => csvCell(row[column])).join(",")
  );

  return [columns.join(","), ...lines].join("\r\n");
}

/*
 * Every logged event, one row each.
 */
export function eventsCsv() {
  return toCsv(getAllEvents(), COLUMNS);
}

// Columns for the one-row-per-level summary export
const LEVEL_SUMMARY_COLUMNS = [
  "timestamp",
  "participant_id",
  "session_id",
  "run",
  "model",
  "level",
  "word",
  "difficulty",
  "correct_split",
  "result",
  "time_in_level_ms",
  "level_points",
  "score",
  "tokens_correct",
  "tokens_wrong_order",
  "tokens_distractor",
  "concept_accuracy",
  "hints_used",
  "feedback_read_ms",
] as const;

/*
 * One row per level played: the level_end event plus how long
 * the feedback popup that followed it stayed open.
 */
export function levelSummaryCsv() {
  const events = getAllEvents();

  const rows = events.flatMap((event, index) => {
    if (event.event !== "level_end") return [];

    const feedback = events
      .slice(index + 1)
      .find(
        (later) =>
          later.event === "feedback_close" &&
          later.session_id === event.session_id &&
          later.run === event.run &&
          later.level === event.level
      );

    return [{ ...event, feedback_read_ms: feedback?.duration_ms }];
  });

  return toCsv(rows, LEVEL_SUMMARY_COLUMNS);
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel opens it as UTF-8 (the ♥ and × characters)
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
