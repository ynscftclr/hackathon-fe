export interface Person {
  id: string;
  name: string;
  surname: string;
  role: 'lead' | 'user';
}

export interface Group {
  id: string;
  title: string;
  description?: string;
}

export interface Card {
  id: string;
  content: string;
  authorId: string;
  groupId: string | null; // null if not yet grouped
  audioUrl?: string; // For wave surfer / media recorder
  createdAt: string; // ISO date string
  /** Süre dolmadan başkasının kartı (retro panosu) */
  contentMasked?: boolean;
  /** Retro: true ise isim, false/undefined ise ** */
  showAuthorName?: boolean;
  /** Retro: emoji → adet (kartlar açıldıktan sonra) */
  emojiCounts?: Record<string, number>;
  agreeCount?: number;
  disagreeCount?: number;
  /** Retro: bu kullanıcının bu karttaki oyu */
  myVote?: 'AGREE' | 'DISAGREE' | null;
}

export type RetroSynthesisStatus = 'IDLE' | 'RUNNING' | 'DONE' | 'FAILED';

export interface RetroSynthesisItem {
  cardId: string;
  content: string;
  agreeCount: number;
  disagreeCount: number;
}

export interface RetroSynthesisGroup {
  title: string;
  items: RetroSynthesisItem[];
}

export interface RetroSynthesisResult {
  groups: RetroSynthesisGroup[];
}

export interface Action {
  id: string;
  cardId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'todo' | 'in_progress' | 'done';
}

export type EntryBoardColumn = 'good' | 'improve';

export interface EntryBoardItem {
  id: string;
  boardId: string;
  column: EntryBoardColumn;
  content: string;
  showAuthorName: boolean;
  authorName: string | null;
  createdAt: string;
}

// API Response Wrappers (Optional but good practice)
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
