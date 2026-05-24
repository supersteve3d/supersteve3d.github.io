/**
 * Steve's Vibe Coded Chess Program - Chess Game Logic & AI Opponent
 * Uses chess.js for move validation and state management.
 */

// Initialize chess.js
let game = new Chess();

const SUPABASE_URL = 'https://duvohiskcdlsvawyvhpq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SnqVU4BFVL237B2ZOJeRVg_0KyPpr_o';
const SUPABASE_GAMES_TABLE = 'browser_chess_games';
const SUPABASE_LIVE_TABLE = 'browser_chess_live_games';
const PLAYER_NAMES = ['Mum', 'David', 'Anonymous'];
const HEAD_TO_HEAD_PLAYERS = ['Mum', 'David'];
const APP_VERSION = '5.9';
const DIFFICULTY_POINTS = {
    easy: 3,
    medium: 5,
    hard: 8,
    local: 0,
    online: 20
};

// State variables
let boardFlipped = false;
let selectedSquare = null;
let validMoves = [];
let gameMode = 'ai'; // 'ai' or 'local'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let playerColor = 'w';
let onlineRole = 'player';
let pieceTheme = 'classic'; // 'classic' or future hosted custom sets
let funEffectsEnabled = true;
let annotationMode = false;
let annotationDrag = null;
let annotationDraft = null;
let annotationTapFrom = null;
let suppressAnnotationClick = false;
const boardArrows = [];
const boardCircles = [];
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
let liveGame = null;
let liveSyncTimer = null;
let liveSyncInFlight = false;

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
            if (funEffectsEnabled) {
                playFunCaptureSound(now);
                break;
            }
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

function playFunCaptureSound(now) {
    const burst = [
        { freq: 180, type: 'sawtooth', gain: 0.08, delay: 0, duration: 0.12 },
        { freq: 420, type: 'square', gain: 0.055, delay: 0.04, duration: 0.18 },
        { freq: 720, type: 'triangle', gain: 0.04, delay: 0.1, duration: 0.2 }
    ];

    burst.forEach(({ freq, type, gain, delay, duration }) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + delay + duration);
        gainNode.gain.setValueAtTime(gain, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        osc.start(now + delay);
        osc.stop(now + delay + duration);
    });
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

function setLiveStatus(message, type = '') {
    const el = document.getElementById('online-room-status');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('success', 'error');
    if (type) el.classList.add(type);
}

