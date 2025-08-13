  // Export to PDF (simple: uses window.print())
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.onclick = () => {
      window.print();
    };
  }
// Meal Planner Web App
// Features: meal list per day, add/edit/remove meals, theme switching, localStorage persistence

document.addEventListener('DOMContentLoaded', () => {
  const groceryWeekLabel = document.getElementById('grocery-week-label');
  // Manual grocery items
  let manualGroceryItems = JSON.parse(localStorage.getItem('manualGroceryItems')) || {};
  const addIngredientForm = document.getElementById('add-ingredient-form');
  const ingredientInput = document.getElementById('ingredient-input');
  const groceryListEl = document.getElementById('grocery-list');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let viewMode = 'weekly';
  let selectedDay = days[0];
  // mealData: { [weekKey]: { [day]: { Breakfast: [], Lunch: [], Dinner: [] } } }
  // wwData: { [weekKey]: { [day]: string } }
  function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
  function weekKey(date) {
    const monday = getMonday(date);
    return monday.toISOString().slice(0, 10);
  }
  let currentWeek = getMonday(new Date());
  let mealData = JSON.parse(localStorage.getItem('meals')) || {};
  let wwData = JSON.parse(localStorage.getItem('wwData')) || {};
  const mealList = document.getElementById('meal-list');
  const addForm = document.getElementById('add-meal-form');
  const daySelect = document.getElementById('day-select');
  const mealInput = document.getElementById('meal-input');
  const themeSelect = document.getElementById('theme-select');
  const eraseAllBtn = document.getElementById('erase-all-btn');
  const prevWeekBtn = document.getElementById('prev-week-btn');
  const nextWeekBtn = document.getElementById('next-week-btn');
  const weekLabel = document.getElementById('week-label');
  const currentWeekBtn = document.getElementById('current-week-btn');
  // Set to current week
  if (currentWeekBtn) {
    currentWeekBtn.onclick = () => {
      currentWeek = getMonday(new Date());
      renderMeals();
    };
  }
  const viewModeSelect = document.getElementById('view-mode-select');
  const dailyDaySelect = document.getElementById('daily-day-select');

  function updateWeekLabel() {
    const monday = getMonday(currentWeek);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    weekLabel.textContent = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
  }
  if (prevWeekBtn) prevWeekBtn.onclick = () => {
    currentWeek.setDate(currentWeek.getDate() - 7);
    renderMeals();
  };
  if (nextWeekBtn) nextWeekBtn.onclick = () => {
    currentWeek.setDate(currentWeek.getDate() + 7);
    renderMeals();
  };
  // Erase all days' meals and WW data for current week
  if (eraseAllBtn) {
    eraseAllBtn.onclick = () => {
      if (confirm('Are you sure you want to erase all meals and Weight Watchers data for all days this week?')) {
        mealData[weekKey(currentWeek)] = {};
        wwData[weekKey(currentWeek)] = {};
        saveMeals();
        saveWW();
        renderMeals();
      }
    };
  }

  // Populate day dropdowns
  days.forEach(day => {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option.cloneNode(true));
    dailyDaySelect.appendChild(option);
  });

  // Render meals and WW fields with Breakfast, Lunch, Dinner for current week
  function renderMeals() {
    // Set weekly date range for grocery list
    if (groceryWeekLabel) {
      const monday = getMonday(currentWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      groceryWeekLabel.textContent = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
    }
    // Generate grocery list for the week
    if (groceryListEl) {
      const week = weekKey(currentWeek);
      groceryListEl.innerHTML = '';
      const items = manualGroceryItems[week] || [];
      if (items.length === 0) {
        groceryListEl.innerHTML = '<li style="color:#888;">No items yet. Add ingredients to generate your grocery list.</li>';
      } else {
        items.forEach(item => {
          const li = document.createElement('li');
          li.style.display = 'flex';
          li.style.alignItems = 'center';
          li.style.justifyContent = 'space-between';
          const span = document.createElement('span');
          span.textContent = item;
          li.appendChild(span);
          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.style.background = '#e53935';
          delBtn.style.color = '#fff';
          delBtn.style.fontWeight = 'bold';
          delBtn.style.marginLeft = '1em';
          delBtn.style.fontSize = '0.9em';
          delBtn.onclick = () => {
            manualGroceryItems[week] = manualGroceryItems[week].filter(i => i !== item);
            localStorage.setItem('manualGroceryItems', JSON.stringify(manualGroceryItems));
            renderMeals();
          };
          li.appendChild(delBtn);
          groceryListEl.appendChild(li);
        });
      }
    }
  // Add ingredient form logic
  if (addIngredientForm && ingredientInput) {
    addIngredientForm.onsubmit = (e) => {
      e.preventDefault();
      const week = weekKey(currentWeek);
      const item = ingredientInput.value.trim();
      if (!item) return;
      if (!manualGroceryItems[week]) manualGroceryItems[week] = [];
      manualGroceryItems[week].push(item);
      localStorage.setItem('manualGroceryItems', JSON.stringify(manualGroceryItems));
      ingredientInput.value = '';
      renderMeals();
    };
  }
    mealList.innerHTML = '';
    updateWeekLabel();
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const week = weekKey(currentWeek);
    if (!mealData[week]) mealData[week] = {};
    if (!wwData[week]) wwData[week] = {};

    let daysToRender = [];
    if (viewMode === 'weekly') {
      daysToRender = days;
    } else {
      daysToRender = [selectedDay];
    }

    daysToRender.forEach((day, i) => {
      // Ensure structure
      if (!mealData[week][day]) mealData[week][day] = { Breakfast: [], Lunch: [], Dinner: [] };
      if (!wwData[week][day]) wwData[week][day] = {};
      const dayDiv = document.createElement('div');
      dayDiv.className = 'day-block';
      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.alignItems = 'center';
      const title = document.createElement('h3');
      // Calculate the date for this day
      const monday = getMonday(currentWeek);
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + days.indexOf(day));
      const dateStr = dateObj.toLocaleDateString();
      title.textContent = `${day} (${dateStr})`;
      title.style.flex = '1';
      titleRow.appendChild(title);
      // Erase button for this day
      const eraseDayBtn = document.createElement('button');
      eraseDayBtn.textContent = 'Erase';
      eraseDayBtn.style.background = '#e53935';
      eraseDayBtn.style.color = '#fff';
      eraseDayBtn.style.fontWeight = 'bold';
      eraseDayBtn.style.marginLeft = '1em';
      eraseDayBtn.onclick = () => {
        if (confirm(`Erase all meals and Weight Watchers data for ${day}?`)) {
          mealData[week][day] = { Breakfast: [], Lunch: [], Dinner: [] };
          wwData[week][day] = {};
          saveMeals();
          saveWW();
          renderMeals();
        }
      };
      titleRow.appendChild(eraseDayBtn);
      dayDiv.appendChild(titleRow);

      // Calculate WW total for the day
      let wwTotal = 0;
      mealTypes.forEach(type => {
        let val = wwData[week][day][type];
        if (val !== undefined && val !== null && val !== '') {
          let num = parseFloat(val);
          if (!isNaN(num)) wwTotal += num;
        }
      });

      // Weight Watchers input (shows total)
      const wwLabel = document.createElement('label');
      wwLabel.textContent = 'Weight Watchers (total):';
      wwLabel.setAttribute('for', `ww-${day}`);
      wwLabel.style.marginRight = '0.5em';
      const wwInput = document.createElement('input');
      wwInput.type = 'text';
      wwInput.id = `ww-${day}`;
      wwInput.value = wwTotal > 0 ? wwTotal : '';
      wwInput.placeholder = 'Total points';
      wwInput.style.marginBottom = '0.7em';
      wwInput.style.marginLeft = '0.5em';
      wwInput.style.width = '120px';
      wwInput.readOnly = true;
      dayDiv.appendChild(wwLabel);
      dayDiv.appendChild(wwInput);

      mealTypes.forEach(type => {
        // Section title and WW input for meal type
        const sectionRow = document.createElement('div');
        sectionRow.style.display = 'flex';
        sectionRow.style.alignItems = 'center';
        sectionRow.style.margin = '0.5em 0 0.2em 0';
        const sectionTitle = document.createElement('h4');
        sectionTitle.textContent = type;
        sectionTitle.style.margin = '0';
        sectionTitle.style.flex = 'none';
        sectionRow.appendChild(sectionTitle);
        // WW input for meal type
        const wwTypeInput = document.createElement('input');
        wwTypeInput.type = 'text';
        wwTypeInput.value = wwData[week][day][type] || '';
        wwTypeInput.placeholder = 'WW';
        wwTypeInput.style.marginLeft = '1em';
        wwTypeInput.style.width = '60px';
        wwTypeInput.className = 'meal-ww-input';
        wwTypeInput.addEventListener('change', () => {
          wwData[week][day][type] = wwTypeInput.value;
          saveWW();
          renderMeals(); // re-render to update total
        });
        sectionRow.appendChild(wwTypeInput);
        dayDiv.appendChild(sectionRow);
        const ul = document.createElement('ul');
        (mealData[week][day][type] || []).forEach((meal, idx) => {
          const li = document.createElement('li');
          // Make meal text editable
          const span = document.createElement('span');
          span.textContent = meal;
          span.contentEditable = true;
          span.className = 'editable-meal';
          // Save on blur or Enter
          span.addEventListener('blur', () => {
            const newMeal = span.textContent.trim();
            if (newMeal && newMeal !== mealData[week][day][type][idx]) {
              mealData[week][day][type][idx] = newMeal;
              saveMeals();
            }
          });
          span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              span.blur();
            }
          });
          li.appendChild(span);
          // Edit button
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.onclick = () => {
            span.focus();
          };
          // Delete button
          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.onclick = () => {
            mealData[week][day][type].splice(idx, 1);
            saveMeals();
            renderMeals();
          };
          li.appendChild(editBtn);
          li.appendChild(delBtn);
          ul.appendChild(li);
        });
        // Add new meal by clicking empty area (plus sign)
        const addLi = document.createElement('li');
        const addSpan = document.createElement('span');
        addSpan.textContent = '+ Add';
        addSpan.className = 'editable-meal add-meal-placeholder';
        addSpan.style.opacity = '0.6';
        addSpan.style.cursor = 'pointer';
        addSpan.contentEditable = false;
        addSpan.addEventListener('click', () => {
          addSpan.textContent = '';
          addSpan.contentEditable = true;
          addSpan.classList.remove('add-meal-placeholder');
          addSpan.focus();
        });
        addSpan.addEventListener('blur', () => {
          const newMeal = addSpan.textContent.trim();
          if (newMeal) {
            mealData[week][day][type].push(newMeal);
            saveMeals();
            renderMeals();
          } else {
            addSpan.textContent = '+ Add';
            addSpan.contentEditable = false;
            addSpan.classList.add('add-meal-placeholder');
          }
        });
        addSpan.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addSpan.blur();
          }
        });
        addLi.appendChild(addSpan);
        ul.appendChild(addLi);
        dayDiv.appendChild(ul);
      });
      mealList.appendChild(dayDiv);
    });
  }

  // Save WW data to localStorage
  function saveWW() {
    localStorage.setItem('wwData', JSON.stringify(wwData));
  }

  // Save meals to localStorage
  function saveMeals() {
    localStorage.setItem('meals', JSON.stringify(mealData));
  }

  // Add meal with meal type for current week
  addForm.onsubmit = (e) => {
    e.preventDefault();
    const week = weekKey(currentWeek);
    let day = daySelect.value;
    if (viewMode === 'daily') {
      day = dailyDaySelect.value;
    }
    const meal = mealInput.value.trim();
    const mealType = document.getElementById('meal-type-select').value;
    if (!meal) return;
    if (!mealData[week]) mealData[week] = {};
    if (!mealData[week][day]) mealData[week][day] = { Breakfast: [], Lunch: [], Dinner: [] };
    mealData[week][day][mealType].push(meal);
    saveMeals();
    renderMeals();
    mealInput.value = '';
  };

  // Theme switching
  themeSelect.onchange = () => {
    document.body.className = themeSelect.value;
  };

  // View mode switching
  viewModeSelect.onchange = () => {
    viewMode = viewModeSelect.value;
    if (viewMode === 'daily') {
      dailyDaySelect.style.display = '';
      selectedDay = dailyDaySelect.value;
    } else {
      dailyDaySelect.style.display = 'none';
    }
    renderMeals();
  };
  dailyDaySelect.onchange = () => {
    selectedDay = dailyDaySelect.value;
    renderMeals();
  };

  // Initial render
  renderMeals();
  // Set theme from select
  document.body.className = themeSelect.value;
  // Set up initial view mode
  if (viewMode === 'daily') {
    dailyDaySelect.style.display = '';
  } else {
    dailyDaySelect.style.display = 'none';
  }
});
