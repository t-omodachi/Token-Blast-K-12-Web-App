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
};

const developmentLevels: LevelData[] = [
  {
    id: 1,
    word: "PLAYING",
    correctTokens: ["play", "ing"],
    distractors: ["pla", "ying", "pl", "in"],
    explanation:
      "This is temporary development data. The final version will explain why the selected model tokenizes this word into these specific pieces.",
    verified: false,
  },

  {
    id: 2,
    word: "TEACHER",
    correctTokens: ["teach", "er"],
    distractors: ["tea", "cher", "te", "acher"],
    explanation:
      "This is temporary development data. The final explanation will use verified tokenizer information for the selected model.",
    verified: false,
  },

  {
    id: 3,
    word: "UNHAPPY",
    correctTokens: ["un", "happy"],
    distractors: ["unh", "appy", "hap", "py"],
    explanation:
      "This is temporary development data. The final explanation will describe why the selected tokenizer divides this word into these pieces.",
    verified: false,
  },
];

export function getLevelsForModel(
  model: LLM
): LevelData[] {
  return developmentLevels.map(
    (level) => ({
      ...level,
    })
  );
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