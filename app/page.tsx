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

  function chooseLLM(model: LLM) {
    setSelectedLLM(model);
    setScreen("demo");
  }

  return (
    <>
      {/* TITLE */}
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

      {/* DEMO */}
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
      {screen === "game" && (
        <GameScreen
          onBack={() =>
            setScreen("model-select")
          }
        />
      )}
    </>
  );
}