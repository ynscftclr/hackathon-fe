"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Loader2, X } from "lucide-react";
import { ApiService } from "@/services/api";
import type { EntryBoardColumn, EntryBoardItem } from "@/types";

const BOARD_ID = "default";

const COLUMNS: { id: EntryBoardColumn; title: string }[] = [
  { id: "good", title: "İyi gidenler" },
  { id: "improve", title: "Geliştirilmesi gerekenler" },
];

function displayAuthor(item: EntryBoardItem): string {
  if (item.showAuthorName && item.authorName?.trim()) {
    return item.authorName.trim();
  }
  return "Anonim";
}

export function EntryBoardSection() {
  const [items, setItems] = useState<EntryBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<EntryBoardColumn>("good");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showAuthorName, setShowAuthorName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await ApiService.getEntryBoardItems(BOARD_ID);
      setItems(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Pano yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openForColumn = (col: EntryBoardColumn) => {
    setActiveColumn(col);
    setContent("");
    setAuthorName("");
    setShowAuthorName(false);
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await ApiService.createEntryBoardItem({
        boardId: BOARD_ID,
        column: activeColumn,
        content: text,
        authorName: showAuthorName ? authorName.trim() : "",
        showAuthorName,
      });
      await loadItems();
      setModalOpen(false);
      setContent("");
      setAuthorName("");
      setShowAuthorName(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSubmitting(false);
    }
  };

  const itemsFor = (col: EntryBoardColumn) =>
    items.filter((i) => i.column === col);

  const modal =
    modalOpen && typeof document !== "undefined"
      ? createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
        role="presentation"
        onMouseDown={(ev) => {
          if (ev.target === ev.currentTarget) closeModal();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-board-modal-title"
          className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        >
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 id="entry-board-modal-title" className="pr-10 text-lg font-semibold text-slate-900">
            {activeColumn === "good" ? "İyi gidenler" : "Geliştirilmesi gerekenler"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Kartınız kaydedildikten sonra ilgili sütunda listelenir.</p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="entry-content" className="block text-sm font-medium text-slate-700">
                Metin
              </label>
              <textarea
                id="entry-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Paylaşmak istediğiniz notu yazın…"
                className="mt-1 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                disabled={submitting}
                required
              />
            </div>

            <div>
              <label htmlFor="entry-author" className="block text-sm font-medium text-slate-700">
                İsim
              </label>
              <input
                id="entry-author"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={submitting || !showAuthorName}
                placeholder={showAuthorName ? "Örn: Ayşe" : "Önce «İsmim görünsün» seçin"}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50/50">
              <input
                type="checkbox"
                checked={showAuthorName}
                onChange={(e) => {
                  const on = e.target.checked;
                  setShowAuthorName(on);
                  if (!on) setAuthorName("");
                }}
                disabled={submitting}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-800">
                <span className="font-medium">İsmim görünsün</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  İşaretli değilse kartta yalnızca «Anonim» gösterilir; isim veritabanına yazılmaz.
                </span>
              </span>
            </label>

            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Ekle
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )
  : null;

  return (
    <>
      {modal}
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Giriş panosu</h2>
        <p className="text-xs text-slate-500">
          Giriş yapmadan önce not bırakabilirsiniz; kayıtlar sunucuda saklanır.
        </p>
      </div>

      {loadError ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Pano yükleniyor…</span>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="flex min-h-[280px] flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-3">
                <h3 className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{col.title}</h3>
                <button
                  type="button"
                  onClick={() => openForColumn(col.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  title="Kart ekle"
                  aria-label={`${col.title} — kart ekle`}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {itemsFor(col.id).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm"
                  >
                    <p className="text-slate-800 leading-relaxed">{item.content}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {displayAuthor(item)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
