import React, { useEffect, useRef, useState } from 'react';
import { Group, Card as CardType } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CardItem } from './CardItem';
import { useCardStore } from '@/store/useCardStore';
import { Loader2, Plus } from 'lucide-react';

interface Props {
  group: Group | { id: 'ungrouped', title: string };
  cards: CardType[];
}

export const Column: React.FC<Props> = ({ group, cards }) => {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const { addCard, currentUser, retroBoardId, retroRevealed } = useCardStore();
  const canAdd = !retroBoardId || !retroRevealed;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [showAuthorName, setShowAuthorName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetGroupId = group.id === 'ungrouped' ? null : group.id;

  useEffect(() => {
    if (isAddOpen) {
      inputRef.current?.focus();
    }
  }, [isAddOpen]);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !currentUser) return;
    setIsSubmitting(true);
    await addCard({
      content: text,
      authorId: currentUser.id,
      groupId: targetGroupId,
      showAuthorName,
    });
    setDraft('');
    setShowAuthorName(false);
    setIsSubmitting(false);
    setIsAddOpen(false);
  };

  return (
    <div 
      className={`bg-slate-100/50 rounded-2xl p-4 flex flex-col w-80 shrink-0 border transition-colors ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200/60'}`}
    >
      <div className="mb-3 px-1 flex items-center gap-2 min-h-[2rem]">
        <h3 className="font-semibold text-slate-800 flex-1 min-w-0 truncate">{group.title}</h3>
        <span className="shrink-0 text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">{cards.length}</span>
        {currentUser && canAdd && (
          <button
            type="button"
            onClick={() => setIsAddOpen((v) => !v)}
            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              isAddOpen
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
            title="Bu sütuna kart ekle"
            aria-expanded={isAddOpen}
            aria-label={`${group.title} sütununa kart ekle`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {isAddOpen && currentUser && canAdd && (
        <form onSubmit={handleInlineSubmit} className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Kart metnini yaz…"
            disabled={isSubmitting}
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          {retroBoardId ? (
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={showAuthorName}
                onChange={(e) => setShowAuthorName(e.target.checked)}
                disabled={isSubmitting}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              İsmim görünsün
            </label>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setDraft('');
                setShowAuthorName(false);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              disabled={isSubmitting}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!draft.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Ekle
            </button>
          </div>
        </form>
      )}

      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-slate-300">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
