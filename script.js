// ----------------------------
// Firebase Firestore + Anonymous Auth Setup
// ----------------------------
let userId = null;
let userDocRef = null;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    userId = user.uid;
    userDocRef = db.collection("anchors").doc(userId);
    console.log("Signed in as anonymous user:", userId);
    loadAnchors();
  } else {
    firebase.auth().signInAnonymously().catch(err => {
      console.error("Anonymous sign-in failed:", err);
    });
  }
});

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
// Checkbox Visual Feedback
// ----------------------------
function toggleAnchorStyle(cb) {
  const parent = cb.closest(".anchor");
  if (cb.checked) {
    parent.style.backgroundColor = "#E0F3F2"; // soft green
    parent.style.boxShadow = "0 0 8px rgba(76,167,160,0.3)";
  } else {
    parent.style.backgroundColor = "white";
    parent.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
  }
}

checkboxes.forEach(cb => {
  cb.addEventListener("change", () => toggleAnchorStyle(cb));
});

// ----------------------------
// Load Data from Firestore
// ----------------------------
async function loadAnchors() {
  if (!userDocRef) return;
  try {
    const doc = await userDocRef.get();
    if (doc.exists) {
      const data = doc.data();

      // Load checkbox states
      checkboxes.forEach(cb => {
        cb.checked = !!data[cb.id];
        toggleAnchorStyle(cb);
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
      console.log("No existing data for this user 🌱");
    }
  } catch (error) {
    console.error("Error loading anchors:", error);
  }
}

// ----------------------------
// Save Anchors to Firestore
// ----------------------------
async function saveAnchors() {
  if (!userDocRef) return;

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
    streakCount = 0; // Break streak if nothing done
  }

  dataToSave.streakCount = streakCount;
  dataToSave.lastCompletionDate = lastCompletionDate;

  try {
    await userDocRef.set(dataToSave);
    triggerConfetti();
    showMessage(`🌱 Progress Saved! You completed ${completedCount} anchor(s) today 🌞`);
    updateStreakDisplay();
  } catch (error) {
    console.error("Error saving anchors:", error);
    showMessage("⚠️ Error saving progress, please try again.");
  }
}

// ----------------------------
// Reset Day (UI + Firestore)
// ----------------------------
async function resetDay() {
  checkboxes.forEach(cb => {
    cb.checked = false;
    toggleAnchorStyle(cb);
  });
  selfCareOption.value = "";
  showMessage("Day reset. A fresh start awaits 🌸");

  if (userDocRef) {
    await userDocRef.set({
      selfCareOption: "",
      streakCount, // keep streak
      lastCompletionDate // keep last completion date
    });
  }
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
  streakIcons.innerHTML = "";
  for (let i = 0; i < streakCount; i++) {
    const star = document.createElement("span");
    star.textContent = "⭐";
    star.style.fontSize = "20px";
    streakIcons.appendChild(star);
  }
  streakMessage.textContent = streakCount
    ? `You've kept your gentle streak for ${streakCount} day${streakCount > 1 ? "s" : ""} 🌼`
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
