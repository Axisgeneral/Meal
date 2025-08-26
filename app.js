// Export grocery list to PDF using jsPDF
window.exportGroceryListPDF = function() {
  if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
    alert('jsPDF library is required for PDF export. Please include it in your project.');
    return;
  }
  const doc = typeof window.jsPDF !== 'undefined' ? new window.jsPDF() : new window.jspdf.jsPDF();
  doc.setFontSize(18);
  doc.text('Grocery List', 20, 20);
  doc.setFontSize(12);
  let y = 35;
  groceryList.forEach((item, idx) => {
    doc.text(`- ${item}`, 20, y);
    y += 10;
  });
  doc.save('grocery-list.pdf');
};
// Grocery List Logic
let groceryList = [];

function renderGroceryList() {
  const ul = document.getElementById('grocery-items');
  if (!ul) return;
  ul.innerHTML = '';
  groceryList.forEach((item, idx) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.justifyContent = 'space-between';
    li.style.padding = '0.4rem 0';
    li.innerHTML = `<span>${item}</span><button onclick="removeGroceryItem(${idx})" style="background:#d32f2f;color:#fff;border:none;border-radius:6px;padding:0.2rem 0.7rem;cursor:pointer;">Remove</button>`;
    ul.appendChild(li);
  });
}

window.addGroceryItem = function() {
  const input = document.getElementById('grocery-input');
  if (input && input.value.trim()) {
    groceryList.push(input.value.trim());
    input.value = '';
    renderGroceryList();
  }
};

window.removeGroceryItem = function(idx) {
  groceryList.splice(idx, 1);
  renderGroceryList();
};
window.prevWeek = function() {
  baseDate.setDate(baseDate.getDate() - 7);
  renderMeals();
};

window.nextWeek = function() {
  baseDate.setDate(baseDate.getDate() + 7);
  renderMeals();
};
window.resetWeek = function() {
  const key = getWeekKey(baseDate);
  weekDataMap[key] = {
    meals: Array(7).fill().map(() => [
      { name: '', items: ['', '', ''], points: '' },
      { name: '', items: ['', '', ''], points: '' },
      { name: '', items: ['', '', ''], points: '' }
    ]),
    hiddenDays: Array(7).fill(false)
  };
  renderMeals();
};
window.unhideAllDays = function() {
  const week = getWeekMeals();
  for (let i = 0; i < week.hiddenDays.length; i++) {
    week.hiddenDays[i] = false;
  }
  renderMeals();
};
window.hideAllDays = function() {
  const week = getWeekMeals();
  for (let i = 0; i < week.hiddenDays.length; i++) {
    week.hiddenDays[i] = true;
  }
  renderMeals();
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let baseDate = new Date();


let weekDataMap = {};

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  // Always use Sunday as start of week
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getWeekMeals() {
  const key = getWeekKey(baseDate);
  if (!weekDataMap[key]) {
    weekDataMap[key] = {
      meals: Array(7).fill().map(() => [
        { name: '', items: ['', '', ''], points: '' },
        { name: '', items: ['', '', ''], points: '' },
        { name: '', items: ['', '', ''], points: '' }
      ]),
      hiddenDays: Array(7).fill(true)
    };
  }
  return weekDataMap[key];
}

function getDayWithDate(offset = 0) {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offset);
  const day = daysOfWeek[date.getDay()];
  const formatted = `${day} (${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()})`;
  return formatted;
}

let weeklyMax = 175;

function getWeekLabel() {
  const start = new Date(baseDate);
  const end = new Date(baseDate);
  end.setDate(start.getDate() + 6);
  return `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()} - ${end.getMonth() + 1}/${end.getDate()}/${end.getFullYear()}`;
}

