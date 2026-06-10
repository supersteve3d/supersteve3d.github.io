const WORD_PACKS = {
    classic: [
        "Angel", "Apollo", "Arm", "Ball", "Band", "Bank", "Battery", "Beach", "Bear", "Bell",
        "Berlin", "Block", "Bolt", "Boot", "Bottle", "Bridge", "Brush", "Buffalo", "Button", "Cap",
        "Card", "Carrot", "Cat", "Center", "Chair", "Chocolate", "Circle", "Cliff", "Club", "Code",
        "Cold", "Comic", "Compound", "Copper", "Cotton", "Court", "Crane", "Cycle", "Dance", "Date",
        "Deck", "Degree", "Diamond", "Dice", "Dinosaur", "Doctor", "Dog", "Draft", "Dragon", "Dream",
        "Drill", "Drop", "Duck", "Eagle", "Engine", "Europe", "Fan", "Fence", "Field", "Film",
        "Fire", "Fish", "Flute", "Forest", "Fork", "Game", "Gas", "Ghost", "Giant", "Glass",
        "Glove", "Gold", "Grace", "Grass", "Greece", "Green", "Ground", "Ham", "Hand", "Harbor",
        "Hawk", "Heart", "Helicopter", "Honey", "Hook", "Hospital", "Hotel", "Ice", "Iron", "Jam",
        "Jet", "Jupiter", "Kangaroo", "Kid", "King", "Knife", "Knight", "Lab", "Laser", "Lawyer",
        "Lead", "Lemon", "Library", "Light", "Limousine", "Line", "Link", "Lion", "Lock", "Log",
        "London", "Luck", "Machine", "Mail", "Map", "March", "Match", "Mercury", "Microscope", "Millionaire",
        "Mine", "Mint", "Model", "Mole", "Moon", "Mount", "Mouse", "Mug", "Nail", "Needle",
        "Net", "Ninja", "Note", "Nut", "Octopus", "Oil", "Olive", "Opera", "Orange", "Organ",
        "Palm", "Paper", "Park", "Part", "Piano", "Pilot", "Pin", "Pipe", "Pirate", "Plate",
        "Plot", "Point", "Port", "Post", "Press", "Princess", "Pumpkin", "Queen", "Rabbit", "Ray",
        "Record", "Ring", "Robot", "Rose", "Root", "Saddle", "Saturn", "School", "Scientist", "Server",
        "Shadow", "Shark", "Ship", "Shop", "Shot", "Skyscraper", "Slip", "Slug", "Snow", "Sock",
        "Soldier", "Sound", "Space", "Spell", "Spider", "Spine", "Spot", "Spring", "Square", "Stadium",
        "Staff", "Star", "Stick", "Storm", "Sub", "Suit", "Swing", "Table", "Temple", "Theater",
        "Thief", "Thread", "Time", "Tokyo", "Torch", "Tower", "Track", "Train", "Triangle", "Tube",
        "Turkey", "Undertaker", "Vacuum", "Van", "Vet", "Wake", "Wall", "Watch", "Water", "Wave",
        "Web", "Well", "Whale", "Whip", "Wind", "Witch", "Wolf", "Wood", "Yard"
    ],
    family: [
        "Apple", "Backyard", "Balloon", "Banana", "Barn", "Baseball", "Bed", "Bicycle", "Blanket", "Bread",
        "Bubble", "Burger", "Candle", "Candy", "Castle", "Cereal", "Chair", "Cheese", "Chicken", "Cookie",
        "Cousin", "Crayon", "Cupcake", "Dinosaur", "Dinner", "Dog", "Donut", "Dragon", "Drum", "Family",
        "Feather", "Firefly", "Fish", "Flower", "Football", "Forest", "Friend", "Frog", "Garden", "Guitar",
        "Hamburger", "Hammer", "Hat", "Honey", "Horse", "House", "Ice Cream", "Island", "Jelly", "Jungle",
        "Kite", "Kitten", "Ladder", "Lemonade", "Library", "Lighthouse", "Magic", "Mailbox", "Marshmallow", "Moon",
        "Mountain", "Music", "Noodle", "Ocean", "Pajamas", "Pancake", "Parade", "Park", "Peanut", "Penguin",
        "Picnic", "Pirate", "Pizza", "Planet", "Pocket", "Popsicle", "Princess", "Pumpkin", "Puppy", "Rainbow",
        "Rocket", "School", "Seashell", "Ship", "Snowman", "Soccer", "Space", "Spider", "Spoon", "Star",
        "Story", "Sunflower", "Swing", "Tiger", "Treasure", "Truck", "Tulip", "Turtle", "Vacation", "Volcano"
    ],
    cinematic: [
        "Afterburner", "Alien", "Arena", "Artifact", "Beacon", "Blizzard", "Blueprint", "Bounty", "Cannon", "Captain",
        "Cave", "Cipher", "Comet", "Compass", "Convoy", "Cosmos", "Crash", "Crown", "Danger", "Desert",
        "Echo", "Empire", "Escape", "Falcon", "Fate", "Galaxy", "Glacier", "Harpoon", "Horizon", "Hunter",
        "Inferno", "Jacket", "Journey", "Jungle", "Kingdom", "Legend", "Machine", "Meteor", "Mirage", "Mission",
        "Nebula", "Nomad", "Oasis", "Orbit", "Outlaw", "Passage", "Phantom", "Portal", "Quest", "Radar",
        "Ranger", "Reactor", "Rescue", "Rider", "Rift", "Rocket", "Rogue", "Ruins", "Satellite", "Savanna",
        "Shadow", "Signal", "Skylight", "Smoke", "Solar", "Starship", "Storm", "Summit", "Temple", "Thunder",
        "Titan", "Tracker", "Transit", "Tunnel", "Typhoon", "Vault", "Vector", "Voyage", "Warrior", "Whisper",
        "Wildfire", "Windfall", "Wreck", "Zephyr"
    ]
};

