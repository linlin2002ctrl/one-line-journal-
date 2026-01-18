import React, { useState, useEffect, useCallback } from 'react';
import { PenLine, History, Settings, Save, AlertCircle } from 'lucide-react';
import { Tab, Mood, JournalEntry, NotionConfig } from './types';
import { journalService } from './services/journalService';
import { MoodSelector } from './components/MoodSelector';
import { EntryList } from './components/EntryList';

const MAX_CHARS = 280;

export default function App() {
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
    // Load config from local storage via service (or direct for simplicity if service exposes it)
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
          <h1 className="text-3xl font-bold text-white mb-2">How was your day?</h1>
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
              className="w-full h-32 bg-surface text-white rounded-xl p-4 border border-white/10 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none text-lg"
              placeholder="Today I..."
              maxLength={MAX_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className={`absolute bottom-3 right-3 text-xs ${text.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-zinc-500'}`}>
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
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
            : 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10'}
        `}
      >
        {isSaving ? 'Saving...' : <><Save size={20} /> Save Entry</>}
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-secondary text-sm">Your past days at a glance.</p>
      </header>
      <EntryList entries={entries} isLoading={isLoading} />
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full">
       <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-secondary text-sm">Configure your Notion Integration.</p>
      </header>

      <div className="space-y-6">
        {!isConfigured && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 items-start">
            <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Preview Mode</p>
              <p className="opacity-80">Currently saving to local storage for demo purposes. Fill in the details below to prepare for Notion sync.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Notion API Key</label>
            <input 
              type="password"
              className="w-full bg-surface border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
              placeholder="secret_..."
              value={config.apiKey}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Database ID</label>
            <input 
              type="text"
              className="w-full bg-surface border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
              placeholder="32 characters..."
              value={config.databaseId}
              onChange={(e) => setConfig({...config, databaseId: e.target.value})}
            />
          </div>
        </div>

        <button 
          onClick={handleConfigSave}
          className="w-full bg-surface border border-white/10 hover:bg-white/5 text-white font-medium py-3 rounded-xl transition-colors"
        >
          Save Configuration
        </button>

        <div className="text-xs text-zinc-600 pt-4 border-t border-white/5">
          <p>OneLine v1.0.0 (Preview)</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen font-sans text-zinc-100 flex flex-col items-center">
      {/* Mobile Container */}
      <main className="w-full max-w-md bg-background min-h-screen flex flex-col relative shadow-2xl">
        
        {/* Content Area */}
        <div className="flex-1 p-6 pb-28 overflow-y-auto no-scrollbar">
          {activeTab === Tab.Write && renderWrite()}
          {activeTab === Tab.History && renderHistory()}
          {activeTab === Tab.Settings && renderSettings()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-background/80 backdrop-blur-lg border-t border-white/10 px-6 py-4 flex justify-between items-center z-50">
          <button 
            onClick={() => setActiveTab(Tab.History)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.History ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <History size={24} />
            <span className="text-[10px] font-medium">History</span>
          </button>

          <button 
            onClick={() => setActiveTab(Tab.Write)}
            className="flex items-center justify-center -mt-8 bg-white text-black p-4 rounded-full shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-all"
          >
            <PenLine size={28} />
          </button>

          <button 
            onClick={() => setActiveTab(Tab.Settings)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.Settings ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      </main>
    </div>
  );
}