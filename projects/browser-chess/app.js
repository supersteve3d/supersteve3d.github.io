/**
 * Steve's Vibe Coded Chess Program - Chess Game Logic & AI Opponent
 * Uses chess.js for move validation and state management.
 */

// Initialize chess.js
let game = new Chess();

const SUPABASE_URL = 'https://duvohiskcdlsvawyvhpq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SnqVU4BFVL237B2ZOJeRVg_0KyPpr_o';
const SUPABASE_GAMES_TABLE = 'browser_chess_games';
const PLAYER_NAMES = ['Mum', 'David', 'Anonymous'];

// State variables
let boardFlipped = false;
let selectedSquare = null;
let validMoves = [];
let gameMode = 'ai'; // 'ai' or 'local'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let currentPlayer = 'Anonymous';
let soundEnabled = true;
let isAiThinking = false;
let pendingPromotion = null; // Stores { from, to } during promotion selection
let audioCtx = null;
let lastMove = null; // Stores { from, to } for highlight
let reviewPly = null; // null means live position; otherwise number of half-moves shown
let gameOverOverlayDismissed = false;
let savedGames = [];
let currentGameSaved = false;
let currentLoadedGameId = null;

// Piece-Square Tables (PST) for AI positional evaluation
// Values represent hundredths of a pawn (centipawns)
const pawnEval = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0,  1.0, -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

const knightEval = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

