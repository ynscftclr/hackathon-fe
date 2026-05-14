"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => Promise<void>;
};

export function RetroDurationModal({ open, onClose, onConfirm }: Props) {
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = Math.round(minutes);
    if (m < 1 || m > 480) {
      setErr("1 ile 480 dakika arasında girin.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(m);
      onClose();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Başlatılamadı");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !busy) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          onClick={() => !busy && onClose()}
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Retro süresi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Toplantı linki oluşturulur; süre boyunca katılımcılar yalnızca kendi kartlarını görür. Süre bitince tüm maddeler açılır ve yeni kart eklenemez.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="retro-min" className="block text-sm font-medium text-slate-700">
              Süre (dakika)
            </label>
            <input
              id="retro-min"
              type="number"
              min={1}
              max={480}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
              disabled={busy}
            />
          </div>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => !busy && onClose()}
              disabled={busy}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Başlat ve link oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
