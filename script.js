console.log("Script loaded");
console.log("Firebase version:", firebase.SDK_VERSION);
console.log("Is Firestore available?", !!firebase.firestore);
console.log("Is Auth available?", !!firebase.auth);

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
const auth = firebase.auth();


// ----------------------------
// PWA Update Detection
// ----------------------------

let updateAvailable = false;
let newServiceWorker = null;

function createUpdateNotification() {
  // Create update notification HTML
  const updateNotification = document.createElement('div');
  updateNotification.id = 'updateNotification';
  updateNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      text-align: center;
      font-family: Arial, sans-serif;
    ">
      <div style="margin-bottom: 10px;">
        📱 New version available!
      </div>
      <button id="updateBtn" style="
        background: white;
        color: #4CAF50;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-right: 8px;
      ">
        Update Now
      </button>
      <button id="dismissBtn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">
        Later
      </button>
    </div>
  `;
  
  document.body.appendChild(updateNotification);
  
  // Add event listeners
  document.getElementById('updateBtn').addEventListener('click', () => {
    applyUpdate();
  });
  
  document.getElementById('dismissBtn').addEventListener('click', () => {
    hideUpdateNotification();
  });
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.getElementById('updateNotification')) {
      hideUpdateNotification();
    }
  }, 10000);
}

function hideUpdateNotification() {
  const notification = document.getElementById('updateNotification');
  if (notification) {
    notification.remove();
  }
}

function applyUpdate() {
  if (newServiceWorker) {
    // Tell the new service worker to skip waiting
    newServiceWorker.postMessage({ action: 'skipWaiting' });
    
    // Hide the notification
    hideUpdateNotification();
    
    // Show loading message
    showUpdateProgress();
  }
}

function showUpdateProgress() {
  const progressNotification = document.createElement('div');
  progressNotification.id = 'updateProgress';
  progressNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2196F3;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      text-align: center;
      font-family: Arial, sans-serif;
    ">
      <div>🔄 Updating app...</div>
      <div style="margin-top: 8px; font-size: 12px;">This will only take a moment</div>
    </div>
  `;
  
  document.body.appendChild(progressNotification);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
        
        // Check for updates on registration
        registration.addEventListener('updatefound', () => {
          console.log('New service worker found');
          const newWorker = registration.installing;
          newServiceWorker = newWorker;
          
          newWorker.addEventListener('statechange', () => {
            console.log('New service worker state:', newWorker.state);
            
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker installed, show update notification
                console.log('Update available');
                updateAvailable = true;
                createUpdateNotification();
              } else {
                // First time install
                console.log('Service worker installed for the first time');
              }
            }
          });
        });
        
        // Listen for controller change (when new SW takes control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New service worker took control');
          // Hide any update progress messages
          const progress = document.getElementById('updateProgress');
          if (progress) {
            progress.remove();
          }
          
          // Show success message and reload
          showUpdateSuccess();
        });
        
        // Check for waiting service worker on page load
        if (registration.waiting) {
          console.log('Service worker waiting');
          newServiceWorker = registration.waiting;
          updateAvailable = true;
          createUpdateNotification();
        }
        
        // Periodic check for updates (every 10 minutes)
        setInterval(() => {
          registration.update();
        }, 600000); // 10 minutes
        
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  }
}

