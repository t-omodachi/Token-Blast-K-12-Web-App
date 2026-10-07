"use client";

import { useState } from "react";

import TitleScreen from "@/components/TitleScreen";
import ModelSelectScreen from "@/components/ModelSelectScreen";
import DemoScreen from "@/components/DemoScreen";
import GameScreen from "@/components/GameScreen";

type Screen =
  | "title"
  | "model-select"
  | "demo"
  | "game"
  | "results"
  | "leaderboard";

type LLM =
  | "chatgpt"
  | "gemini"
  | "claude";

export default function Home() {
  const [screen, setScreen] =
    useState<Screen>("title");

  const [selectedLLM, setSelectedLLM] =
    useState<LLM | null>(null);

  const [finalScore, setFinalScore] =
    useState(0);

  function chooseLLM(model: LLM) {
    setSelectedLLM(model);
    setScreen("demo");
  }

  return (
    <>
      {/* TITLE SCREEN */}
      {screen === "title" && (
        <TitleScreen
          onPlay={() =>
            setScreen("model-select")
          }
        />
      )}

      {/* MODEL SELECTION */}
      {screen === "model-select" && (
        <ModelSelectScreen
          onSelect={chooseLLM}
          onBack={() =>
            setScreen("title")
          }
        />
      )}

      {/* DEMO LEVEL */}
      {screen === "demo" &&
        selectedLLM && (
          <DemoScreen
            selectedLLM={selectedLLM}
            onComplete={() =>
              setScreen("game")
            }
            onBack={() =>
              setScreen("model-select")
            }
          />
        )}

      {/* REAL GAME */}
      {screen === "game" &&
        selectedLLM && (
          <GameScreen
            selectedLLM={selectedLLM}
            onBack={() =>
              setScreen("model-select")
            }
            onGameComplete={(score) => {
              setFinalScore(score);
              setScreen("results");
            }}
          />
        )}

      {/* RESULTS SCREEN */}
      {screen === "results" && (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#050816] p-6 text-center text-white">

          <p className="text-sm font-bold tracking-[0.4em] text-cyan-300">
            MISSION COMPLETE
          </p>

          <h1 className="mt-4 text-5xl font-black text-yellow-300 md:text-6xl">
            FINAL SCORE
          </h1>

          <p className="mt-6 text-7xl font-black text-white">
            {finalScore}
          </p>

          <p className="mt-5 text-lg text-slate-300">
            Model used:{" "}
            <span className="font-bold capitalize text-cyan-300">
              {selectedLLM}
            </span>
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">

            <button
              type="button"
              onClick={() =>
                setScreen("leaderboard")
              }
              className="rounded-xl bg-cyan-600 px-10 py-4 text-xl font-black hover:bg-cyan-500"
            >
              VIEW LEADERBOARD
            </button>

            <button
              type="button"
              onClick={() => {
                setFinalScore(0);
                setScreen("model-select");
              }}
              className="rounded-xl bg-green-500 px-10 py-4 text-xl font-black hover:bg-green-400"
            >
              PLAY AGAIN
            </button>

          </div>

          <button
            type="button"
            onClick={() => {
              setFinalScore(0);
              setSelectedLLM(null);
              setScreen("title");
            }}
            className="mt-6 rounded-lg bg-slate-700 px-8 py-3 font-bold hover:bg-slate-600"
          >
            MAIN MENU
          </button>

        </main>
      )}

      {/* TEMPORARY LEADERBOARD */}
      {screen === "leaderboard" && (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#050816] p-6 text-center text-white">

          <p className="text-sm font-bold tracking-[0.4em] text-cyan-300">
            TOKEN BLAST
          </p>

          <h1 className="mt-4 text-5xl font-black text-yellow-300">
            LEADERBOARD
          </h1>

          <p className="mt-6 text-slate-300">
            We’ll build the real leaderboard next.
          </p>

          <div className="mt-8 rounded-xl border border-cyan-500/40 bg-slate-900 px-12 py-6">

            <p className="text-sm text-slate-400">
              YOUR SCORE
            </p>

            <p className="mt-2 text-4xl font-black text-yellow-300">
              {finalScore}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setScreen("results")
            }
            className="mt-8 rounded-lg bg-slate-700 px-8 py-3 font-bold hover:bg-slate-600"
          >
            ← BACK
          </button>

        </main>
      )}
    </>
  );
}