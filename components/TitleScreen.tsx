
type TitleScreenProps = {
  onPlay: () => void;
};

export default function TitleScreen({ onPlay }: TitleScreenProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* Star background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white 98%, transparent),
            radial-gradient(2px 2px at 100px 80px, white 98%, transparent),
            radial-gradient(1px 1px at 170px 130px, white 98%, transparent),
            radial-gradient(2px 2px at 250px 200px, white 98%, transparent),
            radial-gradient(1px 1px at 300px 60px, white 98%, transparent),
            radial-gradient(2px 2px at 400px 150px, white 98%, transparent)
          `,
          backgroundSize: "450px 250px",
        }}
      />

      {/* Scrolling title */}
      <div className="crawl-container">

        <div className="crawl-text">

          <h1 className="crawl-title">
            TOKEN
            <br />
            BLAST
          </h1>
        </div>

      </div>

      {/* Stationary Play button */}
      <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-5">

        <button
          type="button"
          onClick={onPlay}
          className="rounded-xl border-4 border-green-300 bg-green-500 px-16 py-4 text-2xl font-black tracking-widest text-white shadow-[0_6px_0_#166534] transition-all hover:scale-105 hover:bg-green-400 active:translate-y-1"
        >
          PLAY
        </button>

        <p className="whitespace-nowrap text-sm tracking-widest text-slate-400">
          AIM • SHOOT • TOKENIZE
        </p>

      </div>

    </main>
  );
}