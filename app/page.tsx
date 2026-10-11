"use client";

import { useState } from "react";

import TitleScreen from "@/components/TitleScreen";
import InstructionsScreen from "@/components/InstructionsScreen";
import ModelSelectScreen from "@/components/ModelSelectScreen";
import DemoScreen from "@/components/DemoScreen";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import type { ScoreEntry } from "@/lib/leaderboard";

type Screen =
  | "title"
  | "instructions"
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

  // Leaderboard entry for this run, once the player saves it
  const [savedEntry, setSavedEntry] =
    useState<ScoreEntry | null>(null);

  function chooseLLM(model: LLM) {
    setSelectedLLM(model);
    setScreen("demo");
  }

  function goToMainMenu() {
    setFinalScore(0);
    setSavedEntry(null);
    setSelectedLLM(null);
    setScreen("title");
  }

  return (
    <>
      {/* TITLE SCREEN */}
      {screen === "title" && (
        <TitleScreen
          onPlay={() =>
            setScreen("instructions")
          }
        />
      )}

      {/* MISSION BRIEFING */}
      {screen === "instructions" && (
        <InstructionsScreen
          onBack={() =>
            setScreen("title")
          }
          onStart={() =>
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
              setSavedEntry(null);
              setScreen("results");
            }}
          />
        )}

      {/* RESULTS SCREEN */}
      {screen === "results" &&
        selectedLLM && (
          <ResultsScreen
            score={finalScore}
            model={selectedLLM}
            savedEntry={savedEntry}
            onSaved={(entry) => {
              setSavedEntry(entry);
              setScreen("leaderboard");
            }}
            onViewLeaderboard={() =>
              setScreen("leaderboard")
            }
            onPlayAgain={() => {
              setFinalScore(0);
              setSavedEntry(null);
              setScreen("model-select");
            }}
            onMainMenu={goToMainMenu}
          />
        )}

      {/* LEADERBOARD */}
      {screen === "leaderboard" && (
        <LeaderboardScreen
          initialModel={selectedLLM}
          highlightId={savedEntry?.id}
          onBack={() =>
            setScreen("results")
          }
          onMainMenu={goToMainMenu}
        />
      )}
    </>
  );
}