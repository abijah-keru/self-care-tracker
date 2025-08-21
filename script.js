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
// Carousel System for Metrics Cards
// ----------------------------

class Carousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.track = this.container.querySelector('.carousel-track');
    this.wrapper = this.container.querySelector('.carousel-wrapper');
    this.prevBtn = this.container.querySelector('.carousel-btn.prev');
    this.nextBtn = this.container.querySelector('.carousel-btn.next');
    this.indicatorsContainer = this.container.querySelector('.carousel-indicators');
    
    this.currentIndex = 0;
    this.cardWidth = 300; // card width + gap
    this.visibleCards = this.getVisibleCards();
    this.totalCards = this.track.children.length;
    
    this.init();
    this.setupResizeHandler();
  }
  
  getVisibleCards() {
    const width = window.innerWidth;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  }
  
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.visibleCards = this.getVisibleCards();
      this.updateControls();
      this.updateIndicators();
    });
  }
  
  init() {
    this.createIndicators();
    this.updateControls();
    this.bindEvents();
    this.updateIndicators();
  }
  
  createIndicators() {
    this.indicatorsContainer.innerHTML = '';
    for (let i = 0; i < this.totalCards; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'carousel-indicator';
      indicator.addEventListener('click', () => this.goToSlide(i));
      this.indicatorsContainer.appendChild(indicator);
    }
  }
  
  bindEvents() {
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    
    // Touch/swipe support
    let startX = 0;
    let endX = 0;
    
    this.wrapper.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });
    
    this.wrapper.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      this.handleSwipe(startX, endX);
    });
    
    // Keyboard navigation
    this.track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    });
  }
  
  handleSwipe(startX, endX) {
    const threshold = 50;
    if (startX - endX > threshold) {
      this.next();
    } else if (endX - startX > threshold) {
      this.prev();
    }
  }
  
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateSlide();
    }
  }
  
  next() {
    if (this.currentIndex < this.totalCards - this.visibleCards) {
      this.currentIndex++;
      this.updateSlide();
    }
  }
  
  goToSlide(index) {
    this.currentIndex = Math.max(0, Math.min(index, this.totalCards - this.visibleCards));
    this.updateSlide();
  }
  
  updateSlide() {
    // Calculate card width dynamically based on screen size
    const width = window.innerWidth;
    let cardWidth = 300; // default
    if (width >= 1024) cardWidth = 340; // 320px card + 20px gap
    else if (width >= 768) cardWidth = 320; // 300px card + 20px gap
    
    const translateX = -this.currentIndex * cardWidth;
    this.track.style.transform = `translateX(${translateX}px)`;
    this.updateControls();
    this.updateIndicators();
  }
  
  updateControls() {
    this.prevBtn.disabled = this.currentIndex === 0;
    this.nextBtn.disabled = this.currentIndex >= this.totalCards - this.visibleCards;
  }
  
  updateIndicators() {
    const indicators = this.indicatorsContainer.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentIndex);
    });
    
    // Update ARIA labels for accessibility
    this.container.setAttribute('aria-label', `${this.container.getAttribute('aria-label').split(' - ')[0]} - Card ${this.currentIndex + 1} of ${this.totalCards}`);
  }
}

// Initialize carousels when DOM is loaded
function initializeCarousels() {
  // Initialize primary carousel (Anchors)
  if (document.getElementById('primaryCarouselWrapper')) {
    new Carousel('primaryMetrics');
  }
  
  // Initialize secondary carousel (Dreams)
  if (document.getElementById('secondaryCarouselWrapper')) {
    new Carousel('secondaryMetrics');
  }
}

// ----------------------------
// Habits System - Growth Mode
// ----------------------------

// Habit data structure
let habits = [];
let habitIdCounter = 1;

// Initialize habits system
function initializeHabitsSystem() {
  loadHabits();
  setupHabitsEventListeners();
  updateHabitsProgress();
}

// Load habits from localStorage
function loadHabits() {
  const savedHabits = localStorage.getItem('habits');
  if (savedHabits) {
    habits = JSON.parse(savedHabits);
    habitIdCounter = Math.max(...habits.map(h => h.id), 0) + 1;
  }
  renderHabits();
}

// Save habits to localStorage and Firebase
async function saveHabits() {
  const userId = getCurrentUserId();
  const localStorageKey = `habits_${userId}`;
  
  // Save to localStorage immediately
  localStorage.setItem(localStorageKey, JSON.stringify(habits));
  
  // Save to Firebase with sync
  await saveDataWithSync('habits', habits);
}

// Setup event listeners for habits
function setupHabitsEventListeners() {
  const floatingAddHabitBtn = document.getElementById('floatingAddHabitBtn');
  const habitFrequency = document.getElementById('habitFrequency');
  
  if (floatingAddHabitBtn) {
    floatingAddHabitBtn.addEventListener('click', showAddHabitModal);
  }
  
  if (habitFrequency) {
    habitFrequency.addEventListener('change', toggleCustomFrequency);
  }
}

// Show add habit modal
function showAddHabitModal() {
  const modal = document.getElementById('addHabitModal');
  if (modal) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('habitName').focus();
  }
}

// Hide add habit modal
function hideAddHabitModal() {
  const modal = document.getElementById('addHabitModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    // Clear form
    document.getElementById('habitName').value = '';
    document.getElementById('habitFrequency').value = 'daily';
    document.getElementById('customFrequency').value = '';
    document.getElementById('habitWhy').value = '';
    document.getElementById('customFrequencyGroup').style.display = 'none';
  }
}

// Toggle custom frequency input
function toggleCustomFrequency() {
  const frequency = document.getElementById('habitFrequency').value;
  const customGroup = document.getElementById('customFrequencyGroup');
  
  if (frequency === 'custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
}

// Create new habit
async function createHabit() {
  const name = document.getElementById('habitName').value.trim();
  const frequency = document.getElementById('habitFrequency').value;
  const customFrequency = document.getElementById('customFrequency').value.trim();
  const why = document.getElementById('habitWhy').value.trim();
  
  if (!name) {
    alert('Please enter a habit name');
    return;
  }
  
  const habit = {
    id: habitIdCounter++,
    name: name,
    frequency: frequency,
    customFrequency: frequency === 'custom' ? customFrequency : '',
    why: why,
    createdAt: new Date().toISOString(),
    streak: 0,
    longestStreak: 0,
    completedDates: [],
    lastCompleted: null
  };
  
  habits.push(habit);
  await saveHabits();
  renderHabits();
  updateHabitsProgress();
  hideAddHabitModal();
  
  // Show success message
  showHabitCreatedMessage(habit.name);
}

// Show habit created message
function showHabitCreatedMessage(habitName) {
  const message = document.createElement('div');
  message.className = 'habit-created-message';
  message.textContent = `Habit "${habitName}" created! 🌱`;
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--growth-green);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: var(--shadow-medium);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(message);
    }, 300);
  }, 3000);
}

// Render habits list
function renderHabits() {
  const habitsList = document.getElementById('habitsList');
  const emptyState = document.getElementById('emptyHabitsState');
  
  if (!habitsList) return;
  
  if (habits.length === 0) {
    habitsList.innerHTML = '';
    if (emptyState) {
      habitsList.appendChild(emptyState);
    }
    return;
  }
  
  habitsList.innerHTML = '';
  
  habits.forEach(habit => {
    const habitCard = createHabitCard(habit);
    habitsList.appendChild(habitCard);
  });
}

// Create habit card element
function createHabitCard(habit) {
  const card = document.createElement('div');
  card.className = 'habit-card';
  card.dataset.habitId = habit.id;
  
  const today = new Date().toDateString();
  const isCompletedToday = habit.completedDates.includes(today);
  const progressPercentage = calculateProgressPercentage(habit);
  
  card.innerHTML = `
    <div class="habit-header">
      <div class="habit-info">
        <h3 class="habit-name">${habit.name}</h3>
        <div class="habit-frequency">${formatFrequency(habit.frequency, habit.customFrequency)}</div>
      </div>
      <div class="habit-options">
        <button class="habit-option-btn" onclick="editHabit(${habit.id})">Edit</button>
        <button class="habit-option-btn" onclick="deleteHabit(${habit.id})">Delete</button>
      </div>
    </div>
    
    <div class="habit-progress">
      <div class="streak-indicator">
        <span class="streak-icon">🔥</span>
        <span class="streak-count">${habit.streak}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
      </div>
    </div>
    
    <div class="habit-actions">
      <div class="habit-checkbox">
        <input type="checkbox" id="habit-${habit.id}" 
               ${isCompletedToday ? 'checked' : ''} 
               onchange="toggleHabitCompletion(${habit.id})">
        <label for="habit-${habit.id}">Complete today</label>
      </div>
    </div>
  `;
  
  return card;
}

// Format frequency display
function formatFrequency(frequency, customFrequency) {
  switch (frequency) {
    case 'daily': return 'Daily';
    case '3x-week': return '3x per week';
    case '5x-week': return '5x per week';
    case 'custom': return customFrequency || 'Custom';
    default: return frequency;
  }
}

// Calculate progress percentage
function calculateProgressPercentage(habit) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekDates = [];
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    weekDates.push(d.toDateString());
  }
  
  const completedThisWeek = habit.completedDates.filter(date => 
    weekDates.includes(date)
  ).length;
  
  let targetThisWeek;
  switch (habit.frequency) {
    case 'daily': targetThisWeek = 7; break;
    case '3x-week': targetThisWeek = 3; break;
    case '5x-week': targetThisWeek = 5; break;
    case 'custom': targetThisWeek = 3; break; // Default for custom
    default: targetThisWeek = 7;
  }
  
  return Math.min((completedThisWeek / targetThisWeek) * 100, 100);
}

// Toggle habit completion
function toggleHabitCompletion(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  const today = new Date().toDateString();
  const checkbox = document.getElementById(`habit-${habitId}`);
  const isCompletedToday = checkbox.checked;
  
  if (isCompletedToday) {
    // Mark as completed
    if (!habit.completedDates.includes(today)) {
      habit.completedDates.push(today);
      habit.lastCompleted = today;
      updateHabitStreak(habit);
    }
  } else {
    // Mark as not completed
    const index = habit.completedDates.indexOf(today);
    if (index > -1) {
      habit.completedDates.splice(index, 1);
      updateHabitStreak(habit);
    }
  }
  
  saveHabits();
  updateHabitsProgress();
  
  // Show feedback
  if (isCompletedToday) {
    showHabitCompletedMessage(habit.name);
  }
}

// Update habit streak
function updateHabitStreak(habit) {
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  if (habit.completedDates.includes(today)) {
    if (habit.completedDates.includes(yesterdayString)) {
      habit.streak++;
    } else {
      habit.streak = 1;
    }
  } else {
    // Check if streak should reset based on frequency
    const shouldReset = shouldResetStreak(habit);
    if (shouldReset) {
      habit.streak = 0;
    }
  }
  
  if (habit.streak > habit.longestStreak) {
    habit.longestStreak = habit.streak;
  }
}

// Check if streak should reset
function shouldResetStreak(habit) {
  const today = new Date();
  const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
  
  if (!lastCompleted) return false;
  
  const daysSinceLastCompleted = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
  
  switch (habit.frequency) {
    case 'daily': return daysSinceLastCompleted > 1;
    case '3x-week': return daysSinceLastCompleted > 3;
    case '5x-week': return daysSinceLastCompleted > 2;
    case 'custom': return daysSinceLastCompleted > 3;
    default: return daysSinceLastCompleted > 1;
  }
}

// Show habit completed message
function showHabitCompletedMessage(habitName) {
  const message = document.createElement('div');
  message.className = 'habit-completed-message';
  message.textContent = `You showed up today! ✨`;
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--growth-green);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: var(--shadow-medium);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(message);
    }, 300);
  }, 3000);
}

// Edit habit
function editHabit(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  // For now, just show an alert. In a full implementation, you'd populate the modal
  alert(`Edit functionality for "${habit.name}" will be implemented next. For now, you can delete and recreate the habit.`);
}

// Delete habit
function deleteHabit(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  if (confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
    habits = habits.filter(h => h.id !== habitId);
    saveHabits();
    renderHabits();
    updateHabitsProgress();
  }
}

// Update habits progress summary
function updateHabitsProgress() {
  const totalHabitsCount = document.getElementById('totalHabitsCount');
  const longestStreak = document.getElementById('longestStreak');
  
  if (totalHabitsCount) {
    totalHabitsCount.textContent = habits.length;
  }
  
  if (longestStreak) {
    const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak)) : 0;
    longestStreak.textContent = maxStreak;
  }
}

// Make habit functions globally accessible
window.createHabit = createHabit;
window.editHabit = editHabit;
window.deleteHabit = deleteHabit;
window.toggleHabitCompletion = toggleHabitCompletion;

// ----------------------------
// Breathing Design System - New Features
// ----------------------------

// Dynamic Greeting System
function updateDynamicGreeting() {
  const heroGreeting = document.getElementById('heroGreeting');
  const heroInsight = document.getElementById('heroInsight');
  
  if (!heroGreeting || !heroInsight) return;
  
  const now = new Date();
  const hour = now.getHours();
  
  // Get user's name with proper anonymous user handling
  let firstName = 'Beautiful Soul';
  let isAnonymousUser = false;
  
  if (currentUser) {
    // First, check if this is an anonymous user
    if (currentUser.isAnonymous) {
      isAnonymousUser = true;
      firstName = 'Mystery Guest'; // Use full name for anonymous users
      console.log('Anonymous user detected - using "Mystery Guest"');
    } else if (currentUser.displayName) {
      // For registered users, extract first name from display name
      firstName = currentUser.displayName.split(' ')[0];
      console.log('Using displayName for greeting:', currentUser.displayName, '-> firstName:', firstName);
    } else {
      // Try to get from localStorage for registered users
      const storedFirstName = localStorage.getItem(`user_${currentUser.uid}_firstName`);
      if (storedFirstName && storedFirstName !== 'Mystery') {
        firstName = storedFirstName;
        console.log('Using localStorage firstName for greeting:', firstName);
      }
    }
  }
  
  console.log('Final firstName for greeting:', firstName, 'isAnonymous:', isAnonymousUser);
  
  // Time-based greetings with exact timing as requested
  let greeting = '';
  if (hour < 12) {
    greeting = `Good morning, ${firstName} ✨`;
  } else if (hour < 18) {
            greeting = `Good Afternoon, ${firstName} 🌟`;
  } else {
            greeting = `Good Evening, ${firstName} 🌙`;
  }
  
  heroGreeting.textContent = greeting;
  
  // Dynamic insights based on user data
  const lastLogin = localStorage.getItem('lastLogin');
  const today = new Date().toDateString();
  
  if (lastLogin === today) {
    // Same day - encouraging message
    const insights = [
      "You're building something beautiful, one day at a time",
      "Every moment of self-care is a step toward your best self",
      "Your journey is unique and beautiful - keep going",
      "You have the power to create positive change in your life"
    ];
    heroInsight.textContent = insights[Math.floor(Math.random() * insights.length)];
  } else {
    // New day - welcoming message
    const welcomeInsights = [
      "Welcome back! We're so glad to see you again",
      "A new day brings new opportunities for growth",
      "You're exactly where you need to be right now",
      "Let's make today beautiful together"
    ];
    heroInsight.textContent = welcomeInsights[Math.floor(Math.random() * insights.length)];
  }
  
  // Update last login
  localStorage.setItem('lastLogin', today);
}

