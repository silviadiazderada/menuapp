'use client';

import { useState } from 'react';
import { Recipe } from '@/lib/types';

type Props = {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectCustom: (name: string) => void;
  onClose: () => void;
  dayLabel: string;
  slotLabel: string;
};

export default function RecipePicker({ recipes, onSelectRecipe, onSelectCustom, onClose, dayLabel, slotLabel }: Props) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'library' | 'custom'>('library');

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = search.trim();
    if (value) {
      onSelectCustom(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Assign meal</h2>
              <p className="text-sm text-gray-500">{dayLabel} · {slotLabel}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setTab('library')}
              className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === 'library' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              📖 From recipes
            </button>
            <button
              onClick={() => setTab('custom')}
              className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === 'custom' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              ✏️ Custom meal
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'library' ? (
            <>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes…"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {recipes.length === 0 ? 'No recipes saved yet. Add some in the Recipes section!' : 'No matching recipes.'}
                  </p>
                ) : (
                  filtered.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => onSelectRecipe(recipe)}
                      className="text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-800">{recipe.name}</div>
                      {recipe.description && (
                        <div className="text-xs text-gray-400 mt-0.5">{recipe.description}</div>
                      )}
                      {recipe.ingredients?.length > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Scrambled eggs and toast"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="text-xs text-gray-400">Custom meals won&apos;t be added to your ingredient shopping list automatically.</p>
              <button
                type="submit"
                disabled={!search.trim()}
                className="w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
              >
                Set meal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
