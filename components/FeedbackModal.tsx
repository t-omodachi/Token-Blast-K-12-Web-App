type FeedbackModalProps = {
  success: boolean;
  modelName: string;
  word: string;
  correctTokens: string[];
  selectedTokens: string[];
  explanation: string;
  score: number;
  verified: boolean;
  levelNumber: number;
  totalLevels: number;
  onContinue: () => void;
};

export default function FeedbackModal({
  success,
  modelName,
  word,
  correctTokens,
  selectedTokens,
  explanation,
  score,
  verified,
  levelNumber,
  totalLevels,
  onContinue,
}: FeedbackModalProps) {
  const finalLevel =
    levelNumber === totalLevels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">

      <div className="w-full max-w-xl rounded-2xl border-2 border-cyan-400 bg-slate-950 p-5 text-center shadow-[0_0_50px_rgba(34,211,238,.25)] md:p-6">

        {/* Level */}
        <p className="text-xs font-bold tracking-[0.3em] text-cyan-300">
          LEVEL {levelNumber} OF {totalLevels}
        </p>

        {/* Result */}
        <h2
          className={`mt-2 text-3xl font-black ${
            success
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {success
            ? "MISSION COMPLETE!"
            : "MISSION FAILED"}
        </h2>

        {/* Model */}
        <p className="mt-3 text-xs tracking-widest text-slate-400">
          {modelName.toUpperCase()} TOKENIZATION
        </p>

        {/* Word */}
        <h3 className="mt-1 text-3xl font-black text-yellow-300">
          {word}
        </h3>

        {/* Correct answer */}
        <div className="mt-4 rounded-xl bg-slate-900 p-4">

          <p className="text-xs font-bold tracking-widest text-slate-400">
            CORRECT TOKEN SEQUENCE
          </p>

          <p className="mt-2 text-2xl font-black text-green-300">
            {correctTokens.join(" + ")}
          </p>

        </div>

        {/* Student answer */}
        {!success && (
          <div className="mt-3 rounded-xl bg-red-950/30 p-3">

            <p className="text-xs tracking-widest text-slate-400">
              YOUR SEQUENCE
            </p>

            <p className="mt-1 font-bold text-red-300">
              {selectedTokens.length
                ? selectedTokens.join(" + ")
                : "No complete sequence"}
            </p>

          </div>
        )}

        {/* Explanation */}
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-left">

          <p className="mb-2 font-black text-cyan-300">
            WHY?
          </p>

          <p className="text-sm leading-relaxed text-slate-200 md:text-base">
            {explanation}
          </p>

        </div>

        {/* Verification warning */}
        {!verified && (
          <p className="mt-3 text-xs text-orange-300">
            Best guess: we couldn&apos;t check this split against {modelName}&apos;s real tokenizer.
          </p>
        )}

        {/* Score */}
        <p className="mt-4 text-lg font-bold">
          Current Score:{" "}
          <span className="text-yellow-300">
            {score}
          </span>
        </p>

        {/* Continue */}
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 rounded-xl bg-green-500 px-10 py-3 text-lg font-black tracking-wider text-white transition hover:scale-105 hover:bg-green-400"
        >
          {finalLevel
            ? "VIEW RESULTS →"
            : "NEXT LEVEL →"}
        </button>

      </div>

    </div>
  );
}