function showUpdateSuccess() {
  const successNotification = document.createElement('div');
  successNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      text-align: center;
      font-family: Arial, sans-serif;
    ">
      <div>✅ App updated successfully!</div>
      <div style="margin-top: 8px; font-size: 12px;">Refreshing...</div>
    </div>
  `;
  
  document.body.appendChild(successNotification);
  
  // Reload the page after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

// Check for updates when app becomes visible (user switches back to app)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration()
      .then(registration => {
        if (registration) {
          registration.update();
        }
      });
  }
});

function initializeServiceWorker() {
  registerServiceWorker();
}

// 🌱 Self-Care Tracker with Authentication and Splash Screen

// Default anchors (checkboxes)
const defaultAnchors = [
    "makeBed",
    "drinkWater", 
    "chooseClothes",
    "bodyMovement",
    "musicDance",
    "watchShow",
    "selfCare",
    "journalAboutApp"
];

// Working anchors list (default + custom)
let anchors = [...defaultAnchors];

function getUserPrefix() {
  return currentUser ? `user_${currentUser.uid}_` : '';
}

function loadCustomAnchors() {
  const prefix = getUserPrefix();
  if (!prefix) return [];
  try {
    const raw = localStorage.getItem(prefix + 'customAnchors');
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function saveCustomAnchors(list) {
  const prefix = getUserPrefix();
  if (!prefix) return;
  localStorage.setItem(prefix + 'customAnchors', JSON.stringify(list));
}

function renderCustomAnchors() {
  const page = document.getElementById('daily-anchors');
  if (!page) return;
  
  // Remove existing custom anchors before re-render
  page.querySelectorAll('.anchor[data-custom="true"]').forEach(el => el.remove());

  const custom = loadCustomAnchors();
  anchors = [...defaultAnchors, ...custom.map(a => a.id)];

  // Insert custom anchors at the bottom, after the self-care section
  const insertBeforeEl = page.querySelector('.progress-indicator');
  custom.forEach(item => {
    const row = document.createElement('div');
    row.className = 'anchor';
    row.setAttribute('data-custom', 'true');
    row.setAttribute('data-id', item.id);
    row.innerHTML = `<label><input type="checkbox" id="${item.id}"> ${item.label}</label>
      <button data-action="remove" class="btn-danger" style="margin-left:8px; flex:0 0 auto;">Remove</button>`;
    page.insertBefore(row, insertBeforeEl);
    
    // restore state
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) {
      const prefix = getUserPrefix();
      checkbox.checked = localStorage.getItem(prefix + item.id) === 'true';
      checkbox.addEventListener('change', handleAnchorChange);
    }
    
    // remove handler
    const removeBtn = row.querySelector('button[data-action="remove"]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const updated = loadCustomAnchors().filter(c => c.id !== item.id);
        saveCustomAnchors(updated);
        renderCustomAnchors();
        updateProgressIndicator();
      });
    }
  });
}

// Current user
let currentUser = null;

// ----------------------------
// Anchor Management Functions
// ----------------------------

// Track removed default anchors
let removedDefaultAnchors = new Set();

function loadRemovedDefaultAnchors() {
  const prefix = getUserPrefix();
  if (!prefix) return new Set();
  try {
    const raw = localStorage.getItem(prefix + 'removedDefaultAnchors');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveRemovedDefaultAnchors() {
  const prefix = getUserPrefix();
  if (!prefix) return;
  localStorage.setItem(prefix + 'removedDefaultAnchors', JSON.stringify([...removedDefaultAnchors]));
}

function removeDefaultAnchor(anchorId) {
  removedDefaultAnchors.add(anchorId);
  saveRemovedDefaultAnchors();
  
  // Hide the anchor element
  const anchorEl = document.querySelector(`[data-id="${anchorId}"]`);
  if (anchorEl) {
    anchorEl.style.display = 'none';
  }
  
  // Update anchors array
  anchors = anchors.filter(id => id !== anchorId);
  updateProgressIndicator();
  updateRemovedAnchorsDisplay();
}

function restoreDefaultAnchor(anchorId) {
  removedDefaultAnchors.delete(anchorId);
  saveRemovedDefaultAnchors();
  
  // Show the anchor element
  const anchorEl = document.querySelector(`[data-id="${anchorId}"]`);
  if (anchorEl) {
    anchorEl.style.display = 'flex';
  }
  
  // Update anchors array
  anchors = [...defaultAnchors.filter(id => !removedDefaultAnchors.has(id)), ...loadCustomAnchors().map(a => a.id)];
  updateProgressIndicator();
  updateRemovedAnchorsDisplay();
}

function updateRemovedAnchorsDisplay() {
  const removedList = document.getElementById('removedAnchorsList');
  if (!removedList) return;
  
  if (removedDefaultAnchors.size === 0) {
    removedList.innerHTML = '<em>No anchors removed</em>';
  } else {
    const anchorNames = Array.from(removedDefaultAnchors).map(id => 
      id.replace(/([A-Z])/g, ' $1').toLowerCase()
    );
    removedList.innerHTML = `<strong>Removed:</strong> ${anchorNames.join(', ')}`;
  }
}

// Sparkle animation function
function addSparkleAnimation(checkbox) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle-animation';
  sparkle.innerHTML = '✨';
  sparkle.style.cssText = `
    position: absolute;
    font-size: 16px;
    pointer-events: none;
    animation: sparkle 1.5s ease-out forwards;
    z-index: 1000;
  `;
  
  // Position sparkle near the checkbox
  const rect = checkbox.getBoundingClientRect();
  sparkle.style.left = (rect.left + rect.width/2 - 8) + 'px';
  sparkle.style.top = (rect.top + rect.height/2 - 8) + 'px';
  
  document.body.appendChild(sparkle);
  
  // Remove after animation
  setTimeout(() => {
    if (sparkle.parentNode) {
      sparkle.parentNode.removeChild(sparkle);
    }
  }, 1500);
}

// Handle anchor checkbox changes with auto-save
async function handleAnchorChange(event) {
  const checkbox = event.target;
  const anchorId = checkbox.id;
  
  // Add sparkle animation
  addSparkleAnimation(checkbox);
  
  // Update progress indicator immediately
  updateProgressIndicator();
  
  // Auto-save to localStorage
  if (currentUser) {
    const prefix = `user_${currentUser.uid}_`;
    localStorage.setItem(prefix + anchorId, checkbox.checked.toString());
    
    // Also save self-care option if this is the self-care checkbox
    if (anchorId === 'selfCare' && checkbox.checked) {
      const selfCareOption = document.getElementById('selfCareOption');
      if (selfCareOption && selfCareOption.value) {
        localStorage.setItem(prefix + 'selfCareOption', selfCareOption.value);
      }
    }
  }
  
  // Auto-save to Firebase
  try {
    await saveProgress();
    // Show success message briefly
    showMessage();
  } catch (error) {
    console.warn('Auto-save to Firebase failed:', error);
    // Don't show error to user for auto-save failures
  }
}


// ----------------------------
// Authentication Functions
// ----------------------------

function showAuthScreen() {
  const authScreen = document.getElementById("authScreen");
  const mainNavbar = document.getElementById("mainNavbar");
  const mainContent = document.getElementById("mainContent");
  
  if (authScreen) {
    authScreen.style.display = "flex";
    authScreen.style.opacity = "1";
  }
  
  if (mainNavbar) {
    mainNavbar.style.display = "none";
    mainNavbar.style.opacity = "0";
  }
  
  if (mainContent) {
    mainContent.style.display = "none";
    mainContent.style.opacity = "0";
  }
}

function showMainApp() {
  const authScreen = document.getElementById("authScreen");
  const mainNavbar = document.getElementById("mainNavbar");
  const mainContent = document.getElementById("mainContent");
  
  if (authScreen) {
    authScreen.style.opacity = "0";
    
    setTimeout(() => {
      authScreen.style.display = "none";
      
      if (mainNavbar) {
        mainNavbar.style.display = "block";
        setTimeout(() => {
          mainNavbar.style.opacity = "1";
        }, 50);
      }
      
      if (mainContent) {
        mainContent.style.display = "block";
        setTimeout(() => {
          mainContent.style.opacity = "1";
        }, 50);
      }
    }, 500);
  }
}

function updateUserInfo() {
  const userInfo = document.getElementById("userInfo");
  const profileNameEl = document.getElementById("profileName");
  const profileEmailEl = document.getElementById("profileEmail");
  const homeGreeting = document.getElementById('homeGreeting');
  if (currentUser && userInfo) {
    const displayName = currentUser.email || 'Anonymous User';
    userInfo.textContent = `Welcome, ${displayName}!`;
  }
  if (currentUser && profileNameEl && profileEmailEl) {
    const displayName = currentUser.displayName || currentUser.email || 'Anonymous User';
    profileNameEl.textContent = displayName;
    profileEmailEl.textContent = currentUser.email || '—';
  }
  if (homeGreeting) {
    const hours = new Date().getHours();
    const period = hours < 12 ? 'Good morning' : (hours < 18 ? 'Good afternoon' : 'Good evening');
    const name = currentUser && (currentUser.displayName || currentUser.email) ? (currentUser.displayName || currentUser.email) : '';
    homeGreeting.textContent = `${period}${name ? ', ' + name : ''}`;
  }
}

// Sign up with email/password
async function signUp() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  
  if (password.length < 6) {
    alert("Password must be at least 6 characters long");
    return;
  }
  
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    console.log("User signed up successfully");
  } catch (error) {
    console.error("Sign up error:", error);
    alert("Sign up failed: " + error.message);
  }
}

// Sign in with email/password
async function signIn() {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
    console.log("User signed in successfully");
  } catch (error) {
    console.error("Sign in error:", error);
    alert("Sign in failed: " + error.message);
  }
}

// Sign in with Google
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    console.log("Google sign in successful");
  } catch (error) {
    console.error("Google sign in error:", error);
    alert("Google sign in failed: " + error.message);
  }
}

// Sign in anonymously (for guests)
async function signInAnonymously() {
  try {
    await auth.signInAnonymously();
    console.log("Anonymous sign in successful");
  } catch (error) {
    console.error("Anonymous sign in error:", error);
    alert("Anonymous sign in failed: " + error.message);
  }
}

// Sign out
async function signOut() {
  try {
    await auth.signOut();
    console.log("User signed out");
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

// ----------------------------
// Firebase Data Functions (Updated for Auth)
// ----------------------------

async function loadFromFirebase() {
  if (!currentUser) {
    console.log("No user signed in");
    return false;
  }
  
  try {
    console.log("Loading from Firebase for user:", currentUser.uid);
    const today = new Date().toDateString();
    
    // Query for today's progress for this specific user
    const querySnapshot = await db.collection("dailyProgress")
      .where("userId", "==", currentUser.uid)
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
        const selfCareSelect = document.getElementById("selfCareOption");
        if (selfCareSelect) {
          selfCareSelect.value = data.selfCareOption;
        }
      }
      
      if (data.watchShowName) {
        const watchShowInput = document.getElementById("watchShowInput");
        if (watchShowInput) {
          watchShowInput.value = data.watchShowName;
          if (data.watchShow) {
            watchShowInput.style.display = "inline-block";
          }
        }
      }
      
      console.log("Firebase data loaded successfully");
      return true;
    } else {
      console.log("No Firebase data found for today");
      return false;
    }
  } catch (error) {
    console.error("Error loading from Firebase:", error);
    return false;
  }
}

async function saveToFirebase(progressData) {
  if (!currentUser) {
    console.log("No user signed in, cannot save to Firebase");
    return false;
  }
  
  try {
    const today = new Date().toDateString();
    
    // Check if we already have a document for today for this user
    const querySnapshot = await db.collection("dailyProgress")
      .where("userId", "==", currentUser.uid)
      .where("date", "==", today)
      .limit(1)
      .get();

    const dataToSave = {
      ...progressData,
      userId: currentUser.uid,
      userEmail: currentUser.email || "anonymous",
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
// Enhanced Save Progress with Auth
// ----------------------------
async function saveProgress() {
  if (!currentUser) {
    alert("Please sign in to save your progress");
    return;
  }
  
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

  // Save to localStorage (for offline access) - using user-specific keys
  const userPrefix = `user_${currentUser.uid}_`;
  anchors.forEach(id => {
    if (progressData[id] !== undefined) {
      localStorage.setItem(userPrefix + id, progressData[id]);
    }
  });
  
  localStorage.setItem(userPrefix + "selfCareOption", progressData.selfCareOption || "");
  localStorage.setItem(userPrefix + "watchedShowName", progressData.watchShowName || "");
  localStorage.setItem(userPrefix + "lastSavedDate", new Date().toDateString());

  // Save to Firebase
  const firebaseSaved = await saveToFirebase(progressData);
  
  if (!firebaseSaved) {
    console.log("Firebase save failed, data saved locally only");
  }

  // Show success message
  displaySaveMessage(progressData);

  // Update progress indicator
  updateProgressIndicator();
}

// ----------------------------
// Enhanced Load Progress with Auth
// ----------------------------
async function loadProgress() {
  if (!currentUser) {
    console.log("No user signed in, cannot load progress");
    return;
  }
  
  checkDailyReset();
  
  // Load removed default anchors first
  removedDefaultAnchors = loadRemovedDefaultAnchors();
  
  // Update anchors array to exclude removed ones
  anchors = [...defaultAnchors.filter(id => !removedDefaultAnchors.has(id)), ...loadCustomAnchors().map(a => a.id)];
  
  // Merge in any custom anchors visually before setting states
  renderCustomAnchors();
  
  // Try to load from Firebase first
  const firebaseLoaded = await loadFromFirebase();
  
  if (!firebaseLoaded) {
    // Fallback to localStorage if Firebase fails or has no data
    console.log("Loading from localStorage...");
    const userPrefix = `user_${currentUser.uid}_`;
    
    anchors.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = localStorage.getItem(userPrefix + id) === "true";
      }
    });
    
    const selfCareSelect = document.getElementById("selfCareOption");
    if (selfCareSelect) {
      selfCareSelect.value = localStorage.getItem(userPrefix + "selfCareOption") || "";
    }
    
    const savedShow = localStorage.getItem(userPrefix + "watchedShowName");
    const watchShowInput = document.getElementById("watchShowInput");
    const watchShowCheckbox = document.getElementById("watchShow");
    
    if (savedShow && watchShowInput) {
      watchShowInput.value = savedShow;
      if (watchShowCheckbox && watchShowCheckbox.checked) {
        watchShowInput.style.display = "inline-block";
      }
    }
  }
  
  updateUIAfterLoad();
}

// ----------------------------
// Clear Progress (Updated for Auth)
// ----------------------------
async function clearAll() {
  if (!currentUser) {
    alert("Please sign in to reset progress");
    return;
  }
  
  // Clear checkboxes
  anchors.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = false;
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
  
  // Clear localStorage with user prefix
  const userPrefix = `user_${currentUser.uid}_`;
  anchors.forEach(id => {
    localStorage.setItem(userPrefix + id, false);
  });
  localStorage.removeItem(userPrefix + "selfCareOption");
  localStorage.removeItem(userPrefix + "watchedShowName");
  localStorage.setItem(userPrefix + "lastSavedDate", new Date().toDateString());
  
  // Hide message
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.style.display = "none";
  }
  updateProgressIndicator();
  
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
// Daily Reset (Updated for Auth)
// ----------------------------
function checkDailyReset() {
  if (!currentUser) return;
  
  const userPrefix = `user_${currentUser.uid}_`;
  const lastDate = localStorage.getItem(userPrefix + "lastSavedDate");
  const today = new Date().toDateString();
  
  if (lastDate && lastDate !== today) {
    // Clear localStorage for new day
    anchors.forEach(id => {
      localStorage.setItem(userPrefix + id, false);
    });
    localStorage.removeItem(userPrefix + "selfCareOption");
    localStorage.removeItem(userPrefix + "watchedShowName");
    localStorage.setItem(userPrefix + "lastSavedDate", today);
  }
}

// ----------------------------
// Auth State Listener
// ----------------------------
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  
  if (user) {
    console.log("User signed in:", user.email || user.uid);
    showMainApp();
    updateUserInfo();
    renderCustomAnchors();
    await loadProgress();
  } else {
    console.log("User signed out");
    showAuthScreen();
    // Clear any displayed data when signed out
    anchors.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = false;
      }
    });
  }
});

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

  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.textContent = messageText;
    showMessage();
  }
  launchConfetti();
  updateStreak(completed > 0);
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
// Streak Tracker (Updated for Auth)
// ----------------------------
function updateStreak(completedToday) {
  if (!currentUser) return;
  
  const userPrefix = `user_${currentUser.uid}_`;
  let streakData = JSON.parse(localStorage.getItem(userPrefix + "streakData")) || [];
  
  const today = new Date().toDateString();
  const lastEntry = streakData.length > 0 ? streakData[streakData.length - 1].date : null;

  if (lastEntry !== today) {
    streakData.push({ date: today, done: completedToday });
    if (streakData.length > 7) streakData.shift();
    localStorage.setItem(userPrefix + "streakData", JSON.stringify(streakData));
  } else {
    streakData[streakData.length - 1].done = completedToday;
    localStorage.setItem(userPrefix + "streakData", JSON.stringify(streakData));
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

function updateProgressIndicator() {
  const indicator = document.getElementById('progressIndicator');
  if (!indicator) return;
  const completed = anchors.filter(id => {
    const el = document.getElementById(id);
    return el && el.checked;
  }).length;
  indicator.textContent = `Completed ${completed}/${anchors.length}`;
}

function calculateCurrentStreak(streakData) {
  let streak = 0;
  for (let i = streakData.length - 1; i >= 0; i--) {
    if (streakData[i].done) streak++;
    else break;
  }
  return streak;
}

function updateUIAfterLoad() {
  if (!currentUser) return;
  
  // Load removed default anchors
  removedDefaultAnchors = loadRemovedDefaultAnchors();
  
  // Hide removed default anchors
  removedDefaultAnchors.forEach(anchorId => {
    const anchorEl = document.querySelector(`[data-id="${anchorId}"]`);
    if (anchorEl) {
      anchorEl.style.display = 'none';
    }
  });
  
  // Update anchors array to exclude removed ones
  anchors = [...defaultAnchors.filter(id => !removedDefaultAnchors.has(id)), ...loadCustomAnchors().map(a => a.id)];
  
  // Update streak display
  const userPrefix = `user_${currentUser.uid}_`;
  const streakData = JSON.parse(localStorage.getItem(userPrefix + "streakData")) || [];
  renderStreak(streakData);
  
  // Handle watch show input visibility
  const watchShowCheckbox = document.getElementById("watchShow");
  const watchShowInput = document.getElementById("watchShowInput");
  
  if (watchShowCheckbox && watchShowInput && watchShowCheckbox.checked) {
    watchShowInput.style.display = "inline-block";
  }
  
  // Render custom anchors
  renderCustomAnchors();
  
  // Update removed anchors display
  updateRemovedAnchorsDisplay();
}

// ----------------------------
// Navigation and Splash
// ----------------------------
function initializeSplashScreen() {
  setTimeout(() => {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 500);
    }
  }, 2500);
}

function setupNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-section');
  const mainContent = document.getElementById('mainContent');
  const auxToggle = document.getElementById('auxMenuToggle');
  const auxMenu = document.getElementById('auxMenu');
  const bottomNav = document.getElementById('bottomNav');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerSheet = document.getElementById('hamburgerSheet');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      // On mobile, use drawer + overlay
      const overlay = document.getElementById('navOverlay');
      let drawer = document.querySelector('.nav-drawer');
      if (!drawer) {
        drawer = document.createElement('div');
        drawer.className = 'nav-drawer';
        const ul = navMenu.cloneNode(true);
        ul.id = 'navMenuDrawer';
        ul.classList.remove('nav-menu');
        drawer.appendChild(ul);
        document.body.appendChild(drawer);
        // Re-bind link clicks inside drawer
        drawer.querySelectorAll('a.nav-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            const targetEl = document.getElementById(page);
            if (targetEl) targetEl.classList.add('active');
            drawer.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
          });
        });
      }
      if (drawer) drawer.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
  }

  // Bottom nav + top nav (if any) share .nav-link class
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Remove active class from all links and sections
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      pageSections.forEach(s => s.classList.remove('active'));

      // Add active class to clicked link
      this.classList.add('active');

      // Show corresponding page
      const targetPage = this.getAttribute('data-page');
      const targetEl = document.getElementById(targetPage);
      if (targetEl) targetEl.classList.add('active');
      // Animate in
      if (targetEl) {
        targetEl.classList.remove('animate-in');
        void targetEl.offsetWidth; // reflow
        targetEl.classList.add('animate-in');
      }

      // Close mobile menu
      if (navMenu && navToggle) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
      }
      const overlay = document.getElementById('navOverlay');
      const drawer = document.querySelector('.nav-drawer');
      if (overlay) overlay.classList.remove('active');
      if (drawer) drawer.classList.remove('active');

      // Ensure main content visible after navigation
      if (mainContent && mainContent.style.display !== 'block') {
        mainContent.style.display = 'block';
        setTimeout(() => { mainContent.style.opacity = '1'; }, 50);
      }

      // Update breadcrumbs
      updateBreadcrumbs(targetPage);
      
      // Load page-specific data
      if (targetPage === 'dashboard') {
        loadDashboardData();
      } else if (targetPage === 'daily-anchors') {
        loadProgress();
      }
    });
  });

  // Aux hamburger menu handlers (About, Contact, Profile)
  if (auxToggle && auxMenu) {
    const closeAux = () => {
      auxMenu.classList.remove('active');
      auxToggle.setAttribute('aria-expanded', 'false');
    };
    auxToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = auxMenu.classList.toggle('active');
      auxToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!auxMenu.contains(e.target) && e.target !== auxToggle) {
        closeAux();
      }
    });
    // Navigate on aux link click and close menu
    auxMenu.querySelectorAll('.aux-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        const targetEl = document.getElementById(page);
        if (targetEl) targetEl.classList.add('active');
        const correspondingTopLink = document.querySelector(`.nav-link[data-page="${page}"]`);
        if (correspondingTopLink) correspondingTopLink.classList.add('active');
        updateBreadcrumbs(page);
        
        // Load page-specific data
        if (page === 'dashboard') {
          loadDashboardData();
        } else if (page === 'daily-anchors') {
          loadProgress();
        }
        
        closeAux();
      });
    });
  }

  // Bottom nav visibility when main app is shown
  if (bottomNav) {
    bottomNav.style.display = 'grid';
  }

  // Hamburger sheet
  if (hamburgerBtn && hamburgerSheet) {
    const toggleSheet = () => {
      hamburgerSheet.classList.toggle('active');
      const hidden = !hamburgerSheet.classList.contains('active');
      hamburgerSheet.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    };
    hamburgerBtn.addEventListener('click', (e) => { e.preventDefault(); toggleSheet(); });
    document.addEventListener('click', (e) => {
      if (!hamburgerSheet.contains(e.target) && e.target !== hamburgerBtn) {
        hamburgerSheet.classList.remove('active');
        hamburgerSheet.setAttribute('aria-hidden', 'true');
      }
    });
    hamburgerSheet.querySelectorAll('.hamburger-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        const targetEl = document.getElementById(page);
        if (targetEl) targetEl.classList.add('active');
        const correspondingBottomLink = document.querySelector(`.bottom-nav .nav-link[data-page="${page}"]`);
        if (correspondingBottomLink) correspondingBottomLink.classList.add('active');
        updateBreadcrumbs(page);
        
        // Load page-specific data
        if (page === 'dashboard') {
          loadDashboardData();
        } else if (page === 'daily-anchors') {
          loadProgress();
        }
        
        hamburgerSheet.classList.remove('active');
        hamburgerSheet.setAttribute('aria-hidden', 'true');
      });
    });
  }
}

function updateBreadcrumbs(page) {
  const map = {
    'home': ['Home'],
    'dashboard': ['Home', 'Dashboard'],
    'daily-anchors': ['Home', 'Daily Anchors'],
    'dream-life': ['Home', 'Dream Life'],
    'about': ['Home', 'About'],
    'profile': ['Home', 'Profile'],
    'contact': ['Home', 'Contact']
  };
  const crumbs = map[page] || ['Home'];
  const el = document.getElementById('breadcrumbs');
  if (!el) return;
  el.innerHTML = '';
  crumbs.forEach((c, idx) => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = c;
    el.appendChild(a);
    if (idx < crumbs.length - 1) {
      const div = document.createElement('span');
      div.className = 'divider';
      div.textContent = '/';
      el.appendChild(div);
    }
  });
}

function setupContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameInput = document.getElementById('name');
      const name = nameInput ? nameInput.value : '';
      alert(`Thank you ${name}! Your message has been sent. We'll get back to you soon!`);
      contactForm.reset();
    });
  }
}

