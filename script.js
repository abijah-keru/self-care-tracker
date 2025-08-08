console.log("Script loaded");
console.log("Firebase version:", firebase.SDK_VERSION);
console.log("Is Firestore available?", !!firebase.firestore);

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDpk63cp1zLv5gvPfYCrFPkvwZt0SXIl4k",
  authDomain: "selfcare-anchors.firebaseapp.com",
  projectId: "selfcare-anchors",
  storageBucket: "selfcare-anchors.firebasestorage.app",
  messagingSenderId: "775875642015",
  appId: "1:775875642015:web:eac713043d3a12ad9f98aa",
  measurementId: "G-TF8GQBZ7XC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🌱 Self-Care Tracker Script with Enhanced Firebase Sync

// All anchors (checkboxes) - Updated to match your HTML
const anchors = [
    "makeBed",
    "drinkWater",
    "chooseClothes",
    "bodyMovement",
    "musicDance",
    "watchShow",
    "journalAboutApp",  // Added this one from your HTML
    "selfCare"
];

// User ID for multi-device sync (you might want to implement proper auth later)
const userId = localStorage.getItem("userId") || generateUserId();

function generateUserId() {
  const id = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", id);
  return id;
}

// ----------------------------
// Firebase Sync Functions
// ----------------------------

async function loadFromFirebase() {
  try {
    console.log("Loading from Firebase...");
    const today = new Date().toDateString();
    
    // Query for today's progress
    const querySnapshot = await db.collection("dailyProgress")
      .where("userId", "==", userId)
      .where("date", "==", today)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log("Found Firebase data for today:", data);
      
      // Load checkbox states
      anchors.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && data[id] !== undefined) {
          checkbox.checked = data[id];
        }
      });
      
      // Load other form data
      if (data.selfCareOption) {
        document.getElementById("selfCareOption").value = data.selfCareOption;
      }
      
      if (data.watchShowName) {
        const watchShowInput = document.getElementById("watchShowInput");
        watchShowInput.value = data.watchShowName;
        if (data.watchShow) {
          watchShowInput.style.display = "inline-block";
        }
      }
      
      console.log("Firebase data loaded successfully");
      return true; // Data was loaded from Firebase
    } else {
      console.log("No Firebase data found for today");
      return false; // No data found
    }
  } catch (error) {
    console.error("Error loading from Firebase:", error);
    return false;
  }
}

async function saveToFirebase(progressData) {
  try {
    const today = new Date().toDateString();
    
    // Check if we already have a document for today
    const querySnapshot = await db.collection("dailyProgress")
      .where("userId", "==", userId)
      .where("date", "==", today)
      .limit(1)
      .get();

    const dataToSave = {
      ...progressData,
      userId: userId,
      date: today,
      timestamp: new Date()
    };

    if (!querySnapshot.empty) {
      // Update existing document
      const doc = querySnapshot.docs[0];
      await doc.ref.update(dataToSave);
      console.log("Progress updated in Firestore");
    } else {
      // Create new document
      const docRef = await db.collection("dailyProgress").add(dataToSave);
      console.log("Progress saved to Firestore with ID:", docRef.id);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    return false;
  }
}

// ----------------------------
// Enhanced Save Progress with Sync
// ----------------------------
async function saveProgress() {
  // Gather all form data
  const progressData = {};
  
  // Get checkbox states
  anchors.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      progressData[id] = checkbox.checked;
    }
  });
  
  // Get other form data
  const selfCareSelect = document.getElementById("selfCareOption");
  const watchShowInput = document.getElementById("watchShowInput");
  
  if (selfCareSelect) {
    progressData.selfCareOption = selfCareSelect.value;
  }
  
  if (watchShowInput) {
    progressData.watchShowName = watchShowInput.value;
  }

  // Save to localStorage (for offline access)
  anchors.forEach(id => {
    if (progressData[id] !== undefined) {
      localStorage.setItem(id, progressData[id]);
    }
  });
  
  localStorage.setItem("selfCareOption", progressData.selfCareOption || "");
  localStorage.setItem("watchedShowName", progressData.watchShowName || "");
  localStorage.setItem("lastSavedDate", new Date().toDateString());

  // Save to Firebase
  const firebaseSaved = await saveToFirebase(progressData);
  
  if (!firebaseSaved) {
    // If Firebase save failed, you might want to queue it for later
    console.log("Firebase save failed, data saved locally only");
  }

  // Show success message
  displaySaveMessage(progressData);
}

