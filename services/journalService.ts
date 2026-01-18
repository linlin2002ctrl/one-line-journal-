import { IJournalService, JournalEntry, NotionConfig, Mood } from '../types';

const STORAGE_KEY = 'oneline_entries';
const CONFIG_KEY = 'oneline_config';

/**
 * Mock Service (Local Storage)
 * Simulates network calls to demonstrate the UI flow before Notion integration.
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async saveEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID()
    };

    const currentEntries = await this.getEntries();
    const updatedEntries = [newEntry, ...currentEntries];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    
    // In a real app, this is where we would also trigger the Notion API call
    if (this.config?.apiKey && this.config?.databaseId) {
       console.log('Attempting to sync with Notion (Mock):', this.config);
       // this.syncToNotion(newEntry); 
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