// Enhanced Mood Tracking System
function initializeMoodTracking() {
  const moodEmojis = document.querySelectorAll('.mood-emoji');
  
  moodEmojis.forEach(emoji => {
    emoji.addEventListener('click', async function() {
      const mood = this.dataset.mood;
      const moodData = {
        mood: mood,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString(),
        userId: currentUser ? currentUser.uid : null
      };
      
      // Store mood data locally
      if (currentUser) {
        const userPrefix = `user_${currentUser.uid}_`;
        localStorage.setItem(userPrefix + 'currentMood', JSON.stringify(moodData));
        
        // Save to Firebase
        await saveMoodToFirebase(moodData);
      } else {
      localStorage.setItem('currentMood', JSON.stringify(moodData));
      }
      
      // Visual feedback
      this.style.transform = 'scale(1.1)';
      this.style.background = 'rgba(76, 167, 160, 0.2)';
      
      // Show mood saved confirmation
      showMoodSavedMessage(mood);
      
      // Update achievement card with mood-based message
      updateAchievementCard(mood);
      
      
      
      // Reset visual feedback after animation
      setTimeout(() => {
        this.style.transform = 'scale(1)';
        this.style.background = '';
      }, 300);
    });
  });
}

// Save mood data to Firebase
async function saveMoodToFirebase(moodData) {
  if (!currentUser) return false;
  
  try {
    const today = new Date().toDateString();
    
    // Check if we already have a mood entry for today for this user
    const querySnapshot = await db.collection("moodData")
      .where("userId", "==", currentUser.uid)
      .where("date", "==", today)
      .limit(1)
      .get();

    const dataToSave = {
      ...moodData,
      userId: currentUser.uid,
      userEmail: currentUser.email || "anonymous",
      date: today,
      timestamp: new Date()
    };

    if (!querySnapshot.empty) {
      // Update existing document
      const doc = querySnapshot.docs[0];
      await doc.ref.update(dataToSave);
      console.log("Mood updated in Firestore");
    } else {
      // Create new document
      const docRef = await db.collection("moodData").add(dataToSave);
      console.log("Mood saved to Firestore with ID:", docRef.id);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving mood to Firestore:", error);
    return false;
  }
}

// Show mood saved confirmation
function showMoodSavedMessage(mood) {
  const moodMessages = {
    'amazing': 'You\'re feeling amazing! ✨',
    'good': 'Great mood! Keep it up! 🌟',
    'okay': 'You\'re doing okay. That\'s perfectly fine! 🌸',
    'rough': 'It\'s okay to have rough days. You\'re strong! 💪',
    'struggling': 'You\'re not alone. Tomorrow is a new day! 🌅'
  };
  
  const message = moodMessages[mood] || 'Mood saved! 💫';
  
  // Create temporary notification
  const notification = document.createElement('div');
  notification.className = 'mood-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: var(--shadow-medium);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Load mood data from Firebase
async function loadMoodFromFirebase() {
  if (!currentUser) return null;
  
  try {
    const today = new Date().toDateString();
    
    const querySnapshot = await db.collection("moodData")
      .where("userId", "==", currentUser.uid)
      .where("date", "==", today)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log("Mood data loaded from Firebase:", data);
      return data;
    } else {
      console.log("No mood data found for today");
      return null;
    }
  } catch (error) {
    console.error("Error loading mood from Firebase:", error);
    return null;
  }
}
      
      // Reset after animation
      setTimeout(() => {
        this.style.transform = '';
        this.style.background = '';
      }, 300);
      


// Update achievement card based on mood and user data
function updateAchievementCard(mood) {
  const achievementTitle = document.getElementById('achievementTitle');
  const achievementText = document.getElementById('achievementText');
  const currentStreakDisplay = document.getElementById('currentStreakDisplay');
  const totalWinsDisplay = document.getElementById('totalWinsDisplay');
  
  if (!achievementTitle || !achievementText) return;
  
  // Get user's current data
  const userPrefix = currentUser ? `user_${currentUser.uid}_` : '';
  const streakData = userPrefix ? JSON.parse(localStorage.getItem(userPrefix + "streakData") || "[]") : [];
  const currentStreak = streakData.length > 0 ? streakData[streakData.length - 1].done : 0;
  const totalWins = userPrefix ? anchors.filter(id => localStorage.getItem(userPrefix + id) === "true").length : 0;
  
  // Update streak display
  if (currentStreakDisplay) {
    currentStreakDisplay.textContent = currentStreak;
  }
  
  // Update total wins display
  if (totalWinsDisplay) {
    totalWinsDisplay.textContent = totalWins;
  }
  
  // Update achievement message based on mood and performance
  const moodMessages = {
    amazing: "You're absolutely crushing it today! Your energy is contagious ✨",
    good: "You're in a great flow state. Keep building on this momentum! 🌟",
    okay: "You're showing up consistently. That's the foundation of success 🌸",
    rough: "You're here despite the challenges. That's real strength 💪",
    struggling: "You're showing courage by continuing. Every step forward counts 🌅"
  };
  
  const message = moodMessages[mood] || "You're making progress every day!";
  achievementText.textContent = message;
  
  // Add sparkle animation
  const sparkles = document.querySelectorAll('.achievement-sparkles .sparkle');
  sparkles.forEach((sparkle, index) => {
    setTimeout(() => {
      sparkle.style.animation = 'none';
      sparkle.offsetHeight; // Trigger reflow
      sparkle.style.animation = 'sparkleFloat 2s ease-in-out infinite';
    }, index * 200);
  });
}



// Energy Monitoring System
function initializeEnergyMonitoring() {
  const energySlider = document.getElementById('energySlider');
  const energyValue = document.getElementById('energyValue');
  
  if (!energySlider || !energyValue) return;
  
  // Load saved energy level
  const savedEnergy = localStorage.getItem('energyLevel') || 7;
  energySlider.value = savedEnergy;
  energyValue.textContent = `${savedEnergy}/10`;
  
  energySlider.addEventListener('input', function() {
    const value = this.value;
    energyValue.textContent = `${value}/10`;
    
    // Save energy level
    localStorage.setItem('energyLevel', value);
    
    // Update nudge card based on energy
    updateNudgeCard(value);
    
    // Save to Firebase if user is authenticated
    if (auth.currentUser) {
      saveEnergyToFirebase(parseInt(value));
    }
  });
}

// Update nudge card based on energy level
function updateNudgeCard(energyLevel) {
  const nudgeText = document.getElementById('nudgeText');
  if (!nudgeText) return;
  
  let nudgeMessage = '';
  
  if (energyLevel <= 3) {
    nudgeMessage = "Your energy is low. Remember: it's okay to rest and recharge. You don't have to do everything today.";
  } else if (energyLevel <= 6) {
    nudgeMessage = "You have some energy to work with. Focus on one or two important things rather than trying to do it all.";
  } else if (energyLevel <= 8) {
    nudgeMessage = "You're feeling good! Use this energy wisely and don't forget to celebrate your wins.";
  } else {
    nudgeMessage = "You're full of energy! Channel it into something that brings you joy and fulfillment.";
  }
  
  nudgeText.textContent = nudgeMessage;
}

// Quick Actions System
function initializeQuickActions() {
  const actionButtons = document.querySelectorAll('.action-btn');
  
  actionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const action = this.dataset.action;
      handleQuickAction(action);
    });
  });
}

// Handle quick actions
function handleQuickAction(action) {
  const actions = {
    meditate: {
      title: "Mindful Moment",
      message: "Take 3 deep breaths. Inhale peace, exhale tension.",
      duration: "2 minutes"
    },
    journal: {
      title: "Reflection Time",
      message: "Write down one thing you're grateful for today.",
      duration: "5 minutes"
    },
    walk: {
      title: "Movement Break",
      message: "Step outside for a 10-minute walk. Notice the world around you.",
      duration: "10 minutes"
    },
    gratitude: {
      title: "Gratitude Practice",
      message: "Think of 3 things that made you smile today.",
      duration: "3 minutes"
    }
  };
  
  const actionData = actions[action];
  if (!actionData) return;
  
  // Show action modal or notification
  showActionNotification(actionData);
  
  // Track action completion
  trackActionCompletion(action);
}

// Show action notification
function showActionNotification(actionData) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'action-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <h4>${actionData.title}</h4>
      <p>${actionData.message}</p>
      <small>Duration: ${actionData.duration}</small>
      <button class="notification-close">✓ Got it</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 40px rgba(76, 167, 160, 0.25);
    border: 1px solid rgba(76, 167, 160, 0.1);
    z-index: 10000;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Close button functionality
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Intention Setting System
function initializeIntentionSetting() {
  const intentionInput = document.getElementById('intentionInput');
  const setIntentionBtn = document.getElementById('setIntentionBtn');
  const currentIntention = document.getElementById('currentIntention');
  const intentionText = document.getElementById('intentionText');
  
  if (!intentionInput || !setIntentionBtn) return;
  
  // Load saved intention
  const savedIntention = localStorage.getItem('todayIntention');
  if (savedIntention) {
    intentionText.textContent = savedIntention;
    currentIntention.style.display = 'block';
    intentionInput.style.display = 'none';
    setIntentionBtn.style.display = 'none';
  }
  
  setIntentionBtn.addEventListener('click', function() {
    const intention = intentionInput.value.trim();
    if (!intention) return;
    
    // Save intention
    localStorage.setItem('todayIntention', intention);
    localStorage.setItem('intentionDate', new Date().toDateString());
    
    // Update UI
    intentionText.textContent = intention;
    currentIntention.style.display = 'block';
    intentionInput.style.display = 'none';
    setIntentionBtn.style.display = 'none';
    
    // Save to Firebase if user is authenticated
    if (auth.currentUser) {
      saveIntentionToFirebase(intention);
    }
    
    // Show celebration
    showIntentionCelebration(intention);
  });
}