// ----------------------------
// Settings: Theme, Accent, Reminders
// ----------------------------
function applySavedSettings() {
  const theme = localStorage.getItem('settings_theme') || 'system';
  const reminder = localStorage.getItem('settings_dailyReminder') || '';

  const themeSelect = document.getElementById('themeSelect');
  const reminderInput = document.getElementById('dailyReminder');

  if (themeSelect) themeSelect.value = theme;
  if (reminderInput && reminder) reminderInput.value = reminder;

  applyTheme(theme);
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--bg-color', '#0f1720');
    root.style.setProperty('--card-bg', '#16222e');
    root.style.setProperty('--text-color', '#e5eef5');
    document.body.style.background = 'var(--bg-color)';
    document.body.style.color = 'var(--text-color)';
  } else {
    root.style.setProperty('--bg-color', '#E9F7F7');
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--text-color', '#333333');
    document.body.style.background = 'var(--bg-color)';
    document.body.style.color = 'var(--text-color)';
  }
}

// Removed accent color customization

function setupSettingsHandlers() {
  const themeSelect = document.getElementById('themeSelect');
  const reminderInput = document.getElementById('dailyReminder');
  const exportBtn = document.getElementById('exportDataBtn');
  const clearBtn = document.getElementById('clearDataBtn');

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      localStorage.setItem('settings_theme', value);
      applyTheme(value);
    });
  }

  if (reminderInput) {
    reminderInput.addEventListener('change', (e) => {
      const value = e.target.value;
      localStorage.setItem('settings_dailyReminder', value);
      // Push notification scheduling would go here if using Notifications API + Service Worker
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = collectExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daily-anchors-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('This will clear local settings and cached progress for this device. Continue?')) {
        clearLocalData();
        applySavedSettings();
        alert('Local data cleared');
      }
    });
  }
}

