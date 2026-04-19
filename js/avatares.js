/**
 * Sistema de avatares con desbloqueo por victorias.
 * Los avatares base están disponibles desde el inicio.
 * Los especiales se desbloquean al alcanzar cierta cantidad de victorias.
 */

export const AVATARES_BASE = [
    { id: 'h1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4',  label: 'Felix' },
    { id: 'h2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=c0aede',   label: 'Max' },
    { id: 'h3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=d1d4f9',   label: 'Leo' },
    { id: 'm1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfbf',  label: 'Luna' },
    { id: 'm2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sofia&backgroundColor=ffd5dc', label: 'Sofia' },
    { id: 'm3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=c1f4c5',   label: 'Mia' },
];

export const AVATARES_ESPECIALES = [
    {
        id: 'esp1', label: 'Novato', requiereVictorias: 5,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rookie&backgroundColor=fef08a',
        descripcion: '5 victorias'
    },
    {
        id: 'esp2', label: 'Guerrero', requiereVictorias: 10,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Warrior&backgroundColor=fed7aa',
        descripcion: '10 victorias'
    },
    {
        id: 'esp3', label: 'Estratega', requiereVictorias: 25,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Strategist&backgroundColor=a5f3fc',
        descripcion: '25 victorias'
    },
    {
        id: 'esp4', label: 'Campeón', requiereVictorias: 50,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Champion&backgroundColor=bbf7d0',
        descripcion: '50 victorias'
    },
    {
        id: 'esp5', label: 'Leyenda', requiereVictorias: 100,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Legend&backgroundColor=e9d5ff',
        descripcion: '100 victorias'
    },
    {
        id: 'esp6', label: 'Maestro', requiereVictorias: 200,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Master&backgroundColor=fecaca',
        descripcion: '200 victorias'
    },
    {
        id: 'esp7', label: 'Gran Maestro', requiereVictorias: 500,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=GrandMaster&backgroundColor=fde68a',
        descripcion: '500 victorias'
    },
    {
        id: 'esp8', label: 'Inmortal', requiereVictorias: 1000,
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Immortal&backgroundColor=f0abfc',
        descripcion: '1000 victorias'
    },
];

export const TODOS_LOS_AVATARES = [...AVATARES_BASE, ...AVATARES_ESPECIALES];

/**
 * Devuelve los avatares especiales que el jugador acaba de desbloquear
 * comparando victorias anteriores con las nuevas.
 */
export function obtenerNuevosDesbloqueos(victoriasAntes, victoriasAhora) {
    return AVATARES_ESPECIALES.filter(
        av => av.requiereVictorias > victoriasAntes && av.requiereVictorias <= victoriasAhora
    );
}

/**
 * Verifica si un avatar está desbloqueado para el jugador.
 */
export function estaDesbloqueado(av, victorias) {
    if (!av.requiereVictorias) return true; // base
    return victorias >= av.requiereVictorias;
}

/**
 * Próximo avatar a desbloquear según las victorias actuales.
 */
export function proximoDesbloqueo(victorias) {
    return AVATARES_ESPECIALES.find(av => av.requiereVictorias > victorias) || null;
}
