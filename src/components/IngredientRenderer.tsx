import badArray from "@root/bad_ingredients.json"

/** Ingredient color rating used to pick a text color class. */
type IngredientColor = "red" | "yellow" | "green";

/** Flagged ingredient entry from bad_ingredients.json. */
interface BadIngredient {
  name?: string;
  title?: string;
  color?: IngredientColor;
  baddness_score?: number;
  description?: string;
}

/** Props for the IngredientRenderer component. */
interface IngredientRendererProps {
  /** Comma-separated ingredient list string */
  ingredients: string;
}

const BADNESS_THRESHOLD = 5;

const COLOR_CLASSES: Record<IngredientColor, string> = {
  red: "text-red-500",
  yellow: "text-yellow-500",
  green: "text-green-500"
};

// Create Map for O(1) lookups instead of O(n) find() calls
const badIngredientMap = new Map<string, BadIngredient>(
  (badArray as BadIngredient[])
    .filter(bad => bad && (bad.name || bad.title))
    .map(bad => {
      const key = (bad.name || bad.title)!.toLowerCase().replace(/\([^)]*\)/g, '').trim();
      return [key, bad];
    })
);

const findIngredient = (ingredientName: string): BadIngredient | undefined => {
  const cleanName = ingredientName.toLowerCase().replace(/\([^)]*\)/g, '').trim();
  return badIngredientMap.get(cleanName);
};

/**
 * Determine whether an ingredient list passes the approval check.
 *
 * @param ingredients - Comma-separated ingredient list string
 * @returns True if no red-flagged ingredient exceeds the badness threshold
 */
export const checkIsApproved = (ingredients: string): boolean => {
  if (!ingredients) return true;
  const ingredientsArray = ingredients.split(',');
  return !ingredientsArray.some(ing => {
    const match = findIngredient(ing.trim());
    return match?.color === 'red' || (match?.baddness_score || 0) > BADNESS_THRESHOLD;
  });
};

/**
 * Render an ingredient list with each ingredient colored by its rating.
 *
 * @component
 * @returns Colored ingredient spans, or null when no ingredients
 */
export default function IngredientRenderer({ ingredients }: IngredientRendererProps) {
  if (!ingredients) return null;

  return ingredients.split(',').map((ing) => {
    const trimmedIng = ing.trim();
    const ingredient = findIngredient(trimmedIng);
    const formattedIngredient = trimmedIng.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return (
      <span key={formattedIngredient} className={`${ingredient?.color ? COLOR_CLASSES[ingredient.color] : ""} mr-1`}>
        {formattedIngredient},
      </span>
    );
  });
}