const bishopEval = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
    [-1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
    [-1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
    [-1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
    [-1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const rookEval = [
    [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [ 0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ 0.0,  0.0,  0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

const queenEval = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [ 0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [-1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.0,  0.0,  0.5,  0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const kingEval = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [ 2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0],
    [ 2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0]
];

// Audio Synthesis Engine
function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error('Web Audio API not supported in this browser.', e);
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    switch (type) {
        case 'move':
            // Synthesize a wood block click
            const oscMove = audioCtx.createOscillator();
            const gainMove = audioCtx.createGain();
            oscMove.connect(gainMove);
            gainMove.connect(audioCtx.destination);

            oscMove.type = 'triangle';
            oscMove.frequency.setValueAtTime(280, now);
            oscMove.frequency.exponentialRampToValueAtTime(140, now + 0.08);

            gainMove.gain.setValueAtTime(0.12, now);
            gainMove.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            oscMove.start(now);
            oscMove.stop(now + 0.08);
            break;

        case 'capture':
            // Synthesize a mechanical click/snap
            const oscCap = audioCtx.createOscillator();
            const gainCap = audioCtx.createGain();
            oscCap.connect(gainCap);
            gainCap.connect(audioCtx.destination);

            oscCap.type = 'sawtooth';
            oscCap.frequency.setValueAtTime(160, now);
            oscCap.frequency.linearRampToValueAtTime(60, now + 0.1);

            gainCap.gain.setValueAtTime(0.08, now);
            gainCap.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            oscCap.start(now);
            oscCap.stop(now + 0.1);
            break;

        case 'check':
            // Synthesize a warning alert (2-tone chime)
            const oscChime1 = audioCtx.createOscillator();
            const oscChime2 = audioCtx.createOscillator();
            const gainChime = audioCtx.createGain();

            oscChime1.connect(gainChime);
            oscChime2.connect(gainChime);
            gainChime.connect(audioCtx.destination);

            oscChime1.type = 'sine';
            oscChime1.frequency.setValueAtTime(587.33, now); // D5
            oscChime1.frequency.setValueAtTime(698.46, now + 0.08); // F5

            oscChime2.type = 'sine';
            oscChime2.frequency.setValueAtTime(880.00, now); // A5
            oscChime2.frequency.setValueAtTime(1046.50, now + 0.08); // C6

            gainChime.gain.setValueAtTime(0.06, now);
            gainChime.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            oscChime1.start(now);
            oscChime2.start(now);
            oscChime1.stop(now + 0.35);
            oscChime2.stop(now + 0.35);
            break;

        case 'game-over':
            // Synthesize success fanfare arpeggio
            const arpeggio = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            arpeggio.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0.06, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.3);
            });
            break;
    }
}

function getSupabaseHeaders(extraHeaders = {}) {
    return {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...extraHeaders
    };
}

function setSaveStatus(message, type = '') {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('success', 'error');
    if (type) el.classList.add(type);
}

function formatSavedGameDate(value) {
    if (!value) return 'Unknown date';
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(new Date(value));
}

function getPlayerColor() {
    return 'w';
}

function getGameResultForCurrentPlayer() {
    if (game.in_draw()) return 'draw';
    if (!game.in_checkmate()) return 'unfinished';

    const winnerColor = game.turn() === 'w' ? 'b' : 'w';
    return winnerColor === getPlayerColor() ? 'win' : 'loss';
}

function getGameResultLabel(result) {
    if (result === 'win') return 'Win';
    if (result === 'loss') return 'Loss';
    if (result === 'draw') return 'Draw';
    return 'Unfinished';
}

function buildSavedGamePayload() {
    const history = game.history({ verbose: true });
    return {
        player: currentPlayer,
        result: getGameResultForCurrentPlayer(),
        pgn: game.pgn(),
        opponent: gameMode === 'ai' ? `Computer (${aiDifficulty})` : 'Local Player',
        game_mode: gameMode,
        ai_difficulty: gameMode === 'ai' ? aiDifficulty : null,
        half_moves: history.length
    };
}

async function fetchSavedGames() {
    setSaveStatus('Loading saved games...');

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${SUPABASE_GAMES_TABLE}?select=*&order=created_at.desc&limit=80`,
            { headers: getSupabaseHeaders() }
        );

        if (!response.ok) {
            throw new Error(`Supabase returned ${response.status}`);
        }

        savedGames = await response.json();
        renderScoreboard();
        renderSavedGames();
        setSaveStatus('Saved games synced.', 'success');
    } catch (error) {
        console.error('Could not load saved games:', error);
        savedGames = [];
        renderScoreboard();
        renderSavedGames();
        setSaveStatus('Could not sync saved games. Check the Supabase table and policies.', 'error');
    }
}

async function saveCompletedGame() {
    if (currentGameSaved || currentLoadedGameId || !game.game_over()) return;

    const payload = buildSavedGamePayload();
    if (payload.result === 'unfinished') return;

    currentGameSaved = true;
    setSaveStatus('Saving completed game...');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_GAMES_TABLE}`, {
            method: 'POST',
            headers: getSupabaseHeaders({
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            }),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            currentGameSaved = false;
            throw new Error(`Supabase returned ${response.status}`);
        }

        const createdRows = await response.json();
        savedGames = [...createdRows, ...savedGames];
        renderScoreboard();
        renderSavedGames();
        setSaveStatus('Game saved.', 'success');
    } catch (error) {
        console.error('Could not save game:', error);
        setSaveStatus('Game not saved. Check the Supabase table and policies.', 'error');
    }
}

function updateSelectedPlayer(player) {
    currentPlayer = PLAYER_NAMES.includes(player) ? player : 'Anonymous';
    document.getElementById('white-player-name').textContent = currentPlayer === 'Anonymous'
        ? 'Player 1 (White)'
        : `${currentPlayer} (White)`;
}

function renderScoreboard() {
    const totals = PLAYER_NAMES.reduce((acc, player) => {
        acc[player] = { played: 0, wins: 0 };
        return acc;
    }, {});

    savedGames.forEach(savedGame => {
        if (!totals[savedGame.player]) return;
        totals[savedGame.player].played += 1;
        if (savedGame.result === 'win') {
            totals[savedGame.player].wins += 1;
        }
    });

    const ids = {
        Mum: ['score-mum-wins', 'score-mum-played'],
        David: ['score-david-wins', 'score-david-played'],
        Anonymous: ['score-anonymous-wins', 'score-anonymous-played']
    };

    PLAYER_NAMES.forEach(player => {
        document.getElementById(ids[player][0]).textContent = totals[player].wins;
        document.getElementById(ids[player][1]).textContent = totals[player].played;
    });
}

function renderSavedGames() {
    const list = document.getElementById('saved-games-list');
    const filter = document.getElementById('saved-games-filter').value;
    const gamesToRender = filter === 'all'
        ? savedGames
        : savedGames.filter(savedGame => savedGame.player === filter);

    list.innerHTML = '';

    if (gamesToRender.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'saved-game-empty';
        empty.textContent = 'No saved games yet.';
        list.appendChild(empty);
        return;
    }

    gamesToRender.forEach(savedGame => {
        const card = document.createElement('div');
        card.className = 'saved-game-card';

        const info = document.createElement('div');

        const title = document.createElement('div');
        title.className = 'saved-game-title';
        title.textContent = `${savedGame.player} - ${getGameResultLabel(savedGame.result)}`;

        const meta = document.createElement('div');
        meta.className = 'saved-game-meta';
        const moves = savedGame.half_moves ? `${Math.ceil(savedGame.half_moves / 2)} moves` : 'PGN saved';
        meta.textContent = `${formatSavedGameDate(savedGame.created_at)} | ${moves} | ${savedGame.opponent || 'Opponent'}`;

        info.appendChild(title);
        info.appendChild(meta);

        const button = document.createElement('button');
        button.className = 'saved-game-review';
        button.type = 'button';
        button.textContent = 'Review';
        button.addEventListener('click', () => loadSavedGame(savedGame));

        card.appendChild(info);
        card.appendChild(button);
        list.appendChild(card);
    });
}

function loadSavedGame(savedGame) {
    const loaded = game.load_pgn(savedGame.pgn);
    if (!loaded) {
        setSaveStatus('Could not load that saved PGN.', 'error');
        return;
    }

    currentPlayer = savedGame.player;
    document.getElementById('player-name').value = currentPlayer;
    currentLoadedGameId = savedGame.id;
    currentGameSaved = true;
    reviewPly = null;
    selectedSquare = null;
    validMoves = [];
    gameOverOverlayDismissed = true;
    document.getElementById('game-over-overlay').classList.add('hidden');

    const history = game.history({ verbose: true });
    const prev = history[history.length - 1];
    lastMove = prev ? { from: prev.from, to: prev.to } : null;

    updateUI();
    setSaveStatus(`Loaded ${savedGame.player}'s saved game.`, 'success');
}

// Generate the Chess Board dynamically in HTML DOM
function renderBoard() {
    const boardElement = document.getElementById('chess-board');
    boardElement.onclick = handleBoardClick;
    boardElement.innerHTML = '';
    const displayGame = getDisplayGame();
    const reviewMode = isReviewing();
    const displayLastMove = getDisplayLastMove();

    // Toggle flipped CSS class
    if (boardFlipped) {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    const currentBoard = displayGame.board();
    const inCheck = displayGame.in_check();
    const activeColor = displayGame.turn();

    // Find the King square of active color if they are in check
    let checkSquare = null;
    if (inCheck) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = currentBoard[r][c];
                if (p && p.type === 'k' && p.color === activeColor) {
                    checkSquare = files[c] + ranks[r];
                    break;
                }
            }
            if (checkSquare) break;
        }
    }

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const file = files[c];
            const rank = ranks[r];
            const squareName = file + rank;

            const squareDiv = document.createElement('div');
            squareDiv.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            squareDiv.dataset.square = squareName;

            // Add highlighting if it's part of the last move
            if (displayLastMove && (displayLastMove.from === squareName || displayLastMove.to === squareName)) {
                squareDiv.classList.add(displayLastMove.from === squareName ? 'highlight-from' : 'highlight-to');
            }

            // Highlight if selected
            if (!reviewMode && selectedSquare === squareName) {
                squareDiv.classList.add('selected');
            }

            // Highlight if in check
            if (checkSquare === squareName) {
                squareDiv.classList.add('in-check');
            }

            // Add Coordinates
            // Bottom-right edge for File character, Top-left edge for Rank digit
            const isFileLabelVisible = (boardFlipped ? r === 0 : r === 7);
            const isRankLabelVisible = (boardFlipped ? c === 7 : c === 0);

            if (isFileLabelVisible) {
                const label = document.createElement('span');
                label.className = 'coordinate file';
                label.textContent = file;
                squareDiv.appendChild(label);
            }
            if (isRankLabelVisible) {
                const label = document.createElement('span');
                label.className = 'coordinate rank';
                label.textContent = rank;
                squareDiv.appendChild(label);
            }

            // Render Piece
            const piece = currentBoard[r][c];
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
                pieceDiv.draggable = !reviewMode && !isAiThinking && (gameMode === 'local' || piece.color === 'w');

                // Standard Staunton representation from Lichess theme
                pieceDiv.innerHTML = `
                    <img src="https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${piece.color}${piece.type.toUpperCase()}.svg" alt="${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}" />
                `;

                // Drag Events
                pieceDiv.addEventListener('dragstart', (e) => {
                    initAudio(); // Warm up context on drag
                    if (reviewMode || isAiThinking) {
                        e.preventDefault();
                        return;
                    }
                    if (gameMode === 'ai' && piece.color === 'b') {
                        e.preventDefault();
                        return;
                    }
                    selectedSquare = squareName;
                    validMoves = game.moves({ square: squareName, verbose: true });
                    e.dataTransfer.setData('text/plain', squareName);
                    setTimeout(() => renderBoard(), 0); // Re-render to show indicators
                });

                pieceDiv.addEventListener('dragend', () => {
                    // Reset selection only if no move was played
                    setTimeout(() => {
                        selectedSquare = null;
                        validMoves = [];
                        renderBoard();
                    }, 100);
                });

                squareDiv.appendChild(pieceDiv);
            }

            // Render valid move markers if selected
            const validMove = reviewMode ? null : validMoves.find(m => m.to === squareName);
            if (validMove) {
                if (piece) {
                    squareDiv.classList.add('capture-target');
                } else {
                    const dot = document.createElement('div');
                    dot.className = 'valid-move-marker';
                    squareDiv.appendChild(dot);
                }

                // Allow drop target interaction
                squareDiv.addEventListener('dragover', (e) => e.preventDefault());

                squareDiv.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromSquare = e.dataTransfer.getData('text/plain');
                    handleMoveIntent(fromSquare, squareName);
                });

            } else {
                // If not a valid move, still support dragover to block it
                squareDiv.addEventListener('dragover', (e) => e.preventDefault());
            }

            boardElement.appendChild(squareDiv);
        }
    }
}

