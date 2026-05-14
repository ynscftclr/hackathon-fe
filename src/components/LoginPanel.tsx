"use client";

import { useState } from "react";
import { useCardStore } from "@/store/useCardStore";
import { ArrowRight } from "lucide-react";

type Props = {
  /** Retro URL ile gelindiyse gösterilir */
  boardIdHint?: string;
};

export function LoginPanel({ boardIdHint }: Props) {
  const { error, loginUser, fetchInitialData } = useCardStore();
  const [usernameInput, setUsernameInput] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    await loginUser(usernameInput.trim());
    await fetchInitialData();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">TeamRetro&apos;ya Hoş Geldiniz</h1>
          <p className="text-sm text-slate-500">
            Veritabanındaki kullanıcı id&apos;nizle giriş yapın. Rolünüz sistemde tanımlıdır (l* = lead, u* = katılımcı).
          </p>
          {boardIdHint ? (
            <p className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-xs text-indigo-900">
              Bu oturum retro panosu: <span className="font-mono font-semibold">{boardIdHint}</span>
            </p>
          ) : null}
        </div>
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
              Kullanıcı id
            </label>
            <input
              id="username"
              type="text"
              placeholder="Örn: u1 veya l2"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (error) useCardStore.setState({ error: null });
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="username"
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              Demo: <span className="font-mono text-slate-700">u1–u4</span> katılımcı,{" "}
              <span className="font-mono text-slate-700">l1–l4</span> lead.
            </p>
          </div>
          <button
            type="submit"
            disabled={!usernameInput.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            Giriş Yap <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
