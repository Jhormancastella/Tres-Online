# Tres Online 🎮

Juego de Tres en Línea multijugador en tiempo real, construido con HTML, CSS, JavaScript vanilla y Supabase.

<div align="center">
  <img src="https://res.cloudinary.com/dipv76dpn/image/upload/v1776561739/b_quiero_crear_un_logo-Photoroom_br2ybi.png" alt="Tres Online Logo" width="100">

  <br><br>

  <a href="https://jhormancastella.github.io/Tres-Online/" target="_blank">
    <img src="https://img.shields.io/badge/🌐%20Ir%20a%20la%20web-facc15?style=for-the-badge&labelColor=0f172a&color=facc15" alt="Ir a la web">
  </a>
</div>

---

## Características

- Multijugador en tiempo real con Supabase Realtime
- 6 salas de juego simultáneas
- Sistema de autenticación (login / registro)
- Avatares predeterminados y subida de foto propia
- Ranking global de jugadores
- Perfil editable (username, avatar, contraseña)
- Diseño responsive para móvil y escritorio

## Tecnologías

- HTML5 / CSS3 / JavaScript ES Modules
- [Supabase](https://supabase.com) — base de datos, auth y realtime
- [DiceBear](https://dicebear.com) — avatares generados

## Estructura

```
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── supabase.js   — cliente Supabase
    ├── auth.js       — autenticación y sesión
    ├── router.js     — navegación entre pantallas
    ├── lobby.js      — listado de salas
    ├── game.js       — lógica del juego
    ├── perfil.js     — edición de perfil
    └── ranking.js    — tabla de ranking
```

## Desarrollo local

Clona el repo y abre `index.html` con un servidor local (Live Server, etc.). No requiere build.

---

Hecho con ❤️ por [Jhorman Castella](https://github.com/jhormancastella)
