const categorySelect = document.getElementById('categorySelect');
const messageBox = document.getElementById('message');
const resultsBox = document.getElementById('results');
const detailsBox = document.getElementById('details');
const searchInput = document.getElementById('searchInput');
const ingredientInput = document.getElementById('ingredientInput');
const suggestInput = document.getElementById('suggestInput');

// Fill the dropdown when the page loads
async function loadCategories() {
  try {
    messageBox.textContent = 'Loading categories...';
    const allCategories = await getCategories();

    // Keep every category except Pork
    const categories = allCategories.filter(cat => cat.strCategory !== 'Pork');

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.strCategory;
      option.textContent = cat.strCategory;
      categorySelect.appendChild(option);
    });

    messageBox.textContent = '';
  } catch (error) {
    messageBox.textContent = 'Could not load categories. Check your internet connection.';
  }
}

// Shared: draw recipe cards for any list of meals
function displayMeals(meals, label) {
  resultsBox.innerHTML = '';
  detailsBox.innerHTML = '';

  if (meals === null) {                        // empty results
    messageBox.textContent = 'No recipes found for "' + label + '".';
    return;
  }

  meals.forEach(meal => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
    `;
    card.addEventListener('click', () => showDetails(meal.idMeal));
    resultsBox.appendChild(card);
  });

  messageBox.textContent = meals.length + ' recipes found for "' + label + '"';
}

// Show recipes for the chosen category
async function showMeals(category) {
  if (category === '') {                       // invalid input
    resultsBox.innerHTML = '';
    messageBox.textContent = 'Please select a category.';
    return;
  }

  try {
    messageBox.textContent = 'Loading recipes...';
    const meals = await getMealsByCategory(category);
    displayMeals(meals, category);
  } catch (error) {                            // failed API request
    messageBox.textContent = 'Failed to load recipes. Please try again.';
  }
}

// Show full recipe details, serving scaler, and add-to-plan form
async function showDetails(id) {
  try {
    messageBox.textContent = 'Loading recipe...';
    const meal = await getMealDetails(id);
    const ingredients = getIngredients(meal);

    let listHTML = '';
    ingredients.forEach(item => {
      listHTML += `<li>${item.measure} ${item.name}</li>`;
    });

    detailsBox.innerHTML = `
      <h2>${meal.strMeal}</h2>
      <p><strong>Category:</strong> ${meal.strCategory} |
         <strong>Cuisine:</strong> ${meal.strArea}</p>
      <h3>Ingredients</h3>
      <ul>${listHTML}</ul>

      <h3>Serving Scaler</h3>
      <div class="scaler">
        <label>This recipe makes (servings):
          <input type="number" id="origServings" value="4" min="1">
        </label>
        <label>I want (servings):
          <input type="number" id="newServings" value="4" min="1">
        </label>
        <button id="scaleBtn">Scale</button>
      </div>
      <p id="scaleMsg"></p>
      <ul id="scaledList"></ul>

      <h3>Add to Meal Plan</h3>
      <div class="scaler">
        <label>Day:
          <select id="addDay">
            <option value="">-- Select a day --</option>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
            <option>Sunday</option>
          </select>
        </label>
        <label>Servings:
          <input type="number" id="addServings" value="4" min="1">
        </label>
        <button id="addPlanBtn">Add to Meal Plan</button>
      </div>
      <p id="addMsg"></p>

      <h3>Instructions</h3>
      <p>${meal.strInstructions}</p>
    `;

    // Event: run the calculation when the Scale button is clicked
    document.getElementById('scaleBtn').addEventListener('click', () => {
      handleScale(ingredients);
    });

    // Event: save this recipe into the meal plan
    document.getElementById('addPlanBtn').addEventListener('click', () => {
      handleAddToPlan(meal);
    });

    messageBox.textContent = '';
    detailsBox.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    messageBox.textContent = 'Could not load the recipe details.';
  }
}

// Read the inputs, validate them, then show the scaled ingredients
function handleScale(ingredients) {
  const orig = Number(document.getElementById('origServings').value);
  const wanted = Number(document.getElementById('newServings').value);
  const scaleMsg = document.getElementById('scaleMsg');
  const scaledList = document.getElementById('scaledList');

  scaledList.innerHTML = '';

  // Validation: must be whole numbers from 1 to 100
  if (!Number.isInteger(orig) || !Number.isInteger(wanted) || orig < 1 || wanted < 1) {
    scaleMsg.textContent = 'Please enter whole numbers of 1 or more.';
    return;
  }
  if (orig > 100 || wanted > 100) {
    scaleMsg.textContent = 'Servings cannot be more than 100.';
    return;
  }

  const factor = wanted / orig;
  scaleMsg.textContent = 'Ingredients for ' + wanted + ' serving(s) (x' + factor.toFixed(2) + '):';

  ingredients.forEach(item => {
    const li = document.createElement('li');
    li.textContent = scaleIngredient(item, factor);
    scaledList.appendChild(li);
  });
}

// Search by recipe name
async function handleSearch() {
  const text = searchInput.value.trim();
  if (text === '') {                           // invalid input
    messageBox.textContent = 'Please type a recipe name to search.';
    return;
  }
  try {
    messageBox.textContent = 'Searching...';
    const meals = await searchMealsByName(text);
    displayMeals(meals, text);
  } catch (error) {
    messageBox.textContent = 'Search failed. Please check your connection.';
  }
}

// Find recipes by one ingredient
async function handleIngredient() {
  const text = ingredientInput.value.trim();
  if (text === '') {
    messageBox.textContent = 'Please type an ingredient.';
    return;
  }
  try {
    messageBox.textContent = 'Searching...';
    const meals = await getMealsByIngredient(text.replace(/\s+/g, '_'));
    displayMeals(meals, text);
  } catch (error) {
    messageBox.textContent = 'Search failed. Please check your connection.';
  }
}

// Suggest recipes using the ingredients the user has
async function handleSuggest() {
  const text = suggestInput.value.trim();
  if (text === '') {                           // invalid input
    messageBox.textContent = 'Please type the ingredients you have.';
    return;
  }

  // "Chicken, Garlic" -> ["chicken", "garlic"]
  const userIngredients = text.toLowerCase().split(',')
    .map(s => s.trim())
    .filter(s => s !== '');

  try {
    messageBox.textContent = 'Finding suggestions...';
    resultsBox.innerHTML = '';
    detailsBox.innerHTML = '';

    // the API filters by one ingredient only, so use the first one as the starting list
    const meals = await getMealsByIngredient(userIngredients[0].replace(/\s+/g, '_'));
    if (meals === null) {
      messageBox.textContent = 'No suitable recipe found. Try other ingredients.';
      return;
    }

    // check the first 10 recipes only, to keep it fast
    const candidates = meals.slice(0, 10);
    const fullMeals = await Promise.all(candidates.map(m => getMealDetails(m.idMeal)));

    const suggestions = [];
    fullMeals.forEach(meal => {
      const result = calculateMatch(getIngredients(meal), userIngredients);
      const level = getSuggestionLevel(result.percent);
      if (level !== null) {
        suggestions.push({
          id: meal.idMeal,
          name: meal.strMeal,
          image: meal.strMealThumb,
          percent: result.percent,
          label: level.label,
          css: level.css,
          missing: result.missing
        });
      }
    });

    if (suggestions.length === 0) {            // fallback
      messageBox.textContent = 'No suitable recipe found. Try other ingredients.';
      return;
    }

    suggestions.sort((a, b) => b.percent - a.percent);   // best match first
    localStorage.setItem('suggestions', JSON.stringify(suggestions));
    displaySuggestions(suggestions);
  } catch (error) {
    messageBox.textContent = 'Could not get suggestions. Please check your connection.';
  }
}

function displaySuggestions(suggestions) {
  resultsBox.innerHTML = '';
  suggestions.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${s.image}" alt="${s.name}">
      <h3>${s.name}</h3>
      <p class="badge ${s.css}">${s.label} (${s.percent}%)</p>
      <p class="missing">${s.missing.length > 0 ? 'Missing: ' + s.missing.join(', ') : 'You have everything!'}</p>
    `;
    card.addEventListener('click', () => showDetails(s.id));
    resultsBox.appendChild(card);
  });
  messageBox.textContent = suggestions.length + ' suggestion(s) found.';
}

// Events
categorySelect.addEventListener('change', () => showMeals(categorySelect.value));
document.addEventListener('DOMContentLoaded', loadCategories);

document.getElementById('searchBtn').addEventListener('click', handleSearch);
document.getElementById('ingredientBtn').addEventListener('click', handleIngredient);
document.getElementById('suggestBtn').addEventListener('click', handleSuggest);

// Enter key inside the text boxes
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
ingredientInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleIngredient(); });
suggestInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSuggest(); });

// Validate the form, then save the recipe as a new meal plan (CREATE)
function handleAddToPlan(meal) {
  const day = document.getElementById('addDay').value;
  const servings = Number(document.getElementById('addServings').value);
  const addMsg = document.getElementById('addMsg');

  if (day === '') {                                  // invalid input
    addMsg.textContent = 'Please select a day.';
    return;
  }
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) {
    addMsg.textContent = 'Servings must be a whole number from 1 to 100.';
    return;
  }

  addPlan({
    mealId: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    day: day,
    servings: servings,
    notes: ''
  });

  addMsg.textContent = '"' + meal.strMeal + '" added to your meal plan for ' + day + '!';
}