const STORAGE_KEY = "codenames-tablet-state-v3";
const PREVIOUS_STORAGE_KEY = "codenames-tablet-state-v2";
const LEGACY_STORAGE_KEY = "codenames-tablet-state-v1";
const APP_VERSION = "1.4";

const state = {
    words: [],
    assignments: [],
    revealed: [],
    selectedIndex: null,
    currentTeam: "red",
    startingTeam: "red",
    redRemaining: 8,
    blueRemaining: 9,
    currentClue: "",
    clueCount: "1",
    log: [],
    peekActive: false,
    winner: null,
    history: [],
    score: { red: 0, blue: 0 },
    wordPack: "classic",
    customWords: ""
};

const elements = {
    board: document.getElementById("board"),
    turnTeam: document.getElementById("turn-team"),
    turnNote: document.getElementById("turn-note"),
    redRemaining: document.getElementById("red-remaining"),
    blueRemaining: document.getElementById("blue-remaining"),
    selectedWord: document.getElementById("selected-word"),
    boardSubtitle: document.getElementById("board-subtitle"),
    clueInput: document.getElementById("clue-input"),
    clueCountInput: document.getElementById("clue-count-input"),
    confirmGuessButton: document.getElementById("confirm-guess-button"),
    peekButton: document.getElementById("peek-button"),
    peekIndicator: document.getElementById("peek-indicator"),
    newGameButton: document.getElementById("new-game-button"),
    undoButton: document.getElementById("undo-button"),
    turnLog: document.getElementById("turn-log"),
    logItemTemplate: document.getElementById("log-item-template"),
    resultDialog: document.getElementById("result-dialog"),
    resultTitle: document.getElementById("result-title"),
    resultMessage: document.getElementById("result-message"),
    redScore: document.getElementById("red-score"),
    blueScore: document.getElementById("blue-score"),
    scoreNote: document.getElementById("score-note"),
    wordPackSelect: document.getElementById("word-pack-select"),
    customPackField: document.getElementById("custom-pack-field"),
    customPackInput: document.getElementById("custom-pack-input"),
    statusTurnCard: document.querySelector(".status-turn"),
    boardPanel: document.querySelector(".board-panel")
};

function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
}

function parseCustomWords(text) {
    return text
        .split(/[\n,]+/)
        .map((word) => word.trim())
        .filter(Boolean)
        .filter((word, index, words) => words.findIndex((entry) => entry.toLowerCase() === word.toLowerCase()) === index);
}

function getActiveWordPool() {
    if (state.wordPack === "custom") {
        const customWords = parseCustomWords(state.customWords);
        if (customWords.length >= 25) {
            return customWords;
        }
    }
    return WORD_PACKS[state.wordPack] || WORD_PACKS.classic;
}

