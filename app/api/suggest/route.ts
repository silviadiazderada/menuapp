import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pantryItems, recipeNames, slot } = await request.json();

  const pantryList = pantryItems.length > 0
    ? pantryItems.join(', ')
    : 'nothing in particular';

  const recipeList = recipeNames.length > 0
    ? recipeNames.join(', ')
    : 'none saved yet';

  const prompt = `You are a helpful meal planning assistant. The user wants meal suggestions for ${slot || 'lunch or dinner'}.

Pantry/fridge items available: ${pantryList}
User's saved recipes: ${recipeList}

Suggest 5 meal ideas. Prioritize suggestions that use the available pantry items. Mix suggestions from the user's saved recipes (if relevant) and new ideas. Keep suggestions short — just the dish name, 1-2 words of description at most.

Respond with a JSON array of objects like:
[
  { "name": "Pasta Carbonara", "note": "uses eggs & bacon from pantry", "fromLibrary": true },
  { "name": "Grilled Salmon", "note": "quick and healthy", "fromLibrary": false }
]

Only respond with the JSON array, nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const suggestions = JSON.parse(text);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
