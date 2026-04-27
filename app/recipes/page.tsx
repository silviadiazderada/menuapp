'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Nav from '@/components/Nav';
import RecipeForm from '@/components/RecipeForm';
import { Recipe, Ingredient } from '@/lib/types';

export default function RecipesPage() {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const [pantryItems, setPantryItems] = useState<string[]>([]);

  const loadRecipes = async () => {
    setLoading(true);
    const [{ data: recipeData }, { data: pantryData }] = await Promise.all([
      supabase.from('recipes').select('*').order('name'),
      supabase.from('pantry_items').select('name').order('name'),
    ]);
    setRecipes((recipeData as Recipe[]) ?? []);
    setPantryItems((pantryData ?? []).map((p: { name: string }) => p.name));
    setLoading(false);
  };

  useEffect(() => { loadRecipes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (data: { name: string; description: string; ingredients: Ingredient[] }) => {
    if (editingRecipe) {
      await supabase.from('recipes').update(data).eq('id', editingRecipe.id);
    } else {
      await supabase.from('recipes').insert(data);
    }
    setShowForm(false);
    setEditingRecipe(null);
    await loadRecipes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    setDeleting(id);
    await supabase.from('recipes').delete().eq('id', id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  };

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button
            onClick={() => { setEditingRecipe(null); setShowForm(true); }}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            + Add recipe
          </button>
        </div>

        {(showForm || editingRecipe) && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">{editingRecipe ? 'Edit recipe' : 'New recipe'}</h2>
            <RecipeForm
              recipe={editingRecipe ?? undefined}
              pantryItems={pantryItems}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingRecipe(null); }}
            />
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {recipes.length === 0 ? (
              <div>
                <div className="text-4xl mb-3">📖</div>
                <p className="font-medium">No recipes yet</p>
                <p className="text-sm mt-1">Add your first recipe to get started.</p>
              </div>
            ) : (
              <p>No recipes match &quot;{search}&quot;</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <button
                    className="flex-1 text-left"
                    onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                  >
                    <div className="font-semibold text-gray-900">{recipe.name}</div>
                    {recipe.description && (
                      <div className="text-sm text-gray-500 mt-0.5">{recipe.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {recipe.ingredients?.length ?? 0} ingredient{recipe.ingredients?.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => { setEditingRecipe(recipe); setShowForm(false); }}
                      className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      disabled={deleting === recipe.id}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedId === recipe.id && recipe.ingredients?.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-orange-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ingredients</p>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ing, i) => (
                        <span key={i} className="bg-white border border-orange-100 text-sm text-gray-700 px-3 py-1 rounded-full">
                          {ing.quantity && `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''} `}{ing.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