// ----------------------------
// Enhanced Load Progress with Sync
// ----------------------------
async function loadProgress() {
  checkDailyReset(); // Auto-reset if a new day
  
  // Try to load from Firebase first
  const firebaseLoaded = await loadFromFirebase();
  
  if (!firebaseLoaded) {
    // Fallback to localStorage if Firebase fails or has no data
    console.log("Loading from localStorage...");
    anchors.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = localStorage.getItem(id) === "true";
      }
    });
    
    const selfCareSelect = document.getElementById("selfCareOption");
    if (selfCareSelect) {
      selfCareSelect.value = localStorage.getItem("selfCareOption") || "";
    }
    
    const savedShow = localStorage.getItem("watchedShowName");
    const watchShowInput = document.getElementById("watchShowInput");
    const watchShowCheckbox = document.getElementById("watchShow");
    
    if (savedShow && watchShowInput) {
      watchShowInput.value = savedShow;
      if (watchShowCheckbox && watchShowCheckbox.checked) {
        watchShowInput.style.display = "inline-block";
      }
    }
  }
  
  // Update UI based on loaded data
  updateUIAfterLoad();
}

function updateUIAfterLoad() {
  // Update streak display
  const streakData = JSON.parse(localStorage.getItem("streakData")) || [];
  renderStreak(streakData);
  
  // Handle watch show input visibility
  const watchShowCheckbox = document.getElementById("watchShow");
  const watchShowInput = document.getElementById("watchShowInput");
  
  if (watchShowCheckbox && watchShowInput && watchShowCheckbox.checked) {
    watchShowInput.style.display = "inline-block";
  }
}

// ----------------------------
// Sync All Historical Data to Firebase (One-time migration)
// ----------------------------
async function migrateLocalDataToFirebase() {
  try {
    const streakData = JSON.parse(localStorage.getItem("streakData")) || [];
    
    for (const dayData of streakData) {
      // Check if this day's data already exists in Firebase
      const querySnapshot = await db.collection("dailyProgress")
        .where("userId", "==", userId)
        .where("date", "==", dayData.date)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        // Migrate this day's data
        await db.collection("dailyProgress").add({
          userId: userId,
          date: dayData.date,
          completed: dayData.done,
          timestamp: new Date(dayData.date),
          migrated: true
        });
        console.log(`Migrated data for ${dayData.date}`);
      }
    }
    
    console.log("Data migration completed");
  } catch (error) {
    console.error("Error migrating data:", error);
  }
}

// ----------------------------
// Display Save Message
// ----------------------------
function displaySaveMessage(progressData) {
  const completed = anchors.filter(id => progressData[id] === true).length;
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

  document.getElementById("message").textContent = messageText;
  showMessage();
  launchConfetti();
  updateStreak(completed > 0);
}

// ----------------------------
// Clear Progress (Manual Reset)
// ----------------------------
async function clearAll() {
  // Clear checkboxes
  anchors.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = false;
      localStorage.setItem(id, false);
    }
  });
  
  // Clear other form elements
  const selfCareSelect = document.getElementById("selfCareOption");
  if (selfCareSelect) {
    selfCareSelect.value = "";
  }
  
  const watchShowInput = document.getElementById("watchShowInput");
  if (watchShowInput) {
    watchShowInput.value = "";
    watchShowInput.style.display = "none";
  }
  
  localStorage.removeItem("selfCareOption");
  localStorage.removeItem("watchedShowName");
  localStorage.setItem("lastSavedDate", new Date().toDateString());
  
  // Hide message
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.style.display = "none";
  }
  
  // Save the cleared state to Firebase
  const clearedData = {};
  anchors.forEach(id => {
    clearedData[id] = false;
  });
  clearedData.selfCareOption = "";
  clearedData.watchShowName = "";
  
  await saveToFirebase(clearedData);
}

