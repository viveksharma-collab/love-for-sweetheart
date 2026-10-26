(() => {
  "use strict";

  const screens = Array.from(document.querySelectorAll(".screen"));
  const heartField = document.getElementById("heart-field");
  const heartMessages = ["Hlo Princess 💗", "Pagluuu 🥹💕", "Bacchuu 💖"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentScreen = "hearts";
  let messageIndex = 0;
  let heartTimer = null;
  let celebrationTimer = null;
  let selectedDate = "";
  let movingNo = false;
  const heartRemovalTimers = new Map();
  const heartRevealTimers = new Map();
  const celebrationRemovalTimers = new Map();

  const screenIds = {
    hearts: "screen-hearts",
    password: "screen-password",
    invitation: "screen-invitation",
    date: "screen-date",
    confirm: "screen-confirm",
    thanks: "screen-thanks"
  };

  function goTo(name) {
    if (!screenIds[name]) return;
    if (currentScreen === "hearts") stopHeartLoop();
    if (currentScreen === "thanks") stopCelebration();
    currentScreen = name;

    screens.forEach((screen) => {
      const active = screen.id === screenIds[name];
      screen.classList.toggle("active", active);
      screen.setAttribute("aria-hidden", String(!active));
      if (active) screen.scrollTop = 0;
    });

    if (name === "hearts") startHeartLoop();
    if (name === "date") syncDateMinimum();
    if (name === "thanks") startCelebration();
  }

  function startHeartLoop() {
    if (heartTimer !== null) return;
    spawnHeart();
    heartTimer = window.setInterval(spawnHeart, reducedMotion.matches ? 1800 : 900);
  }

  function stopHeartLoop() {
    if (heartTimer !== null) {
      window.clearInterval(heartTimer);
      heartTimer = null;
    }
    heartField.querySelectorAll(".float-heart").forEach(removeHeart);
    heartRemovalTimers.forEach((timer) => window.clearTimeout(timer));
    heartRemovalTimers.clear();
  }

  function spawnHeart() {
    if (currentScreen !== "hearts") return;
    const heart = document.createElement("button");
    const size = window.innerWidth <= 700 ? 68 + Math.random() * 30 : 102 + Math.random() * 48;
    const duration = reducedMotion.matches ? 1 : 11 + Math.random() * 8;
    const message = document.createElement("span");
    heart.className = "float-heart";
    heart.type = "button";
    heart.setAttribute("aria-label", "Reveal a sweet message from this heart");
    message.className = "heart-words";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    heart.append(message);
    heart.style.setProperty("--heart-size", `${size}px`);
    heart.style.left = `${Math.random() * Math.max(0, window.innerWidth - size)}px`;
    if (reducedMotion.matches) heart.style.bottom = `${12 + Math.random() * 62}%`;
    heart.style.setProperty("--duration", `${duration}s`);
    heart.style.setProperty("--drift", `${Math.round(Math.random() * 60 - 30)}px`);
    heart.style.setProperty("--rotation", `${Math.round(Math.random() * 70 - 35)}deg`);
    heart.addEventListener("click", () => revealHeart(heart, message));
    heart.addEventListener("animationend", (event) => {
      if (event.animationName === "heart-rise") removeHeart(heart);
    });
    heartField.append(heart);

    while (heartField.children.length > 24) {
      removeHeart(heartField.firstElementChild);
    }
    if (reducedMotion.matches) {
      heartRemovalTimers.set(heart, window.setTimeout(() => removeHeart(heart), 4500));
    }
  }

  function removeHeart(heart) {
    const timer = heartRemovalTimers.get(heart);
    if (timer !== undefined) window.clearTimeout(timer);
    heartRemovalTimers.delete(heart);
    const revealTimer = heartRevealTimers.get(heart);
    if (revealTimer !== undefined) window.clearTimeout(revealTimer);
    heartRevealTimers.delete(heart);
    heart.remove();
  }

  function revealHeart(heart, messageElement) {
    messageElement.textContent = heartMessages[messageIndex];
    messageIndex = (messageIndex + 1) % heartMessages.length;
    heart.setAttribute("aria-label", messageElement.textContent);
    heart.classList.remove("is-revealing", "is-fading");
    void heart.offsetWidth;
    heart.classList.add("is-revealing");

    const existingTimer = heartRevealTimers.get(heart);
    if (existingTimer !== undefined) window.clearTimeout(existingTimer);
    heartRevealTimers.set(heart, window.setTimeout(() => {
      heart.classList.remove("is-revealing");
      heart.classList.add("is-fading");
      const fadeTimer = window.setTimeout(() => {
        messageElement.textContent = "";
        heart.setAttribute("aria-label", "Reveal a sweet message from this heart");
        heart.classList.remove("is-fading");
        heartRevealTimers.delete(heart);
      }, 850);
      heartRevealTimers.set(heart, fadeTimer);
    }, 2600));
  }

  document.getElementById("open-world").addEventListener("click", () => goTo("password"));

  const passwordForm = document.getElementById("password-form");
  const answerInput = document.getElementById("sweet-answer");
  const passwordError = document.getElementById("password-error");
  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (currentScreen !== "password") return;
    if (answerInput.value.trim().toLocaleLowerCase() === "11th") {
      passwordError.textContent = "";
      goTo("invitation");
    } else {
      passwordError.textContent = "Oops, princess! Try again 💕";
      answerInput.select();
    }
  });

  const noButton = document.getElementById("no-button");
  const buttonStage = document.getElementById("button-stage");
  const yesButton = document.getElementById("yes-button");

  function moveNoButton(clientX, clientY) {
    if (movingNo || currentScreen !== "invitation") return;
    movingNo = true;
    const stageBounds = buttonStage.getBoundingClientRect();
    const buttonBounds = noButton.getBoundingClientRect();
    const yesBounds = yesButton.getBoundingClientRect();
    const maxX = Math.max(0, stageBounds.width - buttonBounds.width);
    const maxY = Math.max(62, buttonStage.clientHeight - buttonBounds.height);
    const positions = [
      [0, maxY], [maxX, maxY], [maxX / 2, maxY],
      [0, Math.max(58, maxY - 7)], [maxX, Math.max(58, maxY - 7)]
    ];
    const valid = positions.filter(([x, y]) => {
      const overlapX = x < yesBounds.right - stageBounds.left && x + buttonBounds.width > yesBounds.left - stageBounds.left;
      const overlapY = y < yesBounds.bottom - stageBounds.top && y + buttonBounds.height > yesBounds.top - stageBounds.top;
      return !(overlapX && overlapY);
    });
    let choices = valid.length ? valid : positions;

    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      const pointerX = clientX - stageBounds.left;
      const pointerY = clientY - stageBounds.top;
      const awayChoices = choices.filter(([x, y]) =>
        Math.hypot(x + buttonBounds.width / 2 - pointerX, y + buttonBounds.height / 2 - pointerY) > 90
      );
      if (awayChoices.length) choices = awayChoices;
    }
    const [x, y] = choices[Math.floor(Math.random() * choices.length)];
    noButton.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
    noButton.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
    noButton.style.transform = "none";
    window.setTimeout(() => { movingNo = false; }, 90);
  }

  noButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") moveNoButton(event.clientX, event.clientY);
  });
  noButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    moveNoButton(event.clientX, event.clientY);
  });
  noButton.addEventListener("click", (event) => {
    event.preventDefault();
    moveNoButton();
  });
  noButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      moveNoButton();
    }
  });

  yesButton.addEventListener("click", () => {
    if (currentScreen === "invitation") goTo("date");
  });

  const dateForm = document.getElementById("date-form");
  const dateInput = document.getElementById("date-input");
  const datePreview = document.getElementById("date-preview");
  const dateError = document.getElementById("date-error");
  const dateNotice = document.getElementById("date-notice");

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function syncDateMinimum() {
    dateInput.min = localDateString();
  }

  function formatDate(value, options = { weekday: "long", month: "long", day: "numeric", year: "numeric" }) {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en", options).format(new Date(year, month - 1, day));
  }

  dateInput.addEventListener("input", () => {
    dateError.textContent = "";
    if (!dateInput.value) {
      datePreview.textContent = "Your lovely day will show up here";
      return;
    }
    datePreview.textContent = formatDate(dateInput.value);
  });

  dateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (currentScreen !== "date") return;
    syncDateMinimum();
    if (!dateInput.value) {
      dateError.textContent = "Pick a day for our little adventure first 💕";
      return;
    }
    if (dateInput.value < dateInput.min) {
      dateError.textContent = "Let's pick today or a future day, sweetheart 💗";
      return;
    }

    selectedDate = dateInput.value;
    dateError.textContent = "";
    dateNotice.textContent = "";
    document.getElementById("chosen-date").textContent = formatDate(selectedDate);
    goTo("confirm");
  });

  document.getElementById("date-is-blocked").addEventListener("click", () => {
    if (currentScreen !== "confirm") return;
    dateInput.value = "";
    datePreview.textContent = "Your lovely day will show up here";
    dateNotice.textContent = "Hehe, choose another date, bacchuu 💕";
    goTo("date");
    dateInput.focus({ preventScroll: true });
  });

  document.getElementById("date-is-free").addEventListener("click", () => {
    if (currentScreen !== "confirm") return;
    document.getElementById("final-date").textContent = `Our little date: ${formatDate(selectedDate)}`;
    goTo("thanks");
  });

  const celebrationField = document.getElementById("celebration-field");
  function startCelebration() {
    if (celebrationTimer !== null) return;
    spawnCelebrationPiece();
    celebrationTimer = window.setInterval(spawnCelebrationPiece, reducedMotion.matches ? 1200 : 650);
  }

  function stopCelebration() {
    if (celebrationTimer !== null) {
      window.clearInterval(celebrationTimer);
      celebrationTimer = null;
    }
    celebrationRemovalTimers.forEach((timer) => window.clearTimeout(timer));
    celebrationRemovalTimers.clear();
    celebrationField.replaceChildren();
  }

  function spawnCelebrationPiece() {
    if (currentScreen !== "thanks") return;
    const piece = document.createElement("span");
    piece.className = "celebration-piece";
    piece.textContent = Math.random() > .45 ? "♡" : "✦";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--size", `${14 + Math.random() * 19}px`);
    piece.style.setProperty("--duration", `${reducedMotion.matches ? 1 : 8 + Math.random() * 6}s`);
    piece.addEventListener("animationend", () => removeCelebrationPiece(piece));
    celebrationField.append(piece);
    while (celebrationField.children.length > 24) {
      removeCelebrationPiece(celebrationField.firstElementChild);
    }
    if (reducedMotion.matches) {
      celebrationRemovalTimers.set(piece, window.setTimeout(() => removeCelebrationPiece(piece), 1300));
    }
  }

  function removeCelebrationPiece(piece) {
    const timer = celebrationRemovalTimers.get(piece);
    if (timer !== undefined) window.clearTimeout(timer);
    celebrationRemovalTimers.delete(piece);
    piece.remove();
  }

  document.getElementById("restart-button").addEventListener("click", () => {
    messageIndex = 0;
    selectedDate = "";
    answerInput.value = "";
    dateInput.value = "";
    datePreview.textContent = "Your lovely day will show up here";
    passwordError.textContent = "";
    dateError.textContent = "";
    dateNotice.textContent = "";
    noButton.style.left = "50%";
    noButton.style.top = "78px";
    noButton.style.transform = "translateX(-50%)";
    goTo("hearts");
  });

  startHeartLoop();
})();
