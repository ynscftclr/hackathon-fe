import { create } from 'zustand';
import { Card, Group, Person, Action, RetroSynthesisResult, RetroSynthesisStatus } from '@/types';
import { ApiService } from '@/services/api';

interface CardState {
  cards: Card[];
  groups: Group[];
  persons: Person[];
  actions: Action[];
  isLoading: boolean;
  error: string | null;
  currentUser: Person | null;
  /** Sunucudaki retro panosu; URL /retro/{id} ile gelir */
  retroBoardId: string | null;
  retroEndsAtIso: string | null;
  /** Süre dolduysa true — kartlar herkese açık, + gizli */
  retroRevealed: boolean;
  /** Retro: viewerId ile sunucudan gelen kullanılan oy (0–3) */
  retroViewerVotesUsed: number;
  /** Gemini retro özeti */
  retroSynthesisStatus: RetroSynthesisStatus;
  retroSynthesisResult: RetroSynthesisResult | null;
  retroSynthesisError: string | null;

  fetchInitialData: () => Promise<void>;
  refreshRetroBoard: () => Promise<void>;
  endRetroCollectingEarly: () => Promise<void>;
  startRetroAiSynthesis: () => Promise<void>;
  applyLocalRetroReveal: () => void;
  loginUser: (username: string) => Promise<void>;
  createRetroBoardWithDuration: (durationMinutes: number) => Promise<string>;
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => Promise<void>;
  addRetroCardEmoji: (cardId: string, emoji: string) => Promise<void>;
  setRetroCardVote: (cardId: string, vote: 'AGREE' | 'DISAGREE') => Promise<void>;
  removeRetroCardVote: (cardId: string) => Promise<void>;
  addGroup: (title: string) => Promise<void>;
  updateCardGroup: (cardId: string, groupId: string | null) => Promise<void>;
  updateCardAudio: (cardId: string, audioUrl: string) => Promise<void>;
  createAction: (action: Omit<Action, 'id'>) => Promise<void>;
  updateActionStatus: (actionId: string, status: Action['status']) => Promise<void>;
  upsertActionFromCard: (cardId: string, status: Action['status']) => Promise<void>;
}

type RetroBoardPayload = Awaited<ReturnType<typeof ApiService.getRetroBoard>>;

function parseMyVote(v: string | null | undefined): 'AGREE' | 'DISAGREE' | null {
  if (v === 'AGREE' || v === 'DISAGREE') return v;
  return null;
}

function parseSynthesisResult(raw: unknown): RetroSynthesisResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const groupsRaw = (raw as { groups?: unknown }).groups;
  if (!Array.isArray(groupsRaw)) return null;
  const groups: RetroSynthesisResult['groups'] = [];
  for (const g of groupsRaw) {
    if (!g || typeof g !== 'object') continue;
    const title = String((g as { title?: unknown }).title ?? 'Grup');
    const itemsRaw = (g as { items?: unknown }).items;
    if (!Array.isArray(itemsRaw)) continue;
    const items = itemsRaw.map((it) => {
      const o = it as Record<string, unknown>;
      return {
        cardId: String(o.cardId ?? ''),
        content: String(o.content ?? ''),
        agreeCount: Number(o.agreeCount ?? 0),
        disagreeCount: Number(o.disagreeCount ?? 0),
      };
    });
    groups.push({ title, items });
  }
  if (groups.length === 0) return null;
  return { groups };
}

function normalizeSynthStatus(s: string | undefined | null): RetroSynthesisStatus {
  if (s === 'RUNNING' || s === 'DONE' || s === 'FAILED') return s;
  return 'IDLE';
}