// ----------------------------
// Automatic Daily Reset
// ----------------------------
function checkDailyReset() {
  const lastDate = localStorage.getItem("lastSavedDate");
  const today = new Date().toDateString();
  if (lastDate && lastDate !== today) {
    // Clear localStorage for new day, but don't clear Firebase
    anchors.forEach(id => {
      localStorage.setItem(id, false);
    });
    localStorage.removeItem("selfCareOption");
    localStorage.removeItem("watchedShowName");
    localStorage.setItem("lastSavedDate", today);
  }
}

// ----------------------------
// Show/Hide Friendly Message
// ----------------------------
function showMessage() {
  const msg = document.getElementById("message");
  if (msg) {
    msg.style.display = "block";
    setTimeout(() => { 
      msg.style.display = "none"; 
    }, 3000);
  }
}

// ----------------------------
// Confetti Celebration
// ----------------------------
function launchConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// ----------------------------
// Streak Tracker (Enhanced with Firebase sync)
// ----------------------------
function updateStreak(completedToday) {
  let streakData = JSON.parse(localStorage.getItem("streakData")) || [];
  const today = new Date().toDateString();
  const lastEntry = streakData.length > 0 ? streakData[streakData.length - 1].date : null;

  if (lastEntry !== today) {
    streakData.push({ date: today, done: completedToday });
    if (streakData.length > 7) streakData.shift();
    localStorage.setItem("streakData", JSON.stringify(streakData));
  } else {
    streakData[streakData.length - 1].done = completedToday;
    localStorage.setItem("streakData", JSON.stringify(streakData));
  }

  renderStreak(streakData);
}

function renderStreak(streakData) {
  const container = document.getElementById("streakIcons");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = streakData[i] || { done: false };
    const dot = document.createElement("div");
    dot.classList.add("streak-day");
    if (day.done) dot.classList.add("completed");
    container.appendChild(dot);
  }

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
  let streak = 0;
  for (let i = streakData.length - 1; i >= 0; i--) {
    if (streakData[i].done) streak++;
    else break;
  }
  return streak;
}

// ----------------------------
// Offline/Online Sync Handler
// ----------------------------
function handleOnlineOffline() {
  window.addEventListener('online', async () => {
    console.log("Back online! Syncing data...");
    await loadProgress(); // Re-sync when back online
  });
  
  window.addEventListener('offline', () => {
    console.log("Offline mode - saving locally only");
  });
}

// ----------------------------
// Event Listeners
// ----------------------------
function setupEventListeners() {
  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const watchShowCheckbox = document.getElementById("watchShow");
  const watchShowInput = document.getElementById("watchShowInput");
  
  if (saveBtn) {
    saveBtn.addEventListener("click", saveProgress);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener("click", clearAll);
  }
  
  if (watchShowCheckbox && watchShowInput) {
    watchShowCheckbox.addEventListener("change", function () {
      if (this.checked) {
        watchShowInput.style.display = "inline-block";
        watchShowInput.focus();
      } else {
        watchShowInput.style.display = "none";
        watchShowInput.value = "";
        localStorage.removeItem("watchedShowName");
      }
    });
    
    watchShowInput.addEventListener("input", function () {
      localStorage.setItem("watchedShowName", this.value);
    });
  }
}

// ----------------------------
// Initialize App
// ----------------------------
async function initializeApp() {
  console.log("Initializing Self-Care Tracker with Firebase sync...");
  
  // Set up event listeners
  setupEventListeners();
  
  // Handle online/offline events
  handleOnlineOffline();
  
  // Load progress (Firebase first, then localStorage fallback)
  await loadProgress();
  
  // Uncomment the next line if you want to migrate existing localStorage data to Firebase
  // await migrateLocalDataToFirebase();
  
  console.log("App initialized successfully!");
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}