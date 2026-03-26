const animals = [
  { name: "brachiosaurus", label: "Brachiosaurus", image: "dinilab memmorie/Brachioaurus.png" },
  { name: "stegosaurus", label: "Stegosaurus", image: "dinilab memmorie/stegosaurus.png" },
  { name: "triceratops", label: "Triceratops", image: "dinilab memmorie/triceratops.png" },
  { name: "velociraptor", label: "Veloceraptor", image: "dinilab memmorie/Veloceraptor.png" },
  { name: "pterodactyl", label: "Pterodactyl", image: "dinilab memmorie/pterodactyl.png" },
  { name: "ankylosaurus", label: "Ankylosaurus", image: "dinilab memmorie/ankylosaurus.png" },
  { name: "parasaurolophus", label: "Parasaurolophus", image: "dinilab memmorie/parasaurolophus.png" },
  { name: "diplodocus", label: "Diplodocus", image: "dinilab memmorie/diplodocus.png" }
];

const totalPairs = animals.length;
const grid = document.getElementById("card-grid");
const movesEl = document.getElementById("moves");
const pairsEl = document.getElementById("pairs");
const timerEl = document.getElementById("timer");
const newGameBtn = document.getElementById("new-game");
const modeToggleBtn = document.getElementById("mode-toggle");
const themeToggleBtn = document.getElementById("theme-toggle");
const duoToggleBtn = document.getElementById("duo-toggle");
let playerBoard = null;
let playerColumns = [];
let playerLabelEls = [];
let playerScoreEls = [];
const bodyEl = document.body;
const movesLeftContainer = document.getElementById("hardcore-moves");
const movesLeftEl = document.getElementById("moves-left");
const statusEl = document.getElementById("status-message");
const duoModal = document.getElementById("duo-modal");
const duoForm = document.getElementById("duo-form");
const duoPlayerOneInput = document.getElementById("duo-player-one");
const duoPlayerTwoInput = document.getElementById("duo-player-two");
const duoCancelBtn = document.getElementById("duo-modal-cancel");
const duoSwapBtn = document.getElementById("duo-swap");
const HARDCORE_MOVE_LIMIT = 16;
const SOUND_EFFECT_PATHS = {
  flip: "kill.mp3",
  victory: "victory-royale.mp3"
};
const audioContext = createAudioContext();
const soundEffectBuffers = {};
const fallbackSoundElements = {};
const backgroundAudio = document.getElementById("background-audio");
const musicSelect = document.getElementById("music-select");
const musicToggleBtn = document.getElementById("music-toggle");
const MUSIC_FOLDER = "hitergrund musik";
const musicTracks = [
  { label: "01 Wii Menu", file: "01 Wii Menu.mp3" },
  { label: "02 Title Screen", file: "02 Title Screen.mp3" },
  { label: "03 Calm 3", file: "03. Calm 3.mp3" },
  { label: "07 Boo", file: "07. Boo.mp3" },
  { label: "09 Wii Shop Channel", file: "09 Wii Shop Channel.mp3" }
];
const highscoreListEl = document.getElementById("highscore-list");
const HIGHSCORE_STORAGE_KEY = "dino-memory-highscores";
const HIGHSCORE_LIMIT = 5;
let highscores = loadHighscores();
const completionHighlight = document.getElementById("completion-highlight");
const completionHighlightText = document.getElementById("completion-highlight-text");
const completionHighlightTag = document.getElementById("completion-highlight-tag");
const completionHighlightClose = document.getElementById("completion-highlight-close");
let completionHighlightHideTimer = null;

let hardcoreMode = false;
let lightMode = false;
let twoPlayerMode = false;
let currentPlayer = 0;
let playerNames = ["Spieler 1", "Spieler 2"];
let playerScores = [0, 0];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let timerInterval = null;
let secondsElapsed = 0;

newGameBtn.addEventListener("click", () => {
  resetGame();
});

modeToggleBtn.addEventListener("click", () => {
  hardcoreMode = !hardcoreMode;
  modeToggleBtn.textContent = hardcoreMode ? "Hardcore an" : "Hardcore aus";
  modeToggleBtn.setAttribute("aria-pressed", String(hardcoreMode));
  if (movesLeftContainer) {
    movesLeftContainer.hidden = !hardcoreMode;
  }
  resetGame();
});

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    lightMode = !lightMode;
    applyTheme();
  });
}

