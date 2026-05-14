import React, { useState } from 'react';
import { Card as CardType } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BrainCircuit, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useAiStore } from '@/store/useAiStore';
import { useUiStore } from '@/store/useUiStore';
import { useCardStore } from '@/store/useCardStore';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '✅', '🔥', '🙏'];

interface Props {
  card: CardType;
}

export const CardItem: React.FC<Props> = ({ card }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: card.contentMasked === true,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const { analyzeCard, isAnalyzing } = useAiStore();
  const { setActionDrawerOpen, setSelectedCardId } = useUiStore();
  const {
    persons,
    retroBoardId,
    retroRevealed,
    retroSynthesisStatus,
    currentUser,
    retroViewerVotesUsed,
    addRetroCardEmoji,
    setRetroCardVote,
    removeRetroCardVote,
  } = useCardStore();

  const author = persons.find((p) => p.id === card.authorId);
  const authorBadge =
    retroBoardId && card.showAuthorName !== true
      ? '**'
      : `@${author?.name || 'Anonim'}`;
  const masked = card.contentMasked === true;
  const showAnalyze = !masked && !retroBoardId;

  const synthOk = retroSynthesisStatus === "IDLE" || retroSynthesisStatus === "FAILED";
  const showRetroInteractions = Boolean(
    retroBoardId && retroRevealed && currentUser && !masked && synthOk
  );

  const [emojiDraft, setEmojiDraft] = useState('');

  const emojiEntries = Object.entries(card.emojiCounts ?? {}).sort((a, b) => b[1] - a[1]);
  const agree = card.agreeCount ?? 0;
  const disagree = card.disagreeCount ?? 0;
  const newVoteBlocked = !card.myVote && retroViewerVotesUsed >= 3;
  const voteBusy = !currentUser;

  const handleAnalyze = async () => {
    setSelectedCardId(card.id);
    await analyzeCard(card.id, card.content);
    setActionDrawerOpen(true);
  };

  const sendQuickEmoji = (e: string) => {
    void addRetroCardEmoji(card.id, e);
  };

  const submitCustomEmoji = (ev: React.FormEvent) => {
    ev.preventDefault();
    const t = emojiDraft.trim();
    if (!t) return;
    void addRetroCardEmoji(card.id, t);
    setEmojiDraft('');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 flex flex-col gap-3 group hover:shadow-md transition-shadow relative ${
        masked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
      {...attributes}
      {...(masked ? {} : listeners)}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-slate-700 text-sm leading-relaxed flex-1 font-medium">
          {masked ? (
            <span className="italic text-slate-400">Başka bir katılımcının kartı — süre bitince görünür.</span>
          ) : (
            card.content
          )}
        </p>
        {showAnalyze ? (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors shrink-0"
            title="AI ile Analiz Et"
          >
            <BrainCircuit size={18} className={isAnalyzing ? 'animate-pulse' : ''} />
          </button>
        ) : null}
      </div>

      {showRetroInteractions ? (
        <div
          className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Emoji
            </span>
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                title={e}
                onClick={() => sendQuickEmoji(e)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg leading-none shadow-sm hover:border-indigo-300 hover:bg-indigo-50"
              >
                {e}
              </button>
            ))}
            <form onSubmit={submitCustomEmoji} className="ml-auto flex min-w-0 flex-1 gap-1 sm:max-w-[11rem]">
              <input
                value={emojiDraft}
                onChange={(ev) => setEmojiDraft(ev.target.value)}
                placeholder="Emoji…"
                maxLength={32}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-900"
              >
                Ekle
              </button>
            </form>
          </div>
          {emojiEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {emojiEntries.map(([em, n]) => (
                <span
                  key={em}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  <span className="text-sm leading-none">{em}</span>
                  <span className="tabular-nums text-slate-500">{n}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="border-t border-slate-200/80 pt-2">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Oylama
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={voteBusy || newVoteBlocked}
                onClick={() => void setRetroCardVote(card.id, 'AGREE')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  card.myVote === 'AGREE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
                Katılıyorum
                <span className="tabular-nums text-slate-500">({agree})</span>
              </button>
              <button
                type="button"
                disabled={voteBusy || newVoteBlocked}
                onClick={() => void setRetroCardVote(card.id, 'DISAGREE')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  card.myVote === 'DISAGREE'
                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/50'
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <ThumbsDown className="h-3.5 w-3.5 shrink-0" />
                Katılmıyorum
                <span className="tabular-nums text-slate-500">({disagree})</span>
              </button>
              {card.myVote ? (
                <button
                  type="button"
                  onClick={() => void removeRetroCardVote(card.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-[11px] font-medium text-slate-500 hover:border-slate-200 hover:bg-white"
                  title="Bu karttaki oyunu kaldır"
                >
                  <X className="h-3 w-3" />
                  Oyu kaldır
                </button>
              ) : null}
            </div>
            {!card.myVote && newVoteBlocked ? (
              <p className="mt-1.5 text-[11px] text-amber-800">
                3 oy hakkınız doldu; başka karta oy vermek için bir oyunuzu kaldırın.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
        <div className="text-[11px] font-medium text-indigo-600/80 bg-indigo-50 px-2 py-0.5 rounded-full">
          {authorBadge}
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {new Date(card.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
