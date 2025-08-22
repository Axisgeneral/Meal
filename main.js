// --- Dark Mode Toggle ---
const darkModeToggle = document.getElementById('darkModeToggle');
function setDarkMode(enabled) {
	document.body.classList.toggle('dark-mode', enabled);
	localStorage.setItem('darkMode', enabled ? '1' : '0');
	darkModeToggle.textContent = enabled ? 'Light Mode' : 'Dark Mode';
}
darkModeToggle.addEventListener('click', function() {
	setDarkMode(!document.body.classList.contains('dark-mode'));
});
// On load, set mode from localStorage
document.addEventListener('DOMContentLoaded', function() {
	setDarkMode(localStorage.getItem('darkMode') === '1');
});

// Export grocery list to PDF
document.getElementById('exportGroceryPDF').addEventListener('click', function() {
	if (window.jspdf && window.jspdf.jsPDF) {
		const doc = new window.jspdf.jsPDF();
		doc.setFontSize(18);
		doc.text('Grocery List', 10, 15);
		doc.setFontSize(13);
		let y = 30;
		const items = Array.from(document.querySelectorAll('#groceryList li')).map(li => li.firstChild.textContent.trim());
		if (items.length === 0) {
			doc.text('No items in grocery list.', 10, y);
		} else {
			items.forEach(item => {
				doc.text('- ' + item, 10, y);
				y += 10;
			});
		}
		doc.save('grocery-list.pdf');
	} else {
		alert('jsPDF library not loaded. Please check your internet connection or add jsPDF to your project.');
	}
});
// Grocery List functionality
const groceryInput = document.getElementById('groceryInput');
const groceryBtn = document.getElementById('addGroceryBtn');
const groceryList = document.getElementById('groceryList');

function addGroceryItem() {
	const value = groceryInput.value.trim();
	if (value) {
		const li = document.createElement('li');
		li.textContent = value;
		const removeBtn = document.createElement('button');
		removeBtn.textContent = 'Remove';
		removeBtn.style.marginLeft = '10px';
		removeBtn.style.background = '#e74c3c';
		removeBtn.style.color = '#fff';
		removeBtn.style.border = 'none';
		removeBtn.style.borderRadius = '4px';
		removeBtn.style.cursor = 'pointer';
		removeBtn.onclick = () => li.remove();
		li.appendChild(removeBtn);
		groceryList.appendChild(li);
		groceryInput.value = '';
	}
}

groceryBtn.addEventListener('click', addGroceryItem);
groceryInput.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') addGroceryItem();
});
// Week navigation and dynamic date filling
let weekOffset = 0; // 0 = current week, -1 = previous, +1 = next, etc.
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMonday(date) {
	const d = new Date(date);
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	d.setHours(0,0,0,0);
	return d;
}

function fillDayCells() {
	const now = new Date();
	const monday = getMonday(now);
	monday.setDate(monday.getDate() + weekOffset * 7);
	document.querySelectorAll('.day-cell').forEach(cell => {
		const dayIdx = parseInt(cell.getAttribute('data-day'));
		const date = new Date(monday);
		date.setDate(monday.getDate() + dayIdx);
		const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
		cell.textContent = `${days[dayIdx]} (${dateStr})`;
	});
	// Update week label
	const endDate = new Date(monday);
	endDate.setDate(monday.getDate() + 6);
	const weekLabel = `${monday.getMonth()+1}/${monday.getDate()} - ${endDate.getMonth()+1}/${endDate.getDate()}`;
	document.getElementById('weekLabel').textContent = weekLabel;
}

document.getElementById('prevWeek').addEventListener('click', function() {
	weekOffset--;
	fillDayCells();
});
document.getElementById('nextWeek').addEventListener('click', function() {
	weekOffset++;
	fillDayCells();
});

fillDayCells();

// Calculate total points and update status
function updatePoints() {
	let total = 0;
	document.querySelectorAll('.points-cell').forEach(cell => {
		const val = parseInt(cell.textContent) || 0;
		total += val;
	});
	document.getElementById('totalPoints').textContent = 'Total Points: ' + total;
	const target = parseInt(document.getElementById('weeklyTarget').value) || 0;
	let status = '';
	// Progress bar logic
	const barFill = document.getElementById('progressBarFill');
	const barLabel = document.getElementById('progressBarLabel');
	let percent = 0;
	if (target > 0) {
		percent = Math.min(100, Math.round((total / target) * 100));
		barFill.style.width = percent + '%';
		barLabel.textContent = `${percent}% of weekly target (${total}/${target} points)`;
		if (total > target) {
			status = 'Over target by ' + (total - target) + ' points.';
			document.getElementById('targetStatus').style.color = 'red';
			barFill.style.background = '#e74c3c';
		} else {
			status = 'Within target. ' + (target - total) + ' points remaining.';
			document.getElementById('targetStatus').style.color = 'green';
			barFill.style.background = '#0078d4';
		}
	} else {
		barFill.style.width = '0';
		barLabel.textContent = '';
		status = '';
	}
	document.getElementById('targetStatus').textContent = status;
}

