import { supabase } from './supabase.js';
import { mostrarPantalla } from './router.js';

export async function cargarRanking() {
    mostrarPantalla('screenRanking');
    const tabla = document.getElementById('rankingTabla');
    tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Cargando...</td></tr>';

    const { data, error } = await supabase
        .from('perfiles')
        .select('username, avatar_url, victorias, derrotas, empates, partidas')
        .order('victorias', { ascending: false })
        .order('empates', { ascending: false })
        .order('derrotas', { ascending: true })
        .limit(20);

    if (error || !data?.length) {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Sin datos aún</td></tr>';
        return;
    }

    tabla.innerHTML = data.map((p, i) => `
        <tr class="${i === 0 ? 'rank-oro' : i === 1 ? 'rank-plata' : i === 2 ? 'rank-bronce' : ''}">
            <td class="rank-pos">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
            <td class="rank-jugador">
                <img src="${p.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default'}" class="rank-avatar">
                ${p.username}
            </td>
            <td class="rank-v" style="color:#4ade80">${p.victorias}</td>
            <td class="rank-e" style="color:#facc15">${p.empates}</td>
            <td class="rank-d" style="color:#f87171">${p.derrotas}</td>
        </tr>
    `).join('');
}