if (duoToggleBtn) {
  duoToggleBtn.addEventListener("click", () => {
    if (twoPlayerMode) {
      disableTwoPlayerMode();
    } else {
      openDuoModal();
    }
  });
}

if (duoForm) {
  duoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const playerOneName = (duoPlayerOneInput?.value || "Spieler 1").trim() || "Spieler 1";
    const playerTwoName = (duoPlayerTwoInput?.value || "Spieler 2").trim() || "Spieler 2";
    playerNames = [playerOneName, playerTwoName];
    closeDuoModal();
    enableTwoPlayerMode();
  });
}

if (duoCancelBtn) {
  duoCancelBtn.addEventListener("click", () => {
    closeDuoModal();
  });
}

if (duoSwapBtn) {
  duoSwapBtn.addEventListener("click", manualPlayerSwap);
}

initGame();
applyTheme();
updateDuoToggle();
updateSwapButtonVisibility();
setupMusicControls();
registerAudioUnlock();
initSoundEffects();
renderHighscores();

if (completionHighlightClose) {
  completionHighlightClose.addEventListener("click", () => {
    hideCompletionHighlight();
    resetGame();
  });
}

if (completionHighlight) {
  completionHighlight.addEventListener("click", (event) => {
    if (event.target === completionHighlight) {
      hideCompletionHighlight();
    }
  });
}

function applyTheme() {
  if (bodyEl) {
    bodyEl.classList.toggle("light-theme", lightMode);
  }
  if (themeToggleBtn) {
    themeToggleBtn.textContent = lightMode ? "Darkmodus" : "Lightmodus";
    themeToggleBtn.setAttribute("aria-pressed", String(lightMode));
  }
}

function initGame() {
  grid.innerHTML = "";
  const deck = shuffle([...animals, ...animals]);
  deck.forEach((animal) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.animal = animal.name;
    card.innerHTML = `
      <div class="card-inner">
        <span class="card-face card-back"></span>
        <span class="card-face card-front">
          <span class="front-label">${animal.label}</span>
          <span class="image-wrapper">
            <img src="${animal.image}" alt="${animal.label}" loading="lazy" />
          </span>
        </span>
      </div>
    `;
    card.addEventListener("click", handleCardClick);
    grid.appendChild(card);
  });
  moves = 0;
  matches = 0;
  secondsElapsed = 0;
  updateStats();
  timerEl.textContent = formatTime(0);
  stopTimer();
  if (statusEl && !twoPlayerMode) {
    statusEl.textContent = "";
  }
  if (movesLeftContainer) {
    movesLeftContainer.hidden = !hardcoreMode;
  }
}

function handleCardClick(event) {
  const card = event.currentTarget;
  if (lockBoard || card === firstCard || card.classList.contains("is-matched")) {
    return;
  }

  if (!timerInterval) {
    startTimer();
  }

  card.classList.add("is-flipped");
  playFlipSound();

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves += 1;
  updateStats();

  if (firstCard.dataset.animal === secondCard.dataset.animal) {
    markMatch();
  } else {
    unflipCards();
  }
}

function markMatch() {
  matches += 1;
  firstCard.classList.add("is-matched");
  secondCard.classList.add("is-matched");
  if (twoPlayerMode) {
    playerScores[currentPlayer] += 1;
    updatePlayerScores();
  }
  updateStats();
  resetSelection();
  if (matches === totalPairs) {
    stopTimer();
    announceWinner();
  } else if (twoPlayerMode) {
    updateTurnStatus();
  }
  checkHardcoreLimit();
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove("is-flipped");
    secondCard.classList.remove("is-flipped");
    resetSelection();
    switchPlayer();
    checkHardcoreLimit();
  }, 900);
}

function switchPlayer(manualSwap = false) {
  if (!twoPlayerMode) {
    return;
  }
  currentPlayer = (currentPlayer + 1) % 2;
  highlightCurrentPlayer();
  updateTurnStatus(manualSwap);
}

function manualPlayerSwap() {
  if (!twoPlayerMode || matches === totalPairs) {
    return;
  }
  if (lockBoard) {
    if (statusEl) {
      statusEl.textContent = "Warte kurz, bis die Karten wieder frei sind, dann kannst du tauschen.";
    }
    return;
  }
  switchPlayer(true);
}

