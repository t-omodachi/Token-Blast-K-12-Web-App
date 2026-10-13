import Starfield from "./Starfield";

import {
  getModelName,
  type LLM,
} from "@/lib/gameLevels";

import { MODEL_STYLES } from "@/lib/modelStyles";

type ModelSelectScreenProps = {
  onSelect: (model: LLM) => void;
  onBack: () => void;
};

/*
 * Each AI is drawn as its own planet.
 * Planet looks live in globals.css (.planet-*),
 * colors in lib/modelStyles.ts.
 */
const PLANETS: {
  model: LLM;
  description: string;
  ring?: boolean;
  moon?: boolean;
}[] = [
  {
    model: "chatgpt",
    description:
      "OpenAI's popular chatbot. See how ChatGPT's tokenizer breaks words into pieces.",
    moon: true,
  },
  {
    model: "gemma",
    description:
      "Google's open AI model. See how Gemma splits the same words into tokens.",
    ring: true,
  },
  {
    model: "llama",
    description:
      "Meta's open AI model. Compare how Llama divides words into pieces.",
    moon: true,
  },
];

export default function ModelSelectScreen({
  onSelect,
  onBack,
}: ModelSelectScreenProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-6 pb-12 pt-4 text-white">

      <Starfield />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center">

        {/* Heading */}
        <header className="mb-2 text-center">
          <p className="mb-2 text-sm font-bold tracking-[0.4em] text-cyan-400">
            TOKEN BLAST
          </p>

          <h1 className="text-4xl font-black tracking-wider text-yellow-300 md:text-5xl">
            CHOOSE YOUR AI
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-300">
            Different AI models can break words into tokens differently.
            Choose which model you want to explore.
          </p>
        </header>

        {/* Planets */}
        <section className="grid w-full gap-4 md:grid-cols-3">

          {PLANETS.map((planet) => (
            <button
              key={planet.model}
              type="button"
              onClick={() => onSelect(planet.model)}
              className={`group flex flex-col items-center rounded-3xl p-2 text-center focus-visible:outline-4 ${MODEL_STYLES[planet.model].focus}`}
            >
              <div
                aria-hidden="true"
                className={`planet-system planet-${planet.model}`}
              >
                {planet.ring && (
                  <div className="planet-ring planet-ring-back" />
                )}

                <div className="planet-body" />

                {planet.ring && (
                  <div className="planet-ring planet-ring-front" />
                )}

                {planet.moon && (
                  <div className="planet-orbit">
                    <div className="planet-moon" />
                  </div>
                )}
              </div>

              <h2 className={`text-3xl font-black ${MODEL_STYLES[planet.model].text}`}>
                {getModelName(planet.model)}
              </h2>

              <p className="mt-2 max-w-sm text-sm text-slate-300">
                {planet.description}
              </p>

              <p
                className={`mt-3 font-bold tracking-widest opacity-70 transition group-hover:opacity-100 group-focus-visible:opacity-100 ${MODEL_STYLES[planet.model].text}`}
              >
                LAND HERE →
              </p>
            </button>
          ))}

        </section>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-lg border border-slate-500 bg-slate-800 px-8 py-3 font-bold transition hover:bg-slate-700"
        >
          ← BACK
        </button>

      </div>

      {/* Trademark disclaimer: pinned to the bottom, small and quiet on purpose */}
      <p className="absolute inset-x-0 bottom-2 z-10 mx-auto max-w-2xl px-6 text-center text-[11px] leading-snug text-slate-500">
        Token Blast is a student project and is not affiliated with or
        endorsed by OpenAI, Google, or Meta. ChatGPT, Gemma, and Llama are
        trademarks of their respective owners. Token splits come from each
        model&apos;s public tokenizer.
      </p>
    </main>
  );
}
