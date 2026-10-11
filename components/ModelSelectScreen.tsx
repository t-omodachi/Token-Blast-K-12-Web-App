import Starfield from "./Starfield";

type LLM = "chatgpt" | "gemini" | "claude";

type ModelSelectScreenProps = {
  onSelect: (model: LLM) => void;
  onBack: () => void;
};

/*
 * Each AI is drawn as its own planet.
 * Planet looks live in globals.css (.planet-*).
 * Full class strings so Tailwind can see them.
 */
const PLANETS: {
  model: LLM;
  name: string;
  description: string;
  text: string;
  focus: string;
  ring?: boolean;
  moon?: boolean;
}[] = [
  {
    model: "chatgpt",
    name: "ChatGPT",
    description:
      "Explore how the tokenizer associated with the ChatGPT version used by the game breaks words into pieces.",
    text: "text-emerald-300",
    focus: "focus-visible:outline-emerald-300",
    moon: true,
  },
  {
    model: "gemini",
    name: "Gemini",
    description:
      "See how the Gemini tokenizer used by the game divides the same kinds of words into tokens.",
    text: "text-blue-300",
    focus: "focus-visible:outline-blue-300",
    ring: true,
  },
  {
    model: "claude",
    name: "Claude",
    description:
      "Compare how the Claude tokenizer represented by the game divides words into useful pieces.",
    text: "text-orange-300",
    focus: "focus-visible:outline-orange-300",
    moon: true,
  },
];

export default function ModelSelectScreen({
  onSelect,
  onBack,
}: ModelSelectScreenProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-6 py-6 text-white">

      <Starfield />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col items-center justify-center">

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
              className={`group flex flex-col items-center rounded-3xl p-2 text-center focus-visible:outline-4 ${planet.focus}`}
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

              <h2 className={`text-3xl font-black ${planet.text}`}>
                {planet.name}
              </h2>

              <p className="mt-2 max-w-sm text-sm text-slate-300">
                {planet.description}
              </p>

              <p
                className={`mt-3 font-bold tracking-widest opacity-70 transition group-hover:opacity-100 group-focus-visible:opacity-100 ${planet.text}`}
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
    </main>
  );
}