function renderMeals() {
  // Get current week data
  const { meals: weekMeals, hiddenDays } = getWeekMeals();

  // Update week label
  const weekLabel = document.getElementById('week-label');
  if (weekLabel) weekLabel.textContent = getWeekLabel();

  // Weekly tracker logic
  let totalPoints = 0;
  for (let day = 0; day < 7; day++) {
    weekMeals[day].forEach(meal => {
      const pts = parseInt(meal.points, 10);
      if (!isNaN(pts)) totalPoints += pts;
    });
  }
  const bar = document.getElementById('points-bar');
  const label = document.getElementById('points-label');
  const goalInput = document.getElementById('weekly-goal');
  if (goalInput) goalInput.value = weeklyMax;
  if (bar && label) {
    const percent = weeklyMax > 0 ? Math.min(100, Math.round((totalPoints / weeklyMax) * 100)) : 0;
    bar.style.width = percent + '%';
    if (totalPoints > weeklyMax) {
      bar.style.background = 'linear-gradient(90deg, #d32f2f 0%, #ff8a80 100%)';
      label.textContent = `${totalPoints} / ${weeklyMax} (+${totalPoints - weeklyMax} over)`;
    } else {
      bar.style.background = 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)';
      label.textContent = `${totalPoints} / ${weeklyMax}`;
    }
  }
window.updateWeeklyGoal = function(value) {
  weeklyMax = Math.max(1, parseInt(value, 10) || 175);
  renderMeals();
};

  // Meals grid
  const grid = document.getElementById('meal-grid');
  grid.innerHTML = '';
  for (let day = 0; day < 7; day++) {
    if (hiddenDays[day]) {
      const unhideCard = document.createElement('div');
      unhideCard.className = 'meal-card';
      // Colorful border for hidden day
      const borderColors = [
        '#1976d2', // Sunday
        '#388e3c', // Monday
        '#fbc02d', // Tuesday
        '#8e24aa', // Wednesday
        '#d84315', // Thursday
        '#0288d1', // Friday
        '#c2185b'  // Saturday
      ];
      unhideCard.style.border = `4px solid ${borderColors[day % borderColors.length]}`;
      unhideCard.style.boxSizing = 'border-box';
      unhideCard.innerHTML = `<h3 style="color:#888;">${getDayWithDate(day)}</h3><button onclick="unhideDay(${day})">Unhide Day</button>`;
      grid.appendChild(unhideCard);
      continue;
    }
    const card = document.createElement('div');
    card.className = 'meal-card';
    // Colorful border for each day
    const borderColors = [
      '#1976d2', // Sunday
      '#388e3c', // Monday
      '#fbc02d', // Tuesday
      '#8e24aa', // Wednesday
      '#d84315', // Thursday
      '#0288d1', // Friday
      '#c2185b'  // Saturday
    ];
    card.style.border = `4px solid ${borderColors[day % borderColors.length]}`;
    card.style.boxSizing = 'border-box';
    card.innerHTML = `<h3>${getDayWithDate(day)}</h3>`;
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    weekMeals[day].forEach((meal, mealIdx) => {
      const typeLabel = mealTypes[mealIdx] || '';
      card.innerHTML += `
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.3rem;">
          <span style="font-size: 1rem; color: #1976d2; font-weight: 500; min-width: 80px; text-align: right;">${typeLabel}</span>
          <h2 contenteditable="true" onblur="updateMealName(${day}, ${mealIdx}, this.textContent)" style="margin: 0;">${meal.name}</h2>
          <input type="number" min="0" placeholder="Points" value="${meal.points}" onchange="updateMealPoints(${day}, ${mealIdx}, this.value)" style="width: 70px; padding: 0.2rem 0.4rem; border-radius: 6px; border: 1px solid #b3d1ff;">
        </div>
        <ul>
          ${meal.items.map((item, itemIdx) => `<li contenteditable="true" onblur="updateMealItem(${day}, ${mealIdx}, ${itemIdx}, this.textContent)">${item}</li>`).join('')}
        </ul>
        <button onclick="deleteMeal(${day}, ${mealIdx})">Delete ${typeLabel}</button>
      `;
    });
    card.innerHTML += `<button onclick="hideDay(${day})" style="background:#e3f0ff;color:#1976d2;border:1px solid #b3d1ff;margin-top:0.7rem;">Hide Day</button>`;
    grid.appendChild(card);
  }
}
window.hideDay = function(day) {
  getWeekMeals().hiddenDays[day] = true;
  renderMeals();
};