function resetSelection() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function updateStats() {
  movesEl.textContent = moves.toString();
  pairsEl.textContent = `${matches}/${totalPairs}`;
  updateMovesLeft();
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed += 1;
    timerEl.textContent = formatTime(secondsElapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateMovesLeft() {
  if (!movesLeftEl) {
    return;
  }
  const remaining = hardcoreMode ? Math.max(HARDCORE_MOVE_LIMIT - moves, 0) : HARDCORE_MOVE_LIMIT;
  movesLeftEl.textContent = remaining.toString();
}

function checkHardcoreLimit() {
  if (!hardcoreMode || matches === totalPairs) {
    return;
  }
  if (moves >= HARDCORE_MOVE_LIMIT) {
    if (statusEl) {
      statusEl.textContent =
        "Hardcore-Modus: Du hast keine Züge mehr. Starte ein neues Spiel oder schalte den Modus aus.";
    }
    lockBoard = true;
    stopTimer();
    showCompletionHighlight(
      "Hardcore-Modus: Du hast keine Züge mehr. Starte ein neues Spiel oder schalte den Modus aus.",
      { tag: "Hardcore gescheitert" }
    );
  }
}

function resetGame() {
  hideCompletionHighlight();
  lockBoard = false;
  resetSelection();
  currentPlayer = 0;
  if (twoPlayerMode) {
    playerScores = [0, 0];
    updatePlayerScores();
  }
  updatePlayerBoardVisibility();
  highlightCurrentPlayer();
  initGame();
  if (twoPlayerMode) {
    updateTurnStatus();
  }
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ensurePlayerBoard() {
  if (playerBoard) {
    return;
  }
  const scoreboardSection = document.querySelector(".scoreboard");
  if (!scoreboardSection) {
    return;
  }
  const board = document.createElement("section");
  board.className = "player-board";
  board.id = "player-board";
  board.setAttribute("aria-live", "polite");
  board.hidden = true;
  board.innerHTML = `
    <div class="player-column">
      <span class="player-label"></span>
      <strong class="player-score">0</strong>
      <small>Punkte</small>
    </div>
    <div class="player-column">
      <span class="player-label"></span>
      <strong class="player-score">0</strong>
      <small>Punkte</small>
    </div>
  `;
  scoreboardSection.insertAdjacentElement("afterend", board);
  playerBoard = board;
  playerColumns = Array.from(board.querySelectorAll(".player-column"));
  playerLabelEls = Array.from(board.querySelectorAll(".player-label"));
  playerScoreEls = Array.from(board.querySelectorAll(".player-score"));
}

function openDuoModal() {
  if (!duoModal) {
    return;
  }
  duoPlayerOneInput.value = playerNames[0];
  duoPlayerTwoInput.value = playerNames[1];
  duoModal.hidden = false;
  bodyEl.classList.add("modal-open");
  duoPlayerOneInput.focus();
}

function closeDuoModal() {
  if (!duoModal) {
    return;
  }
  duoModal.hidden = true;
  bodyEl.classList.remove("modal-open");
}

function enableTwoPlayerMode() {
  ensurePlayerBoard();
  twoPlayerMode = true;
  updateDuoToggle();
  updateSwapButtonVisibility();
  updatePlayerLabels();
  resetGame();
  updateTurnStatus();
}

function disableTwoPlayerMode() {
  twoPlayerMode = false;
  updateSwapButtonVisibility();
  updateDuoToggle();
  resetGame();
  if (playerBoard) {
    playerBoard.remove();
    playerBoard = null;
    playerColumns = [];
    playerLabelEls = [];
    playerScoreEls = [];
  }
  if (statusEl) {
    statusEl.textContent = "";
  }
}

function updateDuoToggle() {
  if (!duoToggleBtn) {
    return;
  }
  duoToggleBtn.textContent = twoPlayerMode ? "2-Spieler an" : "2-Spieler aus";
  duoToggleBtn.setAttribute("aria-pressed", String(twoPlayerMode));
}

function updatePlayerBoardVisibility() {
  if (!playerBoard) {
    return;
  }
  playerBoard.hidden = !twoPlayerMode;
}

function updateSwapButtonVisibility() {
  if (!duoSwapBtn) {
    return;
  }
  duoSwapBtn.hidden = !twoPlayerMode;
}

function setupMusicControls() {
  if (musicSelect) {
    populateMusicSelect();
    musicSelect.addEventListener("change", handleMusicSelection);
  }
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", handleMusicToggle);
  }
}

function populateMusicSelect() {
  if (!musicSelect) {
    return;
  }
  musicSelect.innerHTML = "";
  musicTracks.forEach((track) => {
    const option = document.createElement("option");
    option.value = getTrackPath(track);
    option.textContent = track.label;
    musicSelect.appendChild(option);
  });
  if (musicTracks.length) {
    musicSelect.value = getTrackPath(musicTracks[0]);
    setMusicTrack(musicSelect.value);
  }
}

function getTrackPath(track) {
  return `${MUSIC_FOLDER}/${track.file}`;
}

function handleMusicSelection(event) {
  const nextPath = event.target.value;
  setMusicTrack(nextPath, { keepPlaying: true });
}

function handleMusicToggle() {
  if (!backgroundAudio) {
    return;
  }
  if (!backgroundAudio.src && musicSelect?.value) {
    setMusicTrack(musicSelect.value);
  }
  if (backgroundAudio.paused) {
    backgroundAudio
      .play()
      .then(() => updateMusicToggleButton(true))
      .catch(() => updateMusicToggleButton(false));
  } else {
    backgroundAudio.pause();
    updateMusicToggleButton(false);
  }
}

function setMusicTrack(path, { keepPlaying = false } = {}) {
  if (!backgroundAudio || !path) {
    return;
  }
  const wasPlaying = keepPlaying && !backgroundAudio.paused && !backgroundAudio.ended;
  backgroundAudio.src = encodeURI(path);
  backgroundAudio.load();
  if (wasPlaying) {
    backgroundAudio
      .play()
      .then(() => updateMusicToggleButton(true))
      .catch(() => updateMusicToggleButton(false));
  } else {
    updateMusicToggleButton(false);
  }
}

function updateMusicToggleButton(isPlaying) {
  if (!musicToggleBtn) {
    return;
  }
  musicToggleBtn.textContent = isPlaying ? "Pause" : "Wiedergabe";
  musicToggleBtn.setAttribute("aria-pressed", String(isPlaying));
}

function updatePlayerLabels() {
  playerLabelEls.forEach((label, index) => {
    label.textContent = playerNames[index] || `Spieler ${index + 1}`;
  });
}

function updatePlayerScores() {
  playerScoreEls.forEach((scoreEl, index) => {
    scoreEl.textContent = playerScores[index].toString();
  });
}

function highlightCurrentPlayer() {
  if (!playerColumns.length) {
    return;
  }
  playerColumns.forEach((column, index) => {
    column.classList.toggle("is-active", twoPlayerMode && currentPlayer === index);
  });
}

function updateTurnStatus() {
  if (!twoPlayerMode || matches === totalPairs || !statusEl) {
    return;
  }
  statusEl.textContent = `${playerNames[currentPlayer]} ist dran.`;
}

function announceWinner() {
  if (!statusEl) {
    return;
  }
  let message = "";
  let highlightTag = "Spiel geschafft";
  if (!twoPlayerMode) {
    message = "Du hast alle Paare gefunden!";
    tryRecordHighscore();
  } else {
    const [firstScore, secondScore] = playerScores;
    if (firstScore > secondScore) {
      message = `${playerNames[0]} gewinnt mit ${firstScore} Paaren!`;
      highlightTag = "Duell beendet";
    } else if (secondScore > firstScore) {
      message = `${playerNames[1]} gewinnt mit ${secondScore} Paaren!`;
      highlightTag = "Duell beendet";
    } else {
      message = `Unentschieden: Beide Spieler haben ${firstScore} Paare gefunden.`;
      highlightTag = "Unentschieden";
    }
  }
  statusEl.textContent = message;
  showCompletionHighlight(message, { tag: highlightTag });
  if (playerColumns.length) {
    playerColumns.forEach((column) => column.classList.remove("is-active"));
  }
  playVictorySound();
}

function showCompletionHighlight(message, { tag = "Spiel geschafft" } = {}) {
  if (!completionHighlight || !completionHighlightText) {
    return;
  }
  if (completionHighlightHideTimer) {
    clearTimeout(completionHighlightHideTimer);
    completionHighlightHideTimer = null;
  }
  if (completionHighlightTag) {
    completionHighlightTag.textContent = tag;
  }
  completionHighlightText.textContent = message;
  completionHighlight.hidden = false;
  requestAnimationFrame(() => {
    completionHighlight.classList.add("is-visible");
    completionHighlightClose?.focus();
  });
}

function hideCompletionHighlight() {
  if (!completionHighlight) {
    return;
  }
  if (completionHighlightHideTimer) {
    clearTimeout(completionHighlightHideTimer);
    completionHighlightHideTimer = null;
  }
  completionHighlight.classList.remove("is-visible");
  if (!completionHighlight.hidden) {
    completionHighlightHideTimer = window.setTimeout(() => {
      completionHighlight.hidden = true;
      completionHighlightHideTimer = null;
    }, 320);
  } else {
    completionHighlight.hidden = true;
  }
}

function tryRecordHighscore() {
  if (!highscoreListEl) {
    return;
  }
  const rawName = prompt("Highscore sichern! Gib deinen Namen ein:", "Spieler");
  if (rawName === null) {
    return;
  }
  const displayName = rawName.trim() || "Spieler";
  const entry = {
    name: displayName,
    time: formatTime(secondsElapsed),
    seconds: secondsElapsed
  };
  highscores.push(entry);
  highscores.sort((a, b) => a.seconds - b.seconds);
  highscores = highscores.slice(0, HIGHSCORE_LIMIT);
  saveHighscores();
  renderHighscores();
}

function loadHighscores() {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Highscore-Daten konnten nicht geladen werden.", error);
    return [];
  }
}

function saveHighscores() {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(highscores));
}

