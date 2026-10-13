import wordBank from "../data/wordBank.json";
import tokenData from "../data/tokens.json";

/*
 * The AI models in the game. Every split in tokens.json comes
 * from that model's real, public tokenizer:
 * - chatgpt: OpenAI o200k_base (GPT-4o and newer)
 * - gemma: Google Gemma 3
 * - llama: Meta Llama 4
 */
export type LLM =
  | "chatgpt"
  | "gemma"
  | "llama";

export const MODELS: LLM[] = [
  "chatgpt",
  "gemma",
  "llama",
];

export function isModel(value: unknown): value is LLM {
  return MODELS.includes(value as LLM);
}

export type LevelData = {
  id: number;
  word: string;
  correctTokens: string[];
  distractors: string[];
  explanation: string;
  verified: boolean;
  difficulty: number;
};

/*
 * One model's split of one word in tokens.json.
 * `verified` is false for a split that couldn't be checked
 * against the real tokenizer (none currently). `alternative`
 * is another plausible split, and `explanation` overrides the
 * generated one.
 */
type TokenEntry = {
  tokens: string[];
  verified: boolean;
  alternative?: string[];
  explanation?: string;
};

const tokens = tokenData as Record<
  string,
  Partial<Record<LLM, TokenEntry>>
>;

/*
 * Fisher-Yates shuffle (returns a new array).
 */
function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/*
 * Decoy fragments containing any of these are never shown.
 * Cutting words into pieces can produce offensive fragments
 * even from innocent words (e.g. "rac|coon"), so every decoy
 * is checked. A whole bank word is always allowed.
 */
const BLOCKED_FRAGMENTS = [
  "anal", "anus", "arse", "ass", "bastard", "bitch", "boob", "butt",
  "chink", "cock", "coon", "crap", "cum", "cunt", "damn", "dick",
  "dyke", "fag", "fuck", "fuk", "gook", "hell", "hoe", "homo", "jap",
  "jizz", "kike", "kill", "kys", "naked", "nazi", "nig", "nude",
  "penis", "pimp", "piss", "porn", "pussy", "rape", "sex", "shit",
  "slut", "spic", "tard", "tit", "tramp", "turd", "twat", "vagina",
  "wank", "whore",
];

function isAllowedDecoy(fragment: string, word: string) {
  return (
    fragment === word ||
    !BLOCKED_FRAGMENTS.some((blocked) =>
      fragment.includes(blocked)
    )
  );
}

/*
 * Wrong-answer asteroids: fragments of the word that start or
 * end where a real token starts or ends, so they look like they
 * could fit (e.g. "cat" + "s" for "cats", "unh" for "un + happy").
 * Never includes a correct token or a blocked fragment.
 */
function makeDistractors(
  word: string,
  correct: string[],
  count: number
) {
  const cuts = new Set([0]);

  let position = 0;

  for (const token of correct) {
    position += token.length;
    cuts.add(position);
  }

  // Single letters only make good decoys in short words ("cat" + "s")
  const minLength = word.length > 5 ? 2 : 1;

  const candidates = new Set<string>();

  for (let start = 0; start < word.length; start++) {
    for (let end = start + minLength; end <= word.length; end++) {
      if (cuts.has(start) || cuts.has(end)) {
        candidates.add(word.slice(start, end));
      }
    }
  }

  for (const token of correct) {
    candidates.delete(token);
  }

  const allowed = [...candidates].filter((fragment) =>
    isAllowedDecoy(fragment, word)
  );

  return shuffle(allowed).slice(0, count);
}

function describeSplit(split: string[], plural: boolean) {
  if (split.length === 1) {
    return plural ? "keep it whole" : "keeps it whole";
  }

  return `${plural ? "split" : "splits"} it as ${split.join(" + ")}`;
}

function sameSplit(a: string[], b: string[]) {
  return a.join("|") === b.join("|");
}

/*
 * Feedback text: what this model does, how the other models
 * compare, and any alternative guess.
 */
function makeExplanation(
  word: string,
  model: LLM,
  entry: TokenEntry
) {
  const name = getModelName(model);

  const lines: string[] = [];

  if (entry.explanation) {
    lines.push(entry.explanation);
  } else if (entry.tokens.length === 1) {
    lines.push(
      `${name} keeps "${word}" as one single token. Common words often get a token of their own instead of being split up.`
    );
  } else {
    lines.push(
      `${name} splits "${word}" into ${entry.tokens.length} tokens: ${entry.tokens.join(" + ")}.`
    );
  }

  const matching: string[] = [];

  // Other models with a different split, grouped by split
  // ("ChatGPT and Google Gemma split it as re + build.")
  const different = new Map<
    string,
    { names: string[]; split: string[] }
  >();

  for (const other of MODELS) {
    const otherEntry = tokens[word]?.[other];

    if (other === model || !otherEntry) continue;

    const otherName =
      getModelName(other) +
      (otherEntry.verified ? "" : " (best guess)");

    if (sameSplit(otherEntry.tokens, entry.tokens)) {
      matching.push(otherName);
      continue;
    }

    const key = otherEntry.tokens.join("|");
    const group = different.get(key) ?? {
      names: [],
      split: otherEntry.tokens,
    };

    group.names.push(otherName);
    different.set(key, group);
  }

  if (different.size > 0) {
    const comparisons = [...different.values()].map(
      ({ names, split }) =>
        `${names.join(" and ")} ${describeSplit(split, names.length > 1)}.`
    );

    lines.push(`Compare: ${comparisons.join(" ")}`);
  }

  const whole = entry.tokens.length === 1;

  if (matching.length === MODELS.length - 1) {
    lines.push(
      whole
        ? "All three AIs keep this word whole."
        : "All three AIs split this word the same way."
    );
  } else if (matching.length > 0) {
    lines.push(
      `${matching.join(" and ")} ${whole ? "keeps" : "splits"} it the same way.`
    );
  }

  if (entry.alternative) {
    lines.push(
      `Another possible split: ${entry.alternative.join(" + ")}.`
    );
  }

  return lines.join(" ");
}

export function getLevelsForModel(
  model: LLM
): LevelData[] {
  // Words from the word bank that have a split for this model
  const available = wordBank.filter(
    ({ word }) => tokens[word]?.[model]
  );

  const pick = (difficulty: number, count: number) =>
    shuffle(
      available.filter(
        (entry) => entry.difficulty === difficulty
      )
    ).slice(0, count);

  // 5-round campaign: level 1 easy, levels 2-3 medium, levels 4-5 hard
  const selected = [
    ...pick(1, 1),
    ...pick(2, 2),
    ...pick(3, 2),
  ];

  return selected.map(({ word, difficulty }, index) => {
    const entry = tokens[word][model]!;

    return {
      id: index + 1,
      word: word.toUpperCase(),
      correctTokens: entry.tokens,
      distractors: makeDistractors(
        word,
        entry.tokens,
        3 + difficulty
      ),
      explanation: makeExplanation(word, model, entry),
      verified: entry.verified,
      difficulty,
    };
  });
}

/*
 * Model name without the company, for tight spots
 * like the leaderboard tabs.
 */
export function getShortModelName(model: LLM) {
  return getModelName(model).replace(/^(Google|Meta) /, "");
}

export function getModelName(
  model: LLM
) {
  if (model === "chatgpt") {
    return "ChatGPT";
  }

  if (model === "gemma") {
    return "Google Gemma";
  }

  return "Meta Llama";
}