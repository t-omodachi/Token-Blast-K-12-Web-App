
"use client";

import { useState } from "react";

import TitleScreen from "@/components/TitleScreen";
import InstructionsScreen from "@/components/InstructionsScreen";

type Screen = "title" | "instructions" | "game";

export default function Home() {

  const [screen, setScreen] = useState<Screen>("title");

  return (
    <>

      {/* Title Screen */}
      {screen === "title" && (
        <TitleScreen
          onPlay={() => setScreen("instructions")}
        />
      )}

      {/* Instructions Screen */}
      {screen === "instructions" && (
        <InstructionsScreen
          onBack={() => setScreen("title")}
          onStart={() => setScreen("game")}
        />
      )}

      {/* Game Screen - Placeholder */}
      {screen === "game" && (

        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">

          <h1 className="text-5xl font-black text-cyan-400">
            TOKEN BLAST
          </h1>

          <h2 className="text-2xl text-yellow-300">
            GAME STARTED!
          </h2>

          <p className="text-slate-300">
            The gameplay screen is coming next.
          </p>

          <button
            onClick={() => setScreen("instructions")}
            className="rounded-lg bg-slate-700 px-8 py-3 font-bold hover:bg-slate-600"
          >
            BACK TO INSTRUCTIONS
          </button>

        </main>

      )}

    </>
  );
}
