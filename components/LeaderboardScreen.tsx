"use client";

import { useEffect, useState } from "react";

import Starfield from "./Starfield";

import {
  getModelName,
  MODELS,
  type LLM,
} from "@/lib/gameLevels";

import {
  getScores,
  topScores,
  type ScoreEntry,
} from "@/lib/leaderboard";

type LeaderboardScreenProps = {
  // Tab to open first (the model just played)
  initialModel?: LLM | null;
  // Entry to highlight (the score just saved)
  highlightId?: string | null;
  onBack: () => void;
  onMainMenu: () => void;
};

/*
 * Full class strings so Tailwind can see them.
 * Colors match the model select cards.
 */
const MODEL_STYLES: Record<
  LLM,
  { text: string; tab: string; badge: string }
> = {
  chatgpt: {
    text: "text-emerald-300",
    tab: "border-emerald-400 bg-emerald-500/20 text-emerald-300",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  gemini: {
    text: "text-blue-300",
    tab: "border-blue-400 bg-blue-500/20 text-blue-300",
    badge: "bg-blue-500/20 text-blue-300",
  },
  claude: {
    text: "text-orange-300",
    tab: "border-orange-400 bg-orange-500/20 text-orange-300",
    badge: "bg-orange-500/20 text-orange-300",
  },
};

// Gold, silver, bronze
const RANK_COLORS = [
  "text-yellow-300",
  "text-slate-200",
  "text-orange-400",
];

const PLACE_LABELS = ["1ST", "2ND", "3RD"];

export default function LeaderboardScreen({
  initialModel,
  highlightId,
  onBack,
  onMainMenu,
}: LeaderboardScreenProps) {
  const [entries, setEntries] =
    useState<ScoreEntry[] | null>(null);

  const [activeModel, setActiveModel] =
    useState<LLM>(
      initialModel ?? "chatgpt"
    );

  useEffect(() => {
    getScores().then(setEntries);
  }, []);

  const overall = entries
    ? topScores(entries, 10)
    : [];

  const modelTop = entries
    ? topScores(entries, 3, activeModel)
    : [];

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#050816] px-4 py-5 text-white sm:px-6">

      <Starfield />

      <div className="relative z-10 mx-auto w-full max-w-5xl">

        {/* Heading */}
        <header className="mb-5 text-center">
          <p className="text-sm font-bold tracking-[0.4em] text-cyan-300">
            TOKEN BLAST
          </p>

          <h1 className="mt-1 text-4xl font-black text-yellow-300 md:text-5xl">
            LEADERBOARD
          </h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">

          {/* Overall top 10 */}
          <section className="rounded-2xl border-2 border-cyan-500/40 bg-slate-900/90 p-5 sm:p-6">

            <h2 className="mb-4 text-center text-sm font-black tracking-[0.3em] text-cyan-300">
              TOP 10 PILOTS
            </h2>

            <div className="grid grid-cols-[3rem_1fr_auto] gap-x-3 border-b border-slate-700 pb-2 text-xs font-bold tracking-widest text-slate-400 sm:grid-cols-[3rem_5rem_1fr_auto]">
              <span>RANK</span>
              <span>PILOT</span>
              <span className="hidden sm:block">MODEL</span>
              <span className="text-right">SCORE</span>
            </div>

            <ol>
              {Array.from({ length: 10 }, (_, index) => {
                const entry = overall[index];

                const highlighted =
                  entry && entry.id === highlightId;

                return (
                  <li
                    key={entry?.id ?? `empty-${index}`}
                    className={`grid grid-cols-[3rem_1fr_auto] items-center gap-x-3 rounded-lg px-1 py-1.5 sm:grid-cols-[3rem_5rem_1fr_auto] ${
                      highlighted
                        ? "bg-yellow-300/15 ring-2 ring-yellow-300"
                        : ""
                    }`}
                  >
                    <span
                      className={`font-mono font-black ${
                        RANK_COLORS[index] ?? "text-slate-400"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {entry ? (
                      <>
                        <span className="font-mono text-xl font-black tracking-[0.2em]">
                          {entry.initials}
                        </span>

                        <span className="hidden sm:block">
                          <span
                            className={`rounded-md px-2 py-1 text-xs font-bold ${
                              MODEL_STYLES[entry.model].badge
                            }`}
                          >
                            {getModelName(entry.model)}
                          </span>
                        </span>

                        <span className="text-right font-mono text-xl font-black text-yellow-300">
                          {entry.score}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-xl text-slate-600">
                          ---
                        </span>

                        <span className="hidden sm:block" />

                        <span className="text-right font-mono text-xl text-slate-600">
                          ---
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>

            {entries && entries.length === 0 && (
              <p className="mt-4 text-center text-sm text-slate-400">
                No scores yet. Be the first pilot on the board!
              </p>
            )}

          </section>

          <div className="flex flex-col gap-6">

            {/* Top 3 per model */}
            <section className="rounded-2xl border-2 border-cyan-500/40 bg-slate-900/90 p-5 sm:p-6">

              <h2 className="mb-4 text-center text-sm font-black tracking-[0.3em] text-cyan-300">
                TOP 3 BY MODEL
              </h2>

              <div
                role="tablist"
                aria-label="AI model"
                className="grid grid-cols-3 gap-2"
              >
                {MODELS.map((model) => {
                  const active =
                    model === activeModel;

                  return (
                    <button
                      key={model}
                      type="button"
                      role="tab"
                      id={`tab-${model}`}
                      aria-selected={active}
                      aria-controls="model-panel"
                      onClick={() =>
                        setActiveModel(model)
                      }
                      className={`rounded-lg border-2 px-2 py-2 text-sm font-black transition ${
                        active
                          ? MODEL_STYLES[model].tab
                          : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                      }`}
                    >
                      {getModelName(model)}
                    </button>
                  );
                })}
              </div>

              <ol
                id="model-panel"
                role="tabpanel"
                aria-labelledby={`tab-${activeModel}`}
                className="mt-5 space-y-3"
              >
                {PLACE_LABELS.map((place, index) => {
                  const entry = modelTop[index];

                  const highlighted =
                    entry && entry.id === highlightId;

                  return (
                    <li
                      key={place}
                      className={`flex items-center gap-4 rounded-xl bg-slate-950/70 px-4 py-3 ${
                        highlighted
                          ? "ring-2 ring-yellow-300"
                          : ""
                      }`}
                    >
                      <span
                        className={`w-10 font-mono text-sm font-black ${RANK_COLORS[index]}`}
                      >
                        {place}
                      </span>

                      <span
                        className={`flex-1 font-mono text-2xl font-black tracking-[0.2em] ${
                          entry
                            ? MODEL_STYLES[activeModel].text
                            : "text-slate-600"
                        }`}
                      >
                        {entry?.initials ?? "---"}
                      </span>

                      <span
                        className={`font-mono text-2xl font-black ${
                          entry
                            ? "text-yellow-300"
                            : "text-slate-600"
                        }`}
                      >
                        {entry?.score ?? "---"}
                      </span>
                    </li>
                  );
                })}
              </ol>

            </section>

            <div className="flex flex-wrap justify-center gap-4">

              <button
                type="button"
                onClick={onBack}
                className="rounded-lg bg-slate-700 px-8 py-3 font-bold hover:bg-slate-600"
              >
                ← BACK
              </button>

              <button
                type="button"
                onClick={onMainMenu}
                className="rounded-lg bg-slate-700 px-8 py-3 font-bold hover:bg-slate-600"
              >
                MAIN MENU
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
