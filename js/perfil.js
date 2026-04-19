import { supabase } from './supabase.js';
import { mostrarPantalla } from './router.js';
import { getPerfil, getUsuario, AVATARES, actualizarHeaderUsuario } from './auth.js';
import { cargarLobby } from './lobby.js';
import { AVATARES_ESPECIALES, estaDesbloqueado, proximoDesbloqueo } from './avatares.js';

export function initPerfil() {
    document.getElementById('btnVolverPerfil').addEventListener('click', () => {
        mostrarPantalla('screenLobby');
        cargarLobby();
    });
    document.getElementById('formPerfil').addEventListener('submit', handleGuardarPerfil);
    document.getElementById('formCambiarClave').addEventListener('submit', handleCambiarClave);
    document.getElementById('inputAvatarPerfil').addEventListener('change', handleUploadAvatarPerfil);
}

export function abrirPerfil() {
    const p = getPerfil();
    if (!p) return;

    document.getElementById('perfilUsername').value = p.username || '';
    document.getElementById('perfilEmail').value = getUsuario()?.email || '';
    document.getElementById('perfilAvatarActual').src = p.avatar_url || AVATARES[0].url;
    document.getElementById('perfilAvatarUrl').value = p.avatar_url || '';
    document.getElementById('perfilMsg').textContent = '';
    document.getElementById('claveMsg').textContent = '';
    document.getElementById('perfilUsernameDisplay').textContent = p.username || '';

    renderStats(p);
    renderAvataresPerfil(p);
    mostrarPantalla('screenPerfil');
}

function renderStats(p) {
    const v = p.victorias || 0;
    const d = p.derrotas || 0;
    const e = p.empates || 0;
    const total = p.partidas || (v + d + e);
    const winrate = total > 0 ? Math.round((v / total) * 100) : 0;

    // Barra de progreso winrate
    const barColor = winrate >= 60 ? '#4ade80' : winrate >= 40 ? '#facc15' : '#f87171';

    document.getElementById('perfilStats').innerHTML = `
        <div class="stats-grid">
            <div class="stat-item stat-v">
                <div class="stat-valor">${v}</div>
                <div class="stat-label">✅ Victorias</div>
            </div>
            <div class="stat-item stat-e">
                <div class="stat-valor">${e}</div>
                <div class="stat-label">🤝 Empates</div>
            </div>
            <div class="stat-item stat-d">
                <div class="stat-valor">${d}</div>
                <div class="stat-label">❌ Derrotas</div>
            </div>
            <div class="stat-item stat-t">
                <div class="stat-valor">${total}</div>
                <div class="stat-label">🎮 Partidas</div>
            </div>
        </div>
        <div class="winrate-wrap">
            <div class="winrate-label">
                <span>Winrate</span>
                <span style="color:${barColor}; font-weight:800">${winrate}%</span>
            </div>
            <div class="winrate-bar-bg">
                <div class="winrate-bar-fill" style="width:${winrate}%; background:${barColor}"></div>
            </div>
        </div>
    `;
}

function renderAvataresPerfil(p) {
    const victorias = p.victorias || 0;
    const grid = document.getElementById('avatarGridPerfil');
    grid.innerHTML = '';

    // Sección: avatares base
    const tituloBase = document.createElement('div');
    tituloBase.className = 'avatar-seccion-titulo';
    tituloBase.textContent = 'Avatares base';
    grid.appendChild(tituloBase);

    const gridBase = document.createElement('div');
    gridBase.className = 'avatar-grid';
    AVATARES.forEach(av => {
        gridBase.appendChild(crearAvatarCard(av, p.avatar_url, true));
    });
    grid.appendChild(gridBase);

    // Sección: avatares desbloqueables
    const tituloEsp = document.createElement('div');
    tituloEsp.className = 'avatar-seccion-titulo';
    tituloEsp.textContent = '🏆 Avatares especiales';
    grid.appendChild(tituloEsp);

    const gridEsp = document.createElement('div');
    gridEsp.className = 'avatar-grid';
    AVATARES_ESPECIALES.forEach(av => {
        const desbloqueado = estaDesbloqueado(av, victorias);
        gridEsp.appendChild(crearAvatarCard(av, p.avatar_url, desbloqueado));
    });
    grid.appendChild(gridEsp);

    // Próximo desbloqueo
    const proximo = proximoDesbloqueo(victorias);
    if (proximo) {
        const falta = proximo.requiereVictorias - victorias;
        const info = document.createElement('div');
        info.className = 'proximo-desbloqueo';
        info.innerHTML = `
            <span class="proximo-icono">🔒</span>
            Próximo: <strong>${proximo.label}</strong> — te faltan <strong>${falta}</strong> victoria${falta !== 1 ? 's' : ''}
        `;
        grid.appendChild(info);
    } else {
        const info = document.createElement('div');
        info.className = 'proximo-desbloqueo proximo-completo';
        info.textContent = '🎉 ¡Tienes todos los avatares desbloqueados!';
        grid.appendChild(info);
    }
}

