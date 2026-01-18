import React, { useState, useEffect, useCallback } from 'react';
import { PenLine, History, Settings, Save, AlertCircle, Moon, Sun, Monitor } from 'lucide-react';
import { Tab, Mood, JournalEntry, NotionConfig } from './types';
import { journalService } from './services/journalService';
import { MoodSelector } from './components/MoodSelector';
import { EntryList } from './components/EntryList';
import { useTheme } from './hooks/useTheme';

const MAX_CHARS = 280;

export default function App() {
  // Theme State
  const { theme, setTheme } = useTheme();

  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Write);
  
  // Data State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Write Form State
  const [text, setText] = useState('');
  const [mood, setMood] = useState<Mood>(Mood.Neutral);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings State
  const [config, setConfig] = useState<NotionConfig>({ apiKey: '', databaseId: '' });

  // Load initial data
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await journalService.getEntries();
      // Sort by date desc
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
    // Load config from local storage via service
    const storedConfig = localStorage.getItem('oneline_config');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
  }, [loadEntries]);

  // Handlers
  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    try {
      const result = await journalService.saveEntry({
        text,
        mood,
        date: new Date().toISOString()
      });

      if (result.synced) {
        alert('Entry Saved to Notion!');
      } else if (result.error) {
        // Saved locally but failed to sync
        alert(`Saved locally, but failed to sync with Notion: ${result.error}`);
      }

      setText('');
      setMood(Mood.Neutral);
      // Switch to history to see the new entry
      await loadEntries(); // Refresh list
      setActiveTab(Tab.History);
    } catch (error) {
      console.error("Failed to save", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigSave = () => {
    journalService.updateConfig(config);
    alert('Settings saved!');
  };

  const isConfigured = config.apiKey && config.databaseId;

  // Render Helpers
  const renderWrite = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-primary mb-2">How was your day?</h1>
          <p className="text-secondary">Capture it in one line.</p>
        </header>

        <div className="space-y-4">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Your Mood</label>
          <MoodSelector selected={mood} onSelect={setMood} />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Your Line</label>
          <div className="relative">
            <textarea
              className="w-full h-32 bg-surface text-primary rounded-xl p-4 border border-primary/10 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none text-lg placeholder-secondary/50"
              placeholder="Today I..."
              maxLength={MAX_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className={`absolute bottom-3 right-3 text-xs ${text.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-secondary'}`}>
              {text.length}/{MAX_CHARS}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!text.trim() || isSaving}
        className={`
          w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
          ${!text.trim() || isSaving 
            ? 'bg-surface text-secondary cursor-not-allowed' 
            : 'bg-primary text-background hover:opacity-90 active:scale-95 shadow-lg shadow-primary/10'}
        `}
      >
        {isSaving ? 'Saving...' : <><Save size={20} /> Save Entry</>}
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">History</h1>
        <p className="text-secondary text-sm">Your past days at a glance.</p>
      </header>
      <EntryList entries={entries} isLoading={isLoading} />
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full">
       <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-secondary text-sm">Configure app preferences.</p>
      </header>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="space-y-4">
           <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Appearance</label>
           <div className="grid grid-cols-3 gap-3">
             <button 
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-primary/10 border-accent text-accent' : 'bg-surface border-transparent text-secondary hover:bg-primary/5'}`}
             >
                <Sun size={24} />
                <span className="text-xs font-medium">Light</span>
             </button>
             <button 
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-primary/10 border-accent text-accent' : 'bg-surface border-transparent text-secondary hover:bg-primary/5'}`}
             >
                <Moon size={24} />
                <span className="text-xs font-medium">Dark</span>
             </button>
             <button 
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'system' ? 'bg-primary/10 border-accent text-accent' : 'bg-surface border-transparent text-secondary hover:bg-primary/5'}`}
             >
                <Monitor size={24} />
                <span className="text-xs font-medium">System</span>
             </button>
           </div>
        </div>

        <div className="border-t border-primary/5 my-4"></div>

        {/* Notion Config Section */}
        {!isConfigured && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 items-start">
            <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-400">
              <p className="font-semibold mb-1">Preview Mode</p>
              <p className="opacity-80">Currently saving to local storage. Configure Notion below to sync.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Notion Integration</label>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Notion API Key</label>
            <input 
              type="password"
              className="w-full bg-surface border border-primary/10 rounded-lg p-3 text-primary focus:border-accent outline-none placeholder-secondary/30"
              placeholder="secret_..."
              value={config.apiKey}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Database ID</label>
            <input 
              type="text"
              className="w-full bg-surface border border-primary/10 rounded-lg p-3 text-primary focus:border-accent outline-none placeholder-secondary/30"
              placeholder="32 characters..."
              value={config.databaseId}
              onChange={(e) => setConfig({...config, databaseId: e.target.value})}
            />
          </div>
        </div>

        <button 
          onClick={handleConfigSave}
          className="w-full bg-surface border border-primary/10 hover:bg-primary/5 text-primary font-medium py-3 rounded-xl transition-colors"
        >
          Save Configuration
        </button>

        <div className="text-xs text-secondary pt-4 border-t border-primary/5 text-center">
          <p>OneLine v1.1.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen font-sans text-primary flex flex-col items-center transition-colors duration-300">
      {/* Mobile Container */}
      <main className="w-full max-w-md bg-background min-h-screen flex flex-col relative shadow-2xl transition-colors duration-300">
        
        {/* Content Area */}
        <div className="flex-1 p-6 pb-28 overflow-y-auto no-scrollbar">
          {activeTab === Tab.Write && renderWrite()}
          {activeTab === Tab.History && renderHistory()}
          {activeTab === Tab.Settings && renderSettings()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-background/80 backdrop-blur-lg border-t border-primary/10 px-6 py-4 flex justify-between items-center z-50 transition-colors duration-300">
          <button 
            onClick={() => setActiveTab(Tab.History)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.History ? 'text-accent' : 'text-secondary hover:text-primary'}`}
          >
            <History size={24} />
            <span className="text-[10px] font-medium">History</span>
          </button>

          <button 
            onClick={() => setActiveTab(Tab.Write)}
            className="flex items-center justify-center -mt-8 bg-primary text-background p-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <PenLine size={28} />
          </button>

          <button 
            onClick={() => setActiveTab(Tab.Settings)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.Settings ? 'text-accent' : 'text-secondary hover:text-primary'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      </main>
    </div>
  );
}