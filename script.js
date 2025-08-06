// ----------------------------
// Handle Anchor Checklist + Save
// ----------------------------
const checkboxes = document.querySelectorAll("input[type=checkbox]");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");
const streakIcons = document.getElementById("streakIcons");
const streakMessage = document.getElementById("streakMessage");

// Load saved state
window.addEventListener("load", () => {
  checkboxes.forEach(cb => {
    cb.checked = localStorage.getItem(cb.id) === "true";
  });
  updateStreakDisplay();
});

// Save progress
saveBtn.addEventListener("click", () => {
  checkboxes.forEach(cb => localStorage.setItem(cb.id, cb.checked));
  triggerConfetti();
  message.style.display = "block";

  // Update streak
  let streak = parseInt(localStorage.getItem("streak") || "0", 10);
  let completed = Array.from(checkboxes).filter(cb => cb.checked).length;
  if (completed > 0) {
    streak++;
  } else {
    streak = 0;
  }
  localStorage.setItem("streak", streak);
  updateStreakDisplay();

  setTimeout(() => (message.style.display = "none"), 3000);
});

// Reset for new day
resetBtn.addEventListener("click", () => {
  checkboxes.forEach(cb => {
    cb.checked = false;
    localStorage.setItem(cb.id, "false");
  });
  message.style.display = "none";
});

// Confetti animation
function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
  });
}

// Streak display
function updateStreakDisplay() {
  const streak = parseInt(localStorage.getItem("streak") || "0", 10);
  streakIcons.innerHTML = "⭐".repeat(streak);
  streakMessage.textContent = `Current streak: ${streak} day${streak !== 1 ? "s" : ""}!`;
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

