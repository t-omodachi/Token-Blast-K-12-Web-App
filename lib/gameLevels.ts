export type LLM =
  | "chatgpt"
  | "gemini"
  | "claude";

export type LevelData = {
  id: number;
  word: string;
  correctTokens: string[];
  distractors: string[];
  explanation: string;
  verified: boolean;
  difficulty: number;
};

import tokenData from "../data/tokens.json";

export function getLevelsForModel(
  model: LLM
): LevelData[] {
  // Filter the JSON database for the selected model
  const modelTokens = tokenData.filter((t) => t.model === model);

  // Group by difficulty
  const diff1 = modelTokens.filter((t) => t.difficulty === 1);
  const diff2 = modelTokens.filter((t) => t.difficulty === 2);
  const diff3 = modelTokens.filter((t) => t.difficulty === 3);

  // Helper to pick N random items from an array
  const pickRandom = (arr: typeof diff1, n: number) => {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, Math.min(n, arr.length));
  };

  // Build the 5-round campaign: Two Level 1s, Two Level 2s, One Level 3
  const selectedLevels = [
    ...pickRandom(diff1, 2),
    ...pickRandom(diff2, 2),
    ...pickRandom(diff3, 1),
  ];

  // Map them into the expected LevelData structure
  return selectedLevels.map((level, index) => ({
    id: index + 1,
    word: level.word,
    correctTokens: level.correctTokens,
    distractors: level.distractors,
    explanation: level.explanation,
    verified: true,
    difficulty: level.difficulty,
  }));
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