window.unhideDay = function(day) {
  getWeekMeals().hiddenDays[day] = false;
  renderMeals();
};

window.updateMealPoints = function(day, mealIdx, value) {
  getWeekMeals().meals[day][mealIdx].points = value;
  renderMeals();
};

window.updateMealName = function(day, mealIdx, newName) {
  getWeekMeals().meals[day][mealIdx].name = newName;
  renderMeals();
};

window.updateMealItem = function(day, mealIdx, itemIdx, newItem) {
  getWeekMeals().meals[day][mealIdx].items[itemIdx] = newItem;
  renderMeals();
};

window.deleteMeal = function(day, mealIdx) {
  // Only clear the items, keep the meal type visible
  getWeekMeals().meals[day][mealIdx].items = getWeekMeals().meals[day][mealIdx].items.map(() => '');
  renderMeals();
};

function saveUserData(uid) {
  if (!db) return;
  // Convert nested arrays to objects for Firestore compatibility
  const weekDataMapForFirestore = {};
  for (const key in weekDataMap) {
    const week = weekDataMap[key];
    weekDataMapForFirestore[key] = {
      meals: week.meals.reduce((acc, dayMeals, dayIdx) => {
        const obj = {};
        dayMeals.forEach((meal, idx) => { obj[idx] = meal; });
        acc[dayIdx] = obj;
        return acc;
      }, {}),
      hiddenDays: [...week.hiddenDays]
    };
  }
  getUserDoc(uid).set({
    weekDataMap: weekDataMapForFirestore,
    groceryList
  }, { merge: true });
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    db = firebase.firestore();
    if (unsubscribeUserData) unsubscribeUserData();
    unsubscribeUserData = db.collection('users').doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          let shouldRender = false;
          if (JSON.stringify(data.weekDataMap) !== JSON.stringify(weekDataMap)) {
            // Convert Firestore object back to arrays
            weekDataMap = {};
            for (const key in data.weekDataMap) {
              const week = data.weekDataMap[key];
              weekDataMap[key] = {
                meals: Object.values(week.meals).map(dayMeals => Object.values(dayMeals)),
                hiddenDays: Array.isArray(week.hiddenDays) ? week.hiddenDays : []
              };
            }
            shouldRender = true;
          }
          if (JSON.stringify(data.groceryList) !== JSON.stringify(groceryList)) {
            groceryList = data.groceryList;
            renderGroceryList();
          }
          if (shouldRender) renderMeals();
        }
      });
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('logoff-btn').style.display = 'inline-block';
  } else {
    if (unsubscribeUserData) unsubscribeUserData();
    db = null;
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('logoff-btn').style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  renderMeals();
  renderGroceryList();
});
window.loginEmail = function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(user => {
      showAuthStatus('Logged in!');
      document.getElementById('auth-section').style.display = 'none';
    })
    .catch(err => showAuthStatus(err.message));
};

window.signupEmail = function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(user => {
      showAuthStatus('Account created!');
      document.getElementById('auth-section').style.display = 'none';
    })
    .catch(err => showAuthStatus(err.message));
};

window.loginGoogle = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(user => {
      showAuthStatus('Logged in with Google!');
      document.getElementById('auth-section').style.display = 'none';
    })
    .catch(err => showAuthStatus(err.message));
};

let unsubscribeUserData = null;

function showAuthStatus(msg) {
  const status = document.getElementById('auth-status');
  if (status) status.textContent = msg;
}
