"use client";

import { useEffect, useState } from "react";

import { clearScores } from "@/lib/leaderboard";
import {
  clearResearchData,
  downloadCsv,
  eventsCsv,
  getLogStatus,
  levelSummaryCsv,
  newParticipant,
} from "@/lib/researchLog";

type Status = ReturnType<typeof getLogStatus>;

type DangerAction =
  | "participant"
  | "clear"
  | "leaderboard";

// Warn well before localStorage's ~5 MB limit
const STORAGE_WARNING_KB = 3000;

function fileStamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/*
 * Hidden researcher tools: participant ID, CSV export,
 * and resets. Open with Ctrl+Shift+L or by adding
 * #researcher to the URL. Students never see it.
 */
export default function ResearcherPanel() {
  const [status, setStatus] =
    useState<Status | null>(null);

  // Destructive buttons need a second click to confirm
  const [confirming, setConfirming] =
    useState<DangerAction | null>(null);

  const [notice, setNotice] =
    useState("");

  useEffect(() => {
    function open() {
      setStatus(getLogStatus());
      setConfirming(null);
      setNotice("");
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.code === "KeyL"
      ) {
        event.preventDefault();

        setStatus((current) =>
          current ? null : getLogStatus()
        );

        setConfirming(null);
        setNotice("");
      }

      if (event.key === "Escape") {
        setStatus(null);
      }
    }

    function onHashChange() {
      if (window.location.hash === "#researcher") {
        open();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("hashchange", onHashChange);

    // Opened directly with #researcher in the URL
    const frame = requestAnimationFrame(onHashChange);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("hashchange", onHashChange);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!status) return null;

  function refresh(message: string) {
    setStatus(getLogStatus());
    setConfirming(null);
    setNotice(message);
  }

  function close() {
    setStatus(null);

    // Drop #researcher so a refresh doesn't reopen it
    if (window.location.hash === "#researcher") {
      history.replaceState(null, "", window.location.pathname);
    }
  }

  function danger(action: DangerAction) {
    if (confirming !== action) {
      setConfirming(action);
      setNotice("");
      return;
    }

    if (action === "participant") {
      const id = newParticipant();
      refresh(`New participant: ${id}`);
    } else if (action === "clear") {
      clearResearchData();
      refresh("Research data cleared.");
    } else {
      clearScores();
      refresh("Leaderboard reset.");
    }
  }

  /*
   * Saves both files: the level summary (one row per level)
   * and the full event log (everything else).
   */
  function exportData() {
    const stamp = fileStamp();

    downloadCsv(`token-blast-levels_${stamp}.csv`, levelSummaryCsv());

    // Brief gap so the browser treats them as two separate downloads
    setTimeout(() => {
      downloadCsv(`token-blast-events_${stamp}.csv`, eventsCsv());
    }, 400);

    refresh("Exported 2 files: levels + events.");
  }

  const storageWarning =
    status.storageFailed ||
    status.storageKb > STORAGE_WARNING_KB;

  const dangerLabel = (
    action: DangerAction,
    label: string
  ) =>
    confirming === action
      ? "Click again to confirm"
      : label;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Researcher panel"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 text-white"
    >
      <div className="w-full max-w-lg rounded-2xl border-2 border-fuchsia-400 bg-slate-950 p-6 shadow-[0_0_40px_rgba(232,121,249,.25)]">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-fuchsia-300">
              RESEARCHER PANEL
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Data stays on this laptop until exported.
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-lg bg-slate-800 px-3 py-1 font-bold hover:bg-slate-700"
          >
            Close ✕
          </button>
        </div>

        {/* Current participant */}
        <div className="mt-5 rounded-xl bg-slate-900 p-4">
          <p className="text-xs tracking-widest text-slate-400">
            CURRENT PARTICIPANT
          </p>

          <p className="mt-1 font-mono text-3xl font-black tracking-widest text-yellow-300">
            {status.participantId}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {status.runs} run{status.runs === 1 ? "" : "s"} started ·{" "}
            {status.eventCount} events logged on this laptop ·{" "}
            {status.storageKb} KB
          </p>
        </div>

        {storageWarning && (
          <p className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-sm font-bold text-red-300">
            {status.storageFailed
              ? "Browser storage is full: new events are only kept until the page closes. Export and clear now."
              : "Storage is getting full. Export, then clear research data."}
          </p>
        )}

        {/* Export */}
        <button
          type="button"
          onClick={exportData}
          className="mt-5 w-full rounded-xl bg-cyan-600 px-4 py-3 font-black hover:bg-cyan-500"
        >
          Export data (CSV)
        </button>

        {/* Participant + resets */}
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => danger("participant")}
            className="rounded-xl bg-green-600 px-4 py-3 font-black hover:bg-green-500"
          >
            {dangerLabel("participant", "New participant (next student)")}
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => danger("clear")}
              className="rounded-xl border-2 border-red-400/60 px-4 py-3 text-sm font-black text-red-300 hover:bg-red-950/50"
            >
              {dangerLabel("clear", "Clear research data")}
            </button>

            <button
              type="button"
              onClick={() => danger("leaderboard")}
              className="rounded-xl border-2 border-red-400/60 px-4 py-3 text-sm font-black text-red-300 hover:bg-red-950/50"
            >
              {dangerLabel("leaderboard", "Reset leaderboard")}
            </button>
          </div>
        </div>

        <p
          aria-live="polite"
          className="mt-4 min-h-5 text-sm font-bold text-green-300"
        >
          {notice}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Clearing research data doesn&apos;t touch the leaderboard, and
          resetting the leaderboard doesn&apos;t touch research data.
          Export before clearing.
        </p>

      </div>
    </div>
  );
}
