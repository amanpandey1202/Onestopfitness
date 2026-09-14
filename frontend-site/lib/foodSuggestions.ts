// Curated quick-add foods for the diet plan meal builder.
// Each entry has a default quantity and approximate calories so trainers can
// add items instantly without typing nutrition from memory.

export type FoodSuggestion = {
  name: string;
  quantity: string;
  calories: number;
};

export type FoodCategory = {
  label: string;
  foods: FoodSuggestion[];
};

export const FOOD_SUGGESTIONS: FoodCategory[] = [
  {
    label: "Breakfast",
    foods: [
      { name: "Oats with Milk", quantity: "60g oats + 250ml milk", calories: 300 },
      { name: "Boiled Eggs", quantity: "2 whole + 2 whites", calories: 180 },
      { name: "Oats Omelette", quantity: "3 eggs + 30g oats", calories: 320 },
      { name: "Poha", quantity: "200g", calories: 240 },
      { name: "Idli (4)", quantity: "4 pieces", calories: 210 },
      { name: "Moong Dal Chilla", quantity: "2 pieces", calories: 260 },
      { name: "Bread & Peanut Butter", quantity: "2 slices + 1 tbsp", calories: 290 },
      { name: "Sprouts Salad", quantity: "150g", calories: 150 },
    ],
  },
  {
    label: "Lunch / Dinner",
    foods: [
      { name: "Grilled Chicken Breast", quantity: "150g", calories: 240 },
      { name: "Chicken Curry", quantity: "150g + gravy", calories: 310 },
      { name: "Paneer Bhurji", quantity: "150g paneer", calories: 330 },
      { name: "Grilled Fish", quantity: "150g", calories: 210 },
      { name: "Dal (1 bowl)", quantity: "250ml", calories: 180 },
      { name: "Brown Rice", quantity: "100g cooked", calories: 130 },
      { name: "Roti (3)", quantity: "100g", calories: 300 },
      { name: "Mixed Veg Sabzi", quantity: "200g", calories: 140 },
      { name: "Egg Curry", quantity: "2 eggs + gravy", calories: 250 },
    ],
  },
  {
    label: "Snacks",
    foods: [
      { name: "Curd / Greek Yogurt", quantity: "150g", calories: 120 },
      { name: "Banana", quantity: "1 medium", calories: 105 },
      { name: "Apple", quantity: "1 medium", calories: 95 },
      { name: "Mixed Nuts", quantity: "30g", calories: 180 },
      { name: "Peanuts", quantity: "30g", calories: 170 },
      { name: "Boiled Chana", quantity: "150g", calories: 180 },
      { name: "Roasted Makhana", quantity: "30g", calories: 100 },
      { name: "Coffee with Milk", quantity: "1 cup", calories: 60 },
    ],
  },
  {
    label: "Supplements",
    foods: [
      { name: "Whey Protein Scoop", quantity: "1 scoop (30g)", calories: 120 },
      { name: "Whey with Water", quantity: "1 scoop + water", calories: 120 },
      { name: "Whey with Milk", quantity: "1 scoop + 250ml milk", calories: 220 },
      { name: "Casein Protein", quantity: "1 scoop", calories: 120 },
      { name: "Creatine", quantity: "5g", calories: 0 },
      { name: "Electrolyte Drink", quantity: "1 serving", calories: 30 },
    ],
  },
  {
    label: "Other",
    foods: [
      { name: "Green Salad", quantity: "1 large bowl", calories: 80 },
      { name: "Buttermilk / Chaas", quantity: "200ml", calories: 50 },
      { name: "Coconut Water", quantity: "1 glass", calories: 45 },
      { name: "Dark Chocolate", quantity: "20g (85%)", calories: 120 },
      { name: "Ragi Porridge", quantity: "1 bowl", calories: 180 },
    ],
  },
];

/** Flattened quick lookup when typing a food name in the item field. */
export function suggestFoods(query: string): FoodSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = FOOD_SUGGESTIONS.flatMap((c) => c.foods);
  return all.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
}