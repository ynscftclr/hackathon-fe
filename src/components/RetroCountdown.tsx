"use client";

import { useEffect, useState } from "react";
import { useCardStore } from "@/store/useCardStore";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function RetroCountdown() {
  const retroBoardId = useCardStore((s) => s.retroBoardId);
  const endsAtIso = useCardStore((s) => s.retroEndsAtIso);
  const retroRevealed = useCardStore((s) => s.retroRevealed);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!retroBoardId || !endsAtIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [retroBoardId, endsAtIso]);

  if (!retroBoardId || !endsAtIso) return null;

  const end = Date.parse(endsAtIso);
  const remaining = end - now;
  const done = retroRevealed || remaining <= 0;

  return (
    <div
      className={`rounded-xl border px-4 py-2 text-sm font-semibold tabular-nums ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-indigo-200 bg-indigo-50 text-indigo-900"
      }`}
    >
      {done ? "Veri girişi bitti — tüm kartlar görünür" : `Kalan süre: ${formatRemaining(remaining)}`}
    </div>
  );
}
