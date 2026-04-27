'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Nav from '@/components/Nav';
import { WeeklyMenuItem, PantryItem, ShoppingIngredient } from '@/lib/types';

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

export default function ShoppingPage() {
  const supabase = createClient();

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [ingredients, setIngredients] = useState<ShoppingIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [customItems, setCustomItems] = useState<ShoppingIngredient[]>([]);
  const [newCustom, setNewCustom] = useState('');

  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(addDays(weekStart, 6));

  const buildList = useCallback(async () => {
    setLoading(true);

    const [menuRes, pantryRes] = await Promise.all([
      supabase
        .from('weekly_menu')
        .select('*, recipe:recipes(name, ingredients)')
        .eq('week_start', weekStartStr),
      supabase.from('pantry_items').select('*'),
    ]);

    const menuItems = (menuRes.data as WeeklyMenuItem[]) ?? [];
    const pantryItems = (pantryRes.data as PantryItem[]) ?? [];
    const pantryNames = new Set(pantryItems.map((p) => normalizeIngredientName(p.name)));

    const ingredientMap: Map<string, ShoppingIngredient> = new Map();

    for (const item of menuItems) {
      if (!item.recipe?.ingredients) continue;
      for (const ing of item.recipe.ingredients) {
        const key = normalizeIngredientName(ing.name);
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.fromMeals.push(item.recipe.name ?? '');
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            fromMeals: [item.recipe.name ?? ''],
            checked: pantryNames.has(key),
          });
        }
      }
    }

    setIngredients(Array.from(ingredientMap.values()).sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return a.name.localeCompare(b.name);
    }));
    setLoading(false);
  }, [weekStartStr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { buildList(); }, [buildList]);

  const toggleIngredient = (name: string) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        normalizeIngredientName(ing.name) === normalizeIngredientName(name)
          ? { ...ing, checked: !ing.checked }
          : ing
      )
    );
  };

  const addCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCustom.trim();
    if (!name) return;
    setCustomItems((prev) => [...prev, { name, quantity: '', unit: '', fromMeals: [], checked: false }]);
    setNewCustom('');
  };

  const toggleCustom = (index: number) => {
    setCustomItems((prev) => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const removeCustom = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const uncheckedCount = ingredients.filter((i) => !i.checked).length + customItems.filter((i) => !i.checked).length;

  const weekLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
            <p className="text-sm text-gray-500 mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setWeekStart(getMondayOf(new Date()))}
              className="px-3 py-1.5 rounded-lg border border-orange-200 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
            >
              This week
            </button>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Building your list…</div>
        ) : (
          <>
            {ingredients.length === 0 && customItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-4xl mb-3">🛒</div>
                <p className="font-medium">No meals planned for this week</p>
                <p className="text-sm mt-1">
                  <a href="/menu" className="text-orange-500 hover:underline">Plan your menu</a> to auto-generate a shopping list.
                </p>
              </div>
            ) : (
              <>
                {uncheckedCount > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                    <span className="text-orange-500">🛒</span>
                    <span className="text-sm font-medium text-orange-700">
                      {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} to buy
                    </span>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-semibold text-gray-600">From your menu ({weekLabel})</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Crossed-out items are already in your pantry — uncheck to add them back.</p>
                  </div>
                  {ingredients.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-400 text-center">
                      No recipes with ingredients planned this week.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {ingredients.map((ing) => (
                        <label
                          key={ing.name}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${ing.checked ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={ing.checked}
                            onChange={() => toggleIngredient(ing.name)}
                            className="mt-0.5 accent-orange-500 w-4 h-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${ing.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {ing.quantity && `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''} `}{ing.name}
                            </span>
                            {ing.fromMeals.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                for: {[...new Set(ing.fromMeals)].join(', ')}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Custom items */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-600">Extra items</h2>
              </div>
              <div className="p-4">
                <form onSubmit={addCustomItem} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCustom}
                    onChange={(e) => setNewCustom(e.target.value)}
                    placeholder="Add something else…"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button
                    type="submit"
                    disabled={!newCustom.trim()}
                    className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </form>
                {customItems.map((item, i) => (
                  <label key={i} className={`flex items-center gap-3 py-2 cursor-pointer ${item.checked ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleCustom(i)}
                      className="accent-orange-500 w-4 h-4 flex-shrink-0"
                    />
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeCustom(i)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                    >
                      ×
                    </button>
                  </label>
                ))}
                {customItems.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Nothing added yet.</p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              This list resets when you reload — copy it to your notes before shopping!
            </p>
          </>
        )}
      </main>
    </div>
  );
}