function getLivePlyCount() {
    return game.history().length;
}

function isReviewing() {
    return reviewPly !== null && reviewPly < getLivePlyCount();
}

function getReviewPly() {
    return reviewPly === null ? getLivePlyCount() : reviewPly;
}

function getDisplayGame() {
    if (!isReviewing()) return game;

    const displayGame = new Chess();
    const history = game.history({ verbose: true });
    for (let i = 0; i < reviewPly; i++) {
        const move = history[i];
        const replayMove = { from: move.from, to: move.to };
        if (move.promotion) replayMove.promotion = move.promotion;
        displayGame.move(replayMove);
    }
    return displayGame;
}

function getDisplayLastMove() {
    if (!isReviewing()) return lastMove;
    if (reviewPly === 0) return null;

    const move = game.history({ verbose: true })[reviewPly - 1];
    return move ? { from: move.from, to: move.to } : null;
}

function enterReviewAtPly(ply) {
    const livePly = getLivePlyCount();
    reviewPly = Math.max(0, Math.min(ply, livePly));
    if (reviewPly === livePly) {
        reviewPly = null;
    }

    selectedSquare = null;
    validMoves = [];
    updateUI();
}

function stepReview(delta) {
    const livePly = getLivePlyCount();
    if (livePly === 0) return;
    enterReviewAtPly(getReviewPly() + delta);
}

