import type { LLM } from "./gameLevels";

/*
 * Each model's UI colors, shared by the planet screen and the
 * leaderboard. Planet looks live in globals.css (.planet-*).
 * Full class strings so Tailwind can see them.
 *
 * - text: name/initials color
 * - focus: keyboard focus outline
 * - activeTab: border + background of a selected leaderboard tab
 * - badgeBg: background of the small model badge
 */
export const MODEL_STYLES: Record<
  LLM,
  {
    text: string;
    focus: string;
    activeTab: string;
    badgeBg: string;
  }
> = {
  chatgpt: {
    text: "text-emerald-300",
    focus: "focus-visible:outline-emerald-300",
    activeTab: "border-emerald-400 bg-emerald-500/20",
    badgeBg: "bg-emerald-500/20",
  },
  gemma: {
    // Google red
    text: "text-[#ea4335]",
    focus: "focus-visible:outline-[#ea4335]",
    activeTab: "border-[#ea4335] bg-[#ea4335]/15",
    badgeBg: "bg-[#ea4335]/15",
  },
  llama: {
    // Facebook's dark-mode blue (readable on the dark background)
    text: "text-[#2d88ff]",
    focus: "focus-visible:outline-[#2d88ff]",
    activeTab: "border-[#2d88ff] bg-[#1877f2]/20",
    badgeBg: "bg-[#1877f2]/20",
  },
};
