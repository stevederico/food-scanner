import badArray from "@root/bad_ingredients.json"

export const checkIsApproved = (ingredients) => {
  if (!ingredients) return true;
  const ingredientsArray = ingredients.split(',');
  return !ingredientsArray.some(ing => {
    const cleanIngredient = ing.trim().toLowerCase();
    const match = badArray.find(bad => {
      if (!bad) return false;
      const propertyToUse = bad.name || bad.title;
      if (!propertyToUse) return false;
      const cleanBadName = propertyToUse.toLowerCase().replace(/\([^)]*\)/g, '').trim();
      return cleanIngredient === cleanBadName;
    });
    return match?.color === 'red' || (match?.baddness_score || 0) > 5;
  });
};

export default function IngredientRenderer({ ingredients }) {
  if (!ingredients) return null;
  
  return ingredients.split(',').map((ing, index) => {
    ing = ing.trim();
    const cleanIngredient = ing.toLowerCase().replace(/\([^)]*\)/g, '').trim();
    const ingredient = badArray.find(bad => {
      if (!bad) return false;
      const propertyToUse = bad.name || bad.title;
      if (!propertyToUse) return false;
      const cleanBadName = propertyToUse.toLowerCase().replace(/\([^)]*\)/g, '').trim();
      return cleanIngredient === cleanBadName;
    });
    
    const colorClasses = {
      red: "text-red-500",
      yellow: "text-yellow-500",
      green: "text-green-500"
    };
    
    const formattedIngredient = ing.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return (
      <span key={index} className={`${ingredient ? colorClasses[ingredient.color] : ""} mr-1`}>
        {formattedIngredient},
      </span>
    );
  });
}