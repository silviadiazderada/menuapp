'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Nav from '@/components/Nav';
import { PantryItem } from '@/lib/types';

export default function PantryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('pantry_items').select('*').order('name');
    setItems((data as PantryItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    setAdding(true);
    const { data } = await supabase.from('pantry_items').insert({ name }).select().single();
    if (data) {
      setItems((prev) => [...prev, data as PantryItem].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setNewItem('');
    setAdding(false);
    inputRef.current?.focus();
  };

  const handleRemove = async (id: string) => {
    await supabase.from('pantry_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pantry</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track what you have at home. These items will be pre-checked in your shopping list and used by the AI for meal suggestions.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="e.g. Rice, olive oil, eggs…"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              disabled={adding || !newItem.trim()}
              className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {adding ? '…' : 'Add'}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🥫</div>
            <p className="font-medium">Your pantry is empty</p>
            <p className="text-sm mt-1">Add ingredients you usually have at home.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-800">{item.name}</span>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none ml-3"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            {items.length} item{items.length !== 1 ? 's' : ''} in your pantry
          </p>
        )}
      </main>
    </div>
  );
}
