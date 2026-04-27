'use client';

import { useState, useRef } from 'react';
import { Recipe, Ingredient } from '@/lib/types';

type Props = {
  recipe?: Recipe;
  pantryItems?: string[];
  onSave: (data: { name: string; description: string; ingredients: Ingredient[] }) => Promise<void>;
  onCancel: () => void;
};

const emptyIngredient = (): Ingredient => ({ name: '', quantity: '', unit: '' });

export default function RecipeForm({ recipe, pantryItems = [], onSave, onCancel }: Props) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [emptyIngredient()]
  );
  const [saving, setSaving] = useState(false);
  const [focusedIngredientIndex, setFocusedIngredientIndex] = useState<number | null>(null);
  const suppressBlur = useRef(false);

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  };

  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        ingredients: ingredients.filter((ing) => ing.name.trim()),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recipe name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pasta Carbonara"
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Classic Italian pasta dish"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Ingredients</label>
          <button
            type="button"
            onClick={addIngredient}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            + Add ingredient
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {ingredients.map((ing, index) => {
            const suggestions = ing.name.trim().length > 0
              ? pantryItems.filter((p) => p.toLowerCase().includes(ing.name.toLowerCase()) && p.toLowerCase() !== ing.name.toLowerCase())
              : [];
            return (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  onFocus={() => setFocusedIngredientIndex(index)}
                  onBlur={() => { if (!suppressBlur.current) setFocusedIngredientIndex(null); }}
                  placeholder="Ingredient"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {focusedIngredientIndex === index && suggestions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-40 overflow-y-auto">
                    {suggestions.map((s) => (
                      <li
                        key={s}
                        onMouseDown={() => { suppressBlur.current = true; }}
                        onMouseUp={() => {
                          updateIngredient(index, 'name', s);
                          setFocusedIngredientIndex(null);
                          suppressBlur.current = false;
                        }}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 cursor-pointer"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="text"
                value={ing.quantity}
                onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                placeholder="Qty"
                className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                placeholder="Unit"
                className="w-16 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : recipe ? 'Save changes' : 'Add recipe'}
        </button>
      </div>
    </form>
  );
}
