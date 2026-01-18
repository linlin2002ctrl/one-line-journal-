import React from 'react';
import { JournalEntry, Mood } from '../types';
import { Smile, Meh, Frown, Zap, Coffee, Calendar } from 'lucide-react';

interface EntryListProps {
  entries: JournalEntry[];
  isLoading: boolean;
}

const getMoodIcon = (mood: Mood) => {
  switch (mood) {
    case Mood.Happy: return <Smile size={16} className="text-green-400" />;
    case Mood.Neutral: return <Meh size={16} className="text-gray-400" />;
    case Mood.Sad: return <Frown size={16} className="text-blue-400" />;
    case Mood.Energetic: return <Zap size={16} className="text-yellow-400" />;
    case Mood.Tired: return <Coffee size={16} className="text-purple-400" />;
    default: return <Meh size={16} />;
  }
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

export const EntryList: React.FC<EntryListProps> = ({ entries, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface h-24 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-secondary">
        <div className="bg-surface p-4 rounded-full mb-4">
          <Calendar size={32} />
        </div>
        <p>No entries yet. Write your first line!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-surface p-4 rounded-xl border border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-md">
              {getMoodIcon(entry.mood)}
              <span className="text-xs font-medium text-secondary uppercase tracking-wider">{entry.mood}</span>
            </div>
            <span className="text-xs text-zinc-500">{formatDate(entry.date)}</span>
          </div>
          <p className="text-zinc-200 leading-relaxed font-light text-lg">
            {entry.text}
          </p>
        </div>
      ))}
    </div>
  );
};