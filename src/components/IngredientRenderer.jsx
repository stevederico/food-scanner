import badArray from "@root/bad_ingredients.json"

const BADNESS_THRESHOLD = 5;

const COLOR_CLASSES = {
  red: "text-red-500",
  yellow: "text-yellow-500",
  green: "text-green-500"
};

// Create Map for O(1) lookups instead of O(n) find() calls
const badIngredientMap = new Map(
  badArray
    .filter(bad => bad && (bad.name || bad.title))
    .map(bad => {
      const key = (bad.name || bad.title).toLowerCase().replace(/\([^)]*\)/g, '').trim();
      return [key, bad];
    })
);

const findIngredient = (ingredientName) => {
  const cleanName = ingredientName.toLowerCase().replace(/\([^)]*\)/g, '').trim();
  return badIngredientMap.get(cleanName);
};

export const checkIsApproved = (ingredients) => {
  if (!ingredients) return true;
  const ingredientsArray = ingredients.split(',');
  return !ingredientsArray.some(ing => {
    const match = findIngredient(ing.trim());
    return match?.color === 'red' || (match?.baddness_score || 0) > BADNESS_THRESHOLD;
  });
};

export default function IngredientRenderer({ ingredients }) {
  if (!ingredients) return null;

  return ingredients.split(',').map((ing) => {
    const trimmedIng = ing.trim();
    const ingredient = findIngredient(trimmedIng);
    const formattedIngredient = trimmedIng.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return (
      <span key={formattedIngredient} className={`${ingredient ? COLOR_CLASSES[ingredient.color] : ""} mr-1`}>
        {formattedIngredient},
      </span>
    );
  });
}
