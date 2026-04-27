export type Ingredient = {
  name: string;
  quantity: string;
  unit: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  ingredients: Ingredient[];
  created_at: string;
};

export type MealSlotType = 'lunch' | 'dinner';

export type WeeklyMenuItem = {
  id: string;
  user_id: string;
  week_start: string;
  day_of_week: number;
  meal_slot: MealSlotType;
  recipe_id: string | null;
  custom_meal: string | null;
  recipe?: Recipe;
  created_at: string;
};

export type PantryItem = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type ShoppingIngredient = {
  name: string;
  quantity: string;
  unit: string;
  fromMeals: string[];
  checked: boolean;
};