// Show intention celebration
function showIntentionCelebration(intention) {
  const celebration = document.createElement('div');
  celebration.className = 'intention-celebration';
  celebration.innerHTML = `
    <div class="celebration-content">
      <span class="celebration-emoji">🎯</span>
      <p>Today's intention set: "${intention}"</p>
      <p class="celebration-subtitle">You've got this!</p>
    </div>
  `;
  
  celebration.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 20px 60px rgba(76, 167, 160, 0.3);
    border: 1px solid rgba(76, 167, 160, 0.1);
    z-index: 10000;
    text-align: center;
    animation: fadeInUp 0.5s ease-out;
  `;
  
  document.body.appendChild(celebration);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (celebration.parentNode) {
      celebration.remove();
    }
  }, 3000);
}

// Enhanced Wins Visualization
function initializeEnhancedWins() {
  // Add organic animations to win cards
  const winCards = document.querySelectorAll('.win-card');
  
  winCards.forEach((card, index) => {
    // Stagger entrance animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 200);
    
    // Add hover effects
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Firebase Integration for New Features
function saveMoodToFirebase(moodData) {
  if (!auth.currentUser) return;
  
  db.collection('users').doc(auth.currentUser.uid).collection('moods').add({
    ...moodData,
    userId: auth.currentUser.uid
  }).catch(error => {
    console.error("Error saving mood:", error);
  });
}

function saveEnergyToFirebase(energyLevel) {
  if (!auth.currentUser) return;
  
  db.collection('users').doc(auth.currentUser.uid).collection('energy').add({
    level: energyLevel,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString(),
    userId: auth.currentUser.uid
  }).catch(error => {
    console.error("Error saving energy:", error);
  });
}

function saveIntentionToFirebase(intention) {
  if (!auth.currentUser) return;
  
  db.collection('users').doc(auth.currentUser.uid).collection('intentions').add({
    intention: intention,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString(),
    userId: auth.currentUser.uid
  }).catch(error => {
    console.error("Error saving intention:", error);
  });
}

function trackActionCompletion(action) {
  if (!auth.currentUser) return;
  
  db.collection('users').doc(auth.currentUser.uid).collection('quickActions').add({
    action: action,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString(),
    userId: auth.currentUser.uid
  }).catch(error => {
    console.error("Error tracking action:", error);
  });
}

// Initialize all new features
function initializeBreathingDesignSystem() {
  updateDynamicGreeting();
  initializeMoodTracking();
  initializeEnergyMonitoring();
  initializeQuickActions();
  initializeIntentionSetting();
  initializeEnhancedWins();
  
  // Update greeting every minute
  setInterval(updateDynamicGreeting, 60000);
  
  // Check for new day and reset intention
  checkNewDay();
}

// Check if it's a new day and reset intention
function checkNewDay() {
  const intentionDate = localStorage.getItem('intentionDate');
  const today = new Date().toDateString();
  
  if (intentionDate !== today) {
    // New day - reset intention
    localStorage.removeItem('todayIntention');
    localStorage.removeItem('intentionDate');
    
    // Reset UI
    const intentionInput = document.getElementById('intentionInput');
    const setIntentionBtn = document.getElementById('setIntentionBtn');
    const currentIntention = document.getElementById('currentIntention');
    
    if (intentionInput && setIntentionBtn && currentIntention) {
      intentionInput.style.display = 'block';
      setIntentionBtn.style.display = 'block';
      currentIntention.style.display = 'none';
      intentionInput.value = '';
    }
  }
}

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
    "bodyMovement",
    "musicDance",
    "watchShow",
    "selfCare",
    "journalAboutApp"
];

// Anchor display name mapping for improved user experience
const anchorDisplayNames = {
    "makeBed": "Make bed",
    "bodyMovement": "Move your body",
    "musicDance": "Music / Dance",
    "watchShow": "Watch something you enjoy",
    "selfCare": "Self-care",
    "journalAboutApp": "Journal your thoughts"
};

// Function to get display name for an anchor
function getAnchorDisplayName(anchorId) {
    return anchorDisplayNames[anchorId] || anchorId;
}

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

  // Insert custom anchors after the last existing anchor in the list
  const lastAnchor = page.querySelector('.anchor:last-of-type');
  const insertAfterEl = lastAnchor || page.querySelector('#addAnchorRow');
  
  custom.forEach(item => {
    const row = document.createElement('div');
    row.className = 'anchor';
    row.setAttribute('data-custom', 'true');
    row.setAttribute('data-id', item.id);
    row.innerHTML = `<label><input type="checkbox" id="${item.id}"> ${item.label}</label>
      <button data-action="remove" class="btn-danger" style="margin-left:8px; flex:0 0 auto;">Remove</button>`;
    
    if (insertAfterEl && insertAfterEl.nextSibling) {
      page.insertBefore(row, insertAfterEl.nextSibling);
    } else {
      page.appendChild(row);
    }
    
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
  
  // Update progress indicator after rendering custom anchors
  updateProgressIndicator();
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
      getAnchorDisplayName(id)
    );
    removedList.innerHTML = `<strong>Removed:</strong> ${anchorNames.join(', ')}`;
  }
}

// Sparkle animation function (kept for other uses)
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

// Tiny twinkle inside checkbox function
function addCheckboxTwinkle(checkbox) {
  // Create a small twinkle element
  const twinkle = document.createElement('div');
  twinkle.className = 'checkbox-twinkle';
  twinkle.innerHTML = '✨';
  
  // Position it inside the checkbox
  const rect = checkbox.getBoundingClientRect();
  twinkle.style.cssText = `
    position: absolute;
    font-size: 10px;
    pointer-events: none;
    animation: checkboxTwinkle 1s ease-out forwards;
    z-index: 1000;
    left: ${rect.left + rect.width/2 - 5}px;
    top: ${rect.top + rect.height/2 - 5}px;
    opacity: 0;
  `;
  
  document.body.appendChild(twinkle);
  
  // Remove after animation
  setTimeout(() => {
    if (twinkle.parentNode) {
      twinkle.parentNode.removeChild(twinkle);
    }
  }, 1000);
}

// Handle anchor checkbox changes with auto-save
async function handleAnchorChange(event) {
  const checkbox = event.target;
  const anchorId = checkbox.id;
  
  // Add tiny twinkle inside the checkbox only when checked
  if (checkbox.checked) {
    addCheckboxTwinkle(checkbox);
  }
  
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
      
      // Ensure homepage is shown after successful authentication
      setTimeout(() => {
        navigateToHomepage();
      }, 300);
    }, 500);
  }
}

// Navigate to homepage with smooth transition
function navigateToHomepage() {
  try {
    console.log('Starting homepage navigation...');
    
    // Remove active class from all navigation links and page sections
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
    
    // Activate homepage navigation link
    const homeLink = document.querySelector('.nav-link[data-page="home"]');
    if (homeLink) {
      homeLink.classList.add('active');
      console.log('Home navigation link activated');
    } else {
      console.warn('Home navigation link not found');
    }
    
    // Show homepage section
    const homeSection = document.getElementById('home');
    if (homeSection) {
      homeSection.classList.add('active');
      // Add smooth animation
      homeSection.classList.remove('animate-in');
      void homeSection.offsetWidth; // reflow
      homeSection.classList.add('animate-in');
      console.log('Home section activated with animation');
    } else {
      console.error('Home section not found');
    }
    

    
    // Ensure bottom navigation shows home as active
    const bottomHomeLink = document.querySelector('.bottom-nav .nav-link[data-page="home"]');
    if (bottomHomeLink) {
      bottomHomeLink.classList.add('active');
      console.log('Bottom navigation home link activated');
    } else {
      console.warn('Bottom navigation home link not found');
    }
    
    console.log('Successfully navigated to homepage after authentication');
  } catch (error) {
    console.error('Error during homepage navigation:', error);
  }
}

// Load user profile data from Firebase
async function loadUserProfile() {
  if (!currentUser) return;
  
  // For anonymous users, ensure local storage is set correctly
  if (currentUser.isAnonymous) {
    console.log('Anonymous user detected in loadUserProfile');
    localStorage.setItem(`user_${currentUser.uid}_firstName`, 'Mystery');
    localStorage.setItem(`user_${currentUser.uid}_lastName`, 'Guest');
    return;
  }
  
  try {
    const userDoc = await db.collection("userProfiles").doc(currentUser.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Store name data locally for immediate access
      if (userData.firstName) {
        localStorage.setItem(`user_${currentUser.uid}_firstName`, userData.firstName);
      }
      if (userData.lastName) {
        localStorage.setItem(`user_${currentUser.uid}_lastName`, userData.lastName);
      }
      
      console.log('User profile loaded:', userData);
    }
  } catch (error) {
    console.log('Could not load user profile:', error);
  }
}

// Force refresh greeting with current user data
function refreshGreeting() {
  if (currentUser) {
    console.log('Forcing greeting refresh for user:', currentUser.uid);
    updateDynamicGreeting();
  }
}

// Debug function to check current user state
function debugUserState() {
  if (!currentUser) {
    console.log('No current user');
    return;
  }
  
  console.log('=== USER STATE DEBUG ===');
  console.log('User ID:', currentUser.uid);
  console.log('Is Anonymous:', currentUser.isAnonymous);
  console.log('Display Name:', currentUser.displayName);
  console.log('Email:', currentUser.email);
  console.log('Creation Time:', currentUser.metadata.creationTime);
  console.log('Last Sign In:', currentUser.metadata.lastSignInTime);
  
  const storedFirstName = localStorage.getItem(`user_${currentUser.uid}_firstName`);
  const storedLastName = localStorage.getItem(`user_${currentUser.uid}_lastName`);
  console.log('Stored First Name:', storedFirstName);
  console.log('Stored Last Name:', storedLastName);
  console.log('========================');
}

function updateUserInfo() {
  const userInfo = document.getElementById("userInfo");
  const profileNameEl = document.getElementById("profileName");
  const profileEmailEl = document.getElementById("profileEmail");
  const homeGreeting = document.getElementById('homeGreeting');
  
  if (currentUser && userInfo) {
    let displayName = 'Anonymous User';
    if (currentUser.displayName) {
      displayName = currentUser.displayName;
    } else if (currentUser.email) {
      displayName = currentUser.email;
    }
    userInfo.textContent = `Welcome, ${displayName}!`;
  }
  
  if (currentUser && profileNameEl && profileEmailEl) {
    let displayName = 'Anonymous User';
    if (currentUser.displayName) {
      displayName = currentUser.displayName;
    } else if (currentUser.email) {
      displayName = currentUser.email;
    }
    profileNameEl.textContent = displayName;
    profileEmailEl.textContent = currentUser.email || '—';
  }
  
  if (homeGreeting) {
    const hours = new Date().getHours();
    const period = hours < 12 ? 'Good Morning' : (hours < 18 ? 'Good Afternoon' : 'Good Evening');
    
    let firstName = '';
    if (currentUser) {
      // Check if this is an anonymous user
      if (currentUser.isAnonymous) {
        firstName = 'Mystery Guest'; // Use full name for anonymous users
      } else if (currentUser.displayName) {
        // For registered users, extract first name
        firstName = currentUser.displayName.split(' ')[0];
      } else {
        // Try to get from localStorage for registered users
        const storedFirstName = localStorage.getItem(`user_${currentUser.uid}_firstName`);
        if (storedFirstName && storedFirstName !== 'Mystery') {
          firstName = storedFirstName;
        }
      }
    }
    
    homeGreeting.textContent = `${period}${firstName ? ', ' + firstName : ''}`;
  }
}

// Sign up with email/password
async function signUp() {
  const firstName = document.getElementById("signupFirstNameInput").value.trim();
  const email = document.getElementById("signupEmailInput").value;
  const password = document.getElementById("signupPasswordInput").value;
  
  if (!firstName) {
    alert("Please enter your first name");
    return;
  }
  
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  
  if (password.length < 6) {
    alert("Password must be at least 6 characters long");
    return;
  }
  
  try {
    // Create user account
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update user profile with name
    await user.updateProfile({
      displayName: firstName
    });
    
    // Store name data in Firebase for additional access
    await db.collection("userProfiles").doc(user.uid).set({
      firstName: firstName,
      lastName: "",
      email: email,
      createdAt: new Date(),
      lastUpdated: new Date()
    });
    
    // Store name locally for immediate use
    localStorage.setItem(`user_${user.uid}_firstName`, firstName);
    
    console.log("User signed up successfully with name - will redirect to homepage");
  } catch (error) {
    console.error("Sign up error:", error);
    alert("Sign up failed: " + error.message);
  }
}

// Sign in with email/password
async function signIn() {
  const email = document.getElementById("signinEmailInput").value;
  const password = document.getElementById("signinPasswordInput").value;
  
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Try to load user profile data if not already loaded
    if (user && !user.displayName) {
      try {
        const userDoc = await db.collection("userProfiles").doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData.firstName) {
            // Update user profile with name
            await user.updateProfile({
              displayName: userData.firstName
            });
            
            // Store name locally
            localStorage.setItem(`user_${user.uid}_firstName`, userData.firstName);
          }
        }
      } catch (profileError) {
        console.log("Could not load user profile:", profileError);
      }
    }
    
    console.log("User signed in successfully - will redirect to homepage");
  } catch (error) {
    console.error("Sign in error:", error);
    alert("Sign in failed: " + error.message);
  }
}

// Sign in with Google


// Sign in anonymously (for guests)
async function signInAnonymously() {
  try {
    const userCredential = await auth.signInAnonymously();
    const user = userCredential.user;
    
    console.log("Anonymous user created:", user.uid);
    
    // Set display name for guest users
    await user.updateProfile({
      displayName: 'Mystery Guest'
    });
    
    console.log("Display name set to 'Mystery Guest'");
    
    // Store guest profile in Firebase for consistency
    try {
      await db.collection("userProfiles").doc(user.uid).set({
        firstName: 'Mystery',
        lastName: 'Guest',
        email: null,
        createdAt: new Date(),
        lastUpdated: new Date(),
        source: 'anonymous'
      });
      console.log("Guest profile stored in Firebase");
    } catch (profileError) {
      console.log("Could not store guest profile in Firebase:", profileError);
    }
    
    // Store guest info locally
    localStorage.setItem(`user_${user.uid}_firstName`, 'Mystery');
    localStorage.setItem(`user_${user.uid}_lastName`, 'Guest');
    console.log("Guest info stored locally");
    
    console.log("Anonymous sign in successful - will redirect to homepage");
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
  
  if (selfCareSelect) {
    progressData.selfCareOption = selfCareSelect.value;
  }

  // Save to localStorage (for offline access) - using user-specific keys
  const userPrefix = `user_${currentUser.uid}_`;
  anchors.forEach(id => {
    if (progressData[id] !== undefined) {
      localStorage.setItem(userPrefix + id, progressData[id]);
    }
  });
  
  localStorage.setItem(userPrefix + "selfCareOption", progressData.selfCareOption || "");
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
  
  // Load mood data from Firebase
  const moodData = await loadMoodFromFirebase();
  
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
    
    const watchShowCheckbox = document.getElementById("watchShow");
  }
  
  updateUIAfterLoad();
  
  // Update progress indicator after loading
  updateProgressIndicator();
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
  
  // Clear localStorage with user prefix
  const userPrefix = `user_${currentUser.uid}_`;
  anchors.forEach(id => {
    localStorage.setItem(userPrefix + id, false);
  });
  localStorage.removeItem(userPrefix + "selfCareOption");
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
  
  await saveToFirebase(clearedData);
  
  // Re-render custom anchors to ensure event listeners are properly attached
  renderCustomAnchors();
  
  // Update progress indicator to show 0 completed
  updateProgressIndicator();
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
    await loadUserProfile(); // Load user profile data first
    
    // Update user info and greeting
    updateUserInfo();
    updateDynamicGreeting(); // Update greeting with user's name
    
    // Continue with app initialization
    renderCustomAnchors();
    await loadProgress();
    updateProgressIndicator();
    updateAchievementCard();
    
    // For returning users, ensure they land on homepage
    if (user.metadata.lastSignInTime && user.metadata.creationTime !== user.metadata.lastSignInTime) {
      console.log("Returning user - ensuring homepage navigation");
      setTimeout(() => {
        navigateToHomepage();
      }, 200);
    }
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
    // Update progress indicator when user signs out
    updateProgressIndicator();
    // Update achievement card for signed out state
    updateAchievementCard();
  }
});

// ----------------------------
// New User Onboarding Flow
// ----------------------------
function checkIfUserHasExistingData() {
  // Check if user has any existing data in localStorage or Firebase
  const hasLocalData = localStorage.getItem('currentStreak') || 
                       localStorage.getItem('totalWins') ||
                       localStorage.getItem('lastProgressDate');
  
  // If user is authenticated, also check Firebase data
  if (currentUser && !currentUser.isAnonymous) {
    // For now, just check local data since Firebase data loading happens after auth
    // This can be enhanced later to check Firebase collections
    return hasLocalData;
  }
  
  console.log("Checking if user has existing data:", hasLocalData);
  return hasLocalData;
}

function setupNewUserOnboarding() {
  console.log("Setting up new user onboarding flow...");
  
  const optionBalance = document.getElementById('optionBalance');
  const optionDreams = document.getElementById('optionDreams');
  const dontAskAgain = document.getElementById('dontAskAgain');
  
  if (optionBalance) {
    optionBalance.addEventListener('click', () => {
      console.log("User selected: Find my balance");
      completeNewUserOnboarding('balance', dontAskAgain?.checked || false);
      navigateToSection('daily-anchors');
    });
  }
  
  if (optionDreams) {
    optionDreams.addEventListener('click', () => {
      console.log("User selected: Start shaping my dream life");
      completeNewUserOnboarding('dreams', dontAskAgain?.checked || false);
      navigateToSection('dream-life');
    });
  }
}

function completeNewUserOnboarding(preference, dontAskAgain = false) {
  // Store user preference and mark onboarding as complete
  localStorage.setItem('new_user_onboarding_shown', 'true');
  localStorage.setItem('user_onboarding_preference', preference);
  
  // If user checked "don't ask again", store this preference
  if (dontAskAgain) {
    localStorage.setItem('never_ask_onboarding', 'true');
    console.log("User chose to never show onboarding again");
  }
  
  // Hide the onboarding overlay
  const newUserOnboarding = document.getElementById('newUserOnboarding');
  if (newUserOnboarding) {
    newUserOnboarding.classList.remove('active');
    newUserOnboarding.setAttribute('aria-hidden', 'true');
  }
  
  console.log(`New user onboarding completed. Preference: ${preference}, Don't ask again: ${dontAskAgain}`);
}

function navigateToSection(sectionName) {
  // Remove active class from all navigation links and page sections
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
  
  // Activate the selected section's navigation link
  const sectionLink = document.querySelector(`.nav-link[data-page="${sectionName}"]`);
  if (sectionLink) {
    sectionLink.classList.add('active');
  }
  
  // Show the selected section
  const section = document.getElementById(sectionName);
  if (section) {
    section.classList.add('active');
    // Add smooth animation
    section.classList.remove('animate-in');
    void section.offsetWidth; // reflow
    section.classList.add('animate-in');
  }
  
  // Ensure bottom navigation shows the correct section as active
  const bottomNavLink = document.querySelector(`.bottom-nav .nav-link[data-page="${sectionName}"]`);
  if (bottomNavLink) {
    bottomNavLink.classList.add('active');
  }
  
  // Show welcome message for first-time visitors if coming from onboarding
  showWelcomeMessageIfNeeded(sectionName);
  
  console.log(`Successfully navigated to ${sectionName} section`);
}

function showWelcomeMessageIfNeeded(sectionName) {
  // Check if user just completed onboarding and this is their first visit to this section
  const onboardingPreference = localStorage.getItem('user_onboarding_preference');
  const welcomeShown = localStorage.getItem(`${sectionName}_welcome_shown`);
  
  if (onboardingPreference && !welcomeShown) {
    const welcomeMessage = document.getElementById(`${sectionName.replace('-', '')}WelcomeMessage`);
    if (welcomeMessage) {
      welcomeMessage.style.display = 'block';
      console.log(`Showing welcome message for ${sectionName}`);
    }
  }
}

function dismissWelcomeMessage(sectionName) {
  // Hide the welcome message
  const welcomeMessage = document.getElementById(`${sectionName}WelcomeMessage`);
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
  
  // Mark as shown for this section
  localStorage.setItem(`${sectionName}_welcome_shown`, 'true');
  
  console.log(`Welcome message dismissed for ${sectionName}`);
}

// Function to manually trigger onboarding for testing (can be removed in production)
function triggerOnboardingForTesting() {
  // Clear onboarding flags
  localStorage.removeItem('new_user_onboarding_shown');
  localStorage.removeItem('user_onboarding_preference');
  localStorage.removeItem('daily-anchors_welcome_shown');
  localStorage.removeItem('dream-life_welcome_shown');
  
  // Show onboarding
  const newUserOnboarding = document.getElementById('newUserOnboarding');
  if (newUserOnboarding) {
    newUserOnboarding.classList.add('active');
    newUserOnboarding.setAttribute('aria-hidden', 'false');
    setupNewUserOnboarding();
    console.log("Onboarding triggered for testing");
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

  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.textContent = messageText;
    showMessage();
  }
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
  const currentStreak = calculateCurrentStreak(streakData);
  const msg = document.getElementById("streakMessage");
  if (!msg) return;
  
  if (currentStreak === 0) {
    msg.textContent = "You've anchored for 0 days 🌿 Keep going at your own pace.";
  } else if (currentStreak === 1) {
    msg.textContent = "You've anchored for 1 day 🌿 Keep going at your own pace.";
  } else {
    msg.textContent = `You've anchored for ${currentStreak} days 🌿 Keep going at your own pace.`;
  }
}

