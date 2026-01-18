import { IJournalService, JournalEntry, NotionConfig, Mood, SaveResult } from '../types';

const STORAGE_KEY = 'oneline_entries';
const CONFIG_KEY = 'oneline_config';

/**
 * Journal Service
 * Manages local storage for offline capability and syncs with the Vercel/Notion backend.
 */
export class JournalService implements IJournalService {
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
    // 1. Fetch from Notion API if Configured
    if (this.config?.apiKey && this.config?.databaseId) {
      try {
        const response = await fetch('/api/notion', {
          method: 'GET',
          headers: {
            'x-notion-token': this.config.apiKey,
            'x-database-id': this.config.databaseId
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          console.error("Failed to fetch entries from Notion API");
          // If fetch fails (e.g. auth error), return empty or handle gracefully
          return [];
        }
      } catch (error) {
        console.error("Network error fetching entries:", error);
        return [];
      }
    }

    // 2. Preview Mode (Local Storage) - Only used if not configured
    await new Promise(resolve => setTimeout(resolve, 300));
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async saveEntry(entry: Omit<JournalEntry, 'id'>): Promise<SaveResult> {
    // 1. Optimistic Update: Save to Local Storage immediately
    // We keep this for "Preview Mode" continuity and potential offline support
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID()
    };

    // Update local storage so Preview Mode still works if keys are cleared
    const raw = localStorage.getItem(STORAGE_KEY);
    const currentEntries = raw ? JSON.parse(raw) : [];
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
           return { 
             entry: newEntry, 
             synced: false, 
             error: errorData.error || errorData.details || 'Server returned an error.' 
           };
         } else {
           return { entry: newEntry, synced: true };
         }
       } catch (error: any) {
         console.error('Network Error during Notion Sync:', error);
         return { 
           entry: newEntry, 
           synced: false, 
           error: error.message || 'Network error occurred.' 
         };
       }
    }

    // Default case: Saved locally (Preview Mode)
    return { entry: newEntry, synced: false };
  }

  updateConfig(config: NotionConfig): void {
    this.config = config;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

// Singleton instance
export const journalService = new JournalService();