import React from 'react';
import { Mood } from '../types';
import { Smile, Meh, Frown, Zap, Coffee } from 'lucide-react';

interface MoodSelectorProps {
  selected: Mood;
  onSelect: (mood: Mood) => void;
}

const MoodConfig: Record<Mood, { icon: React.ReactNode, label: string, color: string }> = {
  [Mood.Happy]: { icon: <Smile size={24} />, label: 'Happy', color: 'bg-green-500/10 text-green-500 border-green-500/50' },
  [Mood.Neutral]: { icon: <Meh size={24} />, label: 'Neutral', color: 'bg-gray-500/10 text-gray-500 border-gray-500/50' },
  [Mood.Sad]: { icon: <Frown size={24} />, label: 'Sad', color: 'bg-blue-500/10 text-blue-500 border-blue-500/50' },
  [Mood.Energetic]: { icon: <Zap size={24} />, label: 'Energetic', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' },
  [Mood.Tired]: { icon: <Coffee size={24} />, label: 'Tired', color: 'bg-purple-500/10 text-purple-500 border-purple-500/50' },
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex justify-between items-center w-full gap-2 py-4 overflow-x-auto no-scrollbar">
      {(Object.keys(MoodConfig) as Mood[]).map((mood) => {
        const config = MoodConfig[mood];
        const isSelected = selected === mood;
        
        return (
          <button
            key={mood}
            onClick={() => onSelect(mood)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border
              min-w-[4.5rem]
              ${isSelected 
                ? `${config.color} scale-105 shadow-md` 
                : 'bg-surface border-transparent text-secondary hover:bg-primary/5'}
            `}
          >
            <div className="mb-1">{config.icon}</div>
            <span className="text-xs font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};