function collectExportData() {
  const payload = { settings: {}, progress: {} };
  payload.settings.theme = localStorage.getItem('settings_theme') || 'system';
  payload.settings.dailyReminder = localStorage.getItem('settings_dailyReminder') || '';

  // If signed in, include user-prefixed items
  if (currentUser) {
    const prefix = `user_${currentUser.uid}_`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    keys.forEach(k => { payload.progress[k] = localStorage.getItem(k); });
  }

  return payload;
}

function clearLocalData() {
  // Clear settings
  localStorage.removeItem('settings_theme');
  localStorage.removeItem('settings_dailyReminder');

  // Clear user data if signed in
  if (currentUser) {
    const prefix = `user_${currentUser.uid}_`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  }
}

// ----------------------------
// Event Listeners
// ----------------------------
function setupEventListeners() {
  // App functionality
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
  
  // Restore removed anchors button
  const restoreAnchorsBtn = document.getElementById("restoreAnchorsBtn");
  if (restoreAnchorsBtn) {
    restoreAnchorsBtn.addEventListener("click", () => {
      if (removedDefaultAnchors.size === 0) {
        alert("No removed anchors to restore!");
        return;
      }
      
      const anchorNames = Array.from(removedDefaultAnchors).map(id => 
        id.replace(/([A-Z])/g, ' $1').toLowerCase()
      );
      
      if (confirm(`Restore these anchors?\n${anchorNames.join('\n')}`)) {
        removedDefaultAnchors.forEach(anchorId => {
          restoreDefaultAnchor(anchorId);
        });
        alert("Anchors restored! You can now track them again.");
      }
    });
  }

  // Add custom anchor handlers
  const addBtn = document.getElementById('addAnchorBtn');
  const addInput = document.getElementById('newAnchorInput');
  if (addBtn && addInput) {
    const addHandler = () => {
      if (!currentUser) { alert('Please sign in first.'); return; }
      const label = addInput.value.trim();
      if (!label) return;
      const id = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const list = loadCustomAnchors();
      if (list.some(c => c.id === id)) { alert('Anchor already exists.'); return; }
      list.push({ id, label });
      saveCustomAnchors(list);
      addInput.value = '';
      renderCustomAnchors();
    };
    addBtn.addEventListener('click', addHandler);
    addInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addHandler(); } });
  }
  
  // Add event handlers for default anchors
  defaultAnchors.forEach(anchorId => {
    const checkbox = document.getElementById(anchorId);
    if (checkbox) {
      checkbox.addEventListener('change', handleAnchorChange);
    }
  });
  
  // Add event handlers for remove buttons on default anchors
  document.querySelectorAll('.remove-anchor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const anchorId = btn.closest('.anchor').getAttribute('data-id');
      if (confirm(`Remove "${anchorId.replace(/([A-Z])/g, ' $1').toLowerCase()}" from your daily anchors?`)) {
        removeDefaultAnchor(anchorId);
      }
    });
  });
  
  if (watchShowCheckbox && watchShowInput) {
    watchShowCheckbox.addEventListener("change", function () {
      if (this.checked) {
        watchShowInput.style.display = "inline-block";
        watchShowInput.focus();
      } else {
        watchShowInput.style.display = "none";
        watchShowInput.value = "";
        if (currentUser) {
          const userPrefix = `user_${currentUser.uid}_`;
          localStorage.removeItem(userPrefix + "watchedShowName");
        }
      }
      updateProgressIndicator();
    });
    
    watchShowInput.addEventListener("input", function () {
      if (currentUser) {
        const userPrefix = `user_${currentUser.uid}_`;
        localStorage.setItem(userPrefix + "watchedShowName", this.value);
      }
    });
  }
  
  // Auth functionality
  const signUpBtn = document.getElementById("signUpBtn");
  const signInBtn = document.getElementById("signInBtn");
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const guestSignInBtn = document.getElementById("guestSignInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const editProfileBtn = document.getElementById("editProfileBtn");
  
  // Mood booster
  const moodSpinBtn = document.getElementById('moodSpinBtn');
  const moodSpinAgainBtn = document.getElementById('moodSpinAgainBtn');
  const moodDoItBtn = document.getElementById('moodDoItBtn');
  const moodResultEl = document.getElementById('moodResult');
  
  if (signUpBtn) {
    signUpBtn.addEventListener("click", signUp);
  }
  
  if (signInBtn) {
    signInBtn.addEventListener("click", signIn);
  }
  
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", signInWithGoogle);
  }
  
  if (guestSignInBtn) {
    guestSignInBtn.addEventListener("click", signInAnonymously);
  }
  
  if (signOutBtn) {
    signOutBtn.addEventListener("click", signOut);
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", async () => {
      if (!currentUser) return;
      const newName = prompt("Update display name:", currentUser.displayName || "");
      if (newName && newName.trim()) {
        try {
          await currentUser.updateProfile({ displayName: newName.trim() });
          updateUserInfo();
          alert("Profile updated");
        } catch (e) {
          console.error("Profile update error:", e);
          alert("Failed to update profile: " + e.message);
        }
      }
    });
  }

  function spinMood() {
    // Use current anchors that are not already checked to encourage action; fallback to all
    const available = anchors.filter(id => {
      const el = document.getElementById(id);
      return el && el.type === 'checkbox';
    });
    if (available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    const labelEl = document.querySelector(`label[for='${pick}']`);
    let labelText = '';
    if (labelEl) { labelText = labelEl.textContent.trim(); }
    else {
      const input = document.getElementById(pick);
      if (input && input.closest('label')) {
        labelText = input.closest('label').textContent.trim();
      }
    }
    if (moodResultEl) moodResultEl.textContent = labelText || 'Do one small thing now';
    if (moodDoItBtn) {
      moodDoItBtn.disabled = false;
      moodDoItBtn.onclick = () => {
        const cb = document.getElementById(pick);
        if (cb && cb.type === 'checkbox') {
          cb.checked = true;
          const prefix = getUserPrefix();
          if (prefix) localStorage.setItem(prefix + pick, true);
          updateProgressIndicator();
        }
      };
    }
  }

  if (moodSpinBtn) moodSpinBtn.addEventListener('click', spinMood);
  if (moodSpinAgainBtn) moodSpinAgainBtn.addEventListener('click', spinMood);

  // Enter key support for auth inputs
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  
  if (emailInput && passwordInput) {
    const handleEnterKey = (event) => {
      if (event.key === 'Enter') {
        signIn();
      }
    };
    
    emailInput.addEventListener("keypress", handleEnterKey);
    passwordInput.addEventListener("keypress", handleEnterKey);
  }
}