function updateProgressIndicator() {
  // Get all anchor checkboxes (default + custom)
  const allAnchors = document.querySelectorAll('.anchor .anchor-checkbox');
  const userPrefix = currentUser ? `user_${currentUser.uid}_` : '';
  
  let completedCount = 0;
  let totalCount = allAnchors.length;
  
  allAnchors.forEach(checkbox => {
    if (checkbox.checked) {
      completedCount++;
    }
  });
  
  const progressIndicator = document.getElementById('progressIndicator');
  const progressFill = document.getElementById('progressFill');
  
  if (progressIndicator) {
    progressIndicator.textContent = `Completed ${completedCount} of ${totalCount} — every step counts 🌱`;
  }
  
  if (progressFill) {
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    progressFill.style.width = `${percentage}%`;
  }
  
  // Update streak
  updateStreak(completedCount);
  
  // Save progress for default anchors
  const defaultAnchors = ['makeBed', 'bodyMovement', 'musicDance', 'watchShow', 'journalAboutApp', 'selfCare'];
  defaultAnchors.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      const isChecked = checkbox.checked;
      if (userPrefix) {
        localStorage.setItem(userPrefix + id, isChecked);
      } else {
        localStorage.setItem(id, isChecked);
      }
    }
  });
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
  
  // Handle watch show checkbox state
  const watchShowCheckbox = document.getElementById("watchShow");
  
  // Render custom anchors
  renderCustomAnchors();
  
  // Update removed anchors display
  updateRemovedAnchorsDisplay();
  
  // Update progress indicator after all UI elements are loaded
  updateProgressIndicator();
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
  }, 3000);
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


      
      // Load page-specific data
      if (targetPage === 'home') {
        // Home page - update greeting and achievement card
        updateDynamicGreeting();
        updateAchievementCard();
          // Initialize the new Core Dashboard functionality
          initializeCoreDashboard();
        // Initialize carousels for metrics cards
        try {
          initializeCarousels();
        } catch (e) {
          console.error("Error initializing carousels:", e);
        }
      } else if (targetPage === 'daily-anchors') {
        loadProgress();
      } else if (targetPage === 'habits') {
        // Habits page - ensure habits are loaded and rendered
        try {
          if (typeof renderHabits === 'function') {
            renderHabits();
            updateHabitsProgress();
          }
        } catch (e) {
          console.error("Error loading habits page:", e);
        }
      } else if (targetPage === 'dream-life') {
        // Dream Life page - ensure data is loaded
        if (typeof renderDreamLifeData === 'function') {
          renderDreamLifeData();
        }
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
        
        // Load page-specific data
        if (page === 'home') {
          // Home page - update greeting and achievement card
          updateDynamicGreeting();
          updateAchievementCard();
          // Initialize the new Core Dashboard functionality
          initializeCoreDashboard();
          // Initialize carousels for metrics cards
          try {
            initializeCarousels();
          } catch (e) {
            console.error("Error initializing carousels:", e);
          }
        } else if (page === 'daily-anchors') {
          loadProgress();
        } else if (page === 'habits') {
          // Habits page - ensure habits are loaded and rendered
          try {
            if (typeof renderHabits === 'function') {
              renderHabits();
              updateHabitsProgress();
            }
          } catch (e) {
            console.error("Error loading habits page:", e);
          }
        } else if (page === 'dream-life') {
          // Dream Life page - ensure data is loaded
          if (typeof renderDreamLifeData === 'function') {
            renderDreamLifeData();
          }
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
        
        // Load page-specific data
        if (page === 'home') {
          // Home page - update greeting and achievement card
          updateDynamicGreeting();
          updateAchievementCard();
          // Initialize the new Core Dashboard functionality
          initializeCoreDashboard();
        } else if (page === 'daily-anchors') {
          loadProgress();
        } else if (page === 'habits') {
          // Habits page - ensure habits are loaded and rendered
          try {
            if (typeof renderHabits === 'function') {
              renderHabits();
              updateHabitsProgress();
            }
          } catch (e) {
            console.error("Error loading habits page:", e);
          }
        } else if (page === 'dream-life') {
          // Dream Life page - ensure data is loaded
          if (typeof renderDreamLifeData === 'function') {
            renderDreamLifeData();
          }
        }
        
        hamburgerSheet.classList.remove('active');
        hamburgerSheet.setAttribute('aria-hidden', 'true');
      });
    });
  }
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
}



// ----------------------------
// Event Listeners
// ----------------------------
function setupEventListeners() {
  // App functionality
  const resetBtn = document.getElementById("resetBtn");
  const watchShowCheckbox = document.getElementById("watchShow");
  
  if (resetBtn) {
    resetBtn.addEventListener("click", clearAll);
    }
    
    // Empty state buttons for Your Wins
    const emptyGoAnchorsBtn = document.getElementById("emptyGoAnchorsBtn");
    if (emptyGoAnchorsBtn) {
      emptyGoAnchorsBtn.addEventListener("click", () => {
        navigateToPage('daily-anchors');
      });
    }
    
    const emptySetReminderBtn = document.getElementById("emptySetReminderBtn");
    if (emptySetReminderBtn) {
      emptySetReminderBtn.addEventListener("click", () => {
        navigateToPage('profile');
      });
    }

  // Add custom anchor handlers
  const addBtn = document.getElementById('addAnchorBtn');
  const addInput = document.getElementById('newAnchorInput');
  if (addBtn && addInput) {
    const addHandler = () => {
      const label = addInput.value.trim();
      if (!label) return;
      
      // Create new custom anchor element
      const newAnchor = document.createElement('div');
      newAnchor.className = 'anchor';
      newAnchor.dataset.id = 'custom_' + Date.now();
      
      newAnchor.innerHTML = `
        <label class="anchor-label">
          <input type="checkbox" class="anchor-checkbox" onchange="updateProgressIndicator()">
          <span class="anchor-text">${label}</span>
        </label>
      `;
      
      // Insert after the add anchor card
      const addAnchorCard = document.getElementById('addAnchorRow');
      if (addAnchorCard) {
        addAnchorCard.parentNode.insertBefore(newAnchor, addAnchorCard.nextSibling);
      }
      
      // Clear input
      addInput.value = '';
      
      // Update progress
      updateProgressIndicator();
      
      // Show success message
      showAnchorAddedMessage(label);
    };
    addBtn.addEventListener('click', addHandler);
    addInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addHandler(); } });
  }
  
  // Add event handlers for default anchors
  defaultAnchors.forEach(anchorId => {
    const checkbox = document.getElementById(anchorId);
    if (checkbox) {
      checkbox.addEventListener('change', updateProgressIndicator);
    }
  });
  
  // Add event handlers for remove buttons on default anchors
  document.querySelectorAll('.remove-anchor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const anchorId = btn.closest('.anchor').getAttribute('data-id');
      if (confirm(`Remove "${getAnchorDisplayName(anchorId)}" from your daily anchors?`)) {
        removeDefaultAnchor(anchorId);
      }
    });
  });

  // Show anchor added message
  function showAnchorAddedMessage(anchorName) {
    const message = document.createElement('div');
    message.className = 'anchor-added-message';
    message.textContent = `Added "${anchorName}" to your anchors 🌱`;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow-medium);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(message);
      }, 300);
    }, 3000);
  }

  // Add sign out button handler
  const signOutMenuBtn = document.getElementById('signOutMenuBtn');
  if (signOutMenuBtn) {
    signOutMenuBtn.addEventListener('click', async () => {
      // Show confirmation dialog
      if (confirm('Are you sure you want to sign out?')) {
        try {
          await signOut();
          // Close hamburger menu
          const hamburgerSheet = document.getElementById('hamburgerSheet');
          if (hamburgerSheet) {
            hamburgerSheet.classList.remove('active');
            hamburgerSheet.setAttribute('aria-hidden', 'true');
          }
          // Show success message
          console.log('User signed out successfully');
        } catch (error) {
          console.error('Error signing out:', error);
          alert('Error signing out. Please try again.');
        }
      }
    });
  }
  
  // Show remove buttons on right-click or hover
  document.querySelectorAll('.anchor[data-default="true"]').forEach(anchorEl => {
    const removeBtn = anchorEl.querySelector('.remove-anchor-btn');
    if (!removeBtn) return;
    
    // Show on right-click
    anchorEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      removeBtn.style.display = 'block';
      // Hide after 3 seconds
      setTimeout(() => {
        removeBtn.style.display = 'none';
      }, 3000);
    });
    
    // Show on hover (desktop)
    anchorEl.addEventListener('mouseenter', () => {
      removeBtn.style.display = 'block';
    });
    
    anchorEl.addEventListener('mouseleave', () => {
      removeBtn.style.display = 'none';
    });
    
    // Show on touch (mobile)
    anchorEl.addEventListener('touchstart', () => {
      removeBtn.style.display = 'block';
      // Hide after 3 seconds
      setTimeout(() => {
        removeBtn.style.display = 'none';
      }, 3000);
    });
  });
  
  if (watchShowCheckbox) {
    watchShowCheckbox.addEventListener("change", function () {
      updateProgressIndicator();
    });
  }
  
  // Auth functionality
  const signUpBtn = document.getElementById("signUpBtn");
  const signInBtn = document.getElementById("signInBtn");
  const guestSignInBtn = document.getElementById("guestSignInBtn");
  const editProfileBtn = document.getElementById("editProfileBtn");
  
  // Auth tabs
  const authTabs = document.querySelectorAll('.auth-tab');
  

  
  // Setup auth tab switching
  if (authTabs.length > 0) {
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const formType = tab.dataset.form;
        switchAuthForm(formType);
      });
    });
  }
  
  if (signUpBtn) {
    signUpBtn.addEventListener("click", signUp);
  }
  
  if (signInBtn) {
    signInBtn.addEventListener("click", signIn);
  }
  
  if (guestSignInBtn) {
    guestSignInBtn.addEventListener("click", signInAnonymously);
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



  // Enter key support for auth inputs
  const signinEmailInput = document.getElementById("signinEmailInput");
  const signinPasswordInput = document.getElementById("signinPasswordInput");
  const signupFirstNameInput = document.getElementById("signupFirstNameInput");
  const signupEmailInput = document.getElementById("signupEmailInput");
  const signupPasswordInput = document.getElementById("signupPasswordInput");
  
  if (signinEmailInput && signinPasswordInput) {
    signinEmailInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        signIn();
      }
    });
    signinPasswordInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        signIn();
      }
    });
  }
  
  if (signupFirstNameInput && signupEmailInput && signupPasswordInput) {
    signupFirstNameInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        signUp();
      }
    });
    signupEmailInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        signUp();
      }
    });
    signupPasswordInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        signUp();
      }
    });
  }
}

// Auth form switching function
function switchAuthForm(formType) {
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const signinTab = document.querySelector('[data-form="signin"]');
  const signupTab = document.querySelector('[data-form="signup"]');
  
  if (formType === 'signin') {
    signinForm.style.display = 'block';
    signupForm.style.display = 'none';
    signinTab.classList.add('active');
    signupTab.classList.remove('active');
  } else if (formType === 'signup') {
    signinForm.style.display = 'none';
    signupForm.style.display = 'block';
    signinTab.classList.remove('active');
    signupTab.classList.add('active');
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



  // Show new user onboarding flow for first-time users
  try {
    const onboardingShown = localStorage.getItem('new_user_onboarding_shown') === 'true';
    const hasExistingData = checkIfUserHasExistingData();
    const newUserOnboarding = document.getElementById('newUserOnboarding');
    
    console.log("Onboarding setup - shown:", onboardingShown, "hasData:", hasExistingData, "element:", !!newUserOnboarding);
    
    if (!onboardingShown && !hasExistingData && newUserOnboarding) {
      // Show the new user onboarding for truly new users
      newUserOnboarding.classList.add('active');
      newUserOnboarding.setAttribute('aria-hidden', 'false');
      
      // Set up event listeners for the onboarding options
      setupNewUserOnboarding();
      console.log("New user onboarding displayed");
    }
  } catch (e) { 
    console.error("Error setting up new user onboarding:", e); 
  }




  
  // Initialize the breathing design system
  try {
    initializeBreathingDesignSystem();
  } catch (e) {
    console.error("Error initializing breathing design system:", e);
  }
  
  // Update progress indicator on initial load
  updateProgressIndicator();
  
  // Initialize achievement card
  updateAchievementCard();
  
  // Initialize Dream Life Vision functionality
  initializeDreamLifeVision();
  
  // Initialize carousels for metrics cards
  try {
    initializeCarousels();
  } catch (e) {
    console.error("Error initializing carousels:", e);
  }
  
  // Initialize habits system
  try {
    initializeHabitsSystem();
  } catch (e) {
    console.error("Error initializing habits system:", e);
  }
  
  // Initialize home page state
  try {
    initializeHomePage();
  } catch (e) {
    console.error("Error initializing home page:", e);
  }
  
  // Initialize data persistence system
  try {
    await initializeDataPersistence();
  } catch (e) {
    console.error("Error initializing data persistence:", e);
  }
  
  // The splash screen will show first, then auth screen based on auth state
  // This is handled by the HTML inline script and auth state listener
  
  console.log("App initialized successfully!");
}


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



// Start the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ----------------------------

// ----------------------------


window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error || event.message);
});
















// Dream Life Vision Data Structure
let dreamLifeData = {
  career: {
    vision: "",
    actionItems: []
  },
  relationships: {
    vision: "",
    actionItems: []
  },
  personalGrowth: {
    vision: "",
    actionItems: []
  }
};

// ========================================
// NEW CORE DASHBOARD FUNCTIONALITY
// ========================================

function initializeCoreDashboard() {
  console.log('Initializing Core Dashboard...');
  
  // First, identify the user's journey stage
  const userStage = getUserJourneyStage();
  console.log('User journey stage:', userStage);
  
  // Render different dashboard templates based on stage
  switch(userStage) {
    case 'new':
      renderOnboardingDashboard();
      break;
    case 'anchor-focused':
      renderSingleFocusDashboard('anchors');
      break;
    case 'dream-focused':
      renderSingleFocusDashboard('dreams');
      break;
    case 'balanced':
      renderBalancedDashboard();
      break;
    case 'returning':
      renderReturningUserDashboard();
      break;
    default:
      renderBalancedDashboard();
  }
  
  console.log('Core Dashboard initialized');
}

function updateEncouragementHeadline() {
  const headline = document.getElementById('heroGreeting');
  const subtitle = document.getElementById('heroInsight');
  
  if (!headline || !subtitle) return;
  
  // Get user data for personalized encouragement
  const currentStreak = getCurrentStreak();
  const monthlyCompletion = getMonthlyCompletion();
  const recentActivity = getRecentActivity();
  
  // Rotate between different encouragement types to prevent staleness
  const encouragements = [
    {
      title: `${currentStreak}-day streak on your daily anchors — that's a strong foundation! ✨`,
      subtitle: "Your consistency is building something beautiful"
    },
    {
      title: `You've taken ${recentActivity} steps towards your goals this month — keep it up! 🌟`,
      subtitle: "Every action moves you closer to your dreams"
    },
    {
      title: `${monthlyCompletion}% completion rate this month — you're showing up for yourself! 🌱`,
      subtitle: "Your commitment to self-care is inspiring"
    },
    {
      title: "Building something beautiful, one day at a time ✨",
      subtitle: "Your journey is unique and worth celebrating"
    }
  ];
  
  // Use date-based rotation to prevent staleness
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const selectedEncouragement = encouragements[dayOfYear % encouragements.length];
  
  headline.textContent = selectedEncouragement.title;
  subtitle.textContent = selectedEncouragement.subtitle;
}

function determineFeaturePriority() {
  // Analyze user engagement to determine which feature to show first
  const anchorsUsage = getAnchorsUsage();
  const dreamsUsage = getDreamsUsage();
  
  const primaryFeature = anchorsUsage > dreamsUsage ? 'anchors' : 'dreams';
  const secondaryFeature = primaryFeature === 'anchors' ? 'dreams' : 'anchors';
  
  // Store the priority for use in other functions
  window.dashboardFeaturePriority = { primary: primaryFeature, secondary: secondaryFeature };
  
  console.log('Feature priority determined:', { primary: primaryFeature, secondary: secondaryFeature });
}

function updatePrimaryMetrics() {
  const priority = window.dashboardFeaturePriority?.primary || 'anchors';
  
  if (priority === 'anchors') {
    updateAnchorsMetrics();
  } else {
    updateDreamsMetrics();
  }
}

function updateSecondaryMetrics() {
  const priority = window.dashboardFeaturePriority?.secondary || 'dreams';
  
  if (priority === 'anchors') {
    updateAnchorsMetrics();
  } else {
    updateDreamsMetrics();
  }
}

