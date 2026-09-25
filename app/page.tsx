
"use client";

import { useState } from "react";
import TitleScreen from "@/components/TitleScreen";

type Screen = "title" | "instructions";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("title");

  return (
    <>
      {screen === "title" && (
        <TitleScreen
          onPlay={() => setScreen("instructions")}
        />
      )}

      {screen === "instructions" && (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">

          <h1 className="text-4xl font-bold text-cyan-400">
            HOW TO PLAY
          </h1>

          <p className="max-w-md text-center text-lg">
            Shoot the correct token fragments in order
            to build the target word!
          </p>

          <button
            onClick={() => setScreen("title")}
            className="rounded-lg bg-green-500 px-8 py-3 font-bold hover:bg-green-400"
          >
            BACK
          </button>

        </main>
      )}
    </>
  );
}