function normalizeRoomCode(value) {
    return (value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function getOpponentName(player) {
    return player === 'Mum' ? 'David' : 'Mum';
}

function getPieceGlyph(type) {
    return {
        k: 'K',
        q: 'Q',
        r: 'R',
        b: 'B',
        n: 'N',
        p: 'P'
    }[type] || '?';
}

function getCaptureEffectScale(type) {
    return {
        p: 1,
        n: 1.45,
        b: 1.45,
        r: 1.9,
        q: 4.8
    }[type] || 1;
}

function setCaptureBurstScale(el, scale) {
    const visualScale = Math.min(scale, 2.4);
    const sparkBase = [
        [-46, -36],
        [42, -34],
        [-48, 28],
        [46, 32],
        [0, -54],
        [0, 48]
    ];

    el.style.setProperty('--burst-font-size', `${16 * Math.min(scale, 2.2)}px`);
    el.style.setProperty('--word-start-scale', `${0.35 * scale}`);
    el.style.setProperty('--word-pop-scale', `${1.05 * scale}`);
    el.style.setProperty('--word-end-scale', `${0.92 * scale}`);
    el.style.setProperty('--word-mid-rise', `${-90 * visualScale}%`);
    el.style.setProperty('--word-end-rise', `${-138 * visualScale}%`);
    el.style.setProperty('--ring-start-scale', `${0.2 * scale}`);
    el.style.setProperty('--ring-end-scale', `${5.2 * scale}`);
    el.style.setProperty('--spark-size', `${10 * Math.min(scale, 2.4)}px`);
    el.style.setProperty('--spark-end-scale', `${1.2 + scale * 0.35}`);

    sparkBase.forEach(([x, y], index) => {
        el.style.setProperty(`--spark-${index + 1}-x`, `${x * scale}px`);
        el.style.setProperty(`--spark-${index + 1}-y`, `${y * scale}px`);
    });
}

function getPieceMarkup(color, type) {
    const alt = `${color === 'w' ? 'White' : 'Black'} ${type}`;
    if (pieceTheme === 'classic') {
        return `<img src="https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${color}${type.toUpperCase()}.svg" alt="${alt}" />`;
    }
    return `<span class="custom-piece custom-piece-${color}" aria-label="${alt}">${getPieceGlyph(type)}</span>`;
}

function getPlayerNameForColor(color) {
    if (!liveGame) return color === 'w' ? currentPlayer : 'Player 2';
    return color === 'w' ? liveGame.whitePlayer : liveGame.blackPlayer;
}

function getAiPlayerName(color) {
    if (gameMode !== 'ai') return color === 'w' ? currentPlayer : 'Player 2';
    if (color === playerColor) {
        return currentPlayer === 'Anonymous' ? 'Player' : currentPlayer;
    }
    return `Computer (${aiDifficulty})`;
}

async function supabaseRequest(path, options = {}) {
    const headers = getSupabaseHeaders(options.headers || {});
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers
    });
    if (!response.ok) {
        throw new Error(`Supabase returned ${response.status}`);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
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
    return playerColor;
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

function getFullMoveCount(savedGame) {
    return savedGame.half_moves ? Math.ceil(savedGame.half_moves / 2) : 0;
}

function getSavedGameDifficulty(savedGame) {
    if (savedGame.game_mode === 'online') return 'online';
    if (savedGame.game_mode === 'local') return 'local';
    return savedGame.ai_difficulty || 'medium';
}

function getMoveLengthBonus(fullMoves) {
    if (!fullMoves) return 0;
    if (fullMoves <= 25) return 2;
    if (fullMoves <= 40) return 1;
    if (fullMoves >= 70) return -1;
    return 0;
}

function getCompetitionPoints(savedGame) {
    const difficulty = getSavedGameDifficulty(savedGame);
    const basePoints = DIFFICULTY_POINTS[difficulty] || DIFFICULTY_POINTS.medium;
    const fullMoves = getFullMoveCount(savedGame);

    if (savedGame.result === 'win') {
        return Math.max(1, basePoints + getMoveLengthBonus(fullMoves));
    }
    if (savedGame.result === 'draw') {
        if (difficulty === 'online') return 8;
        return Math.max(1, Math.floor(basePoints / 2));
    }
    return 0;
}

function buildSavedGamePayload(overrides = {}) {
    const history = game.history({ verbose: true });
    return {
        player: currentPlayer,
        result: getGameResultForCurrentPlayer(),
        pgn: game.pgn(),
        opponent: gameMode === 'ai' ? `Computer (${aiDifficulty})` : 'Local Player',
        game_mode: gameMode,
        ai_difficulty: gameMode === 'ai' ? aiDifficulty : null,
        half_moves: history.length,
        ...overrides
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
    if (gameMode === 'online') return;
    if (currentGameSaved || currentLoadedGameId || !game.game_over()) return;

    const opponentLabel = gameMode === 'ai'
        ? `Computer (${aiDifficulty}, ${playerColor === 'w' ? 'Black' : 'White'})`
        : undefined;
    const payload = buildSavedGamePayload(opponentLabel ? { opponent: opponentLabel } : {});
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
    updatePlayerLabels();
}

function updatePlayerLabels() {
    const whiteName = document.getElementById('white-player-name');
    const blackName = document.getElementById('black-player-name');

    if (liveGame) {
        whiteName.textContent = `${liveGame.whitePlayer} (White)`;
        blackName.textContent = `${liveGame.blackPlayer} (Black)`;
        return;
    }

    if (gameMode === 'ai') {
        whiteName.textContent = `${getAiPlayerName('w')} (White)`;
        blackName.textContent = `${getAiPlayerName('b')} (Black)`;
    } else {
        whiteName.textContent = currentPlayer === 'Anonymous'
            ? 'Player 1 (White)'
            : `${currentPlayer} (White)`;
        blackName.textContent = 'Player 2 (Black)';
    }
}

function renderScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    const totals = PLAYER_NAMES.reduce((acc, player) => {
        acc[player] = { played: 0, wins: 0, points: 0, fullMoves: 0, gamesWithMoves: 0 };
        return acc;
    }, {});

    savedGames.forEach(savedGame => {
        if (!totals[savedGame.player]) return;
        const fullMoves = getFullMoveCount(savedGame);
        totals[savedGame.player].played += 1;
        totals[savedGame.player].points += getCompetitionPoints(savedGame);
        if (fullMoves) {
            totals[savedGame.player].fullMoves += fullMoves;
            totals[savedGame.player].gamesWithMoves += 1;
        }
        if (savedGame.result === 'win') {
            totals[savedGame.player].wins += 1;
        }
    });

    const rankedPlayers = [...PLAYER_NAMES].sort((a, b) => {
        if (totals[b].points !== totals[a].points) return totals[b].points - totals[a].points;
        if (totals[b].wins !== totals[a].wins) return totals[b].wins - totals[a].wins;
        if (totals[b].played !== totals[a].played) return totals[b].played - totals[a].played;
        return PLAYER_NAMES.indexOf(a) - PLAYER_NAMES.indexOf(b);
    });
    const rankClasses = ['rank-gold', 'rank-silver', 'rank-bronze'];
    const uniqueScores = [...new Set(rankedPlayers.map(player => totals[player].points))];
    const medalByPlayer = {};

    if (uniqueScores.length === 1) {
        rankedPlayers.forEach(player => {
            medalByPlayer[player] = 2;
        });
    } else if (uniqueScores.length === 2) {
        const topScore = uniqueScores[0];
        const topGroup = rankedPlayers.filter(player => totals[player].points === topScore);
        rankedPlayers.forEach(player => {
            if (topGroup.length > 1) {
                medalByPlayer[player] = topGroup.includes(player) ? 1 : 2;
            } else {
                medalByPlayer[player] = topGroup.includes(player) ? 0 : 1;
            }
        });
    } else {
        rankedPlayers.forEach((player, index) => {
            medalByPlayer[player] = index;
        });
    }

    rankedPlayers.forEach((player, index) => {
        const row = scoreboard.querySelector(`[data-player="${player}"]`);
        row.classList.remove('rank-gold', 'rank-silver', 'rank-bronze');
        const medalIndex = medalByPlayer[player];
        const averageMoves = totals[player].gamesWithMoves
            ? Math.round(totals[player].fullMoves / totals[player].gamesWithMoves)
            : '-';
        row.classList.add(rankClasses[medalIndex]);
        row.querySelector('.score-medal').textContent = totals[player].points;
        row.querySelector('.score-medal').setAttribute('aria-label', `${totals[player].points} competition points`);
        row.querySelector('[data-score="wins"]').textContent = totals[player].wins;
        row.querySelector('[data-score="played"]').textContent = totals[player].played;
        row.querySelector('[data-score="average"]').textContent = averageMoves;
        scoreboard.appendChild(row);
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

function getLivePlayerColor() {
    return liveGame ? liveGame.color : null;
}

function isSpectatingLiveGame() {
    return gameMode === 'online' && liveGame && liveGame.role === 'spectator';
}

function canControlPiece(piece) {
    if (!piece) return false;
    if (gameMode === 'ai') return piece.color === playerColor || (piece.color !== playerColor && isAiThinking);
    if (gameMode === 'local') return true;
    if (gameMode !== 'online' || !liveGame) return false;
    if (isSpectatingLiveGame()) return false;
    if (!liveGame.whiteReady || !liveGame.blackReady) return false;
    return piece.color === liveGame.color && game.turn() === liveGame.color && !game.game_over();
}

function updateLiveRoomDisplay() {
    const panel = document.getElementById('online-room-panel');
    const codeDisplay = document.getElementById('live-room-code-display');
    const leaveButton = document.getElementById('btn-leave-room');
    const createButton = document.getElementById('btn-create-room');
    const joinButton = document.getElementById('btn-join-room');
    const roomInput = document.getElementById('room-code-input');

    panel.classList.toggle('hidden', gameMode !== 'online');
    if (gameMode !== 'online') return;

    codeDisplay.textContent = liveGame ? liveGame.code : 'Not connected';
    leaveButton.classList.toggle('hidden', !liveGame);
    createButton.disabled = !!liveGame || onlineRole === 'spectator';
    joinButton.disabled = !!liveGame;
    roomInput.disabled = !!liveGame;
}

function applyLiveRoomState(row, message = '') {
    if (!row) return;

    const loaded = row.pgn ? game.load_pgn(row.pgn) : (game.reset() || true);
    if (!loaded) {
        setLiveStatus('Could not read the live game position.', 'error');
        return;
    }

    liveGame = {
        ...liveGame,
        code: row.code,
        role: onlineRole,
        color: onlineRole === 'spectator'
            ? null
            : currentPlayer === row.black_player ? 'b' : 'w',
        whitePlayer: row.white_player,
        blackPlayer: row.black_player,
        moveCount: row.move_count || 0,
        status: row.status,
        archiveSaved: row.archive_saved,
        whiteReady: row.white_ready,
        blackReady: row.black_ready
    };

    currentLoadedGameId = row.code;
    currentGameSaved = !!row.archive_saved;
    lastMove = row.last_move || null;
    reviewPly = null;
    selectedSquare = null;
    validMoves = [];
    gameOverOverlayDismissed = false;
    updatePlayerLabels();
    updateLiveRoomDisplay();
    updateUI();

    if (message) {
        setLiveStatus(message, 'success');
    } else if (row.status === 'active' && (!row.white_ready || !row.black_ready)) {
        const waitingFor = row.white_ready ? row.black_player : row.white_player;
        setLiveStatus(`Room ${row.code} ready. Waiting for ${waitingFor} to join.`, 'success');
    } else if (row.status === 'active' && isSpectatingLiveGame()) {
        setLiveStatus(`Spectating room ${row.code}.`, 'success');
    } else if (row.status === 'active') {
        setLiveStatus(`Room ${row.code} synced. You are ${liveGame.color === 'w' ? 'White' : 'Black'}.`, 'success');
    } else {
        setLiveStatus(`Room ${row.code} finished.`, 'success');
    }

    if (row.status === 'finished' && !row.archive_saved) {
        archiveCompletedLiveGame(row);
    }
}

async function fetchLiveRoom(code) {
    const rows = await supabaseRequest(
        `${SUPABASE_LIVE_TABLE}?code=eq.${encodeURIComponent(code)}&select=*&limit=1`,
        { headers: { Accept: 'application/json' } }
    );
    return rows && rows.length ? rows[0] : null;
}

function startLiveSync() {
    stopLiveSync();
    liveSyncTimer = window.setInterval(syncLiveGame, 1500);
}

function stopLiveSync() {
    if (liveSyncTimer) {
        window.clearInterval(liveSyncTimer);
        liveSyncTimer = null;
    }
    liveSyncInFlight = false;
}

async function createLiveRoom() {
    if (onlineRole === 'spectator') {
        setLiveStatus('Spectators can join an existing room with a code.', 'error');
        return;
    }
    if (!HEAD_TO_HEAD_PLAYERS.includes(currentPlayer)) {
        setLiveStatus('Choose Mum or David before creating an online room.', 'error');
        return;
    }

    const opponent = getOpponentName(currentPlayer);
    const creatorIsWhite = playerColor === 'w';
    const whitePlayer = creatorIsWhite ? currentPlayer : opponent;
    const blackPlayer = creatorIsWhite ? opponent : currentPlayer;
    setLiveStatus('Creating room...');

    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateRoomCode();
        try {
            const rows = await supabaseRequest(SUPABASE_LIVE_TABLE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify({
                    code,
                    white_player: whitePlayer,
                    black_player: blackPlayer,
                    white_ready: creatorIsWhite,
                    black_ready: !creatorIsWhite,
                    pgn: '',
                    fen: game.fen(),
                    move_count: 0,
                    status: 'active',
                    archive_saved: false
                })
            });
            boardFlipped = !creatorIsWhite;
            applyLiveRoomState(rows[0], `Room ${code} created. ${opponent} can join with this code.`);
            startLiveSync();
            return;
        } catch (error) {
            if (attempt === 4) {
                console.error('Could not create live room:', error);
                setLiveStatus('Could not create a room. Paste the v5.0 Supabase SQL if you have not yet.', 'error');
            }
        }
    }
}

async function joinLiveRoom() {
    if (onlineRole === 'player' && !HEAD_TO_HEAD_PLAYERS.includes(currentPlayer)) {
        setLiveStatus('Choose Mum or David before joining an online room.', 'error');
        return;
    }

    const code = normalizeRoomCode(document.getElementById('room-code-input').value);
    if (!code) {
        setLiveStatus('Enter the room code from the other phone.', 'error');
        return;
    }

    setLiveStatus(`Joining ${code}...`);
    try {
        const room = await fetchLiveRoom(code);
        if (!room) {
            setLiveStatus(`No live room found for ${code}.`, 'error');
            return;
        }
        if (onlineRole === 'spectator') {
            boardFlipped = false;
            applyLiveRoomState(room, `Spectating room ${code}.`);
            startLiveSync();
            return;
        }
        if (![room.white_player, room.black_player].includes(currentPlayer)) {
            setLiveStatus(`Room ${code} is for ${room.white_player} and ${room.black_player}.`, 'error');
            return;
        }

        const readyField = currentPlayer === room.white_player ? 'white_ready' : 'black_ready';
        const rows = await supabaseRequest(`${SUPABASE_LIVE_TABLE}?code=eq.${encodeURIComponent(code)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            },
            body: JSON.stringify({
                [readyField]: true,
                updated_at: new Date().toISOString()
            })
        });
        boardFlipped = currentPlayer === room.black_player;
        applyLiveRoomState(rows[0], `Joined room ${code}. You are ${currentPlayer === room.white_player ? 'White' : 'Black'}.`);
        startLiveSync();
    } catch (error) {
        console.error('Could not join live room:', error);
        setLiveStatus('Could not join. Check the room code and Supabase table.', 'error');
    }
}

async function leaveLiveGame(resetBoard = true) {
    if (liveGame && !isSpectatingLiveGame()) {
        const readyField = liveGame.color === 'w' ? 'white_ready' : 'black_ready';
        try {
            await supabaseRequest(`${SUPABASE_LIVE_TABLE}?code=eq.${encodeURIComponent(liveGame.code)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    [readyField]: false,
                    updated_at: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('Could not mark live room as left:', error);
        }
    }

    stopLiveSync();
    liveGame = null;
    currentLoadedGameId = null;
    currentGameSaved = false;
    updateLiveRoomDisplay();
    setLiveStatus('Left the live room.');
    if (resetBoard) restartGame(true);
}

async function syncLiveGame() {
    if (!liveGame || liveSyncInFlight) return;
    liveSyncInFlight = true;
    try {
        const row = await fetchLiveRoom(liveGame.code);
        if (!row) {
            setLiveStatus('Live room no longer exists.', 'error');
            stopLiveSync();
            return;
        }

        const localMoves = game.history().length;
        if (
            (row.move_count || 0) !== localMoves ||
            row.status !== liveGame.status ||
            row.archive_saved !== liveGame.archiveSaved ||
            row.white_ready !== liveGame.whiteReady ||
            row.black_ready !== liveGame.blackReady
        ) {
            applyLiveRoomState(row);
        }
    } catch (error) {
        console.warn('Live sync failed:', error);
        setLiveStatus('Live sync paused. Retrying...', 'error');
    } finally {
        liveSyncInFlight = false;
    }
}

function getLiveGameResultRows(row) {
    const halfMoves = row.move_count || 0;
    const common = {
        pgn: row.pgn || game.pgn(),
        game_mode: 'online',
        ai_difficulty: null,
        half_moves: halfMoves
    };

    if (row.result === 'draw') {
        return [
            { ...common, player: row.white_player, result: 'draw', opponent: row.black_player },
            { ...common, player: row.black_player, result: 'draw', opponent: row.white_player }
        ];
    }

    return [
        {
            ...common,
            player: row.white_player,
            result: row.winner_player === row.white_player ? 'win' : 'loss',
            opponent: row.black_player
        },
        {
            ...common,
            player: row.black_player,
            result: row.winner_player === row.black_player ? 'win' : 'loss',
            opponent: row.white_player
        }
    ];
}

async function archiveCompletedLiveGame(row) {
    try {
        const claimed = await supabaseRequest(
            `${SUPABASE_LIVE_TABLE}?code=eq.${encodeURIComponent(row.code)}&archive_saved=eq.false`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify({
                    archive_saved: true,
                    updated_at: new Date().toISOString()
                })
            }
        );
        if (!claimed || claimed.length === 0) return;

        const resultRows = getLiveGameResultRows(row);
        const createdRows = await supabaseRequest(SUPABASE_GAMES_TABLE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            },
            body: JSON.stringify(resultRows)
        });
        savedGames = [...createdRows, ...savedGames];
        currentGameSaved = true;
        renderScoreboard();
        renderSavedGames();
        setSaveStatus('Head-to-head game saved.', 'success');
    } catch (error) {
        console.error('Could not archive live game:', error);
        setSaveStatus('Live game finished but was not archived. Check Supabase policies.', 'error');
    }
}

async function publishLiveMove(previousMoveCount) {
    if (!liveGame) return;

    const result = game.in_draw()
        ? 'draw'
        : game.in_checkmate()
            ? 'win'
            : null;
    const winnerPlayer = game.in_checkmate()
        ? getPlayerNameForColor(game.turn() === 'w' ? 'b' : 'w')
        : null;
    const status = game.game_over() ? 'finished' : 'active';
    const payload = {
        pgn: game.pgn(),
        fen: game.fen(),
        move_count: game.history().length,
        status,
        result,
        winner_player: winnerPlayer,
        last_move: lastMove,
        updated_at: new Date().toISOString()
    };

    try {
        const rows = await supabaseRequest(
            `${SUPABASE_LIVE_TABLE}?code=eq.${encodeURIComponent(liveGame.code)}&move_count=eq.${previousMoveCount}&status=eq.active`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!rows || rows.length === 0) {
            setLiveStatus('Move was not sent because the room changed. Syncing latest board...', 'error');
            await syncLiveGame();
            return;
        }

        applyLiveRoomState(rows[0], status === 'finished' ? 'Game finished and synced.' : 'Move sent.');
    } catch (error) {
        console.error('Could not publish live move:', error);
        setLiveStatus('Could not send move. Syncing latest board...', 'error');
        await syncLiveGame();
    }
}

function openChangelog() {
    document.getElementById('changelog-overlay').classList.remove('hidden');
}

function closeChangelog() {
    document.getElementById('changelog-overlay').classList.add('hidden');
}

function openScoringGuide() {
    document.getElementById('scoring-overlay').classList.remove('hidden');
}

function closeScoringGuide() {
    document.getElementById('scoring-overlay').classList.add('hidden');
}

function toggleBoardCircle(square) {
    const existingIndex = boardCircles.findIndex(circle => circle.from === square);
    if (existingIndex >= 0) {
        boardCircles.splice(existingIndex, 1);
    } else {
        boardCircles.push({ from: square });
    }
}

function toggleBoardArrow(from, to) {
    const existingIndex = boardArrows.findIndex(arrow => arrow.from === from && arrow.to === to);
    if (existingIndex >= 0) {
        boardArrows.splice(existingIndex, 1);
    } else {
        boardArrows.push({ from, to });
    }
}

function clearBoardAnnotations() {
    boardArrows.length = 0;
    boardCircles.length = 0;
    annotationDraft = null;
    annotationDrag = null;
    annotationTapFrom = null;
    renderBoard();
}

function updateAnnotationModeButton() {
    const button = document.getElementById('btn-annotate');
    if (!button) return;
    button.classList.toggle('active', annotationMode);
    button.setAttribute('aria-pressed', annotationMode ? 'true' : 'false');
}

function squareCenter(squareName) {
    const fileIndex = squareName.charCodeAt(0) - 97;
    const rankIndex = 8 - Number(squareName[1]);
    const xIndex = boardFlipped ? 7 - fileIndex : fileIndex;
    const yIndex = boardFlipped ? 7 - rankIndex : rankIndex;
    return {
        x: (xIndex + 0.5) * 12.5,
        y: (yIndex + 0.5) * 12.5
    };
}

function renderAnnotationLayer(boardElement) {
    const circles = annotationTapFrom && !boardCircles.some(circle => circle.from === annotationTapFrom)
        ? [...boardCircles, { from: annotationTapFrom, draft: true }]
        : boardCircles;

    circles.forEach(circle => {
        const square = boardElement.querySelector(`.square[data-square="${circle.from}"]`);
        if (!square) return;
        const circleElement = document.createElement('div');
        circleElement.className = 'annotation-circle';
        if (circle.draft) circleElement.classList.add('draft');
        circleElement.style.borderColor = '#ffe500';
        circleElement.style.boxShadow = '0 0 14px rgba(255, 229, 0, 0.34)';
        square.appendChild(circleElement);
    });

    const arrows = annotationDraft ? [...boardArrows, annotationDraft] : boardArrows;
    if (arrows.length === 0) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('annotation-layer');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'annotation-arrowhead');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '4');
    marker.setAttribute('markerHeight', '4');
    marker.setAttribute('orient', 'auto-start-reverse');

    const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    markerPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    markerPath.setAttribute('fill', '#ef233c');
    marker.appendChild(markerPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    arrows.forEach(arrow => {
        if (arrow.from === arrow.to) return;
        const start = squareCenter(arrow.from);
        const end = squareCenter(arrow.to);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy) || 1;
        const trim = 4.2;
        const lineEnd = {
            x: end.x - (dx / length) * trim,
            y: end.y - (dy / length) * trim
        };

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('annotation-arrow-line');
        if (arrow === annotationDraft) line.classList.add('draft');
        line.setAttribute('x1', String(start.x));
        line.setAttribute('y1', String(start.y));
        line.setAttribute('x2', String(lineEnd.x));
        line.setAttribute('y2', String(lineEnd.y));
        line.setAttribute('stroke', '#ef233c');
        line.setAttribute('stroke-width', '1.35');
        line.setAttribute('marker-end', 'url(#annotation-arrowhead)');
        svg.appendChild(line);
    });

    boardElement.appendChild(svg);
}

