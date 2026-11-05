const planForm = document.getElementById('planForm');
const plannerMsg = document.getElementById('plannerMsg');
const planList = document.getElementById('planList');
const cancelBtn = document.getElementById('cancelBtn');

// READ + DOM: draw all saved plans
function showPlans() {
  const plans = getPlans();
  planList.innerHTML = '';

  if (plans.length === 0) {                       // empty state
    planList.textContent = 'No meal plans yet. Add one above.';
    return;
  }

  plans.forEach(plan => {
    const item = document.createElement('div');
    item.className = 'plan-item';

    const photo = plan.image
      ? '<img src="' + plan.image + '" alt="' + plan.name + '" class="plan-thumb">'
      : '';

    item.innerHTML = `
      <div class="plan-info">
        ${photo}
        <div>
          <h3>${plan.name}</h3>
          <p>${plan.day} | ${plan.servings} serving(s)</p>
          <p class="missing">${plan.notes ? 'Notes: ' + plan.notes : ''}</p>
        </div>
      </div>
      <div>
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
      </div>
    `;
    item.querySelector('.editBtn').addEventListener('click', () => startEdit(plan));
    item.querySelector('.deleteBtn').addEventListener('click', () => removePlan(plan.id));
    planList.appendChild(item);
  });
}

// Put a plan's values into the form so the user can edit it
function startEdit(plan) {
  document.getElementById('planId').value = plan.id;
  document.getElementById('planName').value = plan.name;
  document.getElementById('planDay').value = plan.day;
  document.getElementById('planServings').value = plan.servings;
  document.getElementById('planNotes').value = plan.notes;
  document.getElementById('saveBtn').textContent = 'Update Plan';
  cancelBtn.hidden = false;
  plannerMsg.textContent = 'Editing "' + plan.name + '"...';
}

// Reset the form back to "add" mode
function resetForm() {
  planForm.reset();
  document.getElementById('planId').value = '';
  document.getElementById('planServings').value = 4;
  document.getElementById('saveBtn').textContent = 'Add Plan';
  cancelBtn.hidden = true;
}

// DELETE with confirmation
function removePlan(id) {
  if (confirm('Delete this meal plan?')) {
    deletePlan(id);
    plannerMsg.textContent = 'Meal plan deleted.';
    showPlans();
  }
}

// CREATE or UPDATE when the form is submitted
planForm.addEventListener('submit', event => {
  event.preventDefault();

  const id = document.getElementById('planId').value;
  const name = document.getElementById('planName').value.trim();
  const day = document.getElementById('planDay').value;
  const servings = Number(document.getElementById('planServings').value);
  const notes = document.getElementById('planNotes').value.trim();

  // Validation
  if (name === '') {
    plannerMsg.textContent = 'Please enter a meal name.';
    return;
  }
  if (day === '') {
    plannerMsg.textContent = 'Please select a day.';
    return;
  }
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) {
    plannerMsg.textContent = 'Servings must be a whole number from 1 to 100.';
    return;
  }

  if (id === '') {                                 // no id means a new plan
    addPlan({ name, day, servings, notes });
    plannerMsg.textContent = 'Meal plan added!';
  } else {                                         // has id means editing
    updatePlan(Number(id), { name, day, servings, notes });
    plannerMsg.textContent = 'Meal plan updated!';
  }

  resetForm();
  showPlans();
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  plannerMsg.textContent = 'Edit cancelled.';
});

// Show saved plans when the page opens
showPlans();