// ----------------------------
// Initialize App
// ----------------------------
async function initializeApp() {
  console.log("Initializing Self-Care Tracker with Firebase Auth and Splash Screen...");
  
  // Initialize service worker for PWA updates
  initializeServiceWorker();
  
  // Set up event listeners
  setupEventListeners();
  
  // Navigation, splash screen, and contact form
  initializeSplashScreen();
  setupNavigation();
  setupContactForm();
  setupSettingsHandlers();

  // Apply saved settings
  applySavedSettings();

  // Initialize breadcrumbs
  updateBreadcrumbs('home');

  // Show onboarding for first-time users (no local streak and no entries)
  try {
    const shown = localStorage.getItem('onboarding_shown') === 'true';
    const overlay = document.getElementById('onboardingOverlay');
    if (!shown && overlay) {
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      const skip = document.getElementById('onboardingSkip');
      const got = document.getElementById('onboardingGotIt');
      const complete = () => {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        localStorage.setItem('onboarding_shown', 'true');
      };
      if (skip) skip.addEventListener('click', complete);
      if (got) got.addEventListener('click', complete);
    }
  } catch (e) { /* ignore */ }

  // Optional interactive coach tutorial (one-time)
  try {
    const coachShown = localStorage.getItem('coach_shown') === 'true';
    if (!coachShown) {
      setupCoachTutorial();
    }
  } catch (e) { /* ignore */ }
  
  // The splash screen will show first, then auth screen based on auth state
  // This is handled by the HTML inline script and auth state listener
  
  console.log("App initialized successfully!");
}
function setupCoachTutorial() {
  const overlay = document.getElementById('coachOverlay');
  if (!overlay) return;

  const steps = [
    {
      selector: '.bottom-nav .nav-link[data-page="dashboard"]',
      text: 'This is your Dashboard. Tap here anytime to view your progress and charts.',
      position: 'top'
    },
    {
      selector: '.bottom-nav .nav-link[data-page="daily-anchors"]',
      text: 'Your Daily Anchors live here. Tap to check off today\'s habits.',
      position: 'top'
    }
  ];

  let current = 0;

  const renderStep = () => {
    if (current >= steps.length) {
      overlay.innerHTML = '';
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      localStorage.setItem('coach_shown', 'true');
      return;
    }
    const step = steps[current];
    const target = document.querySelector(step.selector);
    if (!target) { current++; renderStep(); return; }

    const rect = target.getBoundingClientRect();
    overlay.innerHTML = '';
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');

    // Highlight
    const highlight = document.createElement('div');
    highlight.className = 'coach-highlight';
    const size = Math.max(rect.width, rect.height) + 16;
    highlight.style.width = `${size}px`;
    highlight.style.height = `${size}px`;
    highlight.style.left = `${rect.left + rect.width/2 - size/2}px`;
    highlight.style.top = `${rect.top + rect.height/2 - size/2}px`;

    // Tooltip
    const tip = document.createElement('div');
    tip.className = 'coach-tooltip';
    tip.innerHTML = `
      <div class="coach-text">${step.text}</div>
      <div class="coach-actions">
        <button class="btn-secondary" id="coachSkip">Skip</button>
        <button class="btn-primary" id="coachNext">Next</button>
      </div>
    `;

    // Position tooltip
    const margin = 10;
    let tipLeft = rect.left + rect.width/2 - 130;
    tipLeft = Math.max(10, Math.min(tipLeft, window.innerWidth - 270));
    let tipTop = step.position === 'top' ? rect.top - 90 : rect.bottom + margin;
    if (tipTop < 10) tipTop = rect.bottom + margin;
    if (tipTop > window.innerHeight - 100) tipTop = rect.top - 90;
    tip.style.left = `${tipLeft}px`;
    tip.style.top = `${tipTop}px`;

    overlay.appendChild(highlight);
    overlay.appendChild(tip);

    // Handlers
    tip.querySelector('#coachSkip').onclick = () => {
      localStorage.setItem('coach_shown', 'true');
      overlay.innerHTML = '';
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    };
    tip.querySelector('#coachNext').onclick = () => {
      current++;
      renderStep();
    };
  };

  // Render after small delay to ensure layout is ready
  setTimeout(renderStep, 400);
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ----------------------------
// Dashboard Rendering
// ----------------------------
let completionChartInstance = null;
let categoryChartInstance = null;
let dashboardRange = '30d';
let dashboardBucket = 'daily';

window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error || event.message);
});

