export enum Mood {
  Happy = 'Happy',
  Neutral = 'Neutral',
  Sad = 'Sad',
  Energetic = 'Energetic',
  Tired = 'Tired'
}

export interface JournalEntry {
  id: string;
  text: string;
  mood: Mood;
  date: string; // ISO String
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export interface IJournalService {
  getEntries(): Promise<JournalEntry[]>;
  saveEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry>;
  updateConfig(config: NotionConfig): void;
}

export enum Tab {
  Write = 'write',
  History = 'history',
  Settings = 'settings'
}