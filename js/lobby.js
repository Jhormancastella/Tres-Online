// lobby.js v3
import { supabase } from './supabase.js';
import { entrarSala } from './game.js';
import { getPerfil } from './auth.js';

const TOTAL_SALAS = 6;
let canalLobby = null;

export async function cargarLobby() {
    await limpiarJugadoresFantasma();

    // Traer salas + perfiles de jugadores actuales para mostrar avatares
    const { data: salas } = await supabase
        .from('juegos')
        .select('id, x_player_id, o_player_id, scores')
        .order('id');

    // Traer perfiles de todos los jugadores en salas para mostrar nombres/avatares
    const ids = [...new Set(
        (salas || []).flatMap(s => [s.x_player_id, s.o_player_id]).filter(Boolean)
    )];
    let perfilesMap = {};
    if (ids.length) {
        const { data: perfs } = await supabase
            .from('perfiles')
            .select('id, username, avatar_url, victorias')
            .in('id', ids);
        (perfs || []).forEach(p => { perfilesMap[p.id] = p; });
    }

    renderLobby(salas || [], perfilesMap);
    suscribirLobby();
}

export function limpiarLobby() {
    if (canalLobby) { supabase.removeChannel(canalLobby); canalLobby = null; }
}

export async function resetearTodasLasSalas() {
    const resetData = {
        x_player_id: null, o_player_id: null,
        board: ['','','','','','','','',''],
        current_turn: 'X', winner: null, is_active: true
    };
    for (let i = 1; i <= TOTAL_SALAS; i++) {
        await supabase.from('juegos').update(resetData).eq('id', i);
    }
}

async function limpiarJugadoresFantasma() {
    const { data: salas } = await supabase
        .from('juegos').select('id, x_player_id, o_player_id').order('id');
    if (!salas?.length) return;

    const ids = [...new Set(
        salas.flatMap(s => [s.x_player_id, s.o_player_id]).filter(Boolean)
    )];
    if (!ids.length) return;

    const { data: perfiles } = await supabase
        .from('perfiles').select('id').in('id', ids);
    const existentes = new Set((perfiles || []).map(p => p.id));

    for (const sala of salas) {
        const xValido = sala.x_player_id && existentes.has(sala.x_player_id);
        const oValido = sala.o_player_id && existentes.has(sala.o_player_id);
        if ((sala.x_player_id && !xValido) || (sala.o_player_id && !oValido)) {
            const update = {};
            if (sala.x_player_id && !xValido) update.x_player_id = null;
            if (sala.o_player_id && !oValido) update.o_player_id = null;
            if (!xValido && !oValido) {
                Object.assign(update, {
                    board: ['','','','','','','','',''],
                    current_turn: 'X', winner: null, is_active: true
                });
            }
            await supabase.from('juegos').update(update).eq('id', sala.id);
        }
    }
}