function handleBoardClick(e) {
    const squareElement = e.target.closest('.square');
    if (!squareElement || !e.currentTarget.contains(squareElement)) return;

    e.stopPropagation();
    initAudio();
    if (isReviewing() || isAiThinking) return;

    const squareName = squareElement.dataset.square;
    const piece = game.get(squareName);
    const selectedMove = selectedSquare ? validMoves.find(m => m.to === squareName) : null;

    if (selectedSquare && selectedMove) {
        handleMoveIntent(selectedSquare, squareName);
        return;
    }

    if (!piece) {
        selectedSquare = null;
        validMoves = [];
        renderBoard();
        return;
    }

    if (gameMode === 'ai' && piece.color === 'b') return;

    if (selectedSquare === squareName) {
        selectedSquare = null;
        validMoves = [];
    } else {
        selectedSquare = squareName;
        validMoves = game.moves({ square: squareName, verbose: true });
    }
    renderBoard();
}

// Check if a move requires pawn promotion
function handleMoveIntent(from, to) {
    const piece = game.get(from);
    if (piece && piece.type === 'p' && (to.endsWith('8') || to.endsWith('1'))) {
        // Pawn promotion triggered
        pendingPromotion = { from, to };
        openPromotionDialog(piece.color);
    } else {
        executeMove(from, to);
    }
}

// Promotion Modal
function openPromotionDialog(color) {
    const overlay = document.getElementById('promotion-overlay');
    overlay.classList.remove('hidden');

    // Customize icons in the buttons based on the promoting color with standard Staunton pieces
    const promoTypes = ['q', 'r', 'b', 'n'];
    promoTypes.forEach(type => {
        const el = document.getElementById(`promo-${type}`);
        el.innerHTML = `<img src="https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${color}${type.toUpperCase()}.svg" style="width: 32px; height: 32px; object-fit: contain;" alt="${type}" />`;
    });
}

function closePromotionDialog() {
    document.getElementById('promotion-overlay').classList.add('hidden');
    pendingPromotion = null;
}

