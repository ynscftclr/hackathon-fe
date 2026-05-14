import { Person, Card, Group, Action, EntryBoardItem, EntryBoardColumn } from '@/types';

const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')
    : 'http://localhost:8080';

// Utility for realistic latency simulation (mock endpoints only)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 500) + 500);

function normalizePerson(raw: { id: string; name: string; surname?: string; role: string }): Person {
  const role = raw.role === 'lead' ? 'lead' : 'user';
  return {
    id: raw.id,
    name: raw.name,
    surname: raw.surname ?? '',
    role,
  };
}

let MOCK_GROUPS: Group[] = [];
let MOCK_CARDS: Card[] = [];
let MOCK_ACTIONS: Action[] = [];

export type RetroBoardApiResponse = {
  boardId: string;
  endsAt: string;
  startedAt: string;
  revealed: boolean;
  viewerVotesUsed: number;
  synthesisStatus?: string;
  synthesisResult?: unknown;
  synthesisError?: string | null;
  groups: { id: string; title: string }[];
  cards: {
    id: string;
    groupId: string | null;
    authorId: string;
    content: string;
    masked: boolean;
    createdAt: string;
    showAuthorName: boolean;
    emojiCounts: Record<string, number>;
    agreeCount: number;
    disagreeCount: number;
    myVote: string | null;
  }[];
};