async function loadDashboardData() {
  console.log('loadDashboardData called');
  console.log('currentUser:', currentUser);
  console.log('db available:', typeof db !== 'undefined');
  
  const loadingEl = document.getElementById('dashboardLoadingState');
  const emptyEl = document.getElementById('dashboardEmptyState');
  if (loadingEl) loadingEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';
  const completionCard = document.getElementById('completionCard');
  const categoryCard = document.getElementById('categoryCard');
  if (completionCard) completionCard.classList.add('skeleton');
  if (categoryCard) categoryCard.classList.add('skeleton');

  // Try to fetch last N days from Firestore if signed in
  let entries = [];
  console.log('Starting data fetch...');
  try {
    if (currentUser && typeof db !== 'undefined') {
      console.log('User authenticated, attempting Firestore query...');
      const days = dashboardRange === '7d' ? 7 : (dashboardRange === '90d' ? 90 : 30);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Use simple query without composite indexes - fetch all user data and filter in memory
      try {
        console.log('Fetching all user data to avoid composite index issues...');
        const snapshot = await db.collection('dailyProgress')
          .where('userId', '==', currentUser.uid)
          .orderBy('timestamp', 'desc')
          .limit(200) // Reasonable limit
          .get();
        
        const allEntries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('Fetched entries:', allEntries.length);
        
        // Filter by date in memory to avoid composite index requirements
        entries = allEntries.filter(e => {
          let entryDate;
          if (e.timestamp && e.timestamp.toDate) {
            entryDate = e.timestamp.toDate();
          } else if (e.timestamp && e.timestamp.seconds) {
            entryDate = new Date(e.timestamp.seconds * 1000);
          } else if (e.date) {
            entryDate = new Date(e.date);
          } else {
            return false; // Skip entries without valid date
          }
          
          return entryDate >= fromDate;
        });
        
        console.log('Filtered entries for range:', entries.length);
      } catch (e1) {
        console.error('Firestore query failed:', e1);
        console.error('Error details:', {
          code: e1.code,
          message: e1.message,
          stack: e1.stack
        });
        
        // Show specific error message for common issues
        const loadingEl = document.getElementById('dashboardLoadingState');
        if (loadingEl) {
          if (e1.code === 'permission-denied') {
            loadingEl.textContent = 'Permission denied. Please check your Firebase rules.';
          } else if (e1.code === 'unavailable') {
            loadingEl.textContent = 'Firebase unavailable. Check your internet connection.';
          } else {
            loadingEl.textContent = `Database error: ${e1.message}`;
          }
        }
        
        // Continue to localStorage fallback
      }
    }
  } catch (e) {
    console.error('Firestore load failed:', e);
    const loadingEl = document.getElementById('dashboardLoadingState');
    if (loadingEl) {
      loadingEl.textContent = 'Unable to load data right now. Showing placeholders.';
    }
    // Continue to localStorage fallback
  }

  // Fallback: derive minimal entries from localStorage if Firestore empty
  if (entries.length === 0) {
    console.log('No Firestore entries found, checking localStorage...');
    const prefix = currentUser ? `user_${currentUser.uid}_` : '';
    
    // Try to load today's progress from localStorage as a fallback
    if (prefix) {
      try {
        const today = new Date().toDateString();
        const todayProgress = {};
        let hasAnyData = false;
        
        // Check each anchor for today's progress
        anchors.forEach(anchorId => {
          const stored = localStorage.getItem(prefix + anchorId);
          if (stored === 'true') {
            todayProgress[anchorId] = true;
            hasAnyData = true;
          }
        });
        
        if (hasAnyData) {
          // Create a mock entry for today
          const mockEntry = {
            id: 'local_' + Date.now(),
            date: today,
            timestamp: new Date(),
            userId: currentUser.uid,
            ...todayProgress
          };
          entries = [mockEntry];
          console.log('Created mock entry from localStorage:', mockEntry);
        }
      } catch (e) {
        console.warn('localStorage fallback failed:', e);
      }
    }
  }

  if (loadingEl) loadingEl.style.display = 'none';
  if (!entries || entries.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (completionCard) completionCard.classList.remove('skeleton');
    if (categoryCard) categoryCard.classList.remove('skeleton');
    renderDashboardStats([], 0);
    renderCompletionChart([], []);
    renderCategoryChart({});
    renderRecentActivity([]);
    // Wire empty-state CTA buttons
    const goBtn = document.getElementById('emptyGoAnchorsBtn');
    const remBtn = document.getElementById('emptySetReminderBtn');
    if (goBtn) {
      goBtn.onclick = () => {
        document.querySelector('.nav-link[data-page="daily-anchors"]').click();
      };
    }
    if (remBtn) {
      remBtn.onclick = () => {
        document.querySelector('.nav-link[data-page="profile"]').click();
      };
    }
    return;
  }

  // Compute metrics
  console.log('Computing metrics with anchors:', anchors);
  const byDate = new Map();
  const categoryCounts = { Cook: 0, Clean: 0, Organize: 0, Journal: 0 };
  let totalCompletedCount = 0;

  entries.forEach(e => {
    let dateStr = '';
    if (e.date) {
      // Support both toDateString outputs and ISO yyyy-mm-dd
      const d = new Date(e.date);
      dateStr = isNaN(d.getTime()) ? String(e.date) : d.toDateString();
    } else if (e.timestamp && e.timestamp.toDate) {
      dateStr = e.timestamp.toDate().toDateString();
    } else if (e.timestamp && e.timestamp.seconds) {
      dateStr = new Date(e.timestamp.seconds * 1000).toDateString();
    }
    const completed = Object.entries(e)
      .filter(([k, v]) => anchors.includes(k) && v === true)
      .length;
    totalCompletedCount += completed;
    if (dateStr) byDate.set(dateStr, (byDate.get(dateStr) || 0) + completed);
    if (e.selfCareOption && categoryCounts[e.selfCareOption] !== undefined) {
      categoryCounts[e.selfCareOption] += 1;
    }
  });

  // Build time series (fill gaps) based on selected bucket and range
  const labels = [];
  const values = [];
  const days = dashboardRange === '7d' ? 7 : (dashboardRange === '90d' ? 90 : 30);
  if (dashboardBucket === 'daily') {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      labels.push(`${d.getMonth()+1}/${d.getDate()}`);
      values.push(byDate.get(key) || 0);
    }
  } else if (dashboardBucket === 'weekly') {
    // Group by ISO week
    const weekMap = new Map();
    entries.forEach(e => {
      const d = e.date ? new Date(e.date) : new Date(e.timestamp.seconds * 1000);
      const weekKey = `${d.getFullYear()}-W${getISOWeek(d)}`;
      const completed = Object.entries(e).filter(([k, v]) => anchors.includes(k) && v === true).length;
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + completed);
    });
    // Approximate last N days into weeks (N/7 points)
    const numWeeks = Math.ceil(days / 7);
    for (let i = numWeeks - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const wk = `${d.getFullYear()}-W${getISOWeek(d)}`;
      labels.push(wk);
      values.push(weekMap.get(wk) || 0);
    }
  } else {
    // Monthly grouping
    const monthMap = new Map();
    entries.forEach(e => {
      const d = e.date ? new Date(e.date) : new Date(e.timestamp.seconds * 1000);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const completed = Object.entries(e).filter(([k, v]) => anchors.includes(k) && v === true).length;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + completed);
    });
    // Use last 3 months for 90d, 2 months for 30d/7d
    const numMonths = dashboardRange === '90d' ? 3 : 2;
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      labels.push(mk);
      values.push(monthMap.get(mk) || 0);
    }
  }

  // Stats
  const totalEntries = entries.length;
  const completionRate = totalEntries > 0 ? Math.round((totalCompletedCount / (totalEntries * anchors.length)) * 100) : 0;

  // Streak from local streak data if available
  let currentStreak = 0;
  if (currentUser) {
    const userPrefix = `user_${currentUser.uid}_`;
    const streakData = JSON.parse(localStorage.getItem(userPrefix + 'streakData')) || [];
    currentStreak = calculateCurrentStreak(streakData);
  }

  console.log('Rendering dashboard with:', { entries: entries.length, currentStreak, completionRate, labels: labels.length, values: values.length, categoryCounts });
  renderDashboardStats(entries, currentStreak, completionRate);
  renderCompletionChart(labels, values);
  renderCategoryChart(categoryCounts);
  renderRecentActivity(entries);
  if (completionCard) completionCard.classList.remove('skeleton');
  if (categoryCard) categoryCard.classList.remove('skeleton');
  console.log('Dashboard rendering complete');
}

