import wordBank from "../data/wordBank.json";
import tokenData from "../data/tokens.json";

export type LLM =
  | "chatgpt"
  | "gemini"
  | "claude";

export const MODELS: LLM[] = [
  "chatgpt",
  "gemini",
  "claude",
];

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
 * `verified` is false for guessed splits (e.g. Claude, whose
 * tokenizer isn't public). `alternative` is another plausible
 * guess, and `explanation` overrides the generated one.
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
 * Wrong-answer asteroids: fragments of the word that start or
 * end where a real token starts or ends, so they look like they
 * could fit (e.g. "cat" + "s" for "cats", "unh" for "un + happy").
 * Never includes a correct token.
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

  return shuffle([...candidates]).slice(0, count);
}

function describeSplit(split: string[]) {
  return split.length === 1
    ? "keeps it whole"
    : `splits it as ${split.join(" + ")}`;
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

  const comparisons: string[] = [];
  const matching: string[] = [];

  for (const other of MODELS) {
    const otherEntry = tokens[word]?.[other];

    if (other === model || !otherEntry) continue;

    const otherName =
      getModelName(other) +
      (otherEntry.verified ? "" : " (best guess)");

    if (sameSplit(otherEntry.tokens, entry.tokens)) {
      matching.push(otherName);
    } else {
      comparisons.push(
        `${otherName} ${describeSplit(otherEntry.tokens)}.`
      );
    }
  }

  if (comparisons.length > 0) {
    lines.push(`Compare: ${comparisons.join(" ")}`);
  }

  if (matching.length > 0) {
    lines.push(
      `${matching.join(" and ")} ${
        matching.length === 1 ? "splits" : "split"
      } it the same way.`
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

  // 5-round campaign: two difficulty 1, two difficulty 2, one difficulty 3
  const selected = [
    ...pick(1, 2),
    ...pick(2, 2),
    ...pick(3, 1),
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

export function getModelName(
  model: LLM
) {
  if (model === "chatgpt") {
    return "ChatGPT";
  }

  if (model === "gemini") {
    return "Gemini";
  }

  return "Claude";
}