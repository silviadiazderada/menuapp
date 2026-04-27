'use client';

import { useState } from 'react';
import { MealSlotType } from '@/lib/types';

type Suggestion = {
  name: string;
  note: string;
  fromLibrary: boolean;
};

type Props = {
  pantryItems: string[];
  recipeNames: string[];
  onPickSuggestion: (name: string) => void;
  targetSlot?: MealSlotType;
};

export default function AISuggestions({ pantryItems, recipeNames, onPickSuggestion, targetSlot }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    setError('');
    setOpen(true);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantryItems, recipeNames, slot: targetSlot }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestions(data.suggestions);
    } catch {
      setError('Could not get suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={getSuggestions}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <span>✨</span>
        {loading ? 'Thinking…' : 'Suggest meals with AI'}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-30">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-medium text-sm text-gray-800">✨ AI Suggestions</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="p-3 flex flex-col gap-1 max-h-72 overflow-y-auto">
            {loading && (
              <div className="text-center py-6 text-sm text-gray-400">
                <div className="animate-spin text-2xl mb-2">✨</div>
                Generating ideas…
              </div>
            )}
            {error && <p className="text-sm text-red-500 text-center py-2">{error}</p>}
            {!loading && suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { onPickSuggestion(s.name); setOpen(false); }}
                className="text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{s.name}</span>
                  {s.fromLibrary && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">saved</span>
                  )}
                </div>
                {s.note && <div className="text-xs text-gray-400 mt-0.5">{s.note}</div>}
              </button>
            ))}
            {!loading && suggestions.length === 0 && !error && (
              <p className="text-sm text-gray-400 text-center py-4">No suggestions yet.</p>
            )}
          </div>
          {!loading && pantryItems.length === 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Tip: Add items to your pantry for better suggestions!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
