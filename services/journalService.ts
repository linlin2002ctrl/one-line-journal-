import { IJournalService, JournalEntry, NotionConfig, Mood } from '../types';

const STORAGE_KEY = 'oneline_entries';
const CONFIG_KEY = 'oneline_config';

/**
 * Journal Service
 * Manages local storage for offline capability and syncs with the Vercel/Notion backend.
 */
export class MockJournalService implements IJournalService {
  private config: NotionConfig | null = null;

  constructor() {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }

    // Seed some initial data if empty for preview purposes
    if (!localStorage.getItem(STORAGE_KEY)) {
      const seedData: JournalEntry[] = [
        {
          id: '1',
          text: 'Had a great coffee today, finally finished the book.',
          mood: Mood.Happy,
          date: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: '2',
          text: 'Feeling a bit under the weather, slept early.',
          mood: Mood.Tired,
          date: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    }
  }

  async getEntries(): Promise<JournalEntry[]> {
    // Simulate network delay for effect, though purely local now
    await new Promise(resolve => setTimeout(resolve, 300));
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async saveEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    // 1. Optimistic Update: Save to Local Storage immediately
    await new Promise(resolve => setTimeout(resolve, 500)); // Keep a small delay for UI feel
    
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID()
    };

    const currentEntries = await this.getEntries();
    const updatedEntries = [newEntry, ...currentEntries];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    
    // 2. Real Sync to Notion via Vercel Function
    if (this.config?.apiKey && this.config?.databaseId) {
       try {
         const response = await fetch('/api/notion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-notion-token': this.config.apiKey,
              'x-database-id': this.config.databaseId
            },
            body: JSON.stringify({
              text: entry.text,
              mood: entry.mood,
              date: entry.date
            })
         });

         if (!response.ok) {
           const errorData = await response.json();
           console.error('Notion Sync Failed:', errorData);
           // In a full app, we might mark the entry as "unsynced" in local storage here
         } else {
           console.log('Successfully synced to Notion');
         }
       } catch (error) {
         console.error('Network Error during Notion Sync:', error);
       }
    } else {
      console.warn('Skipping Notion sync: Missing API Key or Database ID');
    }

    return newEntry;
  }

  updateConfig(config: NotionConfig): void {
    this.config = config;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

// Singleton instance
export const journalService = new MockJournalService();