function renderHighscores() {
  if (!highscoreListEl) {
    return;
  }
  highscoreListEl.innerHTML = "";
  if (!highscores.length) {
    const placeholder = document.createElement("li");
    placeholder.className = "highscore-placeholder";
    placeholder.textContent = "Noch keine Zeiten vorhanden.";
    highscoreListEl.appendChild(placeholder);
    return;
  }
  highscores.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "highscore-entry";
    li.innerHTML = `
      <span class="highscore-rank">${index + 1}.</span>
      <span class="highscore-name">${entry.name}</span>
      <span class="highscore-time">${entry.time}</span>
    `;
    highscoreListEl.appendChild(li);
  });
}

function playFlipSound() {
  playSoundEffect("flip");
}

function playVictorySound() {
  playSoundEffect("victory");
}

function playSoundEffect(effectKey) {
  ensureAudioContextResumed();
  if (audioContext) {
    const buffer = soundEffectBuffers[effectKey];
    if (buffer) {
      try {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        return;
      } catch (error) {
        console.warn("Sound effect playback failed, falling back to HTMLAudioElement.", error);
      }
    }
  }
  playFallbackSound(effectKey);
}

function playFallbackSound(effectKey) {
  const fallback = fallbackSoundElements[effectKey];
  if (!fallback) {
    return;
  }
  fallback.currentTime = 0;
  fallback.play().catch(() => {});
}

