"use client";

import { useState, type FormEvent } from "react";

import Starfield from "./Starfield";

import {
  getModelName,
  type LLM,
} from "@/lib/gameLevels";

import {
  cleanInitials,
  saveScore,
  type ScoreEntry,
} from "@/lib/leaderboard";

type ResultsScreenProps = {
  score: number;
  model: LLM;
  savedEntry: ScoreEntry | null;
  onSaved: (entry: ScoreEntry) => void;
  onViewLeaderboard: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
};

export default function ResultsScreen({
  score,
  model,
  savedEntry,
  onSaved,
  onViewLeaderboard,
  onPlayAgain,
  onMainMenu,
}: ResultsScreenProps) {
  const [initials, setInitials] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const canSave =
    initials.length === 3 && !saving;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canSave) return;

    setSaving(true);

    const entry = await saveScore(
      initials,
      score,
      model
    );

    onSaved(entry);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050816] p-6 text-center text-white">

      <Starfield />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">

        {/* Score on the left, initials on the right (stacked on narrow screens) */}
        <div className="grid w-full items-center gap-8 md:grid-cols-2">

          <div>
            <p className="text-sm font-bold tracking-[0.4em] text-cyan-300">
              MISSION COMPLETE
            </p>

            <h1 className="mt-3 text-5xl font-black text-yellow-300 md:text-6xl">
              FINAL SCORE
            </h1>

            <p className="mt-4 text-7xl font-black text-white">
              {score}
            </p>

            <p className="mt-4 text-lg text-slate-300">
              Model used:{" "}
              <span className="font-bold text-cyan-300">
                {getModelName(model)}
              </span>
            </p>
          </div>

          {/* Initials entry */}
          <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-cyan-500/40 bg-slate-900/90 p-6">

            {savedEntry ? (
              <p className="text-lg font-black tracking-widest text-green-400">
                SCORE SAVED AS{" "}
                <span className="font-mono text-yellow-300">
                  {savedEntry.initials}
                </span>
              </p>
            ) : (
              <form onSubmit={handleSubmit}>

                <label
                  htmlFor="initials"
                  className="text-xs font-bold tracking-[0.3em] text-slate-300"
                >
                  ENTER YOUR INITIALS
                </label>

                <input
                  id="initials"
                  value={initials}
                  onChange={(event) =>
                    setInitials(
                      cleanInitials(
                        event.target.value
                      )
                    )
                  }
                  maxLength={3}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="___"
                  aria-describedby="initials-hint"
                  className="mx-auto mt-3 block w-48 rounded-xl border-2 border-yellow-300/60 bg-slate-950 py-3 pl-[0.5em] text-center font-mono text-5xl font-black tracking-[0.5em] text-yellow-300 placeholder:text-slate-600 focus:border-yellow-300 focus:outline-none"
                />

                <p
                  id="initials-hint"
                  className="mt-2 text-xs text-slate-400"
                >
                  3 letters, like an arcade high score
                </p>

                <button
                  type="submit"
                  disabled={!canSave}
                  className="mt-4 rounded-xl bg-yellow-400 px-8 py-3 text-lg font-black tracking-wider text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? "SAVING..."
                    : "SAVE SCORE"}
                </button>

              </form>
            )}

          </div>

        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">

          <button
            type="button"
            onClick={onMainMenu}
            className="rounded-xl bg-slate-700 px-8 py-4 text-xl font-black hover:bg-slate-600"
          >
            MAIN MENU
          </button>

          <button
            type="button"
            onClick={onViewLeaderboard}
            className="rounded-xl bg-cyan-600 px-10 py-4 text-xl font-black hover:bg-cyan-500"
          >
            VIEW LEADERBOARD
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-xl bg-green-500 px-10 py-4 text-xl font-black hover:bg-green-400"
          >
            PLAY AGAIN
          </button>

        </div>

      </div>

    </main>
  );
}