// Add event listeners for promotion buttons
document.querySelectorAll('.promo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (pendingPromotion) {
            const pieceType = btn.dataset.piece;
            executeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
            closePromotionDialog();
        }
    });
});

// Perform Move state changes
function executeMove(from, to, promotion = null) {
    if (isReviewing()) return;

    const isCapture = game.get(to) !== null;

    const move = game.move({
        from: from,
        to: to,
        promotion: promotion
    });

    if (move === null) return; // Invalid move safeguard

    // Play sounds
    if (game.in_checkmate() || game.in_draw()) {
        playSound('game-over');
    } else if (game.in_check()) {
        playSound('check');
    } else if (isCapture || move.flags.includes('e')) { // Standard capture or en passant
        playSound('capture');
    } else {
        playSound('move');
    }

    // Set last move variables for highlights
    lastMove = { from, to };
    reviewPly = null;

    // Clear selection
    selectedSquare = null;
    validMoves = [];

    // Update Board and UI Panels
    updateUI();

    if (game.game_over()) {
        saveCompletedGame();
    }

    // Trigger AI turn if game mode is AI and it is Black's turn
    if (gameMode === 'ai' && game.turn() === 'b' && !game.game_over()) {
        triggerAiMove();
    }
}

// Update game logs, captured pieces count, player indicator panels
function updateUI() {
    renderBoard();
    updateMoveHistory();
    updateCapturedPieces();
    updateGameStatus();
}

// Status message bar (White's Turn, Check, Checkmate, etc.)
function updateGameStatus() {
    const statusText = document.getElementById('game-status-text');
    const whiteCard = document.getElementById('player-white-card');
    const blackCard = document.getElementById('player-black-card');
    const displayGame = getDisplayGame();

    if (isReviewing()) {
        const currentPly = getReviewPly();
        const livePly = getLivePlyCount();
        statusText.textContent = `Review ${currentPly}/${livePly}`;
        statusText.classList.remove('check');

        if (displayGame.turn() === 'w') {
            whiteCard.classList.add('active');
            blackCard.classList.remove('active');
        } else {
            blackCard.classList.add('active');
            whiteCard.classList.remove('active');
        }

        document.getElementById('white-player-status').textContent = "Reviewing";
        document.getElementById('black-player-status').textContent = "Reviewing";
        return;
    }

    if (game.in_checkmate()) {
        statusText.textContent = "CHECKMATE!";
        statusText.classList.add('check');
        showGameOverOverlay("Checkmate!", `${game.turn() === 'w' ? 'Black' : 'White'} wins the game.`);
    } else if (game.in_draw()) {
        let drawReason = "Draw by agreement.";
        if (game.in_stalemate()) drawReason = "Stalemate! No legal moves.";
        else if (game.in_threefold_repetition()) drawReason = "Threefold repetition.";
        else if (game.insufficient_material()) drawReason = "Insufficient material to mate.";

        statusText.textContent = "DRAW MATCH";
        statusText.classList.remove('check');
        showGameOverOverlay("Draw!", drawReason);
    } else {
        const turn = game.turn();
        if (turn === 'w') {
            statusText.textContent = game.in_check() ? "WHITE IN CHECK!" : "White's Turn";
            whiteCard.classList.add('active');
            blackCard.classList.remove('active');

            document.getElementById('white-player-status').textContent = "Your Turn";
            document.getElementById('black-player-status').textContent = "Waiting";
        } else {
            statusText.textContent = game.in_check() ? "BLACK IN CHECK!" : "Black's Turn";
            blackCard.classList.add('active');
            whiteCard.classList.remove('active');

            document.getElementById('white-player-status').textContent = "Waiting";
            document.getElementById('black-player-status').textContent = gameMode === 'ai' ? "Thinking..." : "Their Turn";
        }

        if (game.in_check()) {
            statusText.classList.add('check');
        } else {
            statusText.classList.remove('check');
        }
    }
}

