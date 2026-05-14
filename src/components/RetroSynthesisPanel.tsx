"use client";

import type { RetroSynthesisResult } from "@/types";

type Props = {
  result: RetroSynthesisResult;
};

export function RetroSynthesisPanel({ result }: Props) {
  return (
    <section className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/90 to-white p-5 shadow-sm">
      <h2 className="text-lg font-bold tracking-tight text-indigo-950">AI özet — gruplar ve oy skoruna göre sıra</h2>
      <p className="mt-1 text-sm text-indigo-800/80">
        Gemini kartları tematik grupladı; her grupta maddeler katılıyorum − katılmıyorum net skoruna göre çoktan aza sıralı.
      </p>
      <div className="mt-4 flex flex-col gap-5">
        {result.groups.map((g, gi) => (
          <div key={`${g.title}-${gi}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">{g.title}</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              {g.items.map((it, ii) => (
                <li key={it.cardId || ii} className="leading-relaxed">
                  <span className="font-medium text-slate-900">{it.content}</span>
                  <span className="ml-2 tabular-nums text-xs text-slate-500">
                    (+{it.agreeCount} / −{it.disagreeCount})
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
