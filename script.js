// ----------------------------
// Firestore Setup (from your HTML)
// ----------------------------
// We are using the Firebase compat SDK already loaded in HTML:
// const db = firebase.firestore();

// Firestore document reference for single-user (can expand later)
const docRef = db.collection("anchors").doc("defaultUser");

// ----------------------------
// DOM Elements
// ----------------------------
const checkboxes = document.querySelectorAll("input[type=checkbox]");
const selfCareOption = document.getElementById("selfCareOption");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");
const streakIcons = document.getElementById("streakIcons");
const streakMessage = document.getElementById("streakMessage");

let streakCount = 0;
let lastCompletionDate = null;

// ----------------------------
// Load Data from Firestore
// ----------------------------
async function loadAnchors() {
  try {
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();

      // Load checkbox states
      checkboxes.forEach(cb => {
        cb.checked = !!data[cb.id];
      });

      // Load self-care dropdown
      if (data.selfCareOption) {
        selfCareOption.value = data.selfCareOption;
      }

      // Load streak info
      streakCount = data.streakCount || 0;
      lastCompletionDate = data.lastCompletionDate || null;
      updateStreakDisplay();
    } else {
      console.log("No existing data, starting fresh 🌱");
    }
  } catch (error) {
    console.error("Error loading anchors:", error);
  }
}

// ----------------------------
// Save Anchors to Firestore
// ----------------------------
async function saveAnchors() {
  const today = new Date().toDateString();
  let completedCount = 0;

  const dataToSave = {};

  checkboxes.forEach(cb => {
    dataToSave[cb.id] = cb.checked;
    if (cb.checked) completedCount++;
  });

  dataToSave.selfCareOption = selfCareOption.value;

  // Handle streaks
  if (completedCount > 0) {
    if (lastCompletionDate !== today) {
      streakCount++;
      lastCompletionDate = today;
    }
  } else {
    streakCount = 0; // If nothing completed, streak breaks
  }

  dataToSave.streakCount = streakCount;
  dataToSave.lastCompletionDate = lastCompletionDate;

  try {
    await docRef.set(dataToSave);
    triggerConfetti();
    showMessage(`🌱 Progress Saved! You completed ${completedCount} anchor(s) today 🌞`);
    updateStreakDisplay();
  } catch (error) {
    console.error("Error saving anchors:", error);
    showMessage("⚠️ Error saving progress, please try again.");
  }
}

// ----------------------------
// Reset Day (UI only)
// ----------------------------
function resetDay() {
  checkboxes.forEach(cb => (cb.checked = false));
  selfCareOption.value = "";
  showMessage("Day reset. A fresh start awaits 🌸");
}

// ----------------------------
// Gentle Message + Confetti
// ----------------------------
function showMessage(text) {
  message.textContent = text;
  message.style.display = "block";
  setTimeout(() => (message.style.display = "none"), 3000);
}

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
  });
}

// ----------------------------
// Streak Display
// ----------------------------
function updateStreakDisplay() {
  streakIcons.innerHTML = "⭐".repeat(streakCount);
  streakMessage.textContent = streakCount
    ? `You've kept your gentle streak for ${streakCount} day(s) 🌼`
    : `Let's begin your gentle journey today 🌱`;
}

// ----------------------------
// Navbar Page Switching
// ----------------------------
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".page-section");

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    const sectionToShow = link.dataset.section;
    sections.forEach(sec => {
      sec.classList.toggle("active", sec.id === sectionToShow);
    });
  });
});

// ----------------------------
// Event Listeners
// ----------------------------
saveBtn.addEventListener("click", saveAnchors);
resetBtn.addEventListener("click", resetDay);

// ----------------------------
// Initial Load
// ----------------------------
loadAnchors();