function sampleWords() {
    return shuffle(getActiveWordPool()).slice(0, 25);
}

function buildAssignments(startingTeam) {
    const pool = [
        ...Array(startingTeam === "red" ? 9 : 8).fill("red"),
        ...Array(startingTeam === "blue" ? 9 : 8).fill("blue"),
        ...Array(7).fill("neutral"),
        "assassin"
    ];
    return shuffle(pool);
}

function teamLabel(team) {
    return team === "red" ? "Red Team" : "Blue Team";
}

function typeLabel(type) {
    if (type === "assassin") return "Assassin";
    if (type === "neutral") return "Bystander";
    return `${teamLabel(type).replace(" Team", "")} Agent`;
}

function setTurnTheme() {
    document.body.classList.toggle("turn-red", state.currentTeam === "red");
    document.body.classList.toggle("turn-blue", state.currentTeam === "blue");
    elements.board.classList.toggle("turn-red", state.currentTeam === "red");
    elements.board.classList.toggle("turn-blue", state.currentTeam === "blue");
    elements.boardPanel.classList.toggle("turn-red", state.currentTeam === "red");
    elements.boardPanel.classList.toggle("turn-blue", state.currentTeam === "blue");
    elements.statusTurnCard.classList.toggle("turn-red", state.currentTeam === "red");
    elements.statusTurnCard.classList.toggle("turn-blue", state.currentTeam === "blue");
}

function updatePackControls() {
    const isCustom = state.wordPack === "custom";
    elements.wordPackSelect.value = state.wordPack;
    elements.customPackField.hidden = !isCustom;
    elements.customPackInput.value = state.customWords;
}

function createNewGame() {
    const startingTeam = Math.random() < 0.5 ? "red" : "blue";
    const assignments = buildAssignments(startingTeam);

    state.words = sampleWords();
    state.assignments = assignments;
    state.revealed = Array(25).fill(false);
    state.selectedIndex = null;
    state.currentTeam = startingTeam;
    state.startingTeam = startingTeam;
    state.redRemaining = assignments.filter((item) => item === "red").length;
    state.blueRemaining = assignments.filter((item) => item === "blue").length;
    state.currentClue = "";
    state.clueCount = "1";
    state.log = [`<strong>${teamLabel(startingTeam)}</strong> starts the round. Add a clue and reveal a guess to hand play across.`];
    state.peekActive = false;
    state.winner = null;
    state.history = [];

    elements.clueInput.value = "";
    elements.clueCountInput.value = "1";
    render();
    saveState();
}

function cloneSnapshot() {
    return {
        revealed: [...state.revealed],
        selectedIndex: state.selectedIndex,
        currentTeam: state.currentTeam,
        redRemaining: state.redRemaining,
        blueRemaining: state.blueRemaining,
        log: [...state.log],
        winner: state.winner,
        currentClue: state.currentClue,
        clueCount: state.clueCount,
        peekActive: state.peekActive
    };
}

function restoreSnapshot(snapshot) {
    state.revealed = [...snapshot.revealed];
    state.selectedIndex = snapshot.selectedIndex;
    state.currentTeam = snapshot.currentTeam;
    state.redRemaining = snapshot.redRemaining;
    state.blueRemaining = snapshot.blueRemaining;
    state.log = [...snapshot.log];
    state.winner = snapshot.winner;
    state.currentClue = snapshot.currentClue;
    state.clueCount = snapshot.clueCount;
    state.peekActive = snapshot.peekActive ?? false;
    render();
    saveState();
}

function selectTile(index) {
    if (state.winner || state.revealed[index]) return;
    state.selectedIndex = state.selectedIndex === index ? null : index;
    render();
}

function applyClueFromInputs() {
    const clue = elements.clueInput.value.trim();
    const clueCount = elements.clueCountInput.value.trim();

    if (!clue) {
        state.log.unshift(`Add a clue for <strong>${teamLabel(state.currentTeam)}</strong> before revealing a guess.`);
        renderLog();
        return;
    }

    const normalizedCount = clueCount || "1";
    if (state.currentClue === clue && state.clueCount === normalizedCount) {
        return true;
    }

    state.currentClue = clue;
    state.clueCount = normalizedCount;
    state.log.unshift(`<strong>${teamLabel(state.currentTeam)}</strong> clue: ${clue.toUpperCase()} ${state.clueCount}`);
    return true;
}

