"use client";

import { useEffect, useState } from "react";

import TitleScreen from "@/components/TitleScreen";
import InstructionsScreen from "@/components/InstructionsScreen";
import ModelSelectScreen from "@/components/ModelSelectScreen";
import DemoScreen from "@/components/DemoScreen";
import GameScreen from "@/components/GameScreen";
import ResultsScreen from "@/components/ResultsScreen";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import ResearcherPanel from "@/components/ResearcherPanel";
import type { ScoreEntry } from "@/lib/leaderboard";
import {
  logEvent,
  startRun,
  startSession,
} from "@/lib/researchLog";

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

  // Research log: session start on page load
  useEffect(() => {
    startSession();
  }, []);

  // Change screens and log it (research timing)
  function go(next: Screen) {
    setScreen(next);
    logEvent("screen_view", { screen: next });
  }

  function chooseLLM(model: LLM) {
    setSelectedLLM(model);
    logEvent("model_selected", { model });
    go("demo");
  }

  function goToMainMenu() {
    setFinalScore(0);
    setSavedEntry(null);
    setSelectedLLM(null);
    go("title");
  }

  return (
    <>
      {/* TITLE SCREEN */}
      {screen === "title" && (
        <TitleScreen
          onPlay={() => {
            startRun("play");
            go("instructions");
          }}
        />
      )}

      {/* MISSION BRIEFING */}
      {screen === "instructions" && (
        <InstructionsScreen
          onBack={() =>
            go("title")
          }
          onStart={() =>
            go("model-select")
          }
        />
      )}

      {/* MODEL SELECTION */}
      {screen === "model-select" && (
        <ModelSelectScreen
          onSelect={chooseLLM}
          onBack={() =>
            go("title")
          }
        />
      )}

      {/* DEMO LEVEL */}
      {screen === "demo" &&
        selectedLLM && (
          <DemoScreen
            selectedLLM={selectedLLM}
            onComplete={() =>
              go("game")
            }
            onBack={() =>
              go("model-select")
            }
          />
        )}

      {/* REAL GAME */}
      {screen === "game" &&
        selectedLLM && (
          <GameScreen
            selectedLLM={selectedLLM}
            onBack={() =>
              go("model-select")
            }
            onGameComplete={(score) => {
              setFinalScore(score);
              setSavedEntry(null);
              go("results");
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
              // Initials are not logged (anonymous data)
              logEvent("score_saved", {
                model: selectedLLM,
                score: entry.score,
              });
              setSavedEntry(entry);
              go("leaderboard");
            }}
            onViewLeaderboard={() =>
              go("leaderboard")
            }
            onPlayAgain={() => {
              startRun("play_again");
              setFinalScore(0);
              setSavedEntry(null);
              go("model-select");
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
            go("results")
          }
          onMainMenu={goToMainMenu}
        />
      )}

      {/* Hidden researcher tools (Ctrl+Shift+L or #researcher) */}
      <ResearcherPanel />
    </>
  );
}