function renderLobby(salas, perfilesMap) {
    const grid = document.getElementById('salasGrid');
    if (!grid) return;
    const miPerfil = getPerfil();
    const miId = miPerfil?.id;

    grid.innerHTML = '';
    for (let i = 1; i <= TOTAL_SALAS; i++) {
        const sala = salas.find(s => s.id === i);
        const jugadores = sala ? [sala.x_player_id, sala.o_player_id].filter(Boolean).length : 0;
        const llena = jugadores >= 2;
        const scores = sala?.scores || { x: 0, o: 0, empate: 0 };
        const totalPartidas = (scores.x || 0) + (scores.o || 0) + (scores.empate || 0);

        // Estado
        let estadoClass, badgeClass, badgeIcon, badgeText;
        if (jugadores === 0)      { estadoClass = 'estado-libre';     badgeClass = 'badge-libre'; badgeIcon = '●'; badgeText = 'Libre'; }
        else if (jugadores === 1) { estadoClass = 'estado-esperando'; badgeClass = 'badge-uno';   badgeIcon = '◐'; badgeText = 'Esperando...'; }
        else                      { estadoClass = '';                  badgeClass = 'badge-llena'; badgeIcon = '●'; badgeText = 'En juego'; }

        // Slots con avatar si hay jugador
        const slot1 = crearSlot(sala?.x_player_id, perfilesMap, 'X');
        const slot2 = crearSlot(sala?.o_player_id, perfilesMap, 'O');

        // Info personalizada según si el usuario jugó aquí
        const infoExtra = construirInfoSala(sala, scores, totalPartidas, miId, perfilesMap);

        const card = document.createElement('div');
        card.classList.add('sala-card');
        if (llena) card.classList.add('llena');
        if (estadoClass) card.classList.add(estadoClass);
        // Marcar si el usuario ya jugó en esta sala
        if (miId && sala && (sala.x_player_id === miId || sala.o_player_id === miId)) {
            card.classList.add('sala-mia');
        }
        card.setAttribute('role', 'listitem');

        card.innerHTML = `
            <div class="sala-numero">Sala ${i}</div>
            <div class="sala-avatares">
                ${slot1}
                <div class="sala-vs">VS</div>
                ${slot2}
            </div>
            <div class="sala-estado-badge ${badgeClass}">
                <span>${badgeIcon}</span> ${badgeText}
            </div>
            <div class="sala-scores-row">
                <div class="sala-score-item">
                    <div class="sala-score-val sv">${scores.x || 0}</div>
                    <div class="sala-score-lbl">X</div>
                </div>
                <div class="sala-score-item">
                    <div class="sala-score-val se">${scores.empate || 0}</div>
                    <div class="sala-score-lbl">E</div>
                </div>
                <div class="sala-score-item">
                    <div class="sala-score-val sd">${scores.o || 0}</div>
                    <div class="sala-score-lbl">O</div>
                </div>
            </div>
            ${infoExtra}
        `;

        if (!llena) {
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Sala ${i}, ${badgeText}`);
            card.addEventListener('click', () => entrarSala(i));
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') entrarSala(i); });
        } else {
            card.setAttribute('aria-disabled', 'true');
        }

        grid.appendChild(card);
    }
}

/** Genera el HTML de un slot con avatar si hay jugador */
function crearSlot(playerId, perfilesMap, simbolo) {
    if (!playerId) return `<div class="sala-slot vacio" title="Esperando jugador ${simbolo}">+</div>`;
    const p = perfilesMap[playerId];
    if (p?.avatar_url) {
        return `<div class="sala-slot ocupado" title="${p.username} (${simbolo})">
            <img src="${p.avatar_url}" alt="${p.username}" class="sala-slot-avatar">
        </div>`;
    }
    return `<div class="sala-slot ocupado" title="Jugador ${simbolo}">${simbolo === 'X' ? '✕' : '○'}</div>`;
}

/**
 * Construye el bloque de info extra de la sala:
 * - Si el usuario jugó aquí: muestra sus victorias/derrotas en esta sala
 * - Si no: muestra total de partidas y quién más ganó
 */
function construirInfoSala(sala, scores, totalPartidas, miId, perfilesMap) {
    if (!sala || totalPartidas === 0) {
        return `<div class="sala-info-extra sala-info-nueva">Sin partidas aún</div>`;
    }

    const esX = sala.x_player_id === miId;
    const esO = sala.o_player_id === miId;

    if (miId && (esX || esO)) {
        // Usuario actual está en esta sala — mostrar sus stats personales
        const misV = esX ? (scores.x || 0) : (scores.o || 0);
        const misD = esX ? (scores.o || 0) : (scores.x || 0);
        const misE = scores.empate || 0;
        return `
            <div class="sala-info-extra sala-info-personal">
                <span class="sala-info-label">Tus stats aquí</span>
                <div class="sala-info-stats">
                    <span class="siv">✅ ${misV}</span>
                    <span class="sie">🤝 ${misE}</span>
                    <span class="sid">❌ ${misD}</span>
                </div>
            </div>`;
    }

    // Usuario no está en la sala — mostrar info general
    // Determinar quién ganó más
    let topNombre = null;
    let topV = 0;
    if (scores.x > scores.o && sala.x_player_id) {
        const p = perfilesMap[sala.x_player_id];
        topNombre = p?.username || 'Jugador X';
        topV = scores.x;
    } else if (scores.o > scores.x && sala.o_player_id) {
        const p = perfilesMap[sala.o_player_id];
        topNombre = p?.username || 'Jugador O';
        topV = scores.o;
    } else if (scores.x === scores.o && scores.x > 0) {
        topNombre = 'Empate';
        topV = scores.x;
    }

    const topHtml = topNombre
        ? `<span class="sala-top">🏅 ${topNombre} (${topV}V)</span>`
        : '';

    return `
        <div class="sala-info-extra sala-info-general">
            <span class="sala-info-label">${totalPartidas} partida${totalPartidas !== 1 ? 's' : ''}</span>
            ${topHtml}
        </div>`;
}

function suscribirLobby() {
    if (canalLobby) supabase.removeChannel(canalLobby);
    canalLobby = supabase
        .channel('lobby-channel')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'juegos' }, async () => {
            const { data: salas } = await supabase
                .from('juegos').select('id, x_player_id, o_player_id, scores').order('id');
            const ids = [...new Set(
                (salas || []).flatMap(s => [s.x_player_id, s.o_player_id]).filter(Boolean)
            )];
            let perfilesMap = {};
            if (ids.length) {
                const { data: perfs } = await supabase
                    .from('perfiles').select('id, username, avatar_url, victorias').in('id', ids);
                (perfs || []).forEach(p => { perfilesMap[p.id] = p; });
            }
            renderLobby(salas || [], perfilesMap);
        })
        .subscribe();
}
