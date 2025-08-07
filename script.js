// 🌱 Self-Care Tracker Script

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
  // Save Progress
  // ----------------------------
  function saveProgress() {
    // Save checkboxes and dropdown
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
  }
  
  // ----------------------------
  // Load Progress
  // ----------------------------
  function loadProgress() {
    checkDailyReset(); // Auto-reset if a new day
    anchors.forEach(id => {
      document.getElementById(id).checked = localStorage.getItem(id) === "true";
    });
    document.getElementById("selfCareOption").value = localStorage.getItem("selfCareOption") || "";
  }
  const savedShow = localStorage.getItem("watchedShowName");
if (savedShow) {
  document.getElementById("watchShowInput").value = savedShow;
  document.getElementById("watchShowInput").style.display = "inline-block";
  document.getElementById("watchShow").checked = true;
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
  // When the checkbox is checked, show the input next to it
document.getElementById("watchShow").addEventListener("change", function () {
  const input = document.getElementById("watchShowInput");
  if (this.checked) {
    input.style.display = "inline-block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
    localStorage.removeItem("watchedShowName");
  }
});

// Save the text whenever the user types it
document.getElementById("watchShowInput").addEventListener("input", function () {
  localStorage.setItem("watchedShowName", this.value);
});
