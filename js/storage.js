const STORAGE_KEY = 'mealPlans';

// READ: get all saved plans (returns an empty array if nothing saved yet)
function getPlans() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === null ? [] : JSON.parse(saved);
}

// Save the whole array back to localStorage
function savePlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

// CREATE: add a new plan
function addPlan(plan) {
  const plans = getPlans();
  plan.id = Date.now();                // unique id based on current time
  plans.push(plan);
  savePlans(plans);
}

// UPDATE: change an existing plan by id
function updatePlan(id, changes) {
  const plans = getPlans();
  const index = plans.findIndex(p => p.id === id);
  if (index === -1) return false;      // not found
  plans[index] = { ...plans[index], ...changes };
  savePlans(plans);
  return true;
}

// DELETE: remove a plan by id
function deletePlan(id) {
  const plans = getPlans().filter(p => p.id !== id);
  savePlans(plans);
}