// Service Layer (API Wrapper simulating http://localhost:8080/api/...)
export const ApiService = {
  // Persons — Spring + H2
  async getPersons(): Promise<Person[]> {
    const res = await fetch(`${API_BASE}/api/persons`);
    if (!res.ok) {
      throw new Error(`Kişi listesi alınamadı (${res.status}). Backend çalışıyor mu?`);
    }
    const data = (await res.json()) as { id: string; name: string; surname?: string; role: string }[];
    return data.map(normalizePerson);
  },

  async login(username: string): Promise<Person> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: '' }),
    });
    if (res.status === 401) {
      throw new Error('Bilinmeyen kullanıcı. u1–u4 (katılımcı) veya l1–l4 (lead) ile deneyin.');
    }
    if (!res.ok) {
      throw new Error(`Giriş başarısız (${res.status})`);
    }
    return normalizePerson(await res.json());
  },

  async getEntryBoardItems(boardId = 'default'): Promise<EntryBoardItem[]> {
    const res = await fetch(
      `${API_BASE}/api/entry-board/items?boardId=${encodeURIComponent(boardId)}`
    );
    if (!res.ok) {
      throw new Error(`Giriş panosu yüklenemedi (${res.status})`);
    }
    return (await res.json()) as EntryBoardItem[];
  },

  async createEntryBoardItem(payload: {
    boardId?: string;
    column: EntryBoardColumn;
    content: string;
    authorName?: string;
    showAuthorName: boolean;
  }): Promise<EntryBoardItem> {
    const res = await fetch(`${API_BASE}/api/entry-board/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: payload.boardId ?? 'default',
        column: payload.column,
        content: payload.content,
        authorName: payload.authorName ?? '',
        showAuthorName: payload.showAuthorName,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Kart kaydedilemedi (${res.status})`);
    }
    return (await res.json()) as EntryBoardItem;
  },

  async createRetroBoard(durationMinutes: number): Promise<{
    boardId: string;
    endsAt: string;
    groups: { id: string; title: string }[];
  }> {
    const res = await fetch(`${API_BASE}/api/retro/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes }),
    });
    if (!res.ok) {
      throw new Error((await res.text()) || `Retro oluşturulamadı (${res.status})`);
    }
    return res.json();
  },

  async getRetroBoard(boardId: string, viewerId: string): Promise<RetroBoardApiResponse> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}?viewerId=${encodeURIComponent(viewerId)}`
    );
    if (!res.ok) {
      throw new Error(`Retro panosu yüklenemedi (${res.status})`);
    }
    return res.json();
  },

  async createRetroBoardCard(
    boardId: string,
    payload: { content: string; groupId: string | null; authorId: string; showAuthorName?: boolean }
  ): Promise<{
    id: string;
    groupId: string | null;
    authorId: string;
    content: string;
    masked: boolean;
    createdAt: string;
    showAuthorName: boolean;
  }> {
    const res = await fetch(`${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: payload.content,
        groupId: payload.groupId,
        authorId: payload.authorId,
        showAuthorName: payload.showAuthorName === true,
      }),
    });
    if (!res.ok) {
      throw new Error((await res.text()) || `Kart eklenemedi (${res.status})`);
    }
    return res.json();
  },

  async patchRetroBoardCard(
    boardId: string,
    cardId: string,
    groupId: string | null,
    viewerId: string
  ): Promise<{
    id: string;
    groupId: string | null;
    authorId: string;
    content: string;
    masked: boolean;
    createdAt: string;
    showAuthorName: boolean;
  }> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}?viewerId=${encodeURIComponent(viewerId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      }
    );
    if (!res.ok) {
      throw new Error((await res.text()) || `Kart güncellenemedi (${res.status})`);
    }
    return res.json();
  },

  async endRetroCollecting(boardId: string, actorId: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/end-collecting?actorId=${encodeURIComponent(actorId)}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Adım bitirilemedi (${res.status})`);
    }
  },

  async postRetroSynthesizeAi(boardId: string, actorId: string): Promise<RetroBoardApiResponse> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/synthesize-ai?actorId=${encodeURIComponent(actorId)}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      throw new Error((await res.text()) || `AI adımı başlatılamadı (${res.status})`);
    }
    return res.json();
  },

  async addRetroCardEmoji(
    boardId: string,
    cardId: string,
    personId: string,
    emoji: string
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}/emojis`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, emoji }),
      }
    );
    if (!res.ok) {
      throw new Error((await res.text()) || `Emoji eklenemedi (${res.status})`);
    }
  },

  async setRetroCardVote(
    boardId: string,
    cardId: string,
    personId: string,
    voteType: 'AGREE' | 'DISAGREE'
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}/votes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, voteType }),
      }
    );
    if (!res.ok) {
      throw new Error((await res.text()) || `Oy verilemedi (${res.status})`);
    }
  },

  async removeRetroCardVote(boardId: string, cardId: string, personId: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/retro/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}/votes?personId=${encodeURIComponent(personId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      throw new Error((await res.text()) || `Oy kaldırılamadı (${res.status})`);
    }
  },

  // Retro (mock — yalnızca / sayfasında retroBoardId yokken)
  async startRetro(): Promise<Group[]> {
    console.log('POST http://localhost:8080/api/retro/start');
    await randomDelay();
    MOCK_GROUPS = [
      { id: `g_iyi_${Date.now()}`, title: 'İyi gidenler', description: '' },
      { id: `g_gelistir_${Date.now()}`, title: 'Geliştirilicek alanlar', description: '' },
    ];
    MOCK_CARDS = MOCK_CARDS.map((c) => ({ ...c, groupId: null }));
    return [...MOCK_GROUPS];
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    console.log('GET http://localhost:8080/api/groups');
    await randomDelay();
    return [...MOCK_GROUPS];
  },
  
  async createGroup(group: Omit<Group, 'id'>): Promise<Group> {
    console.log('POST http://localhost:8080/api/groups', group);
    await randomDelay();
    const newGroup = { ...group, id: `g_${Date.now()}` };
    MOCK_GROUPS.push(newGroup);
    return newGroup;
  },

  // Cards
  async getCards(): Promise<Card[]> {
    console.log('GET http://localhost:8080/api/cards');
    await randomDelay();
    return [...MOCK_CARDS];
  },

  async createCard(card: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
    console.log('POST http://localhost:8080/api/cards', card);
    await randomDelay();
    const newCard: Card = {
      ...card,
      id: `c_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_CARDS.push(newCard);
    return newCard;
  },

  async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
    console.log(`PATCH http://localhost:8080/api/cards/${id}`, updates);
    await randomDelay();
    const index = MOCK_CARDS.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Card not found');
    MOCK_CARDS[index] = { ...MOCK_CARDS[index], ...updates };
    return MOCK_CARDS[index];
  },

  // Actions
  async getActions(): Promise<Action[]> {
    console.log('GET http://localhost:8080/api/actions');
    await randomDelay();
    return [...MOCK_ACTIONS];
  },

  async createAction(action: Omit<Action, 'id'>): Promise<Action> {
    console.log('POST http://localhost:8080/api/actions', action);
    await randomDelay();
    const newAction: Action = { ...action, id: `a_${Date.now()}` };
    MOCK_ACTIONS.push(newAction);
    return newAction;
  },

  async updateAction(id: string, updates: Partial<Pick<Action, 'status' | 'title' | 'description' | 'assigneeId'>>): Promise<Action> {
    console.log(`PATCH http://localhost:8080/api/actions/${id}`, updates);
    await randomDelay();
    const index = MOCK_ACTIONS.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Action not found');
    MOCK_ACTIONS[index] = { ...MOCK_ACTIONS[index], ...updates };
    return { ...MOCK_ACTIONS[index] };
  },

  // AI Semantic Grouping Simulation (Frontend Mock)
  async autoGroupCards(cards: Card[]): Promise<Card[]> {
    console.log('POST http://localhost:8080/api/ai/group (Mock AI processing)');
    await delay(1500); // AI operations take longer
    // Simplistic mock grouping logic
    const groupIds = MOCK_GROUPS.map((g) => g.id);
    const firstGroupId = groupIds[0] ?? null;
    const secondGroupId = groupIds[1] ?? firstGroupId;

    const updatedCards = cards.map(c => {
      if (!c.groupId && firstGroupId) {
        const useSecond = c.content.includes('test') || c.content.includes('bug');
        const target = useSecond && secondGroupId ? secondGroupId : firstGroupId;
        return { ...c, groupId: target };
      }
      return c;
    });
    
    // Update local mock db
    updatedCards.forEach(uc => {
      const idx = MOCK_CARDS.findIndex(mc => mc.id === uc.id);
      if(idx > -1) MOCK_CARDS[idx] = uc;
    });

    return updatedCards;
  },

  // AI Solution Analysis Simulation
  async analyzeTask(cardId: string, content: string, audioUrl?: string): Promise<{ suggestedTitle: string, suggestedDescription: string, recommendedAssigneeId: string }> {
    console.log(`POST http://localhost:8080/api/ai/analyze`, { cardId, content, audioUrl });
    await delay(2000); // Simulate deep reasoning
    
    // Mock response based on dummy inference
    return {
      suggestedTitle: 'Implement AI Analysis Wrapper',
      suggestedDescription: `Analysis based on card content: "${content.substring(0, 30)}...". Need to prioritize testing and documentation.`,
      recommendedAssigneeId: 'u3',
    };
  }
};
