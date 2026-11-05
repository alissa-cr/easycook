const BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

// np the list of meal categories
async function getCategories() {
  const response = await fetch(BASE_URL + 'categories.php');
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  const data = await response.json();   // convert the response into a JS object
  return data.categories;               // the array we need
}

// Get all meals in one category
async function getMealsByCategory(category) {
  const response = await fetch(BASE_URL + 'filter.php?c=' + encodeURIComponent(category));
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  const data = await response.json();
  return data.meals;                    // this is null if nothing is found
}

// Get the full recipe for one meal using thier own id
async function getMealDetails(id) {
  const response = await fetch(BASE_URL + 'lookup.php?i=' + id);
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  const data = await response.json();
  return data.meals[0];                 // lookup returns an array with 1 meal
}

// TheMealDB stores ingredients as strIngredient1...strIngredient20.
// This loop turns them into one clean array.
function getIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal['strIngredient' + i];
    const measure = meal['strMeasure' + i];
    if (name && name.trim() !== '') {   // skip empty slots
      list.push({ name: name.trim(), measure: (measure || '').trim() });
    }
  }
  return list;
}

// Search meals by name (returns full meal objects, or null if none)
async function searchMealsByName(name) {
  const response = await fetch(BASE_URL + 'search.php?s=' + encodeURIComponent(name));
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  const data = await response.json();
  return data.meals;
}

// Get meals that use a given ingredient (returns null if none)
async function getMealsByIngredient(ingredient) {
  const response = await fetch(BASE_URL + 'filter.php?i=' + encodeURIComponent(ingredient));
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  const data = await response.json();
  return data.meals;
}