function updateAnchorsMetrics() {
  const currentStreak = getCurrentStreak();
  const weeklyCompletion = getWeeklyCompletion();
  const mostConsistentAnchor = getMostConsistentAnchor();
  
  // Update primary metrics if this is the primary feature
  if (window.dashboardFeaturePriority?.primary === 'anchors') {
    updateMetricElement('primaryStreakValue', currentStreak);
    updateMetricElement('primaryCompletionValue', `${weeklyCompletion}%`);
    updateMetricElement('primaryHighlightValue', mostConsistentAnchor);
    
    // Update section titles
    updateElementText('primarySectionTitle', 'Your Daily Anchors');
    updateElementText('primarySectionSubtitle', 'Small steps, big transformations');
  }
  
  // Update secondary metrics if this is the secondary feature
  if (window.dashboardFeaturePriority?.secondary === 'anchors') {
    updateMetricElement('secondaryStreakValue', currentStreak);
    updateMetricElement('secondaryCompletionValue', `${weeklyCompletion}%`);
    updateMetricElement('secondaryHighlightValue', mostConsistentAnchor);
    
    // Update section titles
    updateElementText('secondarySectionTitle', 'Your Daily Anchors');
    updateElementText('secondarySectionSubtitle', 'Small steps, big transformations');
  }
}

function updateDreamsMetrics() {
  const activeGoals = getActiveGoalsCount();
  const goalProgress = getGoalProgress();
  const recentMilestone = getRecentMilestone();
  
  // Update primary metrics if this is the primary feature
  if (window.dashboardFeaturePriority?.primary === 'dreams') {
    updateMetricElement('primaryActiveValue', activeGoals);
    updateMetricElement('primaryProgressValue', `${goalProgress}%`);
    updateMetricElement('primaryHighlightValue', recentMilestone);
    
    // Update section titles
    updateElementText('primarySectionTitle', 'Your Dream Life Vision');
    updateElementText('primarySectionSubtitle', 'Building your future, one step at a time');
  }
  
  // Update secondary metrics if this is the secondary feature
  if (window.dashboardFeaturePriority?.secondary === 'dreams') {
    updateMetricElement('secondaryActiveValue', activeGoals);
    updateMetricElement('secondaryProgressValue', `${goalProgress}%`);
    updateMetricElement('secondaryHighlightValue', recentMilestone);
    
    // Update section titles
    updateElementText('secondarySectionTitle', 'Your Dream Life Vision');
    updateElementText('secondarySectionSubtitle', 'Building your future, one step at a time');
  }
}

function updateActionSection() {
  const primaryFeature = window.dashboardFeaturePriority?.primary || 'anchors';
  
  if (primaryFeature === 'anchors') {
    // Primary action for anchors
    updateElementText('primaryActionTitle', 'Start Today\'s Anchors');
    updateElementText('primaryActionDescription', 'Your 5-minute morning routine is waiting');
    updateElementText('primaryActionBtn', 'Go');
    
    // Secondary action for dreams
    updateElementText('secondaryActionTitle', 'Review Your Dreams');
    updateElementText('secondaryActionDescription', 'Take a moment to envision your future');
    updateElementText('secondaryActionBtn', 'Explore');
  } else {
    // Primary action for dreams
    updateElementText('primaryActionTitle', 'Review Your Dreams');
    updateElementText('primaryActionDescription', 'Take a moment to envision your future');
    updateElementText('primaryActionBtn', 'Explore');
    
    // Secondary action for anchors
    updateElementText('secondaryActionTitle', 'Start Today\'s Anchors');
    updateElementText('primaryActionDescription', 'Your 5-minute morning routine is waiting');
    updateElementText('secondaryActionBtn', 'Go');
  }
  
  // Add event listeners to action buttons
  setupActionButtonListeners();
}

// User Journey Stage Detection - FIXED VERSION
function getUserJourneyStage() {
  if (!currentUser) return 'new';
  
  const userPrefix = `user_${currentUser.uid}_`;
  
  // Check if user has EVER completed ANY anchor
  let hasAnyAnchorActivity = false;
  const anchors = ['makeBed', 'bodyMovement', 'musicDance', 'watchShow', 'journalAboutApp', 'selfCare'];
  
  for (let anchor of anchors) {
    const completionHistory = localStorage.getItem(userPrefix + anchor + '_history');
    if (completionHistory && JSON.parse(completionHistory).length > 0) {
      hasAnyAnchorActivity = true;
      break;
    }
  }
  
  // Check if user has EVER set ANY dream content
  let hasAnyDreamActivity = false;
  const dreamCategories = ['career', 'relationships', 'personalGrowth'];
  
  for (let category of dreamCategories) {
    const vision = localStorage.getItem(userPrefix + `dream_${category}_vision`);
    if (vision && vision.trim() !== '') {
      hasAnyDreamActivity = true;
      break;
    }
  }
  
  console.log('User activity analysis:', {
    hasAnyAnchorActivity,
    hasAnyDreamActivity,
    userPrefix
  });
  
  // EXPLICIT USER STATE LOGIC
  if (!hasAnyAnchorActivity && !hasAnyDreamActivity) {
    return 'new';  // TRUE new user
  } else if (hasAnyAnchorActivity && !hasAnyDreamActivity) {
    return 'anchor-focused';  // Only uses anchors
  } else if (hasAnyDreamActivity && !hasAnyAnchorActivity) {
    return 'dream-focused';  // Only uses dreams
  } else {
    return 'balanced';  // Uses both
  }
}

function getAnchorCompletionsCount() {
  if (!currentUser) return 0;
  const userPrefix = `user_${currentUser.uid}_`;
  
  // Count total anchor completions from localStorage
  let totalCompletions = 0;
  const anchors = ['makeBed', 'bodyMovement', 'musicDance', 'watchShow', 'journalAboutApp', 'selfCare'];
  
  anchors.forEach(anchor => {
    const stored = localStorage.getItem(userPrefix + anchor);
    if (stored === 'true') totalCompletions++;
  });
  
  return totalCompletions;
}

function getDreamsSetCount() {
  if (!currentUser) return 0;
  const userPrefix = `user_${currentUser.uid}_`;
  
  // Count dreams that have been set
  let dreamsCount = 0;
  const dreamCategories = ['career', 'relationships', 'personalGrowth'];
  
  dreamCategories.forEach(category => {
    const vision = localStorage.getItem(userPrefix + `dream_${category}_vision`);
    const actionItems = localStorage.getItem(userPrefix + `dream_${category}_actionItems`);
    
    if (vision && vision.trim() !== '') dreamsCount++;
    if (actionItems && JSON.parse(actionItems).length > 0) dreamsCount++;
  });
  
  return dreamsCount;
}

function getLastActivityDays() {
  if (!currentUser) return 999;
  const userPrefix = `user_${currentUser.uid}_`;
  
  // Get last activity timestamp
  const lastActivity = localStorage.getItem(userPrefix + 'lastActivity');
  if (!lastActivity) return 999;
  
  const lastDate = new Date(lastActivity);
  const today = new Date();
  const diffTime = Math.abs(today - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Helper functions for getting data - NEVER return zeros
function getCurrentStreak() {
  if (!currentUser) return 0;
  const userPrefix = `user_${currentUser.uid}_`;
  const streakData = JSON.parse(localStorage.getItem(userPrefix + 'streakData')) || [];
  const streak = calculateCurrentStreak(streakData);
  return streak || 0; // Return 0 only if streak calculation fails
}

function getWeeklyCompletion() {
  // Calculate completion for the current week
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  // This would need to be implemented based on your data structure
  // For now, return a placeholder that's never zero
  const completion = Math.floor(Math.random() * 40) + 60; // 60-100% placeholder
  return completion > 0 ? completion : 60; // Never return 0
}

function getMonthlyCompletion() {
  // Calculate completion for the current month
  // This would need to be implemented based on your data structure
  // For now, return a placeholder that's never zero
  const completion = Math.floor(Math.random() * 100) + 70; // 70-100% placeholder
  return completion > 0 ? completion : 70; // Never return 0
}

function getMostConsistentAnchor() {
  // This would analyze which anchor the user completes most often
  // For now, return a placeholder
  const anchors = ['Make bed', 'Move your body', 'Music / Dance', 'Watch something you enjoy', 'Journal your thoughts'];
  return anchors[Math.floor(Math.random() * anchors.length)];
}

function getActiveGoalsCount() {
  // This would count active goals from the dreams section
  // For now, return a placeholder that's never zero
  const goals = Math.floor(Math.random() * 5) + 1; // 1-5 goals placeholder
  return goals > 0 ? goals : 1; // Never return 0
}

function getGoalProgress() {
  // This would calculate overall progress across all goals
  // For now, return a placeholder that's never zero
  const progress = Math.floor(Math.random() * 40) + 20; // 20-60% placeholder
  return progress > 0 ? progress : 20; // Never return 0
}

function getRecentMilestone() {
  // This would find the most recent completed milestone
  // For now, return a placeholder
  const milestones = ['Career goal set', 'Relationship boundary established', 'New hobby started', 'Health routine created'];
  return milestones[Math.floor(Math.random() * milestones.length)];
}

function getAnchorsUsage() {
  // This would analyze how much the user engages with anchors
  // For now, return a placeholder that's never zero
  const usage = Math.floor(Math.random() * 100) + 50; // 50-150 usage score placeholder
  return usage > 0 ? usage : 50; // Never return 0
}

function getDreamsUsage() {
  // This would analyze how much the user engages with dreams
  // For now, return a placeholder that's never zero
  const usage = Math.floor(Math.random() * 100) + 30; // 30-130 usage score placeholder
  return usage > 0 ? usage : 30; // Never return 0
}

function getRecentActivity() {
  // This would count recent actions taken
  // For now, return a placeholder that's never zero
  const activity = Math.floor(Math.random() * 15) + 5; // 5-20 actions placeholder
  return activity > 0 ? activity : 5; // Never return 0
}

// Dashboard Rendering Functions
function renderOnboardingDashboard() {
  console.log('Rendering onboarding dashboard for new user');
  
  // Update hero section for new users
  updateHeroForNewUser();
  
  // HIDE ALL METRICS SECTIONS COMPLETELY
  document.getElementById('primaryMetrics').style.display = 'none';
  document.getElementById('secondaryMetrics').style.display = 'none';
  
  // SHOW ONLY ONBOARDING
  document.getElementById('onboardingCard').style.display = 'block';
  
  // Update action section for new users
  updateActionSectionForNewUser();
}

function renderSingleFocusDashboard(focus) {
  console.log(`Rendering single focus dashboard for ${focus}-focused user`);
  
  if (focus === 'anchors') {
    // Show ONLY anchors, HIDE dreams completely
    document.getElementById('primaryMetrics').style.display = 'block';
    document.getElementById('secondaryMetrics').style.display = 'none';
    
    // Update section to be anchors
    updatePrimarySectionForAnchors();
    
    // Update hero for anchor-focused users
    updateHeroForAnchorUser();
    
    // Update anchors metrics with encouraging language
    updateAnchorsMetricsEncouraging();
    
    // Update action section
    updateActionSectionForAnchorUser();
  } else {
    // Show ONLY dreams, HIDE anchors completely  
    document.getElementById('primaryMetrics').style.display = 'block';
    document.getElementById('secondaryMetrics').style.display = 'none';
    
    // Update section to be dreams
    updatePrimarySectionForDreams();
    
    // Update hero for dream-focused users
    updateHeroForDreamUser();
    
    // Update dreams metrics with encouraging language
    updateDreamsMetricsEncouraging();
    
    // Update action section
    updateActionSectionForDreamUser();
  }
}

function renderBalancedDashboard() {
  console.log('Rendering balanced dashboard for active user');
  
  // Show both sections
  showSection('primaryMetrics');
  showSection('secondaryMetrics');
  
  // Update personalized encouragement headline
  updateEncouragementHeadline();
  
  // Determine primary vs secondary feature based on usage
  determineFeaturePriority();
  
  // Update both sections
  updatePrimaryMetrics();
  updateSecondaryMetrics();
  
  // Update context-aware call-to-action
  updateActionSection();
}

function renderReturningUserDashboard() {
  console.log('Rendering returning user dashboard');
  
  // Show both sections but with returning user messaging
  showSection('primaryMetrics');
  showSection('secondaryMetrics');
  
  // Update hero for returning users
  updateHeroForReturningUser();
  
  // Update metrics with gentle re-engagement language
  updateMetricsForReturningUser();
  
  // Update action section for returning users
  updateActionSectionForReturningUser();
}

// Hero Updates for Different User States
function updateHeroForNewUser() {
  const headline = document.getElementById('heroGreeting');
  const subtitle = document.getElementById('heroInsight');
  
  if (headline) headline.textContent = "Ready to start your journey? ✨";
  if (subtitle) subtitle.textContent = "Every beautiful transformation begins with a single step";
}

function updateHeroForAnchorUser() {
  const headline = document.getElementById('heroGreeting');
  const subtitle = document.getElementById('heroInsight');
  
  if (headline) headline.textContent = "Building your foundation, one day at a time ✨";
  if (subtitle) subtitle.textContent = "Your consistency is creating something beautiful";
}

function updateHeroForDreamUser() {
  const headline = document.getElementById('heroGreeting');
  const subtitle = document.getElementById('heroInsight');
  
  if (headline) headline.textContent = "Your vision is taking shape ✨";
  if (subtitle) subtitle.textContent = "Every dream starts with a single thought";
}

function updateHeroForReturningUser() {
  const headline = document.getElementById('heroGreeting');
  const subtitle = document.getElementById('heroInsight');
  
  if (headline) headline.textContent = "Welcome back, beautiful soul ✨";
  if (subtitle) subtitle.textContent = "Your journey is still here, waiting for you";
}

// Section Visibility Functions
function hideMetricsSections() {
  hideSection('primaryMetrics');
  hideSection('secondaryMetrics');
}

function hideSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) section.style.display = 'none';
}

function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) section.style.display = 'block';
}