document.querySelectorAll('.points-cell').forEach(cell => {
	cell.addEventListener('input', updatePoints);
});
document.getElementById('weeklyTarget').addEventListener('input', updatePoints);
updatePoints();

// --- Firebase Initialization ---
const firebaseConfig = {
    apiKey: "AIzaSyD5PvRi1hr6KDM1lfeKkILJr3fBKShTKw0",
    authDomain: "meal-ca15a.firebaseapp.com",
    databaseURL: "https://meal-ca15a-default-rtdb.firebaseio.com",
    projectId: "meal-ca15a",
    appId: "1:571882719486:web:45935f040dc4b6f8ed3daf"
};
firebase.initializeApp(firebaseConfig);

// --- Google Login ---
const loginBtn = document.getElementById('loginBtn');
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loginBtn.textContent = `Logged in as ${user.email}`;
        loginBtn.disabled = true;
        // Load user data for the current week
        loadMealData(user.uid, getCurrentWeekKey());
    } else {
        loginBtn.textContent = 'Login with Google';
        loginBtn.disabled = false;
    }
});
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .catch(error => alert("Login failed: " + error.message));
});

// --- Helper to get current week key ---
function getCurrentWeekKey() {
    const now = new Date();
    const monday = getMonday(now);
    return `${monday.getFullYear()}-${monday.getMonth()+1}-${monday.getDate()}`;
}

// --- Save Data to Firebase ---
async function saveMealData(data) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const weekKey = getCurrentWeekKey();
    await firebase.database().ref(`users/${user.uid}/weeks/${weekKey}`).set(data);
}

// --- UI Update Logic for Firebase Data ---
async function loadMealData(userId, weekKey) {
    const snapshot = await firebase.database().ref(`users/${userId}/weeks/${weekKey}`).once('value');
    const data = snapshot.val();
    if (data) {
        // Update meal grid
        if (data.meals) {
            document.querySelectorAll('.meal-cell').forEach((cell, idx) => {
                cell.textContent = data.meals[idx] || '';
            });
        }
        // Update points grid
        if (data.points) {
            document.querySelectorAll('.points-cell').forEach((cell, idx) => {
                cell.textContent = data.points[idx] || '';
            });
            updatePoints();
        }
        // Update grocery list
        if (data.groceryList) {
            groceryList.innerHTML = '';
            data.groceryList.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.style.marginLeft = '10px';
                removeBtn.style.background = '#e74c3c';
                removeBtn.style.color = '#fff';
                removeBtn.style.border = 'none';
                removeBtn.style.borderRadius = '4px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.onclick = () => li.remove();
                li.appendChild(removeBtn);
                groceryList.appendChild(li);
            });
        }
    } else {
        // Clear UI if no data
        document.querySelectorAll('.meal-cell').forEach(cell => cell.textContent = '');
        document.querySelectorAll('.points-cell').forEach(cell => cell.textContent = '');
        groceryList.innerHTML = '';
        updatePoints();
    }
}

// Example call to saveMealData
saveMealData({
    meals: /* array or object of meals */,
    points: /* array of points */,
    groceryList: /* array of grocery items */
});

// --- Autosave Feature ---
function collectMealData() {
    // Collect meals
    const meals = Array.from(document.querySelectorAll('.meal-cell')).map(cell => cell.textContent);
    // Collect points
    const points = Array.from(document.querySelectorAll('.points-cell')).map(cell => cell.textContent);
    // Collect grocery list
    const groceryItems = Array.from(document.querySelectorAll('#groceryList li')).map(li => li.firstChild.textContent.trim());
    return {
        meals,
        points,
        groceryList: groceryItems
    };
}

// Autosave on meal/points/grocery changes
document.querySelectorAll('.meal-cell, .points-cell').forEach(cell => {
    cell.addEventListener('input', () => {
        saveMealData(collectMealData());
    });
});
groceryBtn.addEventListener('click', () => {
    saveMealData(collectMealData());
});
groceryInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveMealData(collectMealData());
});

// Autosave weekly target changes
document.getElementById('weeklyTarget').addEventListener('input', () => {
    saveMealData(collectMealData());
});

// Autosave when removing grocery items
groceryList.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' && e.target.textContent === 'Remove') {
        setTimeout(() => saveMealData(collectMealData()), 100);
    }
});