function crearAvatarCard(av, avatarActual, desbloqueado) {
    const div = document.createElement('div');
    div.classList.add('avatar-opcion');
    if (!desbloqueado) div.classList.add('bloqueado');
    if (av.url === avatarActual) div.classList.add('selected');

    const tooltip = desbloqueado ? av.label : `🔒 ${av.descripcion || av.label}`;

    div.innerHTML = `
        <img src="${av.url}" alt="${av.label}" title="${tooltip}">
        ${!desbloqueado ? `<div class="avatar-lock">🔒</div>` : ''}
        ${av.requiereVictorias && desbloqueado ? `<div class="avatar-badge-desbloqueado">✓</div>` : ''}
    `;

    if (desbloqueado) {
        div.setAttribute('tabindex', '0');
        div.setAttribute('role', 'radio');
        div.setAttribute('aria-label', av.label);
        div.addEventListener('click', () => {
            document.querySelectorAll('#avatarGridPerfil .avatar-opcion').forEach(d => d.classList.remove('selected'));
            div.classList.add('selected');
            document.getElementById('perfilAvatarUrl').value = av.url;
            document.getElementById('perfilAvatarActual').src = av.url;
        });
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') div.click();
        });
    } else {
        div.setAttribute('aria-disabled', 'true');
        div.setAttribute('title', `Desbloquea con ${av.requiereVictorias} victorias`);
    }

    return div;
}

async function handleUploadAvatarPerfil(e) {
    const file = e.target.files[0];
    if (!file) return;
    const uid = getUsuario()?.id;
    if (!uid) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowed.includes(ext)) {
        document.getElementById('perfilMsg').textContent = 'Formato no permitido. Usa JPG, PNG o WEBP.';
        return;
    }

    document.getElementById('perfilMsg').textContent = 'Subiendo imagen...';
    const path = `${uid}/avatar.${ext}`;
    const { data, error } = await supabase.storage
        .from('avatares')
        .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
        document.getElementById('perfilMsg').textContent = 'Error al subir: ' + error.message;
        return;
    }

    const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();
    document.getElementById('perfilAvatarUrl').value = publicUrl;
    document.getElementById('perfilAvatarActual').src = publicUrl;
    document.querySelectorAll('#avatarGridPerfil .avatar-opcion').forEach(d => d.classList.remove('selected'));
    document.getElementById('perfilMsg').textContent = 'Imagen lista. Guarda los cambios.';
}

async function handleGuardarPerfil(e) {
    e.preventDefault();
    const username = document.getElementById('perfilUsername').value.trim();
    const avatarUrl = document.getElementById('perfilAvatarUrl').value;
    const msgEl = document.getElementById('perfilMsg');

    if (username.length < 3) { msgEl.textContent = 'Username mínimo 3 caracteres'; return; }
    msgEl.textContent = 'Guardando...';

    const perfil = getPerfil();
    const { error } = await supabase.from('perfiles').update({
        username,
        avatar_url: avatarUrl
    }).eq('id', perfil.id);

    if (error) { msgEl.textContent = 'Error: ' + error.message; return; }

    perfil.username = username;
    perfil.avatar_url = avatarUrl;
    actualizarHeaderUsuario();
    msgEl.style.color = '#4ade80';
    msgEl.textContent = '✅ Perfil actualizado';
    setTimeout(() => { msgEl.style.color = ''; msgEl.textContent = ''; }, 2500);
}

async function handleCambiarClave(e) {
    e.preventDefault();
    const nueva = document.getElementById('nuevaClave').value;
    const confirmar = document.getElementById('confirmarClave').value;
    const msgEl = document.getElementById('claveMsg');

    if (nueva.length < 6) { msgEl.textContent = 'Mínimo 6 caracteres'; return; }
    if (nueva !== confirmar) { msgEl.textContent = 'Las claves no coinciden'; return; }

    msgEl.textContent = 'Actualizando...';
    const { error } = await supabase.auth.updateUser({ password: nueva });

    if (error) { msgEl.textContent = 'Error: ' + error.message; return; }

    msgEl.style.color = '#4ade80';
    msgEl.textContent = '✅ Contraseña actualizada';
    document.getElementById('nuevaClave').value = '';
    document.getElementById('confirmarClave').value = '';
    setTimeout(() => { msgEl.style.color = ''; msgEl.textContent = ''; }, 2500);
}