function getISOWeek(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  return Math.ceil((((tmp - yearStart) / 86400000) + 1)/7);
}

function renderDashboardStats(entries, currentStreak, completionRatePct = null) {
  console.log('renderDashboardStats called with:', { entries: entries.length, currentStreak, completionRatePct });
  const totalEl = document.getElementById('statTotalEntries');
  const rateEl = document.getElementById('statCompletionRate');
  const streakEl = document.getElementById('statCurrentStreak');
  console.log('Found elements:', { totalEl: !!totalEl, rateEl: !!rateEl, streakEl: !!streakEl });
  if (totalEl) totalEl.textContent = entries.length.toString();
  if (rateEl) rateEl.textContent = (completionRatePct === null ? '—' : `${completionRatePct}%`);
  if (streakEl) streakEl.textContent = (currentStreak || 0).toString();
}

function renderCompletionChart(labels, values) {
  const ctx = document.getElementById('completionChart');
  console.log('renderCompletionChart called with:', { labels, values, ctx: !!ctx, Chart: typeof Chart });
  
  if (!ctx) {
    console.error('Completion chart canvas element not found');
    return;
  }
  
  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded. Check CDN connection.');
    // Show fallback message
    ctx.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.innerHTML = '<p style="text-align:center;color:#666;">Chart unavailable - check internet connection</p>';
    ctx.parentNode.appendChild(fallback);
    return;
  }
  
  if (completionChartInstance) completionChartInstance.destroy();
  completionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Anchors Completed',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.12)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        tension: { duration: 600, easing: 'easeOutCubic' },
        x: { duration: 400 },
        y: { duration: 400 }
      },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#F2F4F7' } }
      }
    }
  });
}

