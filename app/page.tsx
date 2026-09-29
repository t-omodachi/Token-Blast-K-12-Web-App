
"use client";

import { useState } from "react";

import TitleScreen from "@/components/TitleScreen";
import InstructionsScreen from "@/components/InstructionsScreen";
import GameScreen from "@/components/GameScreen";

type Screen = "title" | "instructions" | "game";

export default function Home() {

  const [screen, setScreen] = useState<Screen>("title");

  return (
    <>

      {/* TITLE SCREEN */}
      {screen === "title" && (
        <TitleScreen
          onPlay={() => setScreen("instructions")}
        />
      )}

      {/* INSTRUCTIONS SCREEN */}
      {screen === "instructions" && (
        <InstructionsScreen
          onBack={() => setScreen("title")}
          onStart={() => setScreen("game")}
        />
      )}

      {/* GAME SCREEN */}
      {screen === "game" && (
        <GameScreen
          onBack={() => setScreen("instructions")}
        />
      )}

    </>
  );
}
