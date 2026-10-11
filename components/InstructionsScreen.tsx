"use client";

import { useEffect, useRef, useState } from "react";

import { logEvent, msSince } from "@/lib/researchLog";

type InstructionsScreenProps = {
  onBack: () => void;
  onStart: () => void;
};

/*
 * Crawl speed multipliers the player can pick.
 * 1 = the base 80s crawl set in globals.css (.briefing-crawl).
 */
const SPEED_OPTIONS = [0.5, 1, 2, 3];
const DEFAULT_SPEED = 1;

/*
 * Points shown in the briefing.
 * Keep in sync with the scoring in GameScreen.
 */
const SCORING = [
  { points: "+100", text: "each correct token, in order" },
  { points: "+250", text: "for rebuilding the whole word" },
  { points: "+5", text: "for every second left on the clock" },
  { points: "-50", text: "and 1 life for shooting a wrong piece or a right piece out of order" },
  { points: "-1 ♥", text: "for crashing your ship into an asteroid" },
];

/*
 * Star Wars-style scrolling mission briefing.
 * Crawl styles live in globals.css (.briefing-*).
 */
export default function InstructionsScreen({
  onBack,
  onStart,
}: InstructionsScreenProps) {
  // Finished crawling (or no animation for reduced-motion users)
  const [crawlDone, setCrawlDone] =
    useState(
      () =>
        typeof window !== "undefined" &&
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
    );

  const [speed, setSpeed] =
    useState(DEFAULT_SPEED);

  const crawlRef =
    useRef<HTMLDivElement>(null);

  // When the briefing appeared (research timing)
  const shownAt = useRef(0);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  function changeSpeed(option: number) {
    setSpeed(option);

    logEvent("briefing_speed", {
      detail: `${option}x`,
      duration_ms: msSince(shownAt.current),
    });
  }

  function leave(
    action: "start" | "back"
  ) {
    logEvent("briefing_end", {
      result:
        action === "back"
          ? "back"
          : crawlDone
            ? "finished"
            : "skipped",
      duration_ms: msSince(shownAt.current),
      detail: `speed ${speed}x`,
    });

    if (action === "back") {
      onBack();
    } else {
      onStart();
    }
  }

  /*
   * Apply the multiplier to the running CSS
   * animation; it keeps its place in the text.
   */
  useEffect(() => {
    crawlRef.current
      ?.getAnimations()
      .forEach((animation) =>
        animation.updatePlaybackRate(speed)
      );
  }, [speed]);

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

      {/* Scrolling briefing */}
      <div className="briefing-container">

        <div className="briefing-plane">

          <div
            ref={crawlRef}
            className="briefing-crawl"
            onAnimationEnd={() =>
              setCrawlDone(true)
            }
          >

            <p className="briefing-episode">
              MISSION BRIEFING
            </p>

            <h1 className="briefing-title">
              TOKEN BLAST
            </h1>

            <p>
              AI chatbots don&apos;t read words the way you do.
              Before an AI can understand a word, it chops it
              into smaller pieces called TOKENS.
            </p>

            <p>
              Some words stay whole. Others get split into
              pieces. Different AIs can split the same
              word in different ways!
            </p>

            <h2 className="briefing-heading">
              YOUR MISSION
            </h2>

            <p>
              Choose an AI and fly into its asteroid field.
              Each level gives you a TARGET WORD. Blast the
              asteroids holding that AI&apos;s tokens, IN ORDER,
              to rebuild the word.
            </p>

            <p>
              Fly with W A S D. Aim with your mouse.
              Click to fire. Each asteroid takes a few hits
              to break.
            </p>

            <h2 className="briefing-heading">
              SCORING
            </h2>

            <ul className="briefing-scoring">
              {SCORING.map((row) => (
                <li key={row.text}>
                  <span className="briefing-points">
                    {row.points}
                  </span>
                  {row.text}
                </li>
              ))}
            </ul>

            <p>
              You have 3 lives and 45 seconds for each word.
              Lose every life or run out of time and the
              mission fails.
            </p>

            <p>
              Rebuild all 5 words, put your initials on the
              leaderboard, and become the galaxy&apos;s top
              pilot.
            </p>

            <p className="briefing-signoff">
              Good luck!
            </p>

          </div>

        </div>

      </div>

      {/* Crawl speed (hidden once it's finished or for reduced motion) */}
      {!crawlDone && (
        <div
          role="group"
          aria-label="Scroll speed"
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2"
        >
          <span className="mr-1 text-xs font-bold tracking-widest text-slate-400">
            SPEED
          </span>

          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={speed === option}
              onClick={() => changeSpeed(option)}
              className={`rounded-md px-3 py-1 text-sm font-black transition ${
                speed === option
                  ? "bg-yellow-300 text-slate-950"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {option}×
            </button>
          ))}
        </div>
      )}

      {/* Stationary buttons */}
      <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">

        <button
          type="button"
          onClick={() => leave("back")}
          className="whitespace-nowrap rounded-xl border-2 border-slate-400 bg-slate-800/90 px-5 py-3 text-lg font-black transition hover:bg-slate-700 sm:px-6"
        >
          ← BACK
        </button>

        <button
          type="button"
          onClick={() => leave("start")}
          className="whitespace-nowrap rounded-xl border-4 border-green-300 bg-green-500 px-6 py-3 sm:px-10 text-xl font-black tracking-widest shadow-[0_6px_0_#166534] transition hover:scale-105 hover:bg-green-400 active:translate-y-1"
        >
          {crawlDone
            ? "CONTINUE →"
            : "SKIP →"}
        </button>

      </div>

    </main>
  );
}
