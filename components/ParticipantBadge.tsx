"use client";

import { useSyncExternalStore } from "react";

import {
  getParticipantId,
  PARTICIPANT_CHANGE_EVENT,
} from "@/lib/researchLog";

function subscribe(onChange: () => void) {
  window.addEventListener(PARTICIPANT_CHANGE_EVENT, onChange);

  return () =>
    window.removeEventListener(PARTICIPANT_CHANGE_EVENT, onChange);
}

/*
 * The anonymous participant ID, faint in the top-left corner of
 * every screen, so students can copy it onto their pre/post
 * surveys. Ignores clicks so it never gets in the way.
 */
export default function ParticipantBadge() {
  // Empty during the static pre-render; filled in on the client
  const id = useSyncExternalStore(
    subscribe,
    getParticipantId,
    () => ""
  );

  if (!id) return null;

  return (
    <p className="pointer-events-none fixed left-1.5 top-0.5 z-[90] font-mono text-[10px] tracking-wider text-slate-400/50">
      ID {id}
    </p>
  );
}