function endTurn(reason) {
    const nextTeam = state.currentTeam === "red" ? "blue" : "red";
    state.selectedIndex = null;
    state.currentClue = "";
    state.clueCount = "1";
    state.currentTeam = nextTeam;
    state.log.unshift(reason || `Turn passes to <strong>${teamLabel(nextTeam)}</strong>.`);
    elements.clueInput.value = "";
    elements.clueCountInput.value = "1";
    render();
    saveState();
}

function showWinner(team, message) {
    state.winner = team;
    state.score[team] += 1;
    elements.resultTitle.textContent = `${teamLabel(team)} wins`;
    elements.resultMessage.textContent = message;
    renderStatus();
    saveState();
    if (!elements.resultDialog.open) {
        elements.resultDialog.showModal();
    }
}

function openChangelog() {
    document.getElementById("changelog-overlay").classList.remove("hidden");
}

function closeChangelog() {
    document.getElementById("changelog-overlay").classList.add("hidden");
}

function revealSelectedTile() {
    if (state.selectedIndex === null || state.winner) return;
    if (!applyClueFromInputs()) return;

    const index = state.selectedIndex;
    const type = state.assignments[index];
    const word = state.words[index];
    state.history.push(cloneSnapshot());
    state.revealed[index] = true;

    const activeTeam = state.currentTeam;
    let message = `<strong>${teamLabel(activeTeam)}</strong> revealed ${word.toUpperCase()}: ${typeLabel(type)}.`;

    if (type === "red") {
        state.redRemaining -= 1;
    } else if (type === "blue") {
        state.blueRemaining -= 1;
    } else if (type === "assassin") {
        const winner = activeTeam === "red" ? "blue" : "red";
        state.log.unshift(message);
        render();
        saveState();
        showWinner(winner, `${word.toUpperCase()} was the assassin. ${teamLabel(winner)} takes the round.`);
        return;
    }

    state.log.unshift(message);

    if (state.redRemaining === 0) {
        render();
        saveState();
        showWinner("red", "All red agents have been found.");
        return;
    }

    if (state.blueRemaining === 0) {
        render();
        saveState();
        showWinner("blue", "All blue agents have been found.");
        return;
    }

    const nextTeam = activeTeam === "red" ? "blue" : "red";
    endTurn(`${message} <strong>${teamLabel(nextTeam)}</strong> is now up.`);
}

function undoLastReveal() {
    const snapshot = state.history.pop();
    if (!snapshot) return;

    if (elements.resultDialog.open) {
        elements.resultDialog.close();
    }

    restoreSnapshot(snapshot);
}

function setPeekActive(active) {
    state.peekActive = active;
    elements.peekButton.classList.toggle("active", active);
    elements.peekButton.setAttribute("aria-pressed", String(active));
    elements.peekIndicator.hidden = !active;
    renderBoard();
    saveState();
}

function togglePeek() {
    setPeekActive(!state.peekActive);
}

function renderBoard() {
    elements.board.innerHTML = "";

    state.words.forEach((word, index) => {
        const button = document.createElement("button");
        const type = state.assignments[index];
        const revealed = state.revealed[index];
        const selected = index === state.selectedIndex;

        button.type = "button";
        button.className = "tile";
        if (revealed) button.classList.add("revealed", type);
        if (selected) button.classList.add("selected");
        if (state.peekActive && !revealed) button.classList.add(`peek-${type}`);

        button.innerHTML = `
            <span class="tile-word">${word}</span>
            <span class="tile-badge">${typeLabel(type)}</span>
        `;
        button.addEventListener("click", () => selectTile(index));
        elements.board.appendChild(button);
    });
}

function renderLog() {
    elements.turnLog.innerHTML = "";
    state.log.slice(0, 10).forEach((entry) => {
        const item = elements.logItemTemplate.content.firstElementChild.cloneNode(true);
        item.innerHTML = entry;
        elements.turnLog.appendChild(item);
    });
}

