import React from 'react';
import { Clock } from 'lucide-react';

interface HistoryItemProps {
  url: string;
  timestamp: number;
  onSelect: (url: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ url, timestamp, onSelect }) => {
  const formatTime = (timestamp: number): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={() => onSelect(url)}
      className="group flex items-center justify-between w-full px-4 py-2 text-left hover:bg-slate-50 rounded-[24px] transition-colors duration-200"
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <Clock size={14} className="text-slate-400 shrink-0" />
        <span className="text-sm text-slate-700">
          {url}
        </span>
      </div>
      <span className="text-xs text-slate-500 ml-4 shrink-0">
        {formatTime(timestamp)}
      </span>
    </button>
  );
};

export default HistoryItem;