function getSquareFromPointerEvent(e) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    return target ? target.closest('.square') : null;
}

function startBoardAnnotation(e, squareName) {
    if (e.button !== 2 && !annotationMode) return false;
    e.preventDefault();
    e.stopPropagation();
    annotationDrag = { from: squareName, to: squareName, moved: false, button: e.button };
    annotationDraft = null;
    return true;
}

function updateBoardAnnotationDrag(e) {
    if (!annotationDrag) return;
    const square = getSquareFromPointerEvent(e);
    if (!square) return;
    const nextSquare = square.dataset.square;
    annotationDrag.moved = annotationDrag.moved || nextSquare !== annotationDrag.from;
    annotationDrag.to = nextSquare;
    annotationDraft = annotationDrag.moved
        ? { from: annotationDrag.from, to: annotationDrag.to }
        : null;
    renderBoard();
}

function finishBoardAnnotation(e) {
    if (!annotationDrag) return;
    e.preventDefault();
    e.stopPropagation();

    const { from, to, moved } = annotationDrag;
    if (annotationMode && annotationDrag.button !== 2 && !moved) {
        annotationDrag = null;
        annotationDraft = null;
        handleAnnotationTap(from);
        suppressAnnotationClick = true;
        window.setTimeout(() => {
            suppressAnnotationClick = false;
        }, 0);
        return;
    }

    if (moved && from !== to) {
        toggleBoardArrow(from, to);
    } else {
        toggleBoardCircle(from);
    }

    annotationDrag = null;
    annotationDraft = null;
    annotationTapFrom = null;
    suppressAnnotationClick = true;
    window.setTimeout(() => {
        suppressAnnotationClick = false;
    }, 0);
    renderBoard();
}

