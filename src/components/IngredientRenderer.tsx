import { cn } from '@stevederico/skateboard-ui/lib/utils';
import type { IngredientColor, RatedIngredient } from '../services/scanClaim';

interface IngredientRendererProps {
  ingredients: RatedIngredient[];
}

const COLOR_CLASSES: Record<IngredientColor, string> = {
  red: "text-danger",
  yellow: "text-warning",
  green: "text-success"
};

export default function IngredientRenderer({ ingredients }: IngredientRendererProps) {
  if (!ingredients.length) return null;

  return ingredients.map(({ text, color }, index) => {
    const formattedIngredient = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return (
      <span key={`${index}-${formattedIngredient}`} className={cn(color && COLOR_CLASSES[color], "mr-1")}>
        {formattedIngredient},
      </span>
    );
  });
}