// Onboarding Section
function showOnboardingSection() {
  const onboardingCard = document.getElementById('onboardingCard');
  if (onboardingCard) {
    onboardingCard.style.display = 'block';
    onboardingCard.innerHTML = `
      <div class="onboarding-content">
        <div class="onboarding-icon">🌱</div>
        <h3>Welcome to Your Self-Care Journey</h3>
        <p>You're about to create something beautiful. Choose where you'd like to start:</p>
        <div class="onboarding-options">
          <div class="onboarding-option" onclick="startWithAnchors()">
            <div class="option-icon">🎯</div>
            <div class="option-content">
              <h4>Start with Daily Anchors</h4>
              <p>Build simple, grounding habits that anchor you to your best self</p>
            </div>
          </div>
          <div class="onboarding-option" onclick="startWithDreams()">
            <div class="option-icon">🌟</div>
            <div class="option-content">
              <h4>Begin with Your Dreams</h4>
              <p>Envision the life you want and break it down into actionable steps</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Action Section Updates for Different User States
function updateActionSectionForNewUser() {
  updateElementText('primaryActionTitle', 'Set Your First Anchor');
  updateElementText('primaryActionDescription', 'Start with something simple that feels good');
  updateElementText('primaryActionBtn', 'Begin');
  
  updateElementText('secondaryActionTitle', 'Explore What\'s Possible');
  updateElementText('secondaryActionDescription', 'Take a moment to dream about your future');
  updateElementText('secondaryActionBtn', 'Dream');
  
  setupActionButtonListeners();
}

function updateActionSectionForAnchorUser() {
  updateElementText('primaryActionTitle', 'Continue Your Anchors');
  updateElementText('primaryActionDescription', 'Your daily routine is waiting for you');
  updateElementText('primaryActionBtn', 'Go');
  
  updateElementText('secondaryActionTitle', 'When You\'re Ready');
  updateElementText('secondaryActionDescription', 'Explore dreaming about your future');
  updateElementText('secondaryActionBtn', 'Explore');
  
  setupActionButtonListeners();
}

function updateActionSectionForDreamUser() {
  updateElementText('primaryActionTitle', 'Review Your Dreams');
  updateElementText('primaryActionDescription', 'Your vision is waiting for your attention');
  updateElementText('primaryActionBtn', 'Review');
  
  updateElementText('secondaryActionTitle', 'Try Daily Anchors');
  updateElementText('secondaryActionDescription', 'Build grounding habits to support your dreams');
  updateElementText('secondaryActionBtn', 'Try');
  
  setupActionButtonListeners();
}

function updateActionSectionForReturningUser() {
  updateElementText('primaryActionTitle', 'Pick Up Where You Left Off');
  updateElementText('primaryActionDescription', 'Your progress is still here');
  updateElementText('primaryActionBtn', 'Continue');
  
  updateElementText('secondaryActionTitle', 'Start Fresh');
  updateElementText('secondaryActionDescription', 'Begin a new chapter in your journey');
  updateElementText('secondaryActionBtn', 'Begin');
  
  setupActionButtonListeners();
}

// Metrics Updates with Encouraging Language
function updateAnchorsMetricsEncouraging() {
  const currentStreak = getCurrentStreak();
  const weeklyCompletion = getWeeklyCompletion();
  const mostConsistentAnchor = getMostConsistentAnchor();
  
  // NEVER show "0 Days" - ALWAYS encouraging
  if (currentStreak === 0) {
    updateMetricElement('primaryStreakValue', 'Ready to begin');
    updateMetricElement('primaryStreakEncouragement', 'Your first day awaits');
  } else {
    updateMetricElement('primaryStreakValue', `${currentStreak} Days`);
    updateMetricElement('primaryStreakEncouragement', 'Beautiful consistency!');
  }
  
  // Same for completion
  if (weeklyCompletion === 0) {
    updateMetricElement('primaryCompletionValue', 'Fresh start');
    updateMetricElement('primaryCompletionEncouragement', 'This week is yours');
  } else {
    updateMetricElement('primaryCompletionValue', `${weeklyCompletion}%`);
    updateMetricElement('primaryCompletionEncouragement', 'Every percentage counts!');
  }
  
  // Most consistent anchor
  if (!mostConsistentAnchor || mostConsistentAnchor === '-') {
    updateMetricElement('primaryHighlightValue', 'Discovering what works');
    updateMetricElement('primaryHighlightEncouragement', 'Your go-to daily win');
  } else {
    updateMetricElement('primaryHighlightValue', mostConsistentAnchor);
    updateMetricElement('primaryHighlightEncouragement', 'Your go-to daily win');
  }
}

function updateDreamsMetricsEncouraging() {
  const activeGoals = getActiveGoalsCount();
  const goalProgress = getGoalProgress();
  const recentMilestone = getRecentMilestone();
  
  // NEVER show zeros - ALWAYS encouraging
  if (activeGoals === 0) {
    updateMetricElement('secondaryActiveValue', 'Time to dream big');
    updateMetricElement('secondaryActiveEncouragement', 'Your first goal awaits');
  } else {
    updateMetricElement('secondaryActiveValue', activeGoals);
    updateMetricElement('secondaryActiveEncouragement', 'You\'re making progress!');
  }
  
  if (goalProgress === 0) {
    updateMetricElement('secondaryProgressValue', 'First steps await');
    updateMetricElement('secondaryProgressEncouragement', 'Every step forward matters');
  } else {
    updateMetricElement('secondaryProgressValue', `${goalProgress}%`);
    updateMetricElement('secondaryProgressEncouragement', 'Every step forward matters');
  }
  
  if (!recentMilestone || recentMilestone === '-') {
    updateMetricElement('secondaryHighlightValue', 'Your first milestone');
    updateMetricElement('secondaryHighlightEncouragement', 'Celebrating your wins');
  } else {
    updateMetricElement('secondaryHighlightValue', recentMilestone);
    updateMetricElement('secondaryHighlightEncouragement', 'Celebrating your wins');
  }
}

function updateMetricsForReturningUser() {
  // Use encouraging language for returning users
  updateAnchorsMetricsEncouraging();
  updateDreamsMetricsEncouraging();
}

// Section Update Functions for Single Focus Users
function updatePrimarySectionForAnchors() {
  // Update section title and subtitle for anchors
  updateElementText('primarySectionTitle', 'Your Daily Anchors');
  updateElementText('primarySectionSubtitle', 'Small steps, big transformations');
}

function updatePrimarySectionForDreams() {
  // Update section title and subtitle for dreams
  updateElementText('primarySectionTitle', 'Your Dream Life Vision');
  updateElementText('primarySectionSubtitle', 'Building your future, one step at a time');
}

// Onboarding Navigation Functions
function startWithAnchors() {
  trackUserActivity();
  navigateToSection('daily-anchors');
}

function startWithDreams() {
  trackUserActivity();
  navigateToSection('dream-life');
}

// Activity Tracking
function trackUserActivity() {
  if (!currentUser) return;
  
  const userPrefix = `user_${currentUser.uid}_`;
  const now = new Date().toISOString();
  
  // Update last activity timestamp
  localStorage.setItem(userPrefix + 'lastActivity', now);
  
  console.log('User activity tracked:', now);
}

// Utility functions for updating elements
function updateMetricElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function setupActionButtonListeners() {
  const primaryBtn = document.getElementById('primaryActionBtn');
  const secondaryBtn = document.getElementById('secondaryActionBtn');
  
  if (primaryBtn) {
    primaryBtn.addEventListener('click', () => {
      const primaryFeature = window.dashboardFeaturePriority?.primary || 'anchors';
      if (primaryFeature === 'anchors') {
        navigateToSection('daily-anchors');
      } else {
        navigateToSection('dream-life');
      }
    });
  }
  
  if (secondaryBtn) {
    secondaryBtn.addEventListener('click', () => {
      const secondaryFeature = window.dashboardFeaturePriority?.secondary || 'dreams';
      if (secondaryFeature === 'anchors') {
        navigateToSection('daily-anchors');
      } else {
        navigateToSection('dream-life');
      }
    });
  }
}

// Track editing modes for each category
let editingModes = {
  career: false,
  relationships: false,
  personalGrowth: false
};

// Custom categories array
let customCategories = [];

// Initialize Dream Life Vision functionality
function initializeDreamLifeVision() {
  // Load saved data from localStorage first
  loadDreamLifeData();
  
  setupDreamLifeEventListeners();
  renderDreamLifeData();
}

// Load dream life data from localStorage
function loadDreamLifeData() {
  try {
    const userPrefix = getUserPrefix();
    const savedData = localStorage.getItem(`${userPrefix}dreamLifeData`);
    const savedCustomCategories = localStorage.getItem(`${userPrefix}customCategories`);
    
    if (savedData) {
      dreamLifeData = JSON.parse(savedData);
      console.log('Dream life data loaded from localStorage');
    }
    
    if (savedCustomCategories) {
      customCategories = JSON.parse(savedCustomCategories);
      console.log('Custom categories loaded from localStorage');
    }
  } catch (error) {
    console.error('Error loading dream life data:', error);
    // Keep default data if loading fails
  }
}

// Save dream life data to localStorage and Firebase
async function saveDreamLifeData() {
  try {
    const userId = getCurrentUserId();
    const localStorageKey = `dreamLifeData_${userId}`;
    
    // Save to localStorage immediately
    localStorage.setItem(localStorageKey, JSON.stringify(dreamLifeData));
    
    // Save to Firebase with sync
    await saveDataWithSync('dreams', dreamLifeData);
    
    console.log('Dream life data saved to localStorage and Firebase');
  } catch (error) {
    console.error('Error saving dream life data:', error);
  }
}

// Setup event listeners for dream life page
function setupDreamLifeEventListeners() {
  // Vision textarea change tracking
  const visionTextareas = [
    'careerVision', 'relationshipsVision', 'personalGrowthVision'
  ];
  
  visionTextareas.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      textarea.addEventListener('input', () => {
        const category = getCategoryFromTextareaId(id);
        if (category) {
          markAsUnsaved(category);
        }
      });
    }
  });

  // Action textarea enter key handling and auto-expand
  const actionTextareas = [
    'careerActionInput', 'relationshipsActionInput', 'personalGrowthActionInput'
  ];
  
  actionTextareas.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const category = getCategoryFromInputId(id);
          if (category) {
            addActionItem(category);
          }
        }
      });
      
      textarea.addEventListener('input', () => {
        expandTextarea(textarea);
      });
    }
  });
}

// Get category name from textarea ID
function getCategoryFromTextareaId(textareaId) {
  const mapping = {
    'careerVision': 'career',
    'relationshipsVision': 'relationships',
    'personalGrowthVision': 'personalGrowth'
  };
  
  // Check for custom categories
  const customCategory = customCategories.find(cat => 
    textareaId === `${cat.id}Vision`
  );
  
  return mapping[textareaId] || (customCategory ? customCategory.id : null);
}

// Get category name from input ID
function getCategoryFromInputId(inputId) {
  const mapping = {
    'careerActionInput': 'career',
    'relationshipsActionInput': 'relationships',
    'personalGrowthActionInput': 'personalGrowth'
  };
  
  // Check for custom categories
  const customCategory = customCategories.find(cat => 
    inputId === `${cat.id}ActionInput`
  );
  
  return mapping[inputId] || (customCategory ? customCategory.id : null);
}

// Get input ID from category
function getCategoryInputId(category) {
  const mapping = {
    'career': 'careerActionInput',
    'relationships': 'relationshipsActionInput',
    'personalGrowth': 'personalGrowthActionInput'
  };
  
  return mapping[category] || `${category}ActionInput`;
}

// Get textarea ID from category
function getCategoryTextareaId(category) {
  const mapping = {
    'career': 'careerVision',
    'relationships': 'relationshipsVision',
    'personalGrowth': 'personalGrowthVision'
  };
  
  return mapping[category] || `${category}Vision`;
}

// Get action list ID from category
function getCategoryActionListId(category) {
  const mapping = {
    'career': 'careerActionList',
    'relationships': 'relationshipsActionList',
    'personalGrowth': 'personalGrowthActionList'
  };
  
  return mapping[category] || `${category}ActionList`;
}

// Toggle category expand/collapse
function toggleCategory(category) {
  const categoryElement = document.querySelector(`[data-category="${category}"]`);
  if (!categoryElement) return;
  
  const content = categoryElement.querySelector('.category-content');
  const expandIcon = categoryElement.querySelector('.expand-icon');
  
  if (!content || !expandIcon) return;
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    categoryElement.classList.add('expanded');
    expandIcon.style.transform = 'rotate(180deg)';
    
    // Add smooth animation
    content.classList.remove('animate-in');
    void content.offsetWidth; // reflow
    content.classList.add('animate-in');
  } else {
    content.style.display = 'none';
    categoryElement.classList.remove('expanded');
    expandIcon.style.transform = 'rotate(0deg)';
  }
}

// Add new action item to a category
function addActionItem(category) {
  const inputId = getCategoryInputId(category);
  const input = document.getElementById(inputId);
  
  if (!input || !input.value.trim()) return;
  
  const newItem = {
    id: Date.now(),
    text: input.value.trim(),
    completed: false
  };
  
  dreamLifeData[category].actionItems.push(newItem);
  
  // Save to localStorage
  saveDreamLifeData();
  
  // Clear input
  input.value = '';
  
  // Re-render the category
  renderCategory(category);
  
  // Show celebration
  showActionItemAdded(newItem.text);
}

// Toggle action item completion
function toggleActionItem(category, itemId) {
  const item = dreamLifeData[category].actionItems.find(item => item.id === itemId);
  if (item) {
    item.completed = !item.completed;
    
    // Save to localStorage
    saveDreamLifeData();
    
    renderCategory(category);
    
    if (item.completed) {
      showActionItemCompleted(item.text);
    }
  }
}

// Delete action item
function deleteActionItem(category, itemId) {
  dreamLifeData[category].actionItems = dreamLifeData[category].actionItems.filter(item => item.id !== itemId);
  
  // Save to localStorage
  saveDreamLifeData();
  
  renderCategory(category);
}

// Render all dream life data
function renderDreamLifeData() {
  Object.keys(dreamLifeData).forEach(category => {
    renderCategory(category);
    
    // Initialize display mode if vision text exists (without saved indicator)
    if (dreamLifeData[category].vision && dreamLifeData[category].vision.trim() !== '') {
      enterDisplayMode(category, dreamLifeData[category].vision, false);
    }
  });
}

// Render a specific category
function renderCategory(category) {
  const categoryData = dreamLifeData[category];
  const categoryElement = document.querySelector(`[data-category="${category}"]`);
  
  if (!categoryElement) return;
  
  // Update vision textarea
  const textareaId = getCategoryTextareaId(category);
  const textarea = document.getElementById(textareaId);
  if (textarea && textarea.value !== categoryData.vision) {
    textarea.value = categoryData.vision;
  }
  
  // Update action items list
  const actionListId = getCategoryActionListId(category);
  const actionList = document.getElementById(actionListId);
  if (actionList) {
    renderActionItemsList(actionList, category, categoryData.actionItems);
  }
  
  // Update progress
  updateCategoryProgress(category, categoryData.actionItems);
}

// Render action items list
function renderActionItemsList(container, category, actionItems) {
  container.innerHTML = '';
  
  if (actionItems.length === 0) {
    container.innerHTML = '<div class="empty-state">No action steps yet. Add your first step above! ✨</div>';
    return;
  }
  
  actionItems.forEach(item => {
    const itemElement = createActionItemElement(category, item);
    container.appendChild(itemElement);
  });
}

// Create action item element
function createActionItemElement(category, item) {
  const div = document.createElement('div');
  div.className = `action-item ${item.completed ? 'completed' : ''}`;
  div.dataset.id = item.id;
  
  div.innerHTML = `
    <input type="checkbox" class="action-checkbox" ${item.completed ? 'checked' : ''}>
    <span class="action-text">${item.text}</span>
    <button class="delete-action-btn" title="Delete">🗑️</button>
  `;
  
  // Add checkbox event listener
  const checkbox = div.querySelector('.action-checkbox');
  checkbox.addEventListener('change', () => {
    toggleActionItem(category, item.id);
  });
  
  // Add delete button event listener
  const deleteBtn = div.querySelector('.delete-action-btn');
  deleteBtn.addEventListener('click', () => {
    deleteActionItem(category, item.id);
  });
  
  return div;
}

// Update category progress display
function updateCategoryProgress(category, actionItems) {
  const categoryElement = document.querySelector(`[data-category="${category}"]`);
  if (!categoryElement) return;
  
  const progressElement = categoryElement.querySelector('.progress-text');
  const total = actionItems.length;
  const completed = actionItems.filter(item => item.completed).length;
  
  if (progressElement) {
    progressElement.textContent = `${completed} of ${total} completed`;
  }
}

// Show celebration when action item is added
function showActionItemAdded(text) {
  showTemporaryMessage(`✨ Added: ${text}`, 'success');
}

// Show celebration when action item is completed
function showActionItemCompleted(text) {
  showTemporaryMessage(`🎉 Completed: ${text}`, 'success');
}

// Show temporary message
function showTemporaryMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `temp-message temp-message-${type}`;
  messageDiv.textContent = message;
  
  // Style the message
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--accent)' : '#4A5568'};
    color: white;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-medium);
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 500;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(messageDiv);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 300);
    }
  }, 3000);
}

// Vision Save and Review Functions
function saveVision(category) {
  const textarea = document.getElementById(`${category}Vision`);
  if (!textarea) return;
  
  const text = textarea.value.trim();
  
  // Update save status to "Saving..."
  updateSaveStatus(category, 'saving');
  
  // Simulate save delay
  setTimeout(() => {
    // Save the vision text
    dreamLifeData[category].vision = text;
    
    // Save to localStorage
    saveDreamLifeData();
    
    // Enter display mode with saved indicator
    enterDisplayMode(category, text, true);
    
    // Show brief success message
    showTemporaryMessage(`✨ Vision saved for ${getCategoryDisplayName(category)}`, 'success');
    
    // Fade out saved indicator after 2.5 seconds
    setTimeout(() => {
      fadeOutSavedIndicator(category);
    }, 2500);
  }, 500);
}

// These functions are no longer needed with the new display mode approach
// Keeping them commented out in case they're needed elsewhere
/*
function showVisionReview(category, text) {
  const modal = document.getElementById('visionReviewModal');
  const textDisplay = document.getElementById('visionTextDisplay');
  
  if (modal && textDisplay) {
    textDisplay.textContent = text;
    modal.style.display = 'flex';
    
    // Store current category for edit function
    modal.dataset.currentCategory = category;
  }
}

function hideVisionReviewModal() {
  const modal = document.getElementById('visionReviewModal');
  if (modal) {
    modal.style.display = 'none';
    modal.dataset.currentCategory = '';
  }
}

function editVision() {
  const modal = document.getElementById('visionReviewModal');
  const category = modal.dataset.currentCategory;
  
  if (category) {
    hideVisionReviewModal();
    
    // Expand the category and focus on the textarea
    const categoryElement = document.querySelector(`[data-category="${category}"]`);
    if (categoryElement) {
      const content = categoryElement.querySelector('.category-content');
      const expandIcon = categoryElement.querySelector('.expand-icon');
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        categoryElement.classList.add('expanded');
        expandIcon.style.transform = 'rotate(180deg)';
      }
      
      // Focus on the textarea
      const textarea = document.getElementById(`${category}Vision`);
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }
  }
}
*/

function markAsUnsaved(category) {
  updateSaveStatus(category, 'unsaved');
}

function updateSaveStatus(category, status) {
  const statusElement = document.getElementById(`${category}Status`);
  if (!statusElement) return;
  
  // Remove all status classes
  statusElement.classList.remove('no-changes', 'unsaved', 'saving', 'saved');
  
  // Add new status class
  statusElement.classList.add(status);
  
  // Update text content
  const statusTexts = {
    'no-changes': 'No changes',
    'unsaved': 'Unsaved changes',
    'saving': 'Saving...',
    'saved': 'Saved ✓'
  };
  
  statusElement.textContent = statusTexts[status] || 'No changes';
  
  // Update save button state and text
  const saveButton = statusElement.parentElement.querySelector('.btn-save');
  if (saveButton) {
    saveButton.disabled = status === 'saving' || status === 'saved';
    
    // Update button text based on status
    if (status === 'saving') {
      saveButton.textContent = 'Saving...';
    } else if (status === 'saved') {
      saveButton.textContent = 'Save & Review';
    } else {
      saveButton.textContent = 'Save & Review';
    }
  }
}

function expandTextarea(textarea) {
  // Reset height to auto to get the correct scrollHeight
  textarea.style.height = 'auto';
  
  // Set height to scrollHeight, but respect min and max heights
  const newHeight = Math.max(50, Math.min(120, textarea.scrollHeight));
  textarea.style.height = newHeight + 'px';
}

// Display Mode Functions
function enterDisplayMode(category, text, showSavedIndicator = false) {
  const textarea = document.getElementById(`${category}Vision`);
  const visionControls = textarea.parentElement.querySelector('.vision-controls');
  const displayMode = document.getElementById(`${category}VisionDisplay`);
  const textDisplay = document.getElementById(`${category}VisionTextDisplay`);
  
  if (!textarea || !visionControls || !displayMode || !textDisplay) return;
  
  // Hide textarea and save controls
  textarea.style.display = 'none';
  visionControls.style.display = 'none';
  
  // Show display mode and populate with formatted text
  displayMode.style.display = 'block';
  textDisplay.innerHTML = formatDisplayText(text);
  
  // Handle saved indicator based on parameter
  const savedIndicator = displayMode.querySelector('.saved-indicator');
  if (savedIndicator) {
    if (showSavedIndicator) {
      // Show saved indicator for new saves
      savedIndicator.style.display = 'inline';
      savedIndicator.style.opacity = '1';
      savedIndicator.textContent = '✓ Saved';
    } else {
      // Hide saved indicator for existing content
      savedIndicator.style.display = 'none';
      savedIndicator.style.opacity = '0';
    }
  }
  
  // Update editing mode state
  editingModes[category] = false;
}

function enterEditMode(category) {
  const textarea = document.getElementById(`${category}Vision`);
  const visionControls = textarea.parentElement.querySelector('.vision-controls');
  const displayMode = document.getElementById(`${category}VisionDisplay`);
  
  if (!textarea || !visionControls || !displayMode) return;
  
  // Show textarea and save controls
  textarea.style.display = 'block';
  visionControls.style.display = 'flex';
  
  // Hide display mode
  displayMode.style.display = 'none';
  
  // Focus on textarea
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  
  // Update editing mode state
  editingModes[category] = true;
  
  // Mark as unsaved since user is editing
  markAsUnsaved(category);
}

function formatDisplayText(text) {
  if (!text || text.trim() === '') {
    return '<em class="empty-text">No vision text yet. Click Edit to add your vision.</em>';
  }
  
  // Check if text is long enough to truncate
  if (text.length > 300) {
    const truncatedText = text.substring(0, 250) + '...';
    const fullText = text;
    
    return `
      <div class="truncated-text">
        <div class="text-preview">${truncatedText}</div>
        <span class="see-more-toggle" onclick="toggleTextExpansion(this, '${fullText.replace(/'/g, "\\'")}')">See more</span>
      </div>
      <div class="full-text" style="display: none;">
        <div class="text-content">${fullText}</div>
        <span class="see-more-toggle" onclick="toggleTextExpansion(this, '${truncatedText.replace(/'/g, "\\'")}')">See less</span>
      </div>
    `;
  }
  
  // Return full text for shorter content
  return `<div class="text-content">${text}</div>`;
}

function toggleTextExpansion(toggleElement, textToShow) {
  const container = toggleElement.closest('.vision-text-display');
  const truncatedDiv = container.querySelector('.truncated-text');
  const fullDiv = container.querySelector('.full-text');
  
  if (truncatedDiv.style.display !== 'none') {
    // Show full text
    truncatedDiv.style.display = 'none';
    fullDiv.style.display = 'block';
  } else {
    // Show truncated text
    truncatedDiv.style.display = 'block';
    fullDiv.style.display = 'none';
  }
}

function getCategoryDisplayName(category) {
  const names = {
    'career': 'Career & Purpose',
    'relationships': 'Relationships & Social Life',
    'personalGrowth': 'Personal Growth & Hobbies'
  };
  return names[category] || category;
}

function fadeOutSavedIndicator(category) {
  const displayMode = document.getElementById(`${category}VisionDisplay`);
  if (!displayMode) return;
  
  const savedIndicator = displayMode.querySelector('.saved-indicator');
  if (!savedIndicator) return;
  
  // Fade out the saved indicator
  savedIndicator.style.transition = 'opacity 0.5s ease';
  savedIndicator.style.opacity = '0';
  
  // Hide completely after fade animation
  setTimeout(() => {
    savedIndicator.style.display = 'none';
  }, 500);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Custom Category Functions
// Show add category modal
function showAddCategoryModal() {
  document.getElementById('addCategoryModal').style.display = 'flex';
  document.getElementById('categoryName').focus();
}

// Hide add category modal
function hideAddCategoryModal() {
  document.getElementById('addCategoryModal').style.display = 'none';
  // Clear form
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryIcon').value = '';
  document.getElementById('categoryPlaceholder').value = '';
}

// Create custom category
function createCustomCategory() {
  const name = document.getElementById('categoryName').value.trim();
  const icon = document.getElementById('categoryIcon').value.trim() || '📝';
  const placeholder = document.getElementById('categoryPlaceholder').value.trim() || 
    'Describe your vision for this area of your life...';
  
  if (!name) {
    alert('Please enter a category name');
    return;
  }
  
  // Check for duplicate names
  const allCategories = [...Object.keys(dreamLifeData), ...customCategories.map(c => c.id)];
  const categoryId = `custom_${Date.now()}`;
  
  if (allCategories.some(cat => cat.includes(categoryId))) {
    alert('A similar category already exists');
    return;
  }
  
  const customCategory = {
    id: categoryId,
    name: name,
    icon: icon,
    placeholder: placeholder,
    vision: '',
    actionItems: []
  };
  
  customCategories.push(customCategory);
  dreamLifeData[categoryId] = {
    vision: '',
    actionItems: []
  };
  
  // Create and append the new category
  createCustomCategoryElement(customCategory);
  
  // Save to localStorage
  saveDreamLifeData();
  
  hideAddCategoryModal();
  showTemporaryMessage(`✨ Created category: ${name}`, 'success');
}

// Create custom category DOM element
function createCustomCategoryElement(category) {
  const categoriesContainer = document.querySelector('.dream-categories');
  const addCategoryCard = document.querySelector('.add-category-card');
  
  const categoryElement = document.createElement('div');
  categoryElement.className = 'dream-category';
  categoryElement.dataset.category = category.id;
  categoryElement.dataset.custom = 'true';
  
  categoryElement.innerHTML = `
    <div class="category-header" onclick="toggleCategory('${category.id}')">
      <div class="category-title-row">
        <span class="category-icon">${category.icon}</span>
        <h3>${category.name}</h3>
        <span class="expand-icon">▼</span>
      </div>
      <div class="custom-category-controls">
        <button class="control-btn edit" onclick="editCustomCategory('${category.id}')" title="Edit">✏️</button>
        <button class="control-btn delete" onclick="deleteCustomCategory('${category.id}')" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="category-content" style="display: none;">
      <div class="vision-section">
        <label for="${category.id}Vision">Describe your vision for ${category.name}...</label>
        <textarea id="${category.id}Vision" placeholder="${category.placeholder}"></textarea>
        <div class="vision-controls">
          <button class="btn-save" onclick="saveVision('${category.id}')">Save & Review</button>
          <span class="save-status" id="${category.id}Status">No changes</span>
        </div>
        <div class="vision-display-mode" id="${category.id}VisionDisplay" style="display: none;">
          <div class="vision-text-display" id="${category.id}VisionTextDisplay"></div>
          <div class="vision-controls-display">
            <span class="saved-indicator" style="display: none; opacity: 0;">✓ Saved</span>
            <button class="btn-edit" onclick="enterEditMode('${category.id}')">Edit</button>
          </div>
        </div>
      </div>
      <div class="action-items-section">
        <h4>Action Steps</h4>
        <div class="add-action-item">
          <textarea class="action-input-textarea" id="${category.id}ActionInput" placeholder="Add a new action step..." rows="1"></textarea>
          <button type="button" onclick="addActionItem('${category.id}')" class="btn-primary">Add Action Step</button>
        </div>
        <div id="${category.id}ActionList" class="action-items-list">
          <div class="empty-state">No action steps yet. Add your first step above! ✨</div>
        </div>
        
        <!-- Progress indicator moved here -->
        <div class="category-progress">
          <span class="progress-text">0 of 0 completed</span>
        </div>
      </div>
    </div>
  `;
  
  // Insert before the add category card
  categoriesContainer.insertBefore(categoryElement, addCategoryCard);
  
  // Set up event listeners for the new category
  setupCustomCategoryEventListeners(category);
}

// Set up event listeners for custom category
function setupCustomCategoryEventListeners(category) {
  const textarea = document.getElementById(`${category.id}Vision`);
  const actionInput = document.getElementById(`${category.id}ActionInput`);
  
  if (textarea) {
    textarea.addEventListener('input', () => {
      markAsUnsaved(category.id);
    });
  }
  
  if (actionInput) {
    actionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addActionItem(category.id);
      }
    });
    
    actionInput.addEventListener('input', () => {
      expandTextarea(actionInput);
    });
  }
}

// Edit custom category
function editCustomCategory(categoryId) {
  const category = customCategories.find(c => c.id === categoryId);
  if (!category) return;
  
  // Pre-fill modal with existing data
  document.getElementById('categoryName').value = category.name;
  document.getElementById('categoryIcon').value = category.icon;
  document.getElementById('categoryPlaceholder').value = category.placeholder;
  
  showAddCategoryModal();
  
  // Change the create button to update
  const createBtn = document.querySelector('.modal-footer .btn-primary');
  createBtn.textContent = 'Update Category';
  createBtn.onclick = () => updateCustomCategory(categoryId);
}

// Update custom category
function updateCustomCategory(categoryId) {
  const name = document.getElementById('categoryName').value.trim();
  const icon = document.getElementById('categoryIcon').value.trim() || '📝';
  const placeholder = document.getElementById('categoryPlaceholder').value.trim() || 
    'Describe your vision for this area of your life...';
  
  if (!name) {
    alert('Please enter a category name');
    return;
  }
  
  const categoryIndex = customCategories.findIndex(c => c.id === categoryId);
  if (categoryIndex === -1) return;
  
  customCategories[categoryIndex] = {
    ...customCategories[categoryIndex],
    name,
    icon,
    placeholder
  };
  
  // Update the DOM element
  const categoryElement = document.querySelector(`[data-category="${categoryId}"]`);
  if (categoryElement) {
    categoryElement.querySelector('.category-icon').textContent = icon;
    categoryElement.querySelector('h3').textContent = name;
    categoryElement.querySelector('label').textContent = `Describe your vision for ${name}...`;
    categoryElement.querySelector('textarea').placeholder = placeholder;
  }
  
  hideAddCategoryModal();
  showTemporaryMessage(`✨ Updated category: ${name}`, 'success');
  
  // Save to localStorage
  saveDreamLifeData();
  
  // Reset button
  const createBtn = document.querySelector('.modal-footer .btn-primary');
  createBtn.textContent = 'Create Category';
  createBtn.onclick = createCustomCategory;
}

// Delete custom category
function deleteCustomCategory(categoryId) {
  const category = customCategories.find(c => c.id === categoryId);
  if (!category) return;
  
  if (!confirm(`Are you sure you want to delete "${category.name}"? This will remove all vision text and action items.`)) {
    return;
  }
  
  // Remove from arrays
  customCategories = customCategories.filter(c => c.id !== categoryId);
  delete dreamLifeData[categoryId];
  
  // Remove from DOM
  const categoryElement = document.querySelector(`[data-category="${categoryId}"]`);
  if (categoryElement) {
    categoryElement.remove();
  }
  
  // Save to localStorage
  saveDreamLifeData();
  
  showTemporaryMessage(`🗑️ Deleted category: ${category.name}`, 'success');
}

// Load custom categories on initialization
function loadCustomCategories() {
  customCategories.forEach(category => {
    createCustomCategoryElement(category);
  });
}



// Event listeners for modals
document.addEventListener('click', function(e) {
  const addCategoryModal = document.getElementById('addCategoryModal');
  
  if (e.target === addCategoryModal) {
    hideAddCategoryModal();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const addCategoryModal = document.getElementById('addCategoryModal');
    
    if (addCategoryModal && addCategoryModal.style.display === 'flex') {
      hideAddCategoryModal();
    }
  }
});

// ----------------------------
// Home Page State Management
// ----------------------------

// Initialize home page state
function initializeHomePage() {
  console.log("Initializing home page state...");
  
  // Check if user has existing data to determine which state to show
  const hasExistingData = checkIfUserHasExistingData();
  
  if (hasExistingData) {
    showActiveStateHome();
  } else {
    showBlankStateHome();
  }
  
  // Set up bottom message rotation for active state
  setupBottomMessageRotation();
}

// Check if user has existing data
function checkIfUserHasExistingData() {
  // Get current user ID (handles both authenticated and guest users)
  const userId = getCurrentUserId();
  
  // Check for user-specific data
  // Check for anchors data
  const anchorsData = localStorage.getItem(`anchors_data_${userId}`);
  const hasAnchors = anchorsData && JSON.parse(anchorsData).length > 0;
  
  // Check for habits data
  const habitsData = localStorage.getItem(`habits_${userId}`);
  const hasHabits = habitsData && JSON.parse(habitsData).length > 0;
  
  // Check for dream life data
  const dreamData = localStorage.getItem(`dreamLifeData_${userId}`);
  const hasDreams = dreamData && Object.keys(JSON.parse(dreamData)).length > 0;
  
  return hasAnchors || hasHabits || hasDreams;
}

// Show blank state home (new users)
function showBlankStateHome() {
  const blankState = document.getElementById('blankStateHome');
  const activeState = document.getElementById('activeStateHome');
  
  if (blankState && activeState) {
    blankState.style.display = 'block';
    activeState.style.display = 'none';
  }
}

// Show active state home (returning users)
function showActiveStateHome() {
  const blankState = document.getElementById('blankStateHome');
  const activeState = document.getElementById('activeStateHome');
  
  if (blankState && activeState) {
    blankState.style.display = 'none';
    activeState.style.display = 'block';
    
    // Update progress summaries
    updateHomeProgressSummaries();
  }
}

// Update progress summaries on home page
function updateHomeProgressSummaries() {
  // Update anchors progress
  updateAnchorsProgressSummary();
  
  // Update habits progress
  updateHabitsProgressSummary();
  
  // Update dreams progress
  updateDreamsProgressSummary();
}

// Update anchors progress summary
function updateAnchorsProgressSummary() {
  const summaryElement = document.getElementById('anchorsProgressSummary');
  if (!summaryElement) return;
  
  try {
    const userId = getCurrentUserId();
    const anchorsData = localStorage.getItem(`anchors_data_${userId}`);
    if (anchorsData) {
      const anchors = JSON.parse(anchorsData);
      const totalAnchors = anchors.length;
      const completedToday = anchors.filter(anchor => 
        anchor.completedDates && 
        anchor.completedDates.includes(new Date().toDateString())
      ).length;
      
      const summaryText = summaryElement.querySelector('.summary-text');
      if (summaryText) {
        summaryText.textContent = `${totalAnchors} gentle actions ready • Used ${completedToday} anchor today 🌱`;
      }
      
      // Update progress dots
      const progressDots = summaryElement.querySelectorAll('.dot');
      if (progressDots.length > 0) {
        const progressPercentage = totalAnchors > 0 ? (completedToday / totalAnchors) * 100 : 0;
        const activeDots = Math.ceil((progressDots.length * progressPercentage) / 100);
        
        progressDots.forEach((dot, index) => {
          if (index < activeDots) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
    }
  } catch (e) {
    console.error("Error updating anchors progress summary:", e);
  }
}

// Update habits progress summary
function updateHabitsProgressSummary() {
  const summaryElement = document.getElementById('habitsProgressSummary');
  if (!summaryElement) return;
  
  try {
    const userId = getCurrentUserId();
    const habitsData = localStorage.getItem(`habits_${userId}`);
    if (habitsData) {
      const habits = JSON.parse(habitsData);
      const totalHabits = habits.length;
      
      // Calculate longest streak
      let longestStreak = 0;
      habits.forEach(habit => {
        if (habit.streak > longestStreak) {
          longestStreak = habit.streak;
        }
      });
      
      const summaryText = summaryElement.querySelector('.summary-text');
      if (summaryText) {
        summaryText.textContent = `${totalHabits} habits growing • 🔥 ${longestStreak}-day momentum`;
      }
      
      // Update weekly progress
      updateWeeklyProgress(summaryElement);
    }
  } catch (e) {
    console.error("Error updating habits progress summary:", e);
  }
}

// Update weekly progress for habits
function updateWeeklyProgress(summaryElement) {
  const weeklyProgress = summaryElement.querySelector('.weekly-progress');
  if (!weeklyProgress) return;
  
  try {
    const userId = getCurrentUserId();
    const habitsData = localStorage.getItem(`habits_${userId}`);
    if (habitsData) {
      const habits = JSON.parse(habitsData);
      const weekDays = weeklyProgress.querySelectorAll('.week-day');
      
      // Get current week's progress
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      weekDays.forEach((day, index) => {
        const checkDate = new Date(startOfWeek);
        checkDate.setDate(startOfWeek.getDate() + index);
        const dateString = checkDate.toDateString();
        
        // Check if any habits were completed on this day
        const hasCompletions = habits.some(habit => 
          habit.completedDates && 
          habit.completedDates.includes(dateString)
        );
        
        if (hasCompletions) {
          day.classList.add('active');
        } else {
          day.classList.remove('active');
        }
      });
    }
  } catch (e) {
    console.error("Error updating weekly progress:", e);
  }
}

// Update dreams progress summary
function updateDreamsProgressSummary() {
  const summaryElement = document.getElementById('dreamProgressSummary');
  if (!summaryElement) return;
  
  try {
    const userId = getCurrentUserId();
    const dreamData = localStorage.getItem(`dreamLifeData_${userId}`);
    if (dreamData) {
      const dreams = JSON.parse(dreamData);
      const totalCategories = Object.keys(dreams).length;
      
      // Count action items in progress
      let totalActionItems = 0;
      let completedActionItems = 0;
      
      Object.values(dreams).forEach(category => {
        if (category.actionItems) {
          totalActionItems += category.actionItems.length;
          completedActionItems += category.actionItems.filter(item => item.completed).length;
        }
      });
      
      const summaryText = summaryElement.querySelector('.summary-text');
      if (summaryText) {
        if (totalCategories > 0) {
          summaryText.textContent = `Dream vision written • ${totalActionItems - completedActionItems} steps in progress ✨`;
        } else {
          summaryText.textContent = `Ready to dream big • Start envisioning your future ✨`;
        }
      }
    }
  } catch (e) {
    console.error("Error updating dreams progress summary:", e);
  }
}

// Set up bottom message rotation
function setupBottomMessageRotation() {
  const bottomMessage = document.getElementById('bottomMessage');
  if (!bottomMessage) return;
  
  const messages = [
    "Every small step is moving you forward.",
    "Healing and growth aren't linear — and that's okay.",
    "You're exactly where you need to be right now.",
    "Progress looks different for everyone."
  ];
  
  let currentIndex = 0;
  
  // Rotate message every 8 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % messages.length;
    const messageElement = bottomMessage.querySelector('p');
    if (messageElement) {
      messageElement.textContent = messages[currentIndex];
    }
  }, 8000);
}

// Navigation function for home page buttons
function navigateToPage(pageId) {
  // Remove active class from all navigation links and page sections
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
  
  // Add active class to the target navigation link
  const activeNavLink = document.querySelector(`[data-page="${pageId}"]`);
  if (activeNavLink) {
    activeNavLink.classList.add('active');
  }
  
  // Show target page with active class
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // Ensure main content is visible
    const mainContent = document.getElementById('mainContent');
    if (mainContent && mainContent.style.display !== 'block') {
      mainContent.style.display = 'block';
      setTimeout(() => { mainContent.style.opacity = '1'; }, 50);
    }
    
    // Initialize page-specific functionality
    if (pageId === 'home') {
      updateDynamicGreeting();
      updateAchievementCard();
      initializeCoreDashboard();
      try {
        initializeCarousels();
      } catch (e) {
        console.error("Error initializing carousels:", e);
      }
    } else if (pageId === 'daily-anchors') {
      loadProgress();
    } else if (pageId === 'habits') {
      try {
        if (typeof renderHabits === 'function') {
          renderHabits();
          updateHabitsProgress();
        }
      } catch (e) {
        console.error("Error loading habits page:", e);
      }
    } else if (pageId === 'dream-life') {
      if (typeof renderDreamLifeData === 'function') {
        renderDreamLifeData();
      }
    }
  }
}

// ========================================
// UNIFIED DATA PERSISTENCE SYSTEM
// ========================================

// Data sync status tracking
const dataSyncStatus = {
  habits: { lastSync: null, pendingChanges: false, lastError: null },
  anchors: { lastSync: null, pendingChanges: false, lastError: null },
  dreams: { lastSync: null, pendingChanges: false, lastError: null }
};

// Save data to both localStorage and Firebase with retry logic
async function saveDataWithSync(dataType, data, options = {}) {
  const { retryCount = 3, retryDelay = 1000 } = options;
  
  try {
    // 1. Save to localStorage immediately (for instant access)
    const userId = getCurrentUserId();
    const localStorageKey = `${dataType}_${userId}`;
    localStorage.setItem(localStorageKey, JSON.stringify(data));
    
    // 2. Try to save to Firebase
    const firebaseSuccess = await saveToFirebaseWithRetry(dataType, data, retryCount, retryDelay);
    
    if (firebaseSuccess) {
      // Update sync status
      dataSyncStatus[dataType].lastSync = new Date();
      dataSyncStatus[dataType].pendingChanges = false;
      dataSyncStatus[dataType].lastError = null;
      console.log(`${dataType} data synced successfully to Firebase`);
    } else {
      // Mark as pending changes for later sync
      dataSyncStatus[dataType].pendingChanges = true;
      dataSyncStatus[dataType].lastError = 'Firebase sync failed';
      console.warn(`${dataType} data saved locally but Firebase sync failed`);
    }
    
    return true; // Always return true since localStorage save succeeded
    
  } catch (error) {
    console.error(`Error saving ${dataType} data:`, error);
    dataSyncStatus[dataType].lastError = error.message;
    return false;
  }
}

// Save to Firebase with retry logic
async function saveToFirebaseWithRetry(dataType, data, maxRetries = 3, delay = 1000) {
  const userId = getCurrentUserId();
  
  if (!userId || !firebase.auth().currentUser) {
    console.log(`No authenticated user, skipping Firebase save for ${dataType}`);
    return false;
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const docRef = await db.collection('userData').doc(userId).collection(dataType).doc('current').set({
        data: data,
        lastUpdated: new Date(),
        version: Date.now()
      });
      
      console.log(`${dataType} data saved to Firebase on attempt ${attempt}`);
      return true;
      
    } catch (error) {
      console.error(`Firebase save attempt ${attempt} failed for ${dataType}:`, error);
      
      if (attempt === maxRetries) {
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  return false;
}

// Load data from Firebase first, fallback to localStorage
async function loadDataWithSync(dataType, defaultValue = null) {
  try {
    // 1. Try to load from Firebase first
    const firebaseData = await loadFromFirebase(dataType);
    if (firebaseData !== null) {
      // Update localStorage with Firebase data
      const userId = getCurrentUserId();
      const localStorageKey = `${dataType}_${userId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(firebaseData));
      
      // Update sync status
      dataSyncStatus[dataType].lastSync = new Date();
      dataSyncStatus[dataType].pendingChanges = false;
      
      console.log(`${dataType} data loaded from Firebase`);
      return firebaseData;
    }
    
    // 2. Fallback to localStorage
    const userId = getCurrentUserId();
    const localStorageKey = `${dataType}_${userId}`;
    const localData = localStorage.getItem(localStorageKey);
    
    if (localData) {
      const parsedData = JSON.parse(localData);
      console.log(`${dataType} data loaded from localStorage fallback`);
      return parsedData;
    }
    
    // 3. Return default value
    console.log(`${dataType} data not found, using default`);
    return defaultValue;
    
  } catch (error) {
    console.error(`Error loading ${dataType} data:`, error);
    
    // Fallback to localStorage on error
    try {
      const userId = getCurrentUserId();
      const localStorageKey = `${dataType}_${userId}`;
      const localData = localStorage.getItem(localStorageKey);
      
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (localError) {
      console.error(`LocalStorage fallback also failed for ${dataType}:`, localError);
    }
    
    return defaultValue;
  }
}