function ensureAudioContextResumed() {
  if (!audioContext || audioContext.state !== "suspended") {
    return;
  }
  audioContext.resume().catch(() => {});
}

function registerAudioUnlock() {
  if (!audioContext || !bodyEl) {
    return;
  }
  const events = ["pointerdown", "mousedown", "touchstart", "keydown"];
  const handler = () => {
    ensureAudioContextResumed();
    events.forEach((eventName) => bodyEl.removeEventListener(eventName, handler));
  };
  events.forEach((eventName) => bodyEl.addEventListener(eventName, handler));
}

function initSoundEffects() {
  Object.entries(SOUND_EFFECT_PATHS).forEach(([key, file]) => {
    fallbackSoundElements[key] = createFallbackSound(file);
    if (audioContext) {
      loadSoundBuffer(file).then((buffer) => {
        if (buffer) {
          soundEffectBuffers[key] = buffer;
        }
      });
    }
  });
}

function createFallbackSound(path) {
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = encodeURI(path);
  audio.load();
  return audio;
}

function loadSoundBuffer(path) {
  if (!audioContext) {
    return Promise.resolve(null);
  }
  return fetch(encodeURI(path))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Audio file ${path} konnte nicht geladen werden.`);
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => decodeAudioData(arrayBuffer))
    .catch(() => null);
}

function decodeAudioData(arrayBuffer) {
  if (!audioContext) {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    try {
      const maybePromise = audioContext.decodeAudioData(arrayBuffer);
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(resolve).catch(reject);
      } else {
        audioContext.decodeAudioData(arrayBuffer, resolve, reject);
      }
    } catch (error) {
      audioContext.decodeAudioData(arrayBuffer, resolve, (decodeError) =>
        reject(decodeError || error)
      );
    }
  });
}

function createAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  try {
    return new AudioCtx();
  } catch (error) {
    console.warn("AudioContext konnte nicht erstellt werden.", error);
    return null;
  }
}