function mapRetroState(state: RetroBoardPayload) {
  const groups: Group[] = state.groups.map((g) => ({
    id: g.id,
    title: g.title,
    description: '',
  }));
  const cards: Card[] = state.cards.map((c) => {
    const raw = c.emojiCounts;
    const emojiCounts: Record<string, number> =
      raw && typeof raw === 'object'
        ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]))
        : {};
    return {
      id: c.id,
      content: c.content,
      authorId: c.authorId,
      groupId: c.groupId,
      createdAt: c.createdAt,
      contentMasked: c.masked,
      showAuthorName: c.showAuthorName ?? false,
      emojiCounts,
      agreeCount: c.agreeCount ?? 0,
      disagreeCount: c.disagreeCount ?? 0,
      myVote: parseMyVote(c.myVote),
    };
  });
  return {
    groups,
    cards,
    retroEndsAtIso: state.endsAt,
    retroRevealed: state.revealed,
    retroViewerVotesUsed: state.viewerVotesUsed ?? 0,
    retroSynthesisStatus: normalizeSynthStatus(state.synthesisStatus),
    retroSynthesisResult: parseSynthesisResult(state.synthesisResult),
    retroSynthesisError: state.synthesisError ?? null,
  };
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  groups: [],
  persons: [],
  actions: [],
  isLoading: false,
  error: null,
  currentUser: null,
  retroBoardId: null,
  retroEndsAtIso: null,
  retroRevealed: false,
  retroViewerVotesUsed: 0,
  retroSynthesisStatus: 'IDLE',
  retroSynthesisResult: null,
  retroSynthesisError: null,

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const persons = await ApiService.getPersons();
      const boardId = get().retroBoardId;
      const user = get().currentUser;

      if (boardId && user) {
        try {
          const [state, actions] = await Promise.all([
            ApiService.getRetroBoard(boardId, user.id),
            ApiService.getActions(),
          ]);
          set({
            persons,
            ...mapRetroState(state),
            actions,
            isLoading: false,
            error: null,
          });
        } catch {
          set({
            persons,
            retroBoardId: null,
            retroEndsAtIso: null,
            retroRevealed: false,
            retroViewerVotesUsed: 0,
            retroSynthesisStatus: 'IDLE',
            retroSynthesisResult: null,
            retroSynthesisError: null,
            groups: [],
            cards: [],
            actions: [],
            error: null,
            isLoading: false,
          });
        }
        return;
      }

      if (boardId && !user) {
        set({
          persons,
          groups: [],
          cards: [],
          actions: [],
          retroEndsAtIso: null,
          retroRevealed: false,
          retroViewerVotesUsed: 0,
          retroSynthesisStatus: 'IDLE',
          retroSynthesisResult: null,
          retroSynthesisError: null,
          isLoading: false,
        });
        return;
      }

      const [groups, cards, actions] = await Promise.all([
        ApiService.getGroups(),
        ApiService.getCards(),
        ApiService.getActions(),
      ]);
      set({
        persons,
        groups,
        cards,
        actions,
        retroEndsAtIso: null,
        retroRevealed: false,
        retroViewerVotesUsed: 0,
        retroSynthesisStatus: 'IDLE',
        retroSynthesisResult: null,
        retroSynthesisError: null,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch data';
      set({
        error: message,
        isLoading: false,
        retroBoardId: null,
        retroEndsAtIso: null,
        retroRevealed: false,
        retroViewerVotesUsed: 0,
        retroSynthesisStatus: 'IDLE',
        retroSynthesisResult: null,
        retroSynthesisError: null,
        actions: [],
      });
    }
  },

  refreshRetroBoard: async () => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    if (!boardId || !user) return;
    try {
      const [state, actions] = await Promise.all([
        ApiService.getRetroBoard(boardId, user.id),
        ApiService.getActions(),
      ]);
      set({ ...mapRetroState(state), actions });
    } catch {
      set({
        retroBoardId: null,
        retroEndsAtIso: null,
        retroRevealed: false,
        retroViewerVotesUsed: 0,
        retroSynthesisStatus: 'IDLE',
        retroSynthesisResult: null,
        retroSynthesisError: null,
        groups: [],
        cards: [],
        actions: [],
      });
    }
  },

  endRetroCollectingEarly: async () => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    if (!boardId || !user || user.role !== 'lead') return;
    try {
      await ApiService.endRetroCollecting(boardId, user.id);
      await get().refreshRetroBoard();
    } catch (e) {
      console.error(e);
    }
  },

  startRetroAiSynthesis: async () => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    if (!boardId || !user || user.role !== 'lead') return;
    try {
      const state = await ApiService.postRetroSynthesizeAi(boardId, user.id);
      set(mapRetroState(state));
    } catch (e) {
      console.error(e);
    }
  },

  applyLocalRetroReveal: () => {
    const ends = get().retroEndsAtIso;
    if (!ends) return;
    if (Date.now() >= Date.parse(ends)) {
      set({ retroRevealed: true });
      void get().refreshRetroBoard();
    }
  },

  loginUser: async (username) => {
    set({ error: null });
    try {
      const person = await ApiService.login(username.trim());
      set({ currentUser: person, error: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Giriş başarısız';
      set({ error: message });
    }
  },

  createRetroBoardWithDuration: async (durationMinutes: number) => {
    const created = await ApiService.createRetroBoard(durationMinutes);
    set({
      retroBoardId: created.boardId,
      retroEndsAtIso: created.endsAt,
      retroRevealed: false,
      retroViewerVotesUsed: 0,
      retroSynthesisStatus: 'IDLE',
      retroSynthesisResult: null,
      retroSynthesisError: null,
      groups: created.groups.map((g) => ({ id: g.id, title: g.title, description: '' })),
      cards: [],
    });
    return created.boardId;
  },

  addCard: async (card) => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    try {
      if (boardId && user) {
        await ApiService.createRetroBoardCard(boardId, {
          content: card.content,
          groupId: card.groupId,
          authorId: card.authorId,
          showAuthorName: card.showAuthorName === true,
        });
        await get().refreshRetroBoard();
        return;
      }
      const newCard = await ApiService.createCard(card);
      set((state) => ({ cards: [...state.cards, newCard] }));
    } catch (error) {
      console.error(error);
    }
  },

  addRetroCardEmoji: async (cardId, emoji) => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    if (!boardId || !user) return;
    try {
      await ApiService.addRetroCardEmoji(boardId, cardId, user.id, emoji);
      await get().refreshRetroBoard();
    } catch (e) {
      console.error(e);
    }
  },

  setRetroCardVote: async (cardId, vote) => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    if (!boardId || !user) return;
    try {
      await ApiService.setRetroCardVote(boardId, cardId, user.id, vote);
      await get().refreshRetroBoard();
    } catch (e) {
      console.error(e);
    }
  },

  removeRetroCardVote: async (cardId) => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    if (!boardId || !user) return;
    try {
      await ApiService.removeRetroCardVote(boardId, cardId, user.id);
      await get().refreshRetroBoard();
    } catch (e) {
      console.error(e);
    }
  },

  addGroup: async (title) => {
    try {
      const newGroup = await ApiService.createGroup({ title });
      set((state) => ({ groups: [...state.groups, newGroup] }));
    } catch (error) {
      console.error(error);
    }
  },

  updateCardGroup: async (cardId, groupId) => {
    const boardId = get().retroBoardId;
    const user = get().currentUser;
    try {
      set((state) => ({
        cards: state.cards.map((c) => (c.id === cardId ? { ...c, groupId } : c)),
      }));
      if (boardId && user) {
        await ApiService.patchRetroBoardCard(boardId, cardId, groupId, user.id);
        await get().refreshRetroBoard();
      } else {
        await ApiService.updateCard(cardId, { groupId });
      }
    } catch (error) {
      console.error(error);
    }
  },

  updateCardAudio: async (cardId, audioUrl) => {
    try {
      set((state) => ({
        cards: state.cards.map((c) => (c.id === cardId ? { ...c, audioUrl } : c)),
      }));
      await ApiService.updateCard(cardId, { audioUrl });
    } catch (error) {
      console.error(error);
    }
  },

  createAction: async (action) => {
    try {
      const created = await ApiService.createAction(action);
      set((state) => ({ actions: [...state.actions, created] }));
    } catch (error) {
      console.error(error);
    }
  },

  updateActionStatus: async (actionId, status) => {
    try {
      const updated = await ApiService.updateAction(actionId, { status });
      set((state) => ({
        actions: state.actions.map((a) => (a.id === updated.id ? updated : a)),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  upsertActionFromCard: async (cardId, status) => {
    const { cards, actions, currentUser, persons } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.contentMasked) return;
    const existing = actions.find((a) => a.cardId === cardId);
    if (existing) {
      await get().updateActionStatus(existing.id, status);
      return;
    }
    const raw = card.content.trim();
    const title = raw.length > 120 ? `${raw.slice(0, 117)}…` : raw || 'Retro maddesi';
    const assigneeId =
      card.authorId ||
      currentUser?.id ||
      persons.find((p) => p.role === 'user')?.id ||
      persons[0]?.id ||
      'u1';
    await get().createAction({
      cardId,
      title,
      description: raw,
      assigneeId,
      status,
    });
  },
}));
