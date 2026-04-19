import { supabase } from './supabase.js';
import { mostrarPantalla } from './router.js';
import { cargarLobby } from './lobby.js';
import { AVATARES_BASE } from './avatares.js';
import { recalcularStatsDesdeJuegos } from './stats.js';

export const AVATARES = AVATARES_BASE;

let usuarioActual = null;
let perfilActual = null;
let pendingEmail = null;
let _onAvatarClick = null;

export function getUsuario() { return usuarioActual; }
export function getPerfil() { return perfilActual; }
export function setOnAvatarClick(fn) { _onAvatarClick = fn; }

export async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        usuarioActual = session.user;
        perfilActual = await fetchPerfil(session.user.id);
        return true;
    }
    return false;
}

async function fetchPerfil(uid) {
    const { data } = await supabase.from('perfiles').select('*').eq('id', uid).single();
    if (data) {
        try {
            const stats = await recalcularStatsDesdeJuegos(uid);
            if (stats) {
                data.victorias = stats.victorias;
                data.derrotas  = stats.derrotas;
                data.empates   = stats.empates;
                data.partidas  = stats.partidas;
            }
        } catch (e) {
            console.warn('No se pudieron recalcular stats:', e);
        }
    }
    return data;
}

export function initAuthUI() {
    document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
    document.getElementById('tabRegistro').addEventListener('click', () => switchTab('registro'));
    document.getElementById('formLogin').addEventListener('submit', handleLogin);
    document.getElementById('formRegistro').addEventListener('submit', handleRegistro);
    document.getElementById('formOtp').addEventListener('submit', handleOtp);
    document.getElementById('btnReenviarOtp').addEventListener('click', handleReenviarOtp);
    renderAvatarSelector();
    document.getElementById('inputAvatarUpload').addEventListener('change', handleAvatarUpload);
}

function switchTab(tab) {
    document.getElementById('tabLogin').classList.toggle('tab-active', tab === 'login');
    document.getElementById('tabRegistro').classList.toggle('tab-active', tab === 'registro');
    document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('formRegistro').style.display = tab === 'registro' ? 'block' : 'none';
    mostrarError('authError', '');
}

function renderAvatarSelector() {
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = '';
    AVATARES.forEach((av, idx) => {
        const div = document.createElement('div');
        div.classList.add('avatar-opcion');
        div.dataset.id = av.id;
        div.dataset.url = av.url;
        div.setAttribute('role', 'radio');
        div.setAttribute('aria-label', av.label);
        div.setAttribute('tabindex', '0');
        div.innerHTML = `<img src="${av.url}" alt="${av.label}">`;
        div.addEventListener('click', () => seleccionarAvatar(div, av.url));
        div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') seleccionarAvatar(div, av.url); });
        if (idx === 0) div.classList.add('selected');
        grid.appendChild(div);
    });
    document.getElementById('avatarSeleccionado').value = AVATARES[0].url;
    document.getElementById('avatarTipo').value = 'predeterminado';
}

function seleccionarAvatar(div, url) {
    document.querySelectorAll('#avatarGrid .avatar-opcion').forEach(d => d.classList.remove('selected'));
    div.classList.add('selected');
    document.getElementById('avatarSeleccionado').value = url;
    document.getElementById('avatarTipo').value = 'predeterminado';
    // Limpiar preview de upload
    const preview = document.getElementById('avatarPreview');
    preview.style.display = 'none';
    preview.src = '';
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowed.includes(ext)) { mostrarError('authError', 'Formato no permitido. Usa JPG, PNG o WEBP.'); return; }

    setLoading('btnRegistro', true);
    mostrarError('authError', 'Subiendo imagen...');
    const path = `temp/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('avatares').upload(path, file, { upsert: true, contentType: file.type });
    setLoading('btnRegistro', false);

    if (error) { mostrarError('authError', 'Error subiendo imagen: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();
    document.getElementById('avatarSeleccionado').value = publicUrl;
    document.getElementById('avatarTipo').value = 'subido';
    const preview = document.getElementById('avatarPreview');
    preview.src = publicUrl;
    preview.style.display = 'block';
    document.querySelectorAll('#avatarGrid .avatar-opcion').forEach(d => d.classList.remove('selected'));
    mostrarError('authError', '');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    mostrarError('authError', '');
    setLoading('btnLogin', true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading('btnLogin', false);
    if (error) { mostrarError('authError', traducirError(error.message)); return; }
    usuarioActual = data.user;
    perfilActual = await fetchPerfil(data.user.id);
    irAlLobby();
}

async function handleRegistro(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const avatarUrl = document.getElementById('avatarSeleccionado').value;
    const avatarTipo = document.getElementById('avatarTipo').value;
    mostrarError('authError', '');

    if (username.length < 3) { mostrarError('authError', 'Username mínimo 3 caracteres'); return; }

    setLoading('btnRegistro', true);
    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, avatar_url: avatarUrl, avatar_tipo: avatarTipo }, emailRedirectTo: null }
    });
    setLoading('btnRegistro', false);

    if (error) { mostrarError('authError', traducirError(error.message)); return; }

    if (data?.user) {
        usuarioActual = data.user;
        perfilActual = await fetchPerfil(data.user.id);
        irAlLobby();
        return;
    }

    pendingEmail = email;
    mostrarPantalla('screenOtp');
    document.getElementById('otpEmailLabel').textContent = email;
}

async function handleOtp(e) {
    e.preventDefault();
    const token = document.getElementById('otpInput').value.trim();
    mostrarError('otpError', '');
    const { data, error } = await supabase.auth.verifyOtp({ email: pendingEmail, token, type: 'signup' });
    if (error) { mostrarError('otpError', 'Código incorrecto o expirado'); return; }
    usuarioActual = data.user;
    perfilActual = await fetchPerfil(data.user.id);
    irAlLobby();
}

async function handleReenviarOtp() {
    if (!pendingEmail) return;
    await supabase.auth.resend({ type: 'signup', email: pendingEmail });
    mostrarError('otpError', 'Código reenviado ✓');
}

function irAlLobby() {
    mostrarPantalla('screenLobby');
    cargarLobby();
    actualizarHeaderUsuario();
}

export function actualizarHeaderUsuario() {
    const p = perfilActual;
    if (!p) return;
    const el = document.getElementById('headerUsuario');
    if (!el) return;
    el.innerHTML = `
        <img src="${p.avatar_url || AVATARES[0].url}" class="header-avatar" alt="${p.username}">
        <span>${p.username}</span>
    `;
    el.onclick = () => { if (_onAvatarClick) _onAvatarClick(); };
}

export async function cerrarSesion() {
    const btn = document.getElementById('btnSalir');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn('Error al cerrar sesión:', e);
    }
    usuarioActual = null;
    perfilActual = null;
    if (btn) { btn.disabled = false; btn.textContent = 'Salir'; }
    mostrarPantalla('screenAuth');
}

function mostrarError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.7' : '1';
}

function traducirError(msg) {
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos';
    if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de entrar';
    if (msg.includes('User already registered')) return 'Este correo ya está registrado';
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres';
    return msg;
}
