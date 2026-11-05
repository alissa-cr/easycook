// Compare a recipe's ingredients with the ones the user have choose
function calculateMatch(recipeIngredients, userIngredients) {
  const have = [];
  const missing = [];

  recipeIngredients.forEach(item => {
    const name = item.name.toLowerCase();
    // match if either text contains the other (e.g. "chicken" matches "chicken breast")
    const found = userIngredients.some(u => name.includes(u) || u.includes(name));
    if (found) {
      have.push(item.name);
    } else {
      missing.push(item.name);
    }
  });

  const percent = Math.round((have.length / recipeIngredients.length) * 100);
  return { have, missing, percent };
}

// Decide the suggestion level using control statements
function getSuggestionLevel(percent) {
  if (percent >= 80) {
    return { label: 'Ready to cook!', css: 'ready' };
  } else if (percent >= 50) {
    return { label: 'Match found', css: 'almost' };
  } else {
    return null;                       // not good enough to suggest
  }
}