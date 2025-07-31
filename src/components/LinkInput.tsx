import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface LinkInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const LinkInput: React.FC<LinkInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }
    
    setError(null);
    onSubmit(url);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL to analyze..."
          className={`w-full px-6 py-3 pr-12 rounded-[24px] border focus:outline-none focus:ring-2 transition-all duration-200 ${
            error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-indigo-200'
          } shadow-sm`}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#fbd050] hover:bg-[#f8c83e] text-slate-800 p-2 rounded-[24px] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <Send size={18} />
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default LinkInput;