// Append rows dynamically to Move History list
function updateMoveHistory() {
    const historyBody = document.getElementById('move-history-body');
    historyBody.innerHTML = '';

    const history = game.history({ verbose: true });

    for (let i = 0; i < history.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = history[i];
        const blackMove = history[i + 1];

        const tr = document.createElement('tr');

        // Move counter cell
        const tdNum = document.createElement('td');
        tdNum.className = 'move-num';
        tdNum.textContent = `${moveNumber}.`;
        tr.appendChild(tdNum);

        // White move cell
        const tdWhite = document.createElement('td');
        tdWhite.textContent = whiteMove ? whiteMove.san : '';
        if (whiteMove) {
            tdWhite.className = 'move-history-move';
            tdWhite.dataset.ply = String(i + 1);
            tdWhite.title = 'Jump to this position';
            tdWhite.addEventListener('click', () => enterReviewAtPly(i + 1));
            if (getReviewPly() === i + 1) {
                tdWhite.classList.add('active');
            }
        }
        tr.appendChild(tdWhite);

        // Black move cell
        const tdBlack = document.createElement('td');
        tdBlack.textContent = blackMove ? blackMove.san : '';
        if (blackMove) {
            tdBlack.className = 'move-history-move';
            tdBlack.dataset.ply = String(i + 2);
            tdBlack.title = 'Jump to this position';
            tdBlack.addEventListener('click', () => enterReviewAtPly(i + 2));
            if (getReviewPly() === i + 2) {
                tdBlack.classList.add('active');
            }
        }
        tr.appendChild(tdBlack);

        historyBody.appendChild(tr);
    }

    // Auto-scroll the log container to bottom
    const scrollContainer = document.querySelector('.move-history-scroll');
    const activeMove = historyBody.querySelector('.move-history-move.active');
    if (activeMove) {
        activeMove.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
}

// Compute captured pieces by counting pieces remaining vs standard set
function updateCapturedPieces() {
    const whiteCaptures = document.getElementById('white-captures');
    const blackCaptures = document.getElementById('black-captures');
    const whiteMaterial = document.getElementById('white-material');
    const blackMaterial = document.getElementById('black-material');
    whiteCaptures.innerHTML = '';
    blackCaptures.innerHTML = '';
    whiteMaterial.textContent = '';
    blackMaterial.textContent = '';
    whiteMaterial.classList.remove('active');
    blackMaterial.classList.remove('active');

    const standardPieces = {
        p: 8, n: 2, b: 2, r: 2, q: 1
    };
    const pieceValues = {
        p: 1, n: 3, b: 3, r: 5, q: 9
    };

    const activePieces = {
        w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
        b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };

    // Tally board pieces for the currently displayed position
    getDisplayGame().board().forEach(row => {
        row.forEach(piece => {
            if (piece && piece.type !== 'k') {
                activePieces[piece.color][piece.type]++;
            }
        });
    });

    let whiteCapturedValue = 0;
    let blackCapturedValue = 0;

    // Calculate White captures (White captured Black pieces)
    for (const type in standardPieces) {
        const count = standardPieces[type] - activePieces.b[type];
        whiteCapturedValue += count * pieceValues[type];
        for (let i = 0; i < count; i++) {
            whiteCaptures.appendChild(createCapturedPieceIcon('b', type));
        }
    }

    // Calculate Black captures (Black captured White pieces)
    for (const type in standardPieces) {
        const count = standardPieces[type] - activePieces.w[type];
        blackCapturedValue += count * pieceValues[type];
        for (let i = 0; i < count; i++) {
            blackCaptures.appendChild(createCapturedPieceIcon('w', type));
        }
    }

    const materialDiff = whiteCapturedValue - blackCapturedValue;
    if (materialDiff > 0) {
        whiteMaterial.textContent = `+${materialDiff}`;
        whiteMaterial.classList.add('active');
    } else if (materialDiff < 0) {
        blackMaterial.textContent = `+${Math.abs(materialDiff)}`;
        blackMaterial.classList.add('active');
    }
}

function createCapturedPieceIcon(color, type) {
    const img = document.createElement('img');
    img.className = `captured-piece ${color === 'b' ? 'captured-piece-black' : 'captured-piece-white'}`;
    img.src = `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${color}${type.toUpperCase()}.svg`;
    img.alt = `${color === 'w' ? 'White' : 'Black'} ${type}`;
    return img;
}

// Overlay Card showing results
function showGameOverOverlay(title, description) {
    if (gameOverOverlayDismissed) return;

    const overlay = document.getElementById('game-over-overlay');
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-description').textContent = description;
    overlay.classList.remove('hidden');
}

function closeGameOverOverlay() {
    gameOverOverlayDismissed = true;
    document.getElementById('game-over-overlay').classList.add('hidden');
}

function reviewFinishedGame() {
    closeGameOverOverlay();
    reviewPly = null;
    selectedSquare = null;
    validMoves = [];
    updateUI();
}

// -------------------------------------------------------------
// CHESS AI ENGINE (Minimax Search with Alpha-Beta Pruning)
// -------------------------------------------------------------

function triggerAiMove() {
    isAiThinking = true;
    document.getElementById('black-thinking-spinner').classList.remove('hidden');

    // Brief delay to make the AI look human
    setTimeout(() => {
        const bestMove = getAiBestMove();
        if (bestMove) {
            executeMove(bestMove.from, bestMove.to, bestMove.promotion);
        }
        isAiThinking = false;
        document.getElementById('black-thinking-spinner').classList.add('hidden');
        updateUI();
    }, 600);
}

function getAiBestMove() {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Easy mode: 50% random moves, 50% depth 1 minimax search
    if (aiDifficulty === 'easy') {
        if (Math.random() < 0.5) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        return minimaxSearch(1, false, -Infinity, Infinity).move;
    }

    // Medium mode: Depth 2 minimax evaluation
    if (aiDifficulty === 'medium') {
        return minimaxSearch(2, false, -Infinity, Infinity).move;
    }

    // Hard mode: Depth 3 minimax evaluation with move ordering
    if (aiDifficulty === 'hard') {
        return minimaxSearch(3, false, -Infinity, Infinity).move;
    }

    return moves[0];
}

// Helper to estimate piece utility
function getPieceValue(piece, x, y) {
    if (!piece) return 0;

    let absoluteValue = 0;
    switch (piece.type) {
        case 'p':
            absoluteValue = 100 + (piece.color === 'w' ? pawnEval[y][x] : pawnEval[7 - y][x]) * 10;
            break;
        case 'r':
            absoluteValue = 500 + (piece.color === 'w' ? rookEval[y][x] : rookEval[7 - y][x]) * 10;
            break;
        case 'n':
            absoluteValue = 320 + (piece.color === 'w' ? knightEval[y][x] : knightEval[7 - y][x]) * 10;
            break;
        case 'b':
            absoluteValue = 330 + (piece.color === 'w' ? bishopEval[y][x] : bishopEval[7 - y][x]) * 10;
            break;
        case 'q':
            absoluteValue = 900 + (piece.color === 'w' ? queenEval[y][x] : queenEval[7 - y][x]) * 10;
            break;
        case 'k':
            absoluteValue = 20000 + (piece.color === 'w' ? kingEval[y][x] : kingEval[7 - y][x]) * 10;
            break;
    }

    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

// Evaluate entire board state statically from White's perspective
function evaluateBoard() {
    let totalScore = 0;
    const board = game.board();
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            totalScore += getPieceValue(board[y][x], x, y);
        }
    }
    return totalScore;
}

