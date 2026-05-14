"use client";

import { useEffect } from "react";
import { useCardStore } from "@/store/useCardStore";
import { LoginPanel } from "@/components/LoginPanel";
import { LoggedInApp } from "@/components/LoggedInApp";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { fetchInitialData, isLoading, currentUser } = useCardStore();

  useEffect(() => {
    useCardStore.setState({
      retroBoardId: null,
      retroEndsAtIso: null,
      retroRevealed: false,
      retroViewerVotesUsed: 0,
      retroSynthesisStatus: 'IDLE',
      retroSynthesisResult: null,
      retroSynthesisError: null,
    });
  }, []);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-medium">Uygulama Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPanel />;
  }

  return <LoggedInApp />;
}
