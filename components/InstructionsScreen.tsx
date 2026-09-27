
type InstructionsScreenProps = {
  onBack: () => void;
  onStart: () => void;
};

export default function InstructionsScreen({
  onBack,
  onStart,
}: InstructionsScreenProps) {

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b20] px-6 py-8 text-white">

      {/* Star background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white 98%, transparent),
            radial-gradient(2px 2px at 100px 80px, white 98%, transparent),
            radial-gradient(1px 1px at 170px 130px, white 98%, transparent),
            radial-gradient(2px 2px at 250px 200px, white 98%, transparent)
          `,
          backgroundSize: "350px 250px",
        }}
      />

      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-10 text-center">

          <p className="mb-3 text-sm font-bold tracking-[0.4em] text-cyan-400">
            TOKEN BLAST
          </p>

          <h1 className="text-4xl font-black tracking-wider text-yellow-300 md:text-6xl">
            MISSION BRIEFING
          </h1>

          <p className="mt-4 text-slate-300">
            Learn how to complete your tokenization mission!
          </p>

        </header>

        {/* Astronaut and instructions */}
        <section className="mb-10 grid items-center gap-6 md:grid-cols-[180px_1fr]">

          {/* Astronaut */}
          <div className="flex justify-center">

            <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-cyan-400 bg-slate-800 shadow-[0_0_35px_rgba(34,211,238,0.3)]">

              <span className="text-7xl">
                👨‍🚀
              </span>

            </div>

          </div>

          {/* Speech bubble */}
          <div className="rounded-2xl border-4 border-cyan-400 bg-slate-100 p-6 text-slate-900 shadow-lg">

            <h2 className="mb-3 text-2xl font-black">
              Welcome, Space Ranger!
            </h2>

            <p className="mb-4 text-lg">
              AI breaks words into smaller pieces called
              tokens to understand them like we do!
            </p>

            <p className="mb-4 text-lg">
              Your mission is to shoot the correct token
              fragments in order to help out our AI.
            </p>

            <p className="text-lg font-bold text-red-700">
              Watch out for incorrect fragments!
            </p>

          </div>

        </section>

        {/* Example demonstration */}
        <section className="rounded-2xl border-2 border-slate-600 bg-slate-900/90 p-6 shadow-xl">

          <h2 className="mb-6 text-center text-2xl font-black tracking-widest text-yellow-300">
            HOW IT WORKS
          </h2>

          {/* Target word */}
          <div className="mb-8 text-center">

            <p className="mb-2 text-sm tracking-widest text-slate-400">
              TARGET WORD
            </p>

            <h3 className="text-4xl font-black text-cyan-400">
              PLAYING
            </h3>

          </div>

          {/* Example asteroids */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6">

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-500 to-slate-800 text-xl font-bold shadow-lg">
              play
            </div>

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-500 to-slate-800 text-xl font-bold shadow-lg">
              ing
            </div>

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-500 to-slate-800 text-xl font-bold shadow-lg">
              pla
            </div>

          </div>

          {/* Token sequence example */}
          <div className="text-center">

            <p className="mb-4 text-slate-300">
              Shoot the correct fragments in order!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">

              <span className="rounded-lg bg-green-600 px-5 py-3 text-xl font-bold">
                play
              </span>

              <span className="text-2xl">+</span>

              <span className="rounded-lg bg-green-600 px-5 py-3 text-xl font-bold">
                ing
              </span>

              <span className="text-2xl">=</span>

              <span className="text-2xl font-black text-yellow-300">
                playing
              </span>

            </div>

          </div>

        </section>

        {/* Navigation buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">

          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border-2 border-slate-400 bg-slate-700 px-8 py-4 text-lg font-black transition hover:bg-slate-600"
          >
            ← BACK
          </button>

          <button
            type="button"
            onClick={onStart}
            className="rounded-xl border-4 border-green-300 bg-green-500 px-10 py-4 text-xl font-black tracking-widest shadow-[0_6px_0_#166534] transition hover:scale-105 hover:bg-green-400"
          >
            START GAME →
          </button>

        </div>

      </div>

    </main>
  );
}
