const messageBox = document.getElementById('message');
const resultsBox = document.getElementById('results');
const detailsBox = document.getElementById('details');
const pager = document.getElementById('pager');
const categoryList = document.getElementById('categoryList');
const searchInput = document.getElementById('searchInput');
const ingredientInput = document.getElementById('ingredientInput');
const suggestInput = document.getElementById('suggestInput');

// Stores the meals of every category, e.g. { Beef: [...], Chicken: [...] }
const categoryMeals = {};

// Pagination settings
const PAGE_SIZE = 9;
let currentMeals = [];
let currentPage = 1;

// ===== Categories sidebar =====

// Build the checkbox list when the page loads
async function loadCategories() {
  try {
    messageBox.textContent = 'Loading categories...';
    const allCategories = await getCategories();

    // Keep every category except Pork
    const categories = allCategories.filter(cat => cat.strCategory !== 'Pork');

    // Get the meals of every category once, so we can show counts and filter instantly
    const results = await Promise.all(
      categories.map(cat => getMealsByCategory(cat.strCategory))
    );

    categories.forEach((cat, i) => {
      const meals = results[i] || [];
      categoryMeals[cat.strCategory] = meals;

      const row = document.createElement('label');
      row.className = 'category-item';
      row.innerHTML = `
        <input type="checkbox" value="${cat.strCategory}">
        <span>${cat.strCategory} <span class="count">(${meals.length})</span></span>
      `;
      categoryList.appendChild(row);
    });

    messageBox.textContent = '';
  } catch (error) {
    messageBox.textContent = 'Could not load categories. Check your internet connection.';
  }
}

// Apply button: show meals from every ticked category
function applyCategories() {
  const ticked = Array.from(document.querySelectorAll('#categoryList input:checked'))
    .map(box => box.value);

  if (ticked.length === 0) {                   // invalid input: nothing ticked
    resultsBox.innerHTML = '';
    pager.innerHTML = '';
    detailsBox.innerHTML = '';
    messageBox.textContent = 'Please tick at least one category.';
    return;
  }

  let combined = [];
  ticked.forEach(name => {
    combined = combined.concat(categoryMeals[name]);
  });
  displayMeals(combined, ticked.join(', '));
}

// Clear button: untick everything and empty the results
function clearCategories() {
  document.querySelectorAll('#categoryList input').forEach(box => {
    box.checked = false;
  });
  resultsBox.innerHTML = '';
  pager.innerHTML = '';
  detailsBox.innerHTML = '';
  messageBox.textContent = '';
}

// ===== Showing recipe cards with pages =====

// Shared: start showing any list of meals from page 1
function displayMeals(meals, label) {
  detailsBox.innerHTML = '';
  resultsBox.innerHTML = '';
  pager.innerHTML = '';

  if (meals === null || meals.length === 0) {  // empty results
    messageBox.textContent = 'No recipes found for "' + label + '".';
    return;
  }

  currentMeals = meals;
  currentPage = 1;
  showPage();
}

// Draw the cards for the current page
function showPage() {
  resultsBox.innerHTML = '';
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageMeals = currentMeals.slice(start, start + PAGE_SIZE);

  pageMeals.forEach(meal => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
    `;
    card.addEventListener('click', () => showDetails(meal.idMeal));
    resultsBox.appendChild(card);
  });

  const end = start + pageMeals.length;
  messageBox.innerHTML = 'Showing <strong>' + (start + 1) + '-' + end +
    '</strong> of <strong>' + currentMeals.length + '</strong> results';

  showPager();
}

// Previous / Next buttons
function showPager() {
  pager.innerHTML = '';
  const totalPages = Math.ceil(currentMeals.length / PAGE_SIZE);
  if (totalPages <= 1) return;                 // only one page, no buttons needed

  const prev = document.createElement('button');
  prev.textContent = 'Previous';
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => { currentPage--; showPage(); });

  const info = document.createElement('span');
  info.textContent = 'Page ' + currentPage + ' of ' + totalPages;

  const next = document.createElement('button');
  next.textContent = 'Next';
  next.disabled = currentPage === totalPages;
  next.addEventListener('click', () => { currentPage++; showPage(); });

  pager.appendChild(prev);
  pager.appendChild(info);
  pager.appendChild(next);
}

// ===== Recipe details, serving scaler, add to plan =====

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

    document.getElementById('scaleBtn').addEventListener('click', () => {
      handleScale(ingredients);
    });
    document.getElementById('addPlanBtn').addEventListener('click', () => {
      handleAddToPlan(meal);
    });

    // Restore the status line (the Showing... text) after loading
    messageBox.textContent = '';
    detailsBox.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    messageBox.textContent = 'Could not load the recipe details.';
  }
}

// Read inputs, validate them,show the scaled ingredients
function handleScale(ingredients) {
  const orig = Number(document.getElementById('origServings').value);
  const wanted = Number(document.getElementById('newServings').value);
  const scaleMsg = document.getElementById('scaleMsg');
  const scaledList = document.getElementById('scaledList');

  scaledList.innerHTML = '';

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

// Validate the form, then save the recipe as a new meal plan (CREATE)
function handleAddToPlan(meal) {
  const day = document.getElementById('addDay').value;
  const servings = Number(document.getElementById('addServings').value);
  const addMsg = document.getElementById('addMsg');

  if (day === '') {
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

// ===== Search, ingredient and suggestions =====

async function handleSearch() {
  const text = searchInput.value.trim();
  if (text === '') {
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

async function handleSuggest() {
  const text = suggestInput.value.trim();
  if (text === '') {
    messageBox.textContent = 'Please type the ingredients you have.';
    return;
  }

  const userIngredients = text.toLowerCase().split(',')
    .map(s => s.trim())
    .filter(s => s !== '');

  try {
    messageBox.textContent = 'Finding suggestions...';
    resultsBox.innerHTML = '';
    pager.innerHTML = '';
    detailsBox.innerHTML = '';

    const meals = await getMealsByIngredient(userIngredients[0].replace(/\s+/g, '_'));
    if (meals === null) {
      messageBox.textContent = 'No suitable recipe found. Try other ingredients.';
      return;
    }

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

    if (suggestions.length === 0) {
      messageBox.textContent = 'No suitable recipe found. Try other ingredients.';
      return;
    }

    suggestions.sort((a, b) => b.percent - a.percent);
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

// ===== Events =====
document.addEventListener('DOMContentLoaded', loadCategories);
document.getElementById('applyBtn').addEventListener('click', applyCategories);
document.getElementById('clearBtn').addEventListener('click', clearCategories);

document.getElementById('searchBtn').addEventListener('click', handleSearch);
document.getElementById('ingredientBtn').addEventListener('click', handleIngredient);
document.getElementById('suggestBtn').addEventListener('click', handleSuggest);

searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
ingredientInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleIngredient(); });
suggestInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSuggest(); });