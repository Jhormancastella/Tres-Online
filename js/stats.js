/**
 * Módulo de estadísticas.
 * Recalcula victorias/derrotas/empates de un jugador
 * sumando los scores reales de todas las salas donde participó.
 *
 * Estructura de cada fila en 'juegos':
 *   x_player_id: uuid del jugador X
 *   o_player_id: uuid del jugador O
 *   scores: { x: N, o: N, empate: N }
 */

import { supabase } from './supabase.js';

/**
 * Recalcula y guarda las stats del jugador en su perfil.
 * Llama esto al entrar al lobby para mantener el perfil sincronizado.
 * @param {string} uid - ID del jugador
 * @returns {object} - { victorias, derrotas, empates, partidas }
 */
export async function recalcularStatsDesdeJuegos(uid) {
    // Traer todas las salas donde el jugador participó
    const { data: salas, error } = await supabase
        .from('juegos')
        .select('x_player_id, o_player_id, scores')
        .or(`x_player_id.eq.${uid},o_player_id.eq.${uid}`);

    if (error || !salas?.length) return null;

    let victorias = 0;
    let derrotas  = 0;
    let empates   = 0;

    for (const sala of salas) {
        const s = sala.scores || {};
        const esX = sala.x_player_id === uid;
        const esO = sala.o_player_id === uid;

        if (esX) {
            victorias += s.x     || 0;
            derrotas  += s.o     || 0;
            empates   += s.empate || 0;
        } else if (esO) {
            victorias += s.o     || 0;
            derrotas  += s.x     || 0;
            empates   += s.empate || 0;
        }
    }

    const partidas = victorias + derrotas + empates;

    // Guardar en el perfil
    await supabase
        .from('perfiles')
        .update({ victorias, derrotas, empates, partidas })
        .eq('id', uid);

    return { victorias, derrotas, empates, partidas };
}
