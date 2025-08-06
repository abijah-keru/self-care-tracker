// 🌱 Self-Care Tracker Script with Firebase Cloud Save

// ----------------------------
// Firebase Auth (Anonymous)
// ----------------------------
let userId = localStorage.getItem("userId");

if (!userId && firebase && firebase.auth) {
  firebase.auth().signInAnonymously()
    .then(userCredential => {
      userId = userCredential.user.uid;
      localStorage.setItem("userId", userId);
    })
    .catch(err => console.error("Firebase Auth Error:", err));
}

// Reference to Firestore
const db = firebase.firestore();

// All anchors (checkboxes)
const anchors = [
  "makeBed",
  "drinkWater",
  "chooseClothes",
  "bodyMovement",
  "musicDance",
  "watchShow",
  "selfCare"
];

// ----------------------------
// Save Progress (Local + Cloud)
// ----------------------------
async function saveProgress() {
  // Save locally
  anchors.forEach(id => {
    localStorage.setItem(id, document.getElementById(id).checked);
  });
  localStorage.setItem("selfCareOption", document.getElementById("selfCareOption").value);
  localStorage.setItem("lastSavedDate", new Date().toDateString());

  // Calculate progress tally
  const completed = anchors.filter(id => document.getElementById(id).checked).length;

  // Pick a gentle message
  let messageText = "";
  if (completed === 0) {
    messageText = "You showed up today. That's the first step 🌱";
  } else if (completed <= 3) {
    messageText = `You completed ${completed} anchor${completed > 1 ? "s" : ""}. Small steps matter 🌸`;
  } else if (completed < anchors.length) {
    messageText = `Great job! ${completed} out of ${anchors.length} anchors done 🌞`;
  } else {
    messageText = `Wow! ${completed}/${anchors.length} anchors! You're glowing today! 🌟`;
  }

  // Show the message and confetti
  const msg = document.getElementById("message");
  msg.textContent = messageText;
  showMessage();
  launchConfetti();

  // Update streak tracker based on today's progress
  updateStreak(completed > 0);

  // ----------------------------
  // Save to Firestore (Cloud)
  // ----------------------------
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  try {
    if (userId) {
      await db.collection("users").doc(userId).collection("dailyProgress").doc(today).set({
        date: today,
        completed,
        totalAnchors: anchors.length,
        details: anchors.map(id => ({
          id,
          checked: document.getElementById(id).checked
        })),
        selfCareOption: document.getElementById("selfCareOption").value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("🌟 Progress saved to Firestore!");
    }
  } catch (err) {
    console.error("Error saving to Firestore:", err);
  }
}

// ----------------------------
// Load Progress (Local Only)
// ----------------------------
function loadProgress() {
  checkDailyReset(); // Auto-reset if a new day
  anchors.forEach(id => {
    document.getElementById(id).checked = localStorage.getItem(id) === "true";
  });
  document.getElementById("selfCareOption").value = localStorage.getItem("selfCareOption") || "";
}

// ----------------------------
// Clear Progress (Manual Reset)
// ----------------------------
function clearAll() {
  anchors.forEach(id => {
    document.getElementById(id).checked = false;
    localStorage.setItem(id, false);
  });
  document.getElementById("selfCareOption").value = "";
  localStorage.removeItem("selfCareOption");
  localStorage.setItem("lastSavedDate", new Date().toDateString());
  document.getElementById("message").style.display = "none";
}

// ----------------------------
// Automatic Daily Reset
// ----------------------------
function checkDailyReset() {
  const lastDate = localStorage.getItem("lastSavedDate");
  const today = new Date().toDateString();
  if (lastDate && lastDate !== today) {
    clearAll();
  }
}

// ----------------------------
// Show/Hide Friendly Message
// ----------------------------
function showMessage() {
  const msg = document.getElementById("message");
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 3000);
}

// ----------------------------
// Confetti Celebration
// ----------------------------
function launchConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 }
  });
}

// ----------------------------
// Streak Tracker
// ----------------------------
function updateStreak(completedToday) {
  // Load existing streak array (last 7 days)
  let streakData = JSON.parse(localStorage.getItem("streakData")) || [];

  const today = new Date().toDateString();
  const lastEntry = streakData.length > 0 ? streakData[streakData.length - 1].date : null;

  if (lastEntry !== today) {
    // Add today's result
    streakData.push({ date: today, done: completedToday });
    // Keep only last 7 days
    if (streakData.length > 7) streakData.shift();
    localStorage.setItem("streakData", JSON.stringify(streakData));
  } else {
    // Update today's result if already exists
    streakData[streakData.length - 1].done = completedToday;
    localStorage.setItem("streakData", JSON.stringify(streakData));
  }

  renderStreak(streakData);
}

function renderStreak(streakData) {
  const container = document.getElementById("streakIcons");
  if (!container) return; // Skip if HTML doesn't have streak section
  container.innerHTML = "";

  // Render last 7 days as soft dots
  for (let i = 0; i < 7; i++) {
    const day = streakData[i] || { done: false };
    const dot = document.createElement("div");
    dot.classList.add("streak-day");
    if (day.done) dot.classList.add("completed");
    container.appendChild(dot);
  }

  // Calculate streak message
  const currentStreak = calculateCurrentStreak(streakData);
  const msg = document.getElementById("streakMessage");
  if (!msg) return;
  if (currentStreak === 0) {
    msg.textContent = "Every step counts 🌱";
  } else if (currentStreak === 1) {
    msg.textContent = "1-day streak! Small steps 🌿";
  } else {
    msg.textContent = `${currentStreak}-day streak! Keep blooming 🌸`;
  }
}

function calculateCurrentStreak(streakData) {
  // Count streak from the end backwards
  let streak = 0;
  for (let i = streakData.length - 1; i >= 0; i--) {
    if (streakData[i].done) streak++;
    else break;
  }
  return streak;
}

// ----------------------------
// Event Listeners
// ----------------------------
document.getElementById("saveBtn").addEventListener("click", saveProgress);
document.getElementById("resetBtn").addEventListener("click", clearAll);

// Initial Load
loadProgress();
const streakData = JSON.parse(localStorage.getItem("streakData")) || [];
renderStreak(streakData);

