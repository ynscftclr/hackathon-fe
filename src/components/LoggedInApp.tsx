"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCardStore } from "@/store/useCardStore";
import { useAiStore } from "@/store/useAiStore";
import { Board } from "@/components/Board";
import { ActionDrawer } from "@/components/ActionDrawer";
import { RetroCountdown } from "@/components/RetroCountdown";
import { RetroDurationModal } from "@/components/RetroDurationModal";
import { BrainCircuit, Loader2, Sparkles, Link2, Check, SkipForward, Wand2 } from "lucide-react";

export function LoggedInApp() {
  const router = useRouter();
  const {
    currentUser,
    groups,
    retroBoardId,
    retroRevealed,
    retroViewerVotesUsed,
    retroSynthesisStatus,
    retroSynthesisError,
    applyLocalRetroReveal,
    createRetroBoardWithDuration,
    endRetroCollectingEarly,
    startRetroAiSynthesis,
  } = useCardStore();
  const { isGrouping, autoGroup } = useAiStore();
  const [retroModalOpen, setRetroModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [endingStep, setEndingStep] = useState(false);
  const [aiStepBusy, setAiStepBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLead = currentUser?.role === "lead";
  const roleLabel = isLead ? "Retro lideri" : "Katılımcı";
  const shareUrl =
    typeof window !== "undefined" && retroBoardId
      ? `${window.location.origin}/retro/${retroBoardId}`
      : "";

  useEffect(() => {
    if (!retroBoardId || !currentUser) return;
    const ms = retroSynthesisStatus === "RUNNING" ? 1200 : 2500;
    const poll = setInterval(() => {
      void useCardStore.getState().refreshRetroBoard();
    }, ms);
    return () => clearInterval(poll);
  }, [retroBoardId, currentUser, retroSynthesisStatus]);

  useEffect(() => {
    if (!retroBoardId || !currentUser) return;
    const t = setInterval(() => applyLocalRetroReveal(), 1000);
    return () => clearInterval(t);
  }, [retroBoardId, currentUser, applyLocalRetroReveal]);

  const handleRetroConfirm = async (minutes: number) => {
    setStarting(true);
    try {
      const id = await createRetroBoardWithDuration(minutes);
      router.push(`/retro/${id}`);
    } finally {
      setStarting(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleEndCollecting = async () => {
    setEndingStep(true);
    try {
      await endRetroCollectingEarly();
    } finally {
      setEndingStep(false);
    }
  };

  const handleStartAiSynthesis = async () => {
    setAiStepBusy(true);
    try {
      await startRetroAiSynthesis();
    } finally {
      setAiStepBusy(false);
    }
  };

  const showAiNextButton =
    isLead &&
    retroBoardId &&
    retroRevealed &&
    (retroSynthesisStatus === "IDLE" || retroSynthesisStatus === "FAILED");

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      {retroBoardId && retroSynthesisStatus === "RUNNING" ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 px-6 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="max-w-md text-center text-base font-semibold text-slate-800">
            Gemini kartları ve oyları işliyor…
          </p>
          <p className="max-w-sm text-center text-sm text-slate-600">
            Maddeler tematik gruplara ayrılıyor; her grupta katılıyorum / katılmıyorum skoruna göre çoktan aza
            sıralanıyor. Tamamlanınca herkes sonucu görecek.
          </p>
        </div>
      ) : null}

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 md:px-8">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">TeamRetro AI</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hoş geldin, <span className="font-medium text-indigo-600">{currentUser?.name}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{roleLabel}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <RetroCountdown />
          {retroBoardId && retroRevealed ? (
            <span
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 tabular-nums"
              title="Pano genelinde en fazla 3 oy"
            >
              Oylarınız: {retroViewerVotesUsed}/3
            </span>
          ) : null}
          {retroBoardId ? (
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Kopyalandı" : "Davet linki"}
            </button>
          ) : null}
          {isLead && retroBoardId && !retroRevealed ? (
            <button
              type="button"
              onClick={() => void handleEndCollecting()}
              disabled={endingStep}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 shadow-sm hover:bg-amber-100 disabled:opacity-60"
            >
              {endingStep ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
              Süreyi bitir — sonraki adım
            </button>
          ) : null}
          {showAiNextButton ? (
            <button
              type="button"
              onClick={() => void handleStartAiSynthesis()}
              disabled={aiStepBusy}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-950 shadow-sm hover:bg-indigo-100 disabled:opacity-60"
            >
              {aiStepBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Sonraki adım: AI ile grupla ve sırala
            </button>
          ) : null}
          {isLead && !retroBoardId ? (
            <button
              type="button"
              onClick={() => setRetroModalOpen(true)}
              disabled={starting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-70"
            >
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Retro başlat
            </button>
          ) : null}
          {!retroBoardId ? (
            <button
              type="button"
              onClick={() => void autoGroup()}
              disabled={isGrouping || groups.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-70"
            >
              {isGrouping ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI Grupluyor...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-5 w-5" />
                  AI ile Otomatik Grupla
                </>
              )}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
        {retroBoardId && retroSynthesisStatus === "FAILED" && retroSynthesisError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span className="font-semibold">AI adımı başarısız: </span>
            {retroSynthesisError}
          </div>
        ) : null}
        <Board />
      </div>

      <ActionDrawer />
      <RetroDurationModal
        open={retroModalOpen}
        onClose={() => setRetroModalOpen(false)}
        onConfirm={handleRetroConfirm}
      />
    </main>
  );
}