// Simple move scoring heuristic to ordering moves for faster alpha-beta cuts
function scoreMove(move) {
    let score = 0;

    // Captures: MVV-LVA (Most Valuable Victim, Least Valuable Attacker)
    if (move.captured) {
        const victimValue = getAbsoluteValue(move.captured);
        const attackerValue = getAbsoluteValue(move.piece);
        score += 10 * victimValue - attackerValue + 1000;
    }

    // Pawn Promotions
    if (move.promotion) {
        score += 900;
    }

    // Moving out of check
    if (game.in_check()) {
        score += 50;
    }

    return score;
}

function getAbsoluteValue(pieceType) {
    switch (pieceType) {
        case 'p': return 100;
        case 'n': return 320;
        case 'b': return 330;
        case 'r': return 500;
        case 'q': return 900;
        case 'k': return 20000;
        default: return 0;
    }
}

// Minimax with Alpha-Beta Pruning
function minimaxSearch(depth, isMaximizing, alpha, beta) {
    if (depth === 0 || game.game_over()) {
        return { score: evaluateBoard(), move: null };
    }

    const rawMoves = game.moves({ verbose: true });

    // Order moves to optimize pruning
    const moves = rawMoves.map(move => ({
        move,
        score: scoreMove(move)
    })).sort((a, b) => b.score - a.score).map(x => x.move);

    let bestMove = null;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            const evaluation = minimaxSearch(depth - 1, false, alpha, beta).score;
            game.undo();

            if (evaluation > maxEval) {
                maxEval = evaluation;
                bestMove = moves[i];
            }
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            const evaluation = minimaxSearch(depth - 1, true, alpha, beta).score;
            game.undo();

            if (evaluation < minEval) {
                minEval = evaluation;
                bestMove = moves[i];
            }
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return { score: minEval, move: bestMove };
    }
}

