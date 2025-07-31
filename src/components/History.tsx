import React from 'react';
import { Trash2 } from 'lucide-react';
import HistoryItem from './HistoryItem';

interface HistoryProps {
  items: Array<{ url: string; timestamp: number }>;
  onSelectItem: (url: string) => void;
  onClearHistory: () => void;
}

const History: React.FC<HistoryProps> = ({ items, onSelectItem, onClearHistory }) => {
  if (items.length === 0) return null;

  return (
    <div className="p-2">
      <div className="flex justify-between items-center px-4 py-2">
        <h3 className="text-sm font-medium text-slate-700">History</h3>
        <button
          onClick={onClearHistory}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200 flex items-center gap-1"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {items.map((item, index) => (
          <HistoryItem
            key={index}
            url={item.url}
            timestamp={item.timestamp}
            onSelect={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
};

export default History;