function renderStatus() {
    const clueText = state.currentClue
        ? `Current clue: ${state.currentClue.toUpperCase()} ${state.clueCount}`
        : "Add a clue, then reveal one guess.";

    elements.turnTeam.textContent = teamLabel(state.currentTeam);
    elements.turnNote.textContent = clueText;
    elements.redRemaining.textContent = String(state.redRemaining);
    elements.blueRemaining.textContent = String(state.blueRemaining);
    elements.redScore.textContent = String(state.score.red);
    elements.blueScore.textContent = String(state.score.blue);
    elements.selectedWord.textContent = state.selectedIndex === null ? "None" : state.words[state.selectedIndex];
    elements.boardSubtitle.textContent = `${teamLabel(state.startingTeam)} started this round. Revealing a guess automatically passes play to ${teamLabel(state.currentTeam === "red" ? "blue" : "red")}.`;
    elements.scoreNote.textContent = `Persists on this device. Active pack: ${elements.wordPackSelect.options[elements.wordPackSelect.selectedIndex].text}.`;
    elements.confirmGuessButton.disabled = state.selectedIndex === null || Boolean(state.winner);
    elements.undoButton.disabled = state.history.length === 0;
    setTurnTheme();
}

function render() {
    updatePackControls();
    renderBoard();
    renderLog();
    renderStatus();
}

function saveState() {
    const payload = {
        words: state.words,
        assignments: state.assignments,
        revealed: state.revealed,
        selectedIndex: state.selectedIndex,
        currentTeam: state.currentTeam,
        startingTeam: state.startingTeam,
        redRemaining: state.redRemaining,
        blueRemaining: state.blueRemaining,
        currentClue: state.currentClue,
        clueCount: state.clueCount,
        log: state.log,
        history: state.history,
        winner: state.winner,
        score: state.score,
        wordPack: state.wordPack,
        customWords: state.customWords,
        peekActive: state.peekActive
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadSavedState() {
    const raw = window.localStorage.getItem(STORAGE_KEY)
        || window.localStorage.getItem(PREVIOUS_STORAGE_KEY)
        || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
        createNewGame();
        return;
    }

    try {
        const saved = JSON.parse(raw);
        const isValid =
            Array.isArray(saved.words) &&
            saved.words.length === 25 &&
            Array.isArray(saved.assignments) &&
            saved.assignments.length === 25 &&
            Array.isArray(saved.revealed) &&
            saved.revealed.length === 25;

        if (!isValid) {
            createNewGame();
            return;
        }

        Object.assign(state, {
            words: saved.words,
            assignments: saved.assignments,
            revealed: saved.revealed,
            selectedIndex: saved.selectedIndex ?? null,
            currentTeam: saved.currentTeam || "red",
            startingTeam: saved.startingTeam || "red",
            redRemaining: saved.redRemaining ?? 8,
            blueRemaining: saved.blueRemaining ?? 9,
            currentClue: saved.currentClue || "",
            clueCount: saved.clueCount || "1",
            log: saved.log || [],
            history: saved.history || [],
            winner: saved.winner || null,
            score: saved.score || { red: 0, blue: 0 },
            wordPack: saved.wordPack || "classic",
            customWords: saved.customWords || "",
            peekActive: Boolean(saved.peekActive)
        });

        render();
        saveState();
    } catch (error) {
        console.error("Could not load saved Codenames state.", error);
        createNewGame();
    }
}

elements.newGameButton.addEventListener("click", createNewGame);
elements.undoButton.addEventListener("click", undoLastReveal);
elements.confirmGuessButton.addEventListener("click", revealSelectedTile);
elements.peekButton.addEventListener("click", togglePeek);
document.getElementById("btn-changelog").addEventListener("click", openChangelog);
document.getElementById("btn-changelog-close").addEventListener("click", closeChangelog);
document.getElementById("changelog-overlay").addEventListener("click", (event) => {
    if (event.target.id === "changelog-overlay") {
        closeChangelog();
    }
});
elements.wordPackSelect.addEventListener("change", (event) => {
    state.wordPack = event.target.value;
    if (state.wordPack !== "custom") {
        render();
        saveState();
        return;
    }
    updatePackControls();
    saveState();
});
elements.customPackInput.addEventListener("input", (event) => {
    state.customWords = event.target.value;
    const customCount = parseCustomWords(state.customWords).length;
    if (state.wordPack === "custom") {
        elements.scoreNote.textContent = customCount >= 25
            ? `Persists on this device. Active pack: Custom List (${customCount} words ready).`
            : `Persists on this device. Custom List needs ${25 - customCount} more unique words.`;
    }
    saveState();
});

elements.resultDialog.addEventListener("close", () => {
    saveState();
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeChangelog();
    }
});

document.getElementById("version-badge").textContent = `v${APP_VERSION}`;
loadSavedState();