function handleAnnotationTap(squareName) {
    if (!annotationTapFrom) {
        annotationTapFrom = squareName;
    } else if (annotationTapFrom === squareName) {
        toggleBoardCircle(squareName);
        annotationTapFrom = null;
    } else {
        toggleBoardArrow(annotationTapFrom, squareName);
        annotationTapFrom = null;
    }
    renderBoard();
}

// Generate the Chess Board dynamically in HTML DOM
function renderBoard() {
    const boardElement = document.getElementById('chess-board');
    boardElement.onclick = handleBoardClick;
    boardElement.oncontextmenu = (e) => e.preventDefault();
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
    boardElement.classList.toggle('annotating', annotationMode);

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
            squareDiv.addEventListener('pointerdown', (e) => startBoardAnnotation(e, squareName));

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
                pieceDiv.className = `piece piece-theme-${pieceTheme} ${piece.color === 'w' ? 'white' : 'black'}`;
                pieceDiv.draggable = !reviewMode && !isAiThinking && canControlPiece(piece);

                // Standard Staunton representation from Lichess theme
                pieceDiv.innerHTML = getPieceMarkup(piece.color, piece.type);

                // Drag Events
                pieceDiv.addEventListener('dragstart', (e) => {
                    initAudio(); // Warm up context on drag
                    if (reviewMode || isAiThinking) {
                        e.preventDefault();
                        return;
                    }
                    if (!canControlPiece(piece)) {
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
    renderAnnotationLayer(boardElement);
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

function updateReviewControls() {
    const prevButton = document.getElementById('btn-review-prev');
    const nextButton = document.getElementById('btn-review-next');
    const livePly = getLivePlyCount();
    const reviewPlyValue = getReviewPly();
    prevButton.disabled = livePly === 0 || reviewPlyValue <= 0;
    nextButton.disabled = livePly === 0 || reviewPlyValue >= livePly;
}

function handleBoardClick(e) {
    const squareElement = e.target.closest('.square');
    if (!squareElement || !e.currentTarget.contains(squareElement)) return;

    e.stopPropagation();
    if (annotationMode) {
        if (suppressAnnotationClick) return;
        handleAnnotationTap(squareElement.dataset.square);
        return;
    }

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

    if (!canControlPiece(piece)) return;

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
        el.innerHTML = getPieceMarkup(color, type);
    });
}

function closePromotionDialog() {
    document.getElementById('promotion-overlay').classList.add('hidden');
    pendingPromotion = null;
}

function triggerCaptureCelebration(squareName, move) {
    if (!funEffectsEnabled) return;

    const square = document.querySelector(`.square[data-square="${squareName}"]`);
    const boardWrapper = document.querySelector('.board-wrapper');
    if (!square || !boardWrapper) return;

    const squareRect = square.getBoundingClientRect();
    const wrapperRect = boardWrapper.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = 'capture-celebration';
    burst.style.left = `${squareRect.left - wrapperRect.left + squareRect.width / 2}px`;
    burst.style.top = `${squareRect.top - wrapperRect.top + squareRect.height / 2}px`;
    setCaptureBurstScale(burst, getCaptureEffectScale(move.captured || 'p'));

    const captions = move.captured === 'q'
        ? ['QUEEN!', 'MEGA!', 'KABOOM!']
        : move.promotion
            ? ['POWER!', 'QUEEN!']
            : ['POW!', 'ZAP!', 'BOOM!'];
    const caption = captions[Math.floor(Math.random() * captions.length)];
    burst.innerHTML = `
        <span class="capture-word">${caption}</span>
        <span class="capture-ring"></span>
        <span class="capture-pop pop-1"></span>
        <span class="capture-pop pop-2"></span>
        <span class="capture-pop pop-3"></span>
        <span class="capture-pop pop-4"></span>
        <span class="capture-pop pop-5"></span>
        <span class="capture-pop pop-6"></span>
    `;

    boardWrapper.appendChild(burst);
    window.setTimeout(() => burst.remove(), 900);
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
    const movingPiece = game.get(from);
    if (!canControlPiece(movingPiece)) return;

    const previousMoveCount = game.history().length;
    const isCapture = game.get(to) !== null;

    const move = game.move({
        from: from,
        to: to,
        promotion: promotion
    });

    if (move === null) return; // Invalid move safeguard

    // Play sounds
    const capturedPiece = isCapture || move.flags.includes('e');
    if (game.in_checkmate() || game.in_draw()) {
        playSound('game-over');
    } else if (game.in_check()) {
        playSound('check');
    } else if (capturedPiece) { // Standard capture or en passant
        playSound('capture');
    } else {
        playSound('move');
    }
    if (capturedPiece) {
        triggerCaptureCelebration(to, move);
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

    if (gameMode === 'online') {
        publishLiveMove(previousMoveCount);
        return;
    }

    // Trigger the computer when the human's side is not on move.
    if (gameMode === 'ai' && game.turn() !== playerColor && !game.game_over()) {
        triggerAiMove();
    }
}

// Update game logs, captured pieces count, player indicator panels
function updateUI() {
    renderBoard();
    updateMoveHistory();
    updateCapturedPieces();
    updateGameStatus();
    updateReviewControls();
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

    if (gameMode === 'online' && liveGame && (!liveGame.whiteReady || !liveGame.blackReady)) {
        const waitingFor = liveGame.whiteReady ? liveGame.blackPlayer : liveGame.whitePlayer;
        statusText.textContent = `Waiting for ${waitingFor}`;
        statusText.classList.remove('check');
        whiteCard.classList.toggle('active', liveGame.color === 'w');
        blackCard.classList.toggle('active', liveGame.color === 'b');
        document.getElementById('white-player-status').textContent = liveGame.whiteReady ? "Ready" : "Waiting";
        document.getElementById('black-player-status').textContent = liveGame.blackReady ? "Ready" : "Waiting";
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
            const whiteName = gameMode === 'ai' ? getAiPlayerName('w') : getPlayerNameForColor('w');
            statusText.textContent = game.in_check() ? "WHITE IN CHECK!" : `${whiteName}'s Turn`;
            whiteCard.classList.add('active');
            blackCard.classList.remove('active');

            document.getElementById('white-player-status').textContent =
                gameMode === 'ai' && playerColor !== 'w' ? "Thinking..." :
                gameMode === 'online' && getLivePlayerColor() !== 'w' ? "Their Turn" :
                "Your Turn";
            document.getElementById('black-player-status').textContent = "Waiting";
        } else {
            const blackName = gameMode === 'ai' ? getAiPlayerName('b') : getPlayerNameForColor('b');
            statusText.textContent = game.in_check() ? "BLACK IN CHECK!" : `${blackName}'s Turn`;
            blackCard.classList.add('active');
            whiteCard.classList.remove('active');

            document.getElementById('white-player-status').textContent = "Waiting";
            document.getElementById('black-player-status').textContent = gameMode === 'ai'
                ? playerColor === 'b' ? "Your Turn" : "Thinking..."
                : gameMode === 'online' && getLivePlayerColor() === 'b'
                    ? "Your Turn"
                    : "Their Turn";
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
    const reviewMode = isReviewing();

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
            if (reviewMode && getReviewPly() === i + 1) {
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
            if (reviewMode && getReviewPly() === i + 2) {
                tdBlack.classList.add('active');
            }
        }
        tr.appendChild(tdBlack);

        historyBody.appendChild(tr);
    }

    // Auto-scroll the log container to bottom
    const scrollContainer = document.querySelector('.move-history-scroll');
    const activeMove = historyBody.querySelector('.move-history-move.active');
    if (reviewMode && activeMove) {
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
        if (count > 0) {
            whiteCaptures.appendChild(createCapturedPieceIcon('b', type, count));
        }
    }

    // Calculate Black captures (Black captured White pieces)
    for (const type in standardPieces) {
        const count = standardPieces[type] - activePieces.w[type];
        blackCapturedValue += count * pieceValues[type];
        if (count > 0) {
            blackCaptures.appendChild(createCapturedPieceIcon('w', type, count));
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

function createCapturedPieceIcon(color, type, count) {
    const wrapper = document.createElement('span');
    wrapper.className = `captured-piece captured-piece-${color === 'b' ? 'black' : 'white'}`;
    wrapper.innerHTML = getPieceMarkup(color, type);

    if (count > 1) {
        const countBadge = document.createElement('span');
        countBadge.className = 'captured-piece-count';
        countBadge.textContent = `x${count}`;
        wrapper.appendChild(countBadge);
    }

    return wrapper;
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
    const aiColor = game.turn();
    const spinner = document.getElementById(aiColor === 'w' ? 'white-thinking-spinner' : 'black-thinking-spinner');

    isAiThinking = true;
    spinner?.classList.remove('hidden');

    // Brief delay to make the AI look human
    setTimeout(() => {
        const bestMove = getAiBestMove();
        if (bestMove) {
            executeMove(bestMove.from, bestMove.to, bestMove.promotion);
        }
        isAiThinking = false;
        spinner?.classList.add('hidden');
        updateUI();
    }, 600);
}

function getAiBestMove() {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    const aiIsMaximizing = game.turn() === 'w';

    // Easy mode: 50% random moves, 50% depth 1 minimax search
    if (aiDifficulty === 'easy') {
        if (Math.random() < 0.5) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        return minimaxSearch(1, aiIsMaximizing, -Infinity, Infinity).move;
    }

    // Medium mode: Depth 2 minimax evaluation
    if (aiDifficulty === 'medium') {
        return minimaxSearch(2, aiIsMaximizing, -Infinity, Infinity).move;
    }

    // Hard mode: Depth 3 minimax evaluation with move ordering
    if (aiDifficulty === 'hard') {
        return minimaxSearch(3, aiIsMaximizing, -Infinity, Infinity).move;
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
    if (liveGame) {
        leaveLiveGame();
    }
    updateSelectedPlayer(e.target.value);
    if (game.history().length === 0) {
        setSaveStatus(`Ready for ${currentPlayer}.`);
    }
});

document.getElementById('saved-games-filter').addEventListener('change', renderSavedGames);
document.getElementById('btn-refresh-games').addEventListener('click', fetchSavedGames);
document.getElementById('btn-changelog').addEventListener('click', openChangelog);
document.getElementById('btn-changelog-close').addEventListener('click', closeChangelog);
document.getElementById('changelog-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'changelog-overlay') {
        closeChangelog();
    }
});
document.getElementById('btn-scoring').addEventListener('click', openScoringGuide);
document.getElementById('btn-scoring-close').addEventListener('click', closeScoringGuide);
document.getElementById('scoring-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'scoring-overlay') {
        closeScoringGuide();
    }
});
document.getElementById('btn-create-room').addEventListener('click', createLiveRoom);
document.getElementById('btn-join-room').addEventListener('click', joinLiveRoom);
document.getElementById('btn-leave-room').addEventListener('click', () => leaveLiveGame());
document.getElementById('btn-annotate').addEventListener('click', () => {
    annotationMode = !annotationMode;
    annotationTapFrom = null;
    updateAnnotationModeButton();
    renderBoard();
});
document.getElementById('btn-clear-annotations').addEventListener('click', clearBoardAnnotations);
document.getElementById('room-code-input').addEventListener('input', (e) => {
    e.target.value = normalizeRoomCode(e.target.value);
});

// Toggle Opponent (AI vs Local)
document.getElementById('game-mode').addEventListener('change', (e) => {
    if (liveGame) {
        leaveLiveGame(false);
    } else {
        stopLiveSync();
    }
    gameMode = e.target.value;
    const aiGroup = document.getElementById('ai-difficulty-group');
    const colorGroup = document.getElementById('player-color-group');
    const roleGroup = document.getElementById('online-role-group');
    const blackName = document.getElementById('black-player-name');

    if (gameMode === 'ai') {
        aiGroup.classList.remove('hidden');
        colorGroup.classList.remove('hidden');
        roleGroup.classList.add('hidden');
        updatePlayerLabels();
    } else if (gameMode === 'online') {
        aiGroup.classList.add('hidden');
        colorGroup.classList.toggle('hidden', onlineRole === 'spectator');
        roleGroup.classList.remove('hidden');
        blackName.textContent = "Waiting for room";
        if (onlineRole === 'player' && !HEAD_TO_HEAD_PLAYERS.includes(currentPlayer)) {
            setLiveStatus('Online games are only for Mum and David. Choose one of those names first.', 'error');
        } else {
            setLiveStatus('Create a room or enter the code from the other phone.');
        }
    } else {
        aiGroup.classList.add('hidden');
        colorGroup.classList.add('hidden');
        roleGroup.classList.add('hidden');
        updatePlayerLabels();
    }

    updateLiveRoomDisplay();
    restartGame();
});

// Toggle AI Difficulty
document.getElementById('ai-difficulty').addEventListener('change', (e) => {
    aiDifficulty = e.target.value;
    updatePlayerLabels();
    restartGame();
});

document.getElementById('player-color').addEventListener('change', (e) => {
    playerColor = e.target.value === 'b' ? 'b' : 'w';
    boardFlipped = playerColor === 'b';
    updatePlayerLabels();
    restartGame();
});

document.getElementById('online-role').addEventListener('change', (e) => {
    onlineRole = e.target.value === 'spectator' ? 'spectator' : 'player';
    if (liveGame) {
        leaveLiveGame(false);
    }
    updateLiveRoomDisplay();
    if (gameMode === 'online') {
        document.getElementById('player-color-group').classList.toggle('hidden', onlineRole === 'spectator');
        setLiveStatus(onlineRole === 'spectator'
            ? 'Enter a room code to spectate.'
            : 'Create a room or enter the code from the other phone.');
    }
    restartGame();
});

document.getElementById('piece-theme').addEventListener('change', (e) => {
    pieceTheme = e.target.value;
    renderBoard();
    updateCapturedPieces();
});

document.getElementById('fun-effects').addEventListener('change', (e) => {
    funEffectsEnabled = e.target.value === 'on';
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
function restartGame(skipLiveLeave = false) {
    if (gameMode === 'online' && liveGame && !skipLiveLeave) {
        leaveLiveGame(false);
    }
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
    if (gameMode === 'ai' && game.turn() !== playerColor && !game.game_over()) {
        triggerAiMove();
    }
}

document.getElementById('btn-restart').addEventListener('click', restartGame);
document.getElementById('btn-overlay-restart').addEventListener('click', restartGame);
document.getElementById('btn-overlay-review').addEventListener('click', reviewFinishedGame);
document.getElementById('btn-review-prev').addEventListener('click', () => stepReview(-1));
document.getElementById('btn-review-next').addEventListener('click', () => stepReview(1));

// Undo Move
document.getElementById('btn-undo').addEventListener('click', () => {
    if (isAiThinking) return;
    if (gameMode === 'online') {
        setLiveStatus('Undo is disabled in online rooms so both phones stay in sync.', 'error');
        return;
    }
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
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (boardArrows.length > 0 || boardCircles.length > 0 || annotationTapFrom) {
            e.preventDefault();
            clearBoardAnnotations();
        }
    } else if (e.key === 'Escape') {
        closeChangelog();
        closeScoringGuide();
    }
});

window.addEventListener('pointermove', updateBoardAnnotationDrag);
window.addEventListener('pointerup', finishBoardAnnotation);
window.addEventListener('blur', () => {
    annotationDrag = null;
    annotationDraft = null;
    renderBoard();
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
    document.getElementById('version-badge').textContent = `v${APP_VERSION}`;
    updateAnnotationModeButton();
    updateSelectedPlayer(document.getElementById('player-name').value);
    updateLiveRoomDisplay();
    updateUI();
    fetchSavedGames();
});
