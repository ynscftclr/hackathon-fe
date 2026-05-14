"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCardStore } from "@/store/useCardStore";
import { LoginPanel } from "@/components/LoginPanel";
import { LoggedInApp } from "@/components/LoggedInApp";
import { Loader2 } from "lucide-react";

export default function RetroBoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;
  const currentUser = useCardStore((s) => s.currentUser);
  const isLoading = useCardStore((s) => s.isLoading);

  useEffect(() => {
    useCardStore.setState({ retroBoardId: boardId });
    void useCardStore.getState().fetchInitialData();
    return () => {
      useCardStore.setState({
        retroBoardId: null,
        retroEndsAtIso: null,
        retroRevealed: false,
        retroViewerVotesUsed: 0,
        retroSynthesisStatus: 'IDLE',
        retroSynthesisResult: null,
        retroSynthesisError: null,
      });
    };
  }, [boardId]);

  const storeRetroBoardId = useCardStore((s) => s.retroBoardId);

  useEffect(() => {
    if (isLoading) return;
    if (currentUser && !storeRetroBoardId) {
      router.replace("/");
    }
  }, [isLoading, currentUser, storeRetroBoardId, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-medium">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPanel boardIdHint={boardId} />;
  }

  return <LoggedInApp />;
}