// Load specific data type from Firebase
async function loadFromFirebase(dataType) {
  const userId = getCurrentUserId();
  
  if (!userId || !firebase.auth().currentUser) {
    console.log(`No authenticated user, cannot load ${dataType} from Firebase`);
    return null;
  }
  
  try {
    const doc = await db.collection('userData').doc(userId).collection(dataType).doc('current').get();
    
    if (doc.exists) {
      const data = doc.data();
      return data.data || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading ${dataType} from Firebase:`, error);
    return null;
  }
}

// Get current user ID (handles both authenticated and guest users)
function getCurrentUserId() {
  const currentUser = firebase.auth().currentUser;
  
  if (currentUser) {
    return currentUser.uid;
  }
  
  // For guest users, create a consistent ID
  let guestId = localStorage.getItem('guestUserId');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestUserId', guestId);
  }
  
  return guestId;
}

// Sync pending changes to Firebase
async function syncPendingChanges() {
  const userId = getCurrentUserId();
  
  for (const [dataType, status] of Object.entries(dataSyncStatus)) {
    if (status.pendingChanges) {
      try {
        const localStorageKey = `${dataType}_${userId}`;
        const localData = localStorage.getItem(localStorageKey);
        
        if (localData) {
          const data = JSON.parse(localData);
          const success = await saveToFirebaseWithRetry(dataType, data, 2, 2000);
          
          if (success) {
            status.pendingChanges = false;
            status.lastSync = new Date();
            status.lastError = null;
            console.log(`Pending ${dataType} changes synced successfully`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync pending ${dataType} changes:`, error);
        status.lastError = error.message;
      }
    }
  }
}