function renderCategoryChart(categoryCounts) {
  const ctx = document.getElementById('categoryChart');
  console.log('renderCategoryChart called with:', { categoryCounts, ctx: !!ctx, Chart: typeof Chart });
  
  if (!ctx) {
    console.error('Category chart canvas element not found');
    return;
  }
  
  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded. Check CDN connection.');
    // Show fallback message
    ctx.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.innerHTML = '<p style="text-align:center;color:#666;">Chart unavailable - check internet connection</p>';
    ctx.parentNode.appendChild(fallback);
    return;
  }
  
  const labels = Object.keys(categoryCounts);
  const values = Object.values(categoryCounts);
  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Days Selected',
        data: values,
        backgroundColor: ['#2563eb', '#4CA7A0', '#64748b', '#0ea5e9'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeOutCubic' },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#F2F4F7' } }
      }
    }
  });
}

function renderRecentActivity(entries) {
  console.log('renderRecentActivity called with:', { entries: entries.length, anchors });
  const list = document.getElementById('recentActivityList');
  if (!list) {
    console.warn('recentActivityList element not found');
    return;
  }
  list.innerHTML = '';
  const last = entries.slice(0, 10);
  last.forEach(e => {
    const dateStr = e.date || (e.timestamp && e.timestamp.toDate ? e.timestamp.toDate().toDateString() : '');
    const completed = Object.entries(e).filter(([k, v]) => anchors.includes(k) && v === true).length;
    const li = document.createElement('li');
    li.innerHTML = `<span>${dateStr}</span><span>${completed}/${anchors.length} completed</span>`;
    list.appendChild(li);
  });
}

// Hook dashboard load when dashboard page is navigated to
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target && target.classList && target.classList.contains('nav-link')) {
    const page = target.getAttribute('data-page');
    if (page === 'dashboard') {
      setTimeout(loadDashboardData, 50);
    }
  }
});

// Load dashboard on first navigation to it or if hash targets it
if (window.location.hash && window.location.hash.includes('dashboard')) {
  setTimeout(loadDashboardData, 200);
}

// Check if Chart.js loaded properly
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js failed to load from CDN');
      // Try to show a helpful message
      const chartElements = document.querySelectorAll('canvas[id*="Chart"]');
      chartElements.forEach(canvas => {
        const fallback = document.createElement('div');
        fallback.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Chart library unavailable. Please check your internet connection and refresh the page.</p>';
        canvas.parentNode.appendChild(fallback);
      });
    } else {
      console.log('Chart.js loaded successfully:', Chart.version);
    }
  }, 2000); // Wait 2 seconds for CDN to load
});

// Sidebar filters handlers
document.addEventListener('change', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id === 'rangeSelect') {
    dashboardRange = target.value;
    loadDashboardData();
  }
  if (target.id === 'bucketSelect') {
    dashboardBucket = target.value;
    loadDashboardData();
  }
});