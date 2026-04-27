'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Nav from '@/components/Nav';
import RecipePicker from '@/components/RecipePicker';
import AISuggestions from '@/components/AISuggestions';
import { Recipe, WeeklyMenuItem, MealSlotType } from '@/lib/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS: { key: MealSlotType; label: string }[] = [
  { key: 'lunch', label: '☀️ Lunch' },
  { key: 'dinner', label: '🌙 Dinner' },
];

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

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type PickerTarget = { dayIndex: number; slot: MealSlotType } | null;

export default function MenuPage() {
  const supabase = createClient();

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [menuItems, setMenuItems] = useState<WeeklyMenuItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [loading, setLoading] = useState(true);

  const weekStartStr = formatDate(weekStart);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [menuRes, recipesRes, pantryRes] = await Promise.all([
      supabase
        .from('weekly_menu')
        .select('*, recipe:recipes(*)')
        .eq('week_start', weekStartStr),
      supabase.from('recipes').select('*').order('name'),
      supabase.from('pantry_items').select('name'),
    ]);
    setMenuItems((menuRes.data as WeeklyMenuItem[]) ?? []);
    setRecipes((recipesRes.data as Recipe[]) ?? []);
    setPantryItems((pantryRes.data ?? []).map((p: { name: string }) => p.name));
    setLoading(false);
  }, [weekStartStr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  const getMealName = (dayIndex: number, slot: MealSlotType): string | null => {
    const item = menuItems.find((m) => m.day_of_week === dayIndex && m.meal_slot === slot);
    if (!item) return null;
    return item.recipe?.name ?? item.custom_meal ?? null;
  };

  const assignMeal = async (dayIndex: number, slot: MealSlotType, recipeId: string | null, customMeal: string | null) => {
    const existing = menuItems.find((m) => m.day_of_week === dayIndex && m.meal_slot === slot);
    if (existing) {
      await supabase
        .from('weekly_menu')
        .update({ recipe_id: recipeId, custom_meal: customMeal })
        .eq('id', existing.id);
    } else {
      await supabase.from('weekly_menu').insert({
        week_start: weekStartStr,
        day_of_week: dayIndex,
        meal_slot: slot,
        recipe_id: recipeId,
        custom_meal: customMeal,
      });
    }
    await loadData();
  };

  const clearMeal = async (dayIndex: number, slot: MealSlotType) => {
    const existing = menuItems.find((m) => m.day_of_week === dayIndex && m.meal_slot === slot);
    if (existing) {
      await supabase.from('weekly_menu').delete().eq('id', existing.id);
      setMenuItems((prev) => prev.filter((m) => m.id !== existing.id));
    }
  };

  const handlePickRecipe = async (recipe: Recipe) => {
    if (!pickerTarget) return;
    await assignMeal(pickerTarget.dayIndex, pickerTarget.slot, recipe.id, null);
    setPickerTarget(null);
  };

  const handlePickCustom = async (name: string) => {
    if (!pickerTarget) return;
    await assignMeal(pickerTarget.dayIndex, pickerTarget.slot, null, name);
    setPickerTarget(null);
  };

  const handleAISuggestion = (name: string) => {
    if (!pickerTarget) return;
    handlePickCustom(name);
  };

  const weekLabel = () => {
    const end = addDays(weekStart, 6);
    return `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
            <p className="text-sm text-gray-500 mt-0.5">{weekLabel()}</p>
          </div>
          <div className="flex items-center gap-2">
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
              Today
            </button>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
            <AISuggestions
              pantryItems={pantryItems}
              recipeNames={recipes.map((r) => r.name)}
              onPickSuggestion={(name) => {
                if (pickerTarget) {
                  handleAISuggestion(name);
                }
              }}
              targetSlot={pickerTarget?.slot}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-3" />
              {DAYS.map((day, i) => (
                <div key={day} className="p-3 text-center border-l border-gray-100">
                  <div className="font-semibold text-sm text-gray-700">{day}</div>
                  <div className="text-xs text-gray-400">{formatDayHeader(addDays(weekStart, i))}</div>
                </div>
              ))}
            </div>

            {/* Meal rows */}
            {SLOTS.map((slot) => (
              <div key={slot.key} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
                <div className="p-3 flex items-center justify-center bg-gray-50 border-r border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 writing-mode-vertical text-center">{slot.label}</span>
                </div>
                {DAYS.map((_, dayIndex) => {
                  const meal = getMealName(dayIndex, slot.key);
                  return (
                    <div
                      key={dayIndex}
                      className="border-l border-gray-100 p-2 min-h-20 flex flex-col group"
                    >
                      {meal ? (
                        <div className="flex-1 flex flex-col justify-between">
                          <p className="text-sm text-gray-800 font-medium leading-snug">{meal}</p>
                          <button
                            onClick={() => clearMeal(dayIndex, slot.key)}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-left mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPickerTarget({ dayIndex, slot: slot.key })}
                          className="flex-1 flex items-center justify-center text-gray-300 hover:text-orange-400 hover:bg-orange-50 rounded-lg transition-colors text-2xl"
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <a
            href="/shopping"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            🛒 View shopping list
          </a>
        </div>
      </main>

      {pickerTarget !== null && (
        <RecipePicker
          recipes={recipes}
          onSelectRecipe={handlePickRecipe}
          onSelectCustom={handlePickCustom}
          onClose={() => setPickerTarget(null)}
          dayLabel={`${DAYS[pickerTarget.dayIndex]}, ${formatDayHeader(addDays(weekStart, pickerTarget.dayIndex))}`}
          slotLabel={SLOTS.find((s) => s.key === pickerTarget.slot)?.label ?? ''}
        />
      )}
    </div>
  );
}
