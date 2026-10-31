import type { IngredientColor, RatedIngredient } from '../services/scanClaim';

/** Props for the IngredientRenderer component. */
interface IngredientRendererProps {
  /** Ingredients as rated by the server (`POST /api/scan`) */
  ingredients: RatedIngredient[];
}

const COLOR_CLASSES: Record<IngredientColor, string> = {
  red: "text-red-500",
  yellow: "text-yellow-500",
  green: "text-green-500"
};

/**
 * Render an ingredient list with each ingredient colored by its server rating.
 *
 * @component
 * @returns Colored ingredient spans, or null when no ingredients
 */
export default function IngredientRenderer({ ingredients }: IngredientRendererProps) {
  if (!ingredients.length) return null;

  return ingredients.map(({ text, color }, index) => {
    const formattedIngredient = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return (
      <span key={`${index}-${formattedIngredient}`} className={`${color ? COLOR_CLASSES[color] : ""} mr-1`}>
        {formattedIngredient},
      </span>
    );
  });
}