// -------------------------------------------------------------
// EVENT HANDLERS & BUTTON BINDINGS
// -------------------------------------------------------------

document.getElementById('player-name').addEventListener('change', (e) => {
    updateSelectedPlayer(e.target.value);
    if (game.history().length === 0) {
        setSaveStatus(`Ready for ${currentPlayer}.`);
    }
});

document.getElementById('saved-games-filter').addEventListener('change', renderSavedGames);
document.getElementById('btn-refresh-games').addEventListener('click', fetchSavedGames);

// Toggle Opponent (AI vs Local)
document.getElementById('game-mode').addEventListener('change', (e) => {
    gameMode = e.target.value;
    const aiGroup = document.getElementById('ai-difficulty-group');
    const blackName = document.getElementById('black-player-name');

    if (gameMode === 'ai') {
        aiGroup.classList.remove('hidden');
        blackName.textContent = `Computer (AI - ${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})`;
    } else {
        aiGroup.classList.add('hidden');
        blackName.textContent = "Player 2 (Black)";
    }

    restartGame();
});

// Toggle AI Difficulty
document.getElementById('ai-difficulty').addEventListener('change', (e) => {
    aiDifficulty = e.target.value;
    if (gameMode === 'ai') {
        document.getElementById('black-player-name').textContent = `Computer (AI - ${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})`;
    }
    restartGame();
});

// Sound Toggle
document.getElementById('btn-sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');

    if (soundEnabled) {
        iconOn.classList.remove('hidden');
        iconOff.classList.add('hidden');
    } else {
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
    }
});

// Flip Board
document.getElementById('btn-flip').addEventListener('click', () => {
    boardFlipped = !boardFlipped;
    renderBoard();
});

// Restart Game
function restartGame() {
    game.reset();
    selectedSquare = null;
    validMoves = [];
    lastMove = null;
    reviewPly = null;
    currentGameSaved = false;
    currentLoadedGameId = null;
    gameOverOverlayDismissed = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
    updateUI();
}

document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-overlay-restart').addEventListener('click', restartGame);
document.getElementById('btn-overlay-review').addEventListener('click', reviewFinishedGame);

// Undo Move
document.getElementById('btn-undo').addEventListener('click', () => {
    if (isAiThinking) return;
    reviewPly = null;

    if (gameMode === 'ai') {
        // Undo twice (AI move + player move)
        if (game.history().length >= 2) {
            game.undo();
            game.undo();

            // Recalculate previous last move
            const history = game.history({ verbose: true });
            if (history.length > 0) {
                const prev = history[history.length - 1];
                lastMove = { from: prev.from, to: prev.to };
            } else {
                lastMove = null;
            }
        }
    } else {
        // Local mode: Undo once
        if (game.history().length >= 1) {
            game.undo();

            const history = game.history({ verbose: true });
            if (history.length > 0) {
                const prev = history[history.length - 1];
                lastMove = { from: prev.from, to: prev.to };
            } else {
                lastMove = null;
            }
        }
    }

    selectedSquare = null;
    validMoves = [];
    updateUI();
});

// Export Game to Lichess
document.getElementById('btn-export').addEventListener('click', () => {
    const pgn = game.pgn();

    // Copy PGN to clipboard
    navigator.clipboard.writeText(pgn).then(() => {
        const btnText = document.getElementById('btn-export-text');
        const originalText = btnText.textContent;
        btnText.textContent = "Copied! Opening Lichess...";

        // Success audio chime
        if (soundEnabled) {
            initAudio();
            if (audioCtx) {
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            }
        }

        // Open Lichess paste page in a new window/tab
        window.open('https://lichess.org/paste', '_blank');

        // Revert text
        setTimeout(() => {
            btnText.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Could not copy PGN: ', err);
        // Fallback: just open Lichess
        window.open('https://lichess.org/paste', '_blank');
    });
});

document.addEventListener('keydown', (e) => {
    const target = e.target;
    const isTypingTarget = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );
    if (isTypingTarget || pendingPromotion) return;

    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepReview(-1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepReview(1);
    }
});

// Click outside board clears selection
document.addEventListener('click', (e) => {
    if (!e.target.closest('#chess-board') && !e.target.closest('#promotion-overlay')) {
        if (selectedSquare) {
            selectedSquare = null;
            validMoves = [];
            renderBoard();
        }
    }
});

// Page Initialization
window.addEventListener('load', () => {
    updateSelectedPlayer(document.getElementById('player-name').value);
    updateUI();
    fetchSavedGames();
});
