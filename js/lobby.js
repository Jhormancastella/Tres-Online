import { supabase } from './supabase.js';
import { mostrarPantalla } from './router.js';
import { getPerfil } from './auth.js';
import { entrarSala } from './game.js';

const TOTAL_SALAS = 6;
let canalLobby = null;

export async function cargarLobby() {
    const { data: salas } = await supabase
        .from('juegos')
        .select('id, x_player_id, o_player_id, scores')
        .order('id');
    renderLobby(salas || []);
    suscribirLobby();
}

function renderLobby(salas) {
    const grid = document.getElementById('salasGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= TOTAL_SALAS; i++) {
        const sala = salas.find(s => s.id === i);
        const jugadores = sala ? [sala.x_player_id, sala.o_player_id].filter(Boolean).length : 0;
        const llena = jugadores >= 2;
        const scores = sala?.scores || { x: 0, o: 0, empate: 0 };

        let badgeClass = 'badge-libre', badgeText = 'Libre', jugClass = 'vacia';
        if (jugadores === 1) { badgeClass = 'badge-uno'; badgeText = '1 jugador'; jugClass = 'uno'; }
        if (jugadores === 2) { badgeClass = 'badge-llena'; badgeText = 'Llena'; jugClass = 'llena'; }

        const card = document.createElement('div');
        card.classList.add('sala-card');
        if (llena) card.classList.add('llena');
        card.innerHTML = `
            <div class="sala-nombre">Sala ${i}</div>
            <div class="sala-jugadores ${jugClass}">${jugadores}/2 jugadores</div>
            <div class="sala-estado-badge ${badgeClass}">${badgeText}</div>
            <div class="sala-scores">X:${scores.x || 0} E:${scores.empate || 0} O:${scores.o || 0}</div>
        `;
        if (!llena) card.addEventListener('click', () => entrarSala(i));
        grid.appendChild(card);
    }
}

function suscribirLobby() {
    if (canalLobby) supabase.removeChannel(canalLobby);
    canalLobby = supabase
        .channel('lobby-channel')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'juegos' }, async () => {
            const { data: salas } = await supabase
                .from('juegos').select('id, x_player_id, o_player_id, scores').order('id');
            renderLobby(salas || []);
        })
        .subscribe();
}
