/**
 * ia.js — IA de práctica para Tres Online
 *
 * Dificultad aleatoria por partida (el jugador nunca sabe cuál le toca):
 *   - fácil   (40%): movimiento aleatorio
 *   - medio   (35%): bloquea y ataca, sin lookahead profundo
 *   - difícil (25%): minimax completo — imbatible
 *
 * Las partidas contra IA son solo práctica — NO suman al ranking.
 */

const DIFICULTADES = [
    { nivel: 'fácil',    peso: 40 },
    { nivel: 'medio',    peso: 35 },
    { nivel: 'difícil',  peso: 25 },
];

/** Elige dificultad aleatoria ponderada */
export function elegirDificultad() {
    const total = DIFICULTADES.reduce((s, d) => s + d.peso, 0);
    let r = Math.random() * total;
    for (const d of DIFICULTADES) {
        r -= d.peso;
        if (r <= 0) return d.nivel;
    }
    return 'medio';
}

/**
 * Devuelve el índice del movimiento que hará la IA.
 * @param {string[]} board  - tablero actual (9 celdas, '' | 'X' | 'O')
 * @param {string}   simbolo - símbolo de la IA ('X' o 'O')
 * @param {string}   nivel   - 'fácil' | 'medio' | 'difícil'
 * @returns {number} índice 0-8
 */
export function moverIA(board, simbolo, nivel) {
    const vacias = board.map((v, i) => v === '' ? i : -1).filter(i => i !== -1);
    if (!vacias.length) return -1;

    if (nivel === 'fácil') return _aleatorio(vacias);
    if (nivel === 'medio') return _medio(board, simbolo, vacias);
    return _minimax(board, simbolo); // difícil
}

// ── Fácil: aleatorio ─────────────────────────────────────────────────────────
function _aleatorio(vacias) {
    return vacias[Math.floor(Math.random() * vacias.length)];
}

// ── Medio: gana si puede, bloquea si puede, si no aleatorio ──────────────────
function _medio(board, simbolo, vacias) {
    const rival = simbolo === 'X' ? 'O' : 'X';

    // 1. ¿Puedo ganar?
    for (const i of vacias) {
        const copia = [...board]; copia[i] = simbolo;
        if (_ganador(copia) === simbolo) return i;
    }
    // 2. ¿Debo bloquear?
    for (const i of vacias) {
        const copia = [...board]; copia[i] = rival;
        if (_ganador(copia) === rival) return i;
    }
    // 3. Centro
    if (board[4] === '') return 4;
    // 4. Esquina
    const esquinas = [0, 2, 6, 8].filter(i => board[i] === '');
    if (esquinas.length) return _aleatorio(esquinas);
    // 5. Aleatorio
    return _aleatorio(vacias);
}

// ── Difícil: minimax ──────────────────────────────────────────────────────────
function _minimax(board, simboloIA) {
    const rival = simboloIA === 'X' ? 'O' : 'X';
    let mejorPuntaje = -Infinity;
    let mejorMovimiento = -1;

    for (let i = 0; i < 9; i++) {
        if (board[i] !== '') continue;
        board[i] = simboloIA;
        const puntaje = _minimaxRec(board, false, simboloIA, rival, 0);
        board[i] = '';
        if (puntaje > mejorPuntaje) {
            mejorPuntaje = puntaje;
            mejorMovimiento = i;
        }
    }
    return mejorMovimiento;
}

function _minimaxRec(board, esMaximizando, simboloIA, rival, profundidad) {
    const ganador = _ganador(board);
    if (ganador === simboloIA) return 10 - profundidad;
    if (ganador === rival)     return profundidad - 10;
    if (board.every(c => c !== '')) return 0;

    if (esMaximizando) {
        let mejor = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== '') continue;
            board[i] = simboloIA;
            mejor = Math.max(mejor, _minimaxRec(board, false, simboloIA, rival, profundidad + 1));
            board[i] = '';
        }
        return mejor;
    } else {
        let mejor = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== '') continue;
            board[i] = rival;
            mejor = Math.min(mejor, _minimaxRec(board, true, simboloIA, rival, profundidad + 1));
            board[i] = '';
        }
        return mejor;
    }
}

// ── Utilidad: verificar ganador local ────────────────────────────────────────
function _ganador(board) {
    const lineas = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lineas) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
}
