type LLM = "chatgpt" | "gemini" | "claude";

type ModelSelectScreenProps = {
  onSelect: (model: LLM) => void;
  onBack: () => void;
};

export default function ModelSelectScreen({
  onSelect,
  onBack,
}: ModelSelectScreenProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-6 py-10 text-white">

      {/* Star background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white 98%, transparent),
            radial-gradient(1px 1px at 100px 80px, white 98%, transparent),
            radial-gradient(2px 2px at 170px 130px, white 98%, transparent),
            radial-gradient(1px 1px at 250px 200px, white 98%, transparent),
            radial-gradient(2px 2px at 340px 120px, white 98%, transparent)
          `,
          backgroundSize: "400px 250px",
        }}
      />

      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-6xl flex-col items-center justify-center">

        {/* Heading */}
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-bold tracking-[0.4em] text-cyan-400">
            TOKEN BLAST
          </p>

          <h1 className="text-4xl font-black tracking-wider text-yellow-300 md:text-6xl">
            CHOOSE YOUR AI
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Different AI models can break words into tokens differently.
            Choose which model you want to explore.
          </p>
        </header>

        {/* Model cards */}
        <section className="grid w-full gap-6 md:grid-cols-3">

          {/* ChatGPT */}
          <button
            type="button"
            onClick={() => onSelect("chatgpt")}
            className="
              group rounded-2xl border-2 border-emerald-400/50
              bg-slate-900/90 p-8 text-left
              transition-all duration-300
              hover:-translate-y-2
              hover:border-emerald-300
              hover:shadow-[0_0_35px_rgba(52,211,153,0.25)]
              focus-visible:outline-4
              focus-visible:outline-emerald-300
            "
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/20 text-4xl">
              AI
            </div>

            <h2 className="text-3xl font-black text-emerald-300">
              ChatGPT
            </h2>

            <p className="mt-4 text-slate-300">
              Explore how the tokenizer associated with the ChatGPT
              version used by the game breaks words into pieces.
            </p>

            <p className="mt-8 font-bold tracking-widest text-emerald-300">
              SELECT →
            </p>
          </button>

          {/* Gemini */}
          <button
            type="button"
            onClick={() => onSelect("gemini")}
            className="
              group rounded-2xl border-2 border-blue-400/50
              bg-slate-900/90 p-8 text-left
              transition-all duration-300
              hover:-translate-y-2
              hover:border-blue-300
              hover:shadow-[0_0_35px_rgba(96,165,250,0.25)]
              focus-visible:outline-4
              focus-visible:outline-blue-300
            "
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/20 text-4xl">
              ✦
            </div>

            <h2 className="text-3xl font-black text-blue-300">
              Gemini
            </h2>

            <p className="mt-4 text-slate-300">
              See how the Gemini tokenizer used by the game divides
              the same kinds of words into tokens.
            </p>

            <p className="mt-8 font-bold tracking-widest text-blue-300">
              SELECT →
            </p>
          </button>

          {/* Claude */}
          <button
            type="button"
            onClick={() => onSelect("claude")}
            className="
              group rounded-2xl border-2 border-orange-400/50
              bg-slate-900/90 p-8 text-left
              transition-all duration-300
              hover:-translate-y-2
              hover:border-orange-300
              hover:shadow-[0_0_35px_rgba(251,146,60,0.25)]
              focus-visible:outline-4
              focus-visible:outline-orange-300
            "
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/20 text-4xl">
              C
            </div>

            <h2 className="text-3xl font-black text-orange-300">
              Claude
            </h2>

            <p className="mt-4 text-slate-300">
              Compare how the Claude tokenizer represented by the game
              divides words into useful pieces.
            </p>

            <p className="mt-8 font-bold tracking-widest text-orange-300">
              SELECT →
            </p>
          </button>

        </section>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mt-10 rounded-lg border border-slate-500 bg-slate-800 px-8 py-3 font-bold transition hover:bg-slate-700"
        >
          ← BACK
        </button>

      </div>
    </main>
  );
}