// Enhanced signOut that syncs data before clearing
async function signOut() {
  try {
    // 1. Sync any pending changes to Firebase
    await syncPendingChanges();
    
    // 2. Sign out from Firebase Auth
    await auth.signOut();
    
    // 3. Clear local data (but keep guest data if applicable)
    const guestUserId = localStorage.getItem('guestUserId');
    
    // Clear all user-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('guest_') && key !== 'guestUserId') {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reset sync status
    Object.keys(dataSyncStatus).forEach(key => {
      dataSyncStatus[key] = { lastSync: null, pendingChanges: false, lastError: null };
    });
    
    console.log("User signed out and data synced");
    
  } catch (error) {
    console.error("Sign out error:", error);
    // Still try to sign out even if sync fails
    try {
      await auth.signOut();
    } catch (signOutError) {
      console.error("Sign out failed:", signOutError);
    }
  }
}

// ========================================
// UPDATED DATA FUNCTIONS USING NEW SYSTEM
// ========================================

// Updated saveHabits function
async function saveHabits() {
  const userId = getCurrentUserId();
  const localStorageKey = `habits_${userId}`;
  
  // Save to localStorage immediately
  localStorage.setItem(localStorageKey, JSON.stringify(habits));
  
  // Save to Firebase with sync
  await saveDataWithSync('habits', habits);
}

// Updated saveDreamLifeData function
async function saveDreamLifeData() {
  const userId = getCurrentUserId();
  const localStorageKey = `dreamLifeData_${userId}`;
  
  // Save to localStorage immediately
  localStorage.setItem(localStorageKey, JSON.stringify(dreamLifeData));
  
  // Save to Firebase with sync
  await saveDataWithSync('dreams', dreamLifeData);
}

// Updated loadHabits function
async function loadHabits() {
  const loadedHabits = await loadDataWithSync('habits', []);
  if (loadedHabits && Array.isArray(loadedHabits)) {
    habits.length = 0; // Clear existing habits
    habits.push(...loadedHabits);
    
    // Update habit ID counter
    if (habits.length > 0) {
      habitIdCounter = Math.max(...habits.map(h => h.id)) + 1;
    }
    
    renderHabits();
    updateHabitsProgress();
  }
}

// Updated loadDreamLifeData function
async function loadDreamLifeData() {
  const loadedData = await loadDataWithSync('dreams', {});
  if (loadedData && typeof loadedData === 'object') {
    Object.assign(dreamLifeData, loadedData);
    renderDreamLifeData();
  }
}

// ========================================
// INITIALIZATION AND SYNC SETUP
// ========================================

// Initialize data persistence system
async function initializeDataPersistence() {
  try {
    // Load all data types
    await Promise.all([
      loadHabits(),
      loadDreamLifeData()
    ]);
    
    // Set up periodic sync
    setInterval(syncPendingChanges, 30000); // Sync every 30 seconds
    
    // Set up beforeunload sync
    window.addEventListener('beforeunload', () => {
      syncPendingChanges();
    });
    
    console.log('Data persistence system initialized');
    
  } catch (error) {
    console.error('Error initializing data persistence:', error);
  }
}

