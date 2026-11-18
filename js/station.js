/* ==========================================================================
   Rodrigo Station · exploración en tercera persona (Three.js)
   Índice: 1. Datos del mapa      2. Utilidades y texturas   3. Escena, luces y materiales
           4. Arquitectura        5. Puertas y terminales    6. Decoración de salas
           7. Astronauta          8. Colisiones              9. Controles
           10. Interfaz (HUD)     11. Ventanas con el CV     12. Bucle principal
   Los textos del currículum salen de js/data.js.
   Unidades: 1 = 1 metro aprox. Norte = -Z. El mapa mide 28 × 39.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CV = window.CV, PI = Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Si no hay Three.js (sin conexión) o no hay WebGL, se ofrece la versión clásica */
  function fail() { $('#start').hidden = true; $('#fallback').hidden = false; }
  if (!window.THREE) { fail(); return; }
  const THREE = window.THREE;

  /* ---------- 1. Datos del mapa ---------- */
  const WALL_H = 4.2, WALL_T = 0.3, DOOR_W = 2.4, DOOR_H = 3, RADIUS = 0.42;
  const SPAWN = { x: 0, z: 6, h: PI };
  const ACCENT = 0x4de3ff, OK_COLOR = 0x5ef0a8;

  /* rect = [x1, z1, x2, z2] · door.axis = eje por el que corre la pared · entry = punto al entrar */
  const ZONES = [
    { id: 'hall',    name: 'Pasillo central',           short: '',        sub: 'Elige una puerta',                           rect: [-4, -10, 4, 10],  color: 0x9fdcff },
    { id: 'puente',  name: 'Puente de mando',           short: 'PUENTE',  sub: 'Presentación personal y objetivos',          rect: [-8, -20, 8, -10], color: 0x4de3ff, door: { x: 0,  z: -10, axis: 'x', side: 1 },  entry: [0, -11.6, PI] },
    { id: 'lab',     name: 'Laboratorio de desarrollo', short: 'LAB',     sub: 'DAM · programación · bases de datos',        rect: [-14, -10, -4, 0], color: 0x5ef0a8, door: { x: -4, z: -5,  axis: 'z', side: 1 },  entry: [-5.6, -5, -PI / 2] },
    { id: 'ia',      name: 'Núcleo de IA',              short: 'IA',      sub: 'Especialización en inteligencia artificial', rect: [4, -10, 14, 0],   color: 0x9b7bff, door: { x: 4,  z: -5,  axis: 'z', side: -1 }, entry: [5.6, -5, PI / 2] },
    { id: 'archivo', name: 'Archivo de misiones',       short: 'ARCHIVO', sub: 'Formación académica y certificados',         rect: [-14, 0, -4, 10],  color: 0xffb454, door: { x: -4, z: 5,   axis: 'z', side: 1 },  entry: [-5.6, 5, -PI / 2] },
    { id: 'com',     name: 'Centro de comunicaciones',  short: 'COM',     sub: 'Inglés B2, idiomas y contacto',              rect: [4, 0, 14, 10],    color: 0xff6b9d, door: { x: 4,  z: 5,   axis: 'z', side: -1 }, entry: [5.6, 5, PI / 2] },
    { id: 'hangar',  name: 'Hangar de operaciones',     short: 'HANGAR',  sub: 'Experiencia laboral y prácticas',            rect: [-7, 10, 7, 19],   color: 0xffd23f, door: { x: 0,  z: 10,  axis: 'x', side: -1 }, entry: [0, 11.6, 0] }
  ];
  const ROOMS = ZONES.filter(z => z.door);
  const zoneById = id => ZONES.find(z => z.id === id);

  /* rot = hacia dónde mira la pantalla (0 = sur, PI = norte, PI/2 = este, -PI/2 = oeste) */
  /* icon = forma del holograma que flota sobre la terminal (cada una distinta) */
  const TERMS = [
    { id: 'ident',      zone: 'puente',  x: -7.1,  z: -16.3, rot: PI / 2,  icon: 'sphere', title: 'Presentación' },
    { id: 'objetivos',  zone: 'puente',  x: 7.1,   z: -16.3, rot: -PI / 2, icon: 'cone',   title: 'Perfil y objetivos' },
    { id: 'stack',      zone: 'lab',     x: -13.1, z: -5,    rot: PI / 2,  icon: 'box',    title: 'Stack tecnológico' },
    { id: 'dam',        zone: 'lab',     x: -9.6,  z: -0.9,  rot: PI,      icon: 'dodeca', title: 'Ciclo DAM' },
    { id: 'ia',         zone: 'ia',      x: 9,     z: -5,    rot: -PI / 2, title: 'Especialización en IA y Big Data', core: true },
    { id: 'rai',        zone: 'ia',      x: 9,     z: -9.1,  rot: 0,       icon: 'knot',   title: 'Hablar con R-AI' },
    { id: 'contacto',   zone: 'com',     x: 9,     z: 9.1,   rot: PI,      icon: 'torus',  title: 'Canal de contacto' },
    { id: 'idiomas',    zone: 'com',     x: 9,     z: 0.9,   rot: 0,       icon: 'globe',  title: 'Idiomas' },
    { id: 'academico',  zone: 'archivo', x: -6.4,  z: 0.9,   rot: 0,       icon: 'tetra',  title: 'Registro académico' },
    { id: 'cursos',     zone: 'archivo', x: -6,    z: 9.1,   rot: PI,      icon: 'disc',   title: 'Certificados' },
    { id: 'socorrista', zone: 'hangar',  x: -6.1,  z: 13.2,  rot: PI / 2,  icon: 'buoy',   title: 'Misión 01 · Socorrista' },
    { id: 'monitor',    zone: 'hangar',  x: -6.1,  z: 17.2,  rot: PI / 2,  icon: 'wave',   title: 'Misión 02 · Monitor' },
    { id: 'indra',      zone: 'hangar',  x: 6.1,   z: 15.2,  rot: -PI / 2, icon: 'chip',   title: 'Misión 03 · Prácticas en Indra' }
  ];

  const state = { started: false, win: null, zone: 'hall', visited: new Set(), done: new Set(), complete: false };
  const blocks = [];        // obstáculos [x1, z1, x2, z2]
  const interactables = []; // { x, z, r, label, action, active }
  const updaters = [];      // funciones (t, dt) que animan la escena

  /* ---------- 2. Utilidades y texturas ---------- */
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  const FONT = '"Space Grotesk", "Segoe UI", sans-serif';
  const MONO = '"JetBrains Mono", Consolas, monospace';
  function fitText(g, text, max, size, weight = 700, font = FONT) {
    let s = size; g.font = `${weight} ${s}px ${font}`;
    while (g.measureText(text).width > max && s > 14) { s -= 2; g.font = `${weight} ${s}px ${font}`; }
  }
  /* Escribe un texto centrado partiéndolo en líneas */
  function wrapText(g, text, cx, y, max, lh) {
    let line = '';
    for (const wd of text.split(' ')) {
      if (g.measureText(line + wd).width > max && line) { g.fillText(line.trim(), cx, y); y += lh; line = ''; }
      line += wd + ' ';
    }
    g.fillText(line.trim(), cx, y);
  }
  /* Texto luminoso sobre fondo transparente (rótulos de puertas y carteles) */
  function textTex(text, color, { w = 1024, h = 200, size = 84 } = {}) {
    return canvasTex(w, h, (g) => {
      g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, text, w - 50, size);
      g.shadowColor = color; g.shadowBlur = 26; g.fillStyle = color;
      g.fillText(text, w / 2, h / 2); g.fillText(text, w / 2, h / 2);
      g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText(text, w / 2, h / 2);
    });
  }
  /* Pantalla de pared con contenido real del CV: título y filas (texto o [texto, valor]) */
  function infoTex(title, rows, color, cw, ch) {
    return canvasTex(cw, ch, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0a1626'); bg.addColorStop(1, '#04080f');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
      g.strokeStyle = color; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = color; g.fillRect(10, 10, w - 20, 92);
      g.fillStyle = '#04080f'; g.textBaseline = 'middle'; fitText(g, title, w - 90, 50); g.fillText(title, 40, 58);
      const top = 130, step = Math.min(84, (h - top - 30) / rows.length), size = Math.min(44, step * .56);
      rows.forEach((r, i) => {
        const y = top + step * (i + .5), [a, b] = Array.isArray(r) ? r : [r, null];
        g.fillStyle = color; g.fillRect(40, y - size * .28, 9, size * .56);
        g.fillStyle = '#eef3fb'; g.textAlign = 'left'; fitText(g, a, w - (b ? 380 : 110), size, 500); g.fillText(a, 68, y);
        if (b) { g.fillStyle = color; g.textAlign = 'right'; fitText(g, b, 280, size * .82, 600, MONO); g.fillText(b, w - 42, y); g.textAlign = 'left'; }
      });
    });
  }
  function screenTex(title, color) {
    return canvasTex(512, 320, (g, w, h) => {
      g.fillStyle = '#050a14'; g.fillRect(0, 0, w, h);
      g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = color; g.font = `600 24px ${MONO}`; g.fillText('TERMINAL', 30, 52);
      g.fillStyle = '#fff'; g.font = `700 44px ${FONT}`; g.textAlign = 'left';
      let line = '', y = 126;
      for (const wd of title.split(' ')) {
        if (g.measureText(line + wd).width > w - 60 && line) { g.fillText(line.trim(), 30, y); y += 52; line = ''; }
        line += wd + ' ';
      }
      g.fillText(line.trim(), 30, y);
      g.fillStyle = color; g.fillRect(30, h - 62, 64, 36);
      g.fillStyle = '#050a14'; g.font = `700 28px ${FONT}`; g.fillText('E', 53, h - 34);
      g.fillStyle = color; g.font = `500 24px ${FONT}`; g.fillText('consultar', 108, h - 35);
    });
  }
  /* Pantalla decorativa con "líneas de código"; se anima desplazando la textura */
  function codeTex(color) {
    const t = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#04080f'; g.fillRect(0, 0, w, h);
      const cols = [color, '#ffffff', '#6f7fa6', color];
      for (let y = 8; y < h - 4; y += 12) {
        let x = 12 + Math.floor(Math.random() * 3) * 16;
        while (x < w - 30 && Math.random() > .16) {
          const len = 12 + Math.random() * 46;
          g.fillStyle = cols[Math.floor(Math.random() * cols.length)]; g.globalAlpha = .35 + Math.random() * .6;
          g.fillRect(x, y, len, 5); x += len + 8;
        }
      }
    });
    t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, .6);
    updaters.push((time, dt) => { t.offset.y += dt * .035; });
    return t;
  }
  /* Halo radial para simular el resplandor de las luces */
  const glowTex = canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  /* Paneles de pared: color + relieve (bump) para que la luz marque juntas y remaches */
  const drawPanel = bump => (g, w, h) => {
    g.fillStyle = bump ? '#808080' : '#3a445c'; g.fillRect(0, 0, w, h);
    if (!bump) {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.07)'); gr.addColorStop(.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2b3348'; g.fillRect(0, h * .72, w, h * .28);            // zócalo oscuro
      g.fillStyle = '#4a5878'; g.fillRect(0, h * .72 - 3, w, 3);
      g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 26; i++) g.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 1);
      g.fillStyle = '#566585'; g.font = `600 13px ${MONO}`; g.fillText('RB-01', 16, h * .72 + 24);
      g.fillStyle = '#1d2433'; for (let i = 0; i < 5; i++) g.fillRect(w * .62, h * .8 + i * 8, 70, 4); // rejilla
    }
    g.strokeStyle = bump ? '#202020' : '#171c2a'; g.lineWidth = 5;
    g.strokeRect(2, 2, w / 2 - 4, h - 4); g.strokeRect(w / 2 + 2, 2, w / 2 - 4, h - 4);
    g.beginPath(); g.moveTo(0, h * .3); g.lineTo(w, h * .3); g.stroke();
    g.fillStyle = bump ? '#d0d0d0' : '#6a7896';
    for (const x of [14, w / 2 - 14, w / 2 + 14, w - 14]) for (const y of [14, h * .3 - 12, h * .3 + 12, h - 14]) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
  };
  const panelTex = canvasTex(256, 256, drawPanel(false)), panelBump = canvasTex(256, 256, drawPanel(true), false);
  const drawFloor = bump => (g, w, h) => {
    g.fillStyle = bump ? '#808080' : '#1a2130'; g.fillRect(0, 0, w, h);
    if (!bump) {
      g.fillStyle = '#202a3d'; g.fillRect(20, 20, w - 40, h - 40);
      g.save(); g.beginPath(); g.rect(20, 20, w - 40, h - 40); g.clip(); g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 3;
      for (let i = -h; i < w; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
      g.restore();
    }
    g.strokeStyle = bump ? '#1a1a1a' : '#0c1019'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
    g.strokeStyle = bump ? '#5a5a5a' : '#2e3b56'; g.lineWidth = 2; g.strokeRect(20, 20, w - 40, h - 40);
    g.fillStyle = bump ? '#c8c8c8' : '#3d4d6d'; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  };
  const floorTex = canvasTex(256, 256, drawFloor(false)), floorBump = canvasTex(256, 256, drawFloor(true), false);
  function tiled(tex, rx, ry) { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }

  /* ---------- 3. Escena, luces y materiales ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('#game'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.Fog(0x050915, 16, 62);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1200);
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = camera.aspect < 1 ? 72 : 58;      // en vertical (móvil) se abre el campo de visión
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  /* Mapa de entorno generado por código: da reflejos a metales, suelo y visor */
  (() => {
    const eq = canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#25324f'); gr.addColorStop(.5, '#0b111f'); gr.addColorStop(1, '#04060b');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      [[30, 22, 130, 14, '#dff4ff'], [290, 30, 150, 12, '#ffffff'], [190, 62, 70, 8, '#9b7bff'], [430, 74, 70, 8, '#4de3ff'], [100, 96, 50, 6, '#ff6b9d'], [0, 120, 512, 3, '#4de3ff']]
        .forEach(([x, y, a, b, c]) => { g.fillStyle = c; g.fillRect(x, y, a, b); });
    });
    eq.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(eq).texture; pm.dispose();
  })();

  scene.add(new THREE.AmbientLight(0x8fa3cc, 0.3));
  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x0a0c14, 0.32));
  /* Foco cenital que acompaña al astronauta: es la única luz que proyecta sombras */
  const keyLight = new THREE.SpotLight(0xe6f0ff, 1.15, 13, .78, .75, 1.1);
  keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = .5; keyLight.shadow.camera.far = 9; keyLight.shadow.bias = -.0012; keyLight.shadow.radius = 5;
  scene.add(keyLight, keyLight.target);

  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    metal: std({ color: 0x4a556e, metalness: .75, roughness: .38, envMapIntensity: 1 }),
    dark: std({ color: 0x161c2a, metalness: .6, roughness: .45, envMapIntensity: .9 }),
    frame: std({ color: 0x232b3e, metalness: .8, roughness: .3, envMapIntensity: 1.1 }),
    ceil: std({ color: 0x0d111b, roughness: .85, metalness: .2 }),
    white: std({ color: 0xf2f5fa, metalness: .08, roughness: .42, envMapIntensity: .8 }),
    glass: std({ color: 0x9fdcff, metalness: .2, roughness: .05, transparent: true, opacity: .16, envMapIntensity: 2, depthWrite: false })
  };
  const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false });
  M.accent = glow(ACCENT);
  function box(w, h, d, mat, x, y, z, parent = scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function plane(w, h, mat, x, y, z, parent = scene) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, parent = scene, seg = 20) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function ball(r, mat, x, y, z, parent = scene) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  const flat = m => { m.rotation.x = -PI / 2; return m; };
  const arch = m => { m.userData.arch = true; m.receiveShadow = true; return m; };   // paredes y suelos: reciben sombra, no la proyectan
  function halo(color, size, x, y, z, opacity = .5, parent = scene) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.scale.set(size, size, 1); s.position.set(x, y, z); parent.add(s); return s;
  }
  const wire = (geo, color, opacity = .9) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false }));
  /* Pantalla de pared enmarcada. rotY indica hacia dónde mira; glowSize 0 = sin resplandor */
  function wallScreen(tex, w, h, x, y, z, rotY, color, glowSize = Math.max(w, h) * 1.5) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
    box(w + .2, h + .2, .1, M.frame, 0, 0, 0, g);
    plane(w, h, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, 0, .056, g);
    box(w + .2, .035, .12, glow(color), 0, h / 2 + .1, 0, g); box(w + .2, .035, .12, glow(color), 0, -h / 2 - .1, 0, g);
    if (glowSize) halo(color, glowSize, 0, 0, .3, .1, g);
    return g;
  }

  /* ---------- 4. Arquitectura ---------- */
  /* Una pared recta con huecos para puertas. axis 'x' = corre a lo largo de X en z = c */
  function wallLine(axis, c, a, b, doors = []) {
    const segs = []; let s = a;
    for (const d of [...doors].sort((p, q) => p - q)) {
      segs.push([s, d - DOOR_W / 2, 0, WALL_H], [d - DOOR_W / 2, d + DOOR_W / 2, DOOR_H, WALL_H]);
      s = d + DOOR_W / 2;
    }
    segs.push([s, b, 0, WALL_H]);
    for (const [p, q, y0, y1] of segs) {
      const len = q - p, h = y1 - y0; if (len < 0.02) continue;
      const rx = Math.max(1, Math.round(len / 3)), ry = h / WALL_H;
      const mat = std({ map: tiled(panelTex, rx, ry), bumpMap: tiled(panelBump, rx, ry), bumpScale: .035, metalness: .55, roughness: .5, envMapIntensity: .7 });
      const mid = (p + q) / 2, y = (y0 + y1) / 2;
      arch(axis === 'x' ? box(len, h, WALL_T, mat, mid, y, c) : box(WALL_T, h, len, mat, c, y, mid));
    }
  }
  function buildArchitecture() {
    wallLine('x', -10, -14, 14, [0]);
    wallLine('x', 10, -14, 14, [0]);
    wallLine('z', -7, 10, 19); wallLine('z', 7, 10, 19);
    wallLine('z', -4, -10, 10, [-5, 5]);
    wallLine('z', 4, -10, 10, [-5, 5]);
    wallLine('z', -14, -10, 10); wallLine('z', 14, -10, 10);
    wallLine('x', 0, -14, -4); wallLine('x', 0, 4, 14);
    wallLine('z', -8, -20, -10); wallLine('z', 8, -20, -10);

    for (const z of ZONES) {
      const [x1, z1, x2, z2] = z.rect, w = x2 - x1, d = z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, hall = z.id === 'hall';
      /* Suelo pulido: refleja las luces gracias al mapa de entorno */
      arch(flat(plane(w, d, std({ map: tiled(floorTex, w / 2, d / 2), bumpMap: tiled(floorBump, w / 2, d / 2), bumpScale: .02, metalness: .82, roughness: .3, envMapIntensity: 1.15 }), cx, 0, cz)));
      const ceil = plane(w, d, M.ceil, cx, WALL_H, cz); ceil.rotation.x = PI / 2;
      /* Luces de sala. Las salas arrancan en penumbra y se encienden al abrir su puerta */
      z.lights = []; z.power = hall ? 1 : 0;
      const spots = hall ? [[0, -6], [0, 0], [0, 6]] : [[cx, cz]];
      for (const [lx, lz] of spots) {
        const base = hall ? .85 : 1.5, light = new THREE.PointLight(z.color, base, hall ? 15 : 19, 1.5); light.userData.base = base;
        light.position.set(lx, 3.4, lz); scene.add(light); z.lights.push(light);
      }
      const bars = hall ? [[0, -7.5, .5, 2.6], [0, -2.5, .5, 2.6], [0, 2.5, .5, 2.6], [0, 7.5, .5, 2.6]] : [[cx, cz - 2.2, 3.2, .34], [cx, cz + 2.2, 3.2, .34]];
      for (const [bx, bz, bw, bd] of bars) {
        box(bw + .16, .1, bd + .16, M.frame, bx, WALL_H - .05, bz);
        box(bw, .06, bd, glow(hall ? 0xdff4ff : z.color), bx, WALL_H - .1, bz);
        halo(z.color, 2.6, bx, WALL_H - .35, bz, .32);
      }
      /* Zócalo luminoso a lo largo del perímetro */
      const trim = hall ? M.accent : glow(z.color, .9);
      if (!hall) { box(w - .4, .05, .05, trim, cx, .1, z1 + .19); box(w - .4, .05, .05, trim, cx, .1, z2 - .19); }
      box(.05, .05, d - .4, trim, x1 + .19, .1, cz); box(.05, .05, d - .4, trim, x2 - .19, .1, cz);
      /* Columnas en las esquinas */
      if (!hall) for (const [px, pz] of [[x1 + .28, z1 + .28], [x2 - .28, z1 + .28], [x1 + .28, z2 - .28], [x2 - .28, z2 - .28]]) {
        if ((z.id === 'puente' && pz < -19) || (z.id === 'hangar' && pz > 18.5)) continue;
        box(.34, WALL_H, .34, M.frame, px, WALL_H / 2, pz); box(.36, .05, .36, glow(z.color), px, 2.9, pz);
      }
    }

    /* Ventanal del puente: cristal, montantes y, fuera, estrellas y un planeta */
    arch(box(16, .9, WALL_T, M.metal, 0, .45, -20)); arch(box(16, .6, WALL_T, M.metal, 0, WALL_H - .3, -20));
    for (const x of [-8, -4, 0, 4, 8]) box(.22, WALL_H, .34, M.frame, x, WALL_H / 2, -20);
    plane(16, WALL_H - 1.5, M.glass, 0, .9 + (WALL_H - 1.5) / 2, -20);
    arch(box(14, .6, WALL_T, M.metal, 0, .3, 19)); arch(box(14, .7, WALL_T, M.metal, 0, WALL_H - .35, 19));
    for (const x of [-7, -3.5, 0, 3.5, 7]) box(.26, WALL_H, .4, M.frame, x, WALL_H / 2, 19);
    const field = plane(14, WALL_H - 1.3, new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: .06, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), 0, .6 + (WALL_H - 1.3) / 2, 19);
    updaters.push(t => { field.material.opacity = .05 + Math.sin(t * 2.2) * .02; });

    const sp = new Float32Array(2200 * 3);
    for (let i = 0; i < 2200; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * 2 * PI, r = 300 + Math.random() * 300, s = Math.sqrt(1 - u * u);
      sp.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false, fog: false, toneMapped: false })));

    const planetTex = canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      [[0, '#16245c'], [.3, '#2f5fb8'], [.5, '#58b6e6'], [.62, '#2c4ea6'], [.8, '#5a3fa8'], [1, '#161a48']].forEach(([s, c]) => gr.addColorStop(s, c));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .12})`; g.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 160, 2 + Math.random() * 5); }
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(46, 48, 32), new THREE.MeshBasicMaterial({ map: planetTex, fog: false, toneMapped: false }));
    planet.position.set(34, -34, -150); planet.rotation.z = .35; scene.add(planet);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(48.5, 48, 32), new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: .16, side: THREE.BackSide, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    atm.position.copy(planet.position); scene.add(atm);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), new THREE.MeshBasicMaterial({ color: 0xb9c2d6, fog: false }));
    scene.add(moon);
    updaters.push((t, dt) => { planet.rotation.y += dt * .02; moon.position.set(34 + Math.cos(t * .05) * 80, -10 + Math.sin(t * .05) * 12, -150 + Math.sin(t * .05) * 60); });

    /* Pasillo: costillas en las paredes, vigas y tuberías en el techo */
    const copper = std({ color: 0xc08a3a, metalness: .8, roughness: .35 });
    for (const sx of [-1, 1]) {
      for (const z of [-8.2, -1.9, 1.9, 8.2]) { box(.3, WALL_H, .4, M.frame, sx * 3.72, WALL_H / 2, z); box(.04, 2.6, .06, M.accent, sx * 3.56, 1.7, z); }
      cyl(.08, .08, 20, M.metal, sx * 3.25, 3.92, 0).rotation.x = PI / 2;
      cyl(.045, .045, 20, copper, sx * 3.02, 3.98, 0).rotation.x = PI / 2;
      for (const z of [-6, 0, 6]) cyl(.11, .11, .14, M.frame, sx * 3.25, 3.92, z).rotation.x = PI / 2;
    }
    for (const z of [-5, 0, 5]) box(8, .22, .3, M.frame, 0, WALL_H - .11, z);

    /* Líneas guía en el suelo hacia cada puerta y marca del punto de inicio */
    const guide = (w, d, color, x, z, o = .6) => flat(plane(w, d, glow(color, o), x, .012, z));
    guide(.1, 15.4, 0xffffff, 0, -2.3, .35);
    for (const r of ROOMS) {
      if (r.door.axis === 'z') guide(Math.abs(r.door.x) - .1, .1, r.color, r.door.x / 2, r.door.z);
      const strip = r.door.axis === 'z' ? [.4, DOOR_W] : [DOOR_W, .4];
      guide(strip[0], strip[1], r.color, r.door.x - Math.sign(r.door.x) * .5, r.door.z - (r.door.axis === 'x' ? Math.sign(r.door.z) * .5 : 0), .8);
    }
    const ring = flat(new THREE.Mesh(new THREE.RingGeometry(.92, 1.02, 56), M.accent)); ring.position.set(SPAWN.x, .014, SPAWN.z); scene.add(ring);
    const ring2 = flat(new THREE.Mesh(new THREE.RingGeometry(1.2, 1.23, 56), glow(ACCENT, .5))); ring2.position.copy(ring.position); scene.add(ring2);
    updaters.push(t => { const k = t * .35 % 1; ring2.scale.setScalar(1 + k * .5); ring2.material.opacity = .5 * (1 - k); });
    flat(plane(1.3, .26, new THREE.MeshBasicMaterial({ map: textTex('INICIO', '#ffffff', { w: 512, h: 100, size: 64 }), transparent: true, toneMapped: false }), SPAWN.x, .014, SPAWN.z + 1.5));

    /* Cartel de la estación y pantallas informativas del pasillo */
    for (const sx of [-1.7, 1.7]) box(.03, .5, .03, M.frame, sx, 3.75, .05);
    box(4.1, .62, .07, M.frame, 0, 3.42, .05);
    plane(3.9, .55, new THREE.MeshBasicMaterial({ map: textTex('RODRIGO STATION', hex(ACCENT), { w: 2048, h: 288, size: 170 }), transparent: true, toneMapped: false }), 0, 3.42, .1);
    wallScreen(infoTex('ESTADO DE LA MISIÓN', CV.ficha.map(f => [f.clave.toUpperCase(), f.valor]), hex(ACCENT), 1024, 640), 2.6, 1.62, -3.78, 2.2, 0, PI / 2, ACCENT);
    wallScreen(infoTex('DIRECTORIO', ROOMS.map(r => [r.name, r.short]), '#dff4ff', 1024, 640), 2.6, 1.62, 3.78, 2.2, 0, -PI / 2, 0xdff4ff);
    for (const x of [-3.1, 3.1]) { box(1, 1, 1, M.metal, x, .5, 9.1); box(.8, .05, .8, M.accent, x, 1.03, 9.1); box(.5, .5, .5, M.dark, x, 1.3, 9.15).rotation.y = .5; blocks.push([x - .5, 8.6, x + .5, 9.6]); }

    /* Vida ambiental: motas de polvo en suspensión y un dron de mantenimiento */
    const N = 260, dp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) dp.set([-14 + Math.random() * 28, .3 + Math.random() * 3.6, -20 + Math.random() * 30], i * 3);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xcfe6ff, size: .035, transparent: true, opacity: .55, depthWrite: false })));
    updaters.push((t, dt) => {
      for (let i = 0; i < N; i++) { dp[i * 3 + 1] += dt * (.03 + (i % 5) * .012); dp[i * 3] += Math.sin(t * .4 + i) * dt * .03; if (dp[i * 3 + 1] > 4) dp[i * 3 + 1] = .2; }
      dg.attributes.position.needsUpdate = true;
    });
    const drone = new THREE.Group(); scene.add(drone);
    ball(.2, M.white, 0, 0, 0, drone); ball(.075, glow(ACCENT), 0, -.02, .16, drone);
    const dring = new THREE.Mesh(new THREE.TorusGeometry(.3, .025, 8, 32), M.frame); dring.rotation.x = PI / 2; drone.add(dring);
    halo(ACCENT, .8, 0, 0, .2, .5, drone);
    updaters.push(t => {
      const a = t * .32;
      drone.position.set(Math.sin(a) * 2.5, 3.05 + Math.sin(t * 2) * .08, -1.5 + Math.cos(a) * 6.5);
      drone.rotation.y = Math.atan2(Math.cos(a) * 2.5, -Math.sin(a) * 6.5); dring.rotation.z = t * 3;
    });
  }

  /* ---------- 5. Puertas y terminales ---------- */
  const leafTex = (color, n) => canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#3a445c'); gr.addColorStop(.5, '#566380'); gr.addColorStop(1, '#3a445c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1b2233'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#0a1220'; g.fillRect(60, 90, w - 120, 120); g.fillStyle = color; g.globalAlpha = .85; g.fillRect(68, 98, w - 136, 104); g.globalAlpha = 1;
    g.fillStyle = '#1b2233'; g.fillRect(14, h - 120, w - 28, 76);
    g.save(); g.beginPath(); g.rect(14, h - 120, w - 28, 76); g.clip(); g.fillStyle = '#e8b33a';
    for (let x = -80; x < w; x += 56) { g.beginPath(); g.moveTo(x, h - 44); g.lineTo(x + 28, h - 44); g.lineTo(x + 104, h - 120); g.lineTo(x + 76, h - 120); g.fill(); }
    g.restore();
    g.fillStyle = '#c8d2e6'; g.font = `700 54px ${MONO}`; g.textAlign = 'center'; g.fillText('0' + n, w / 2, 300);
  });
  let pasilloTex;
  function buildDoor(zone, idx) {
    const d = zone.door, g = new THREE.Group();
    g.position.set(d.x, 0, d.z); if (d.axis === 'z') g.rotation.y = PI / 2;
    scene.add(g);
    const col = glow(zone.color);
    pasilloTex = pasilloTex || textTex('PASILLO CENTRAL', '#9fdcff', { size: 70 });
    /* Marco metálico con una fina línea de luz */
    for (const s of [-1, 1]) { box(.2, DOOR_H + .1, WALL_T + .16, M.frame, s * (DOOR_W / 2 + .06), DOOR_H / 2 + .05, 0, g); for (const zf of [-1, 1]) box(.035, DOOR_H, .03, col, s * (DOOR_W / 2 - .03), DOOR_H / 2, zf * (WALL_T / 2 + .09), g); }
    box(DOOR_W + .32, .2, WALL_T + .16, M.frame, 0, DOOR_H + .1, 0, g); for (const zf of [-1, 1]) box(DOOR_W, .035, .03, col, 0, DOOR_H - .01, zf * (WALL_T / 2 + .09), g);
    /* Hojas correderas */
    const leafMat = std({ map: leafTex(hex(zone.color), idx + 1), metalness: .7, roughness: .35, envMapIntensity: 1 });
    const leaves = [-1, 1].map(s => box(DOOR_W / 2, DOOR_H, .14, leafMat, s * DOOR_W / 4, DOOR_H / 2, 0, g));
    /* Rótulo y teclado con piloto (rojo = cerrada, verde = abierta), por ambos lados */
    const led = glow(0xff4d5e);
    for (const s of [d.side, -d.side]) {
      const front = s === d.side, zo = s * (WALL_T / 2 + .04);
      box(front ? 3.6 : 2.9, .78, .06, M.frame, 0, DOOR_H + .68, zo, g);
      const lab = plane(front ? 3.3 : 2.6, front ? .64 : .5, new THREE.MeshBasicMaterial({ map: front ? textTex(zone.name.toUpperCase(), hex(zone.color)) : pasilloTex, transparent: true, toneMapped: false }), 0, DOOR_H + .68, zo + s * .035, g);
      if (s < 0) lab.rotation.y = PI;
      if (front) halo(zone.color, 4.2, 0, DOOR_H + .68, zo + s * .3, .22, g);
      box(.26, .4, .06, M.dark, DOOR_W / 2 + .52, 1.4, zo, g); box(.14, .06, .07, led, DOOR_W / 2 + .52, 1.52, zo + s * .005, g);
      box(.16, .16, .07, glow(zone.color, .8), DOOR_W / 2 + .52, 1.32, zo + s * .005, g);
    }
    zone.open = false; zone.openT = 0;
    const it = { x: d.x, z: d.z, r: 2.7, label: `Abrir · ${zone.name}`, active: true, action: () => openDoor(zone) };
    zone.doorItem = it; interactables.push(it);
    updaters.push((t, dt) => {
      if (zone.open && zone.openT < 1) zone.openT = Math.min(1, zone.openT + dt * 1.9);
      const e = 1 - Math.pow(1 - zone.openT, 3), off = DOOR_W / 4 + e * (DOOR_W / 2 - .04);
      leaves[0].position.x = -off; leaves[1].position.x = off;
      /* Al abrirse la puerta, la sala se enciende progresivamente */
      if (zone.open && zone.power < 1) zone.power = Math.min(1, zone.power + dt * .9);
      for (const l of zone.lights) l.intensity = l.userData.base * (.16 + .84 * zone.power);
      led.color.setHex(zone.open ? OK_COLOR : (Math.sin(t * 4) > 0 ? 0xff4d5e : 0x7a1f2a));
    });
  }
  function openDoor(zone, instant) {
    if (!zone.door || zone.open) return;
    zone.open = true; zone.doorItem.active = false;
    if (instant) { zone.openT = 1; zone.power = Math.max(zone.power, .6); }
  }

  function iconGeo(icon) {
    switch (icon) {
      case 'sphere': return new THREE.SphereGeometry(.16, 16, 12);
      case 'cone':   return new THREE.ConeGeometry(.15, .34, 4);
      case 'box':    return new THREE.BoxGeometry(.24, .24, .24);
      case 'dodeca': return new THREE.DodecahedronGeometry(.18);
      case 'knot':   return new THREE.TorusKnotGeometry(.11, .035, 48, 8);
      case 'torus':  return new THREE.TorusGeometry(.14, .05, 10, 24);
      case 'globe':  return new THREE.IcosahedronGeometry(.17, 1);
      case 'tetra':  return new THREE.TetrahedronGeometry(.21);
      case 'disc':   return new THREE.CylinderGeometry(.18, .18, .05, 24).rotateX(PI / 2);
      case 'buoy':   return new THREE.TorusGeometry(.16, .065, 10, 24);
      case 'wave':   return new THREE.TorusKnotGeometry(.12, .03, 64, 8, 3, 2);
      case 'chip':   return new THREE.BoxGeometry(.3, .06, .3);
      default:       return new THREE.OctahedronGeometry(.17);
    }
  }
  function buildTerminal(t) {
    const zone = zoneById(t.zone), color = zone.color;
    t.fx = Math.sin(t.rot); t.fz = Math.cos(t.rot);        // hacia dónde mira
    t.reach = t.core ? 2.5 : 1.5;                          // dónde se coloca el astronauta
    t.holoMat = glow(color, .95); t.ringMat = glow(color, .7);
    const it = { x: t.x, z: t.z, r: t.core ? 3.1 : 2.3, label: t.title, active: true, action: () => openWin(t) };
    interactables.push(it);
    if (t.core) return;                                    // el núcleo de IA se dibuja en su sala
    const g = new THREE.Group(); g.position.set(t.x, 0, t.z); g.rotation.y = t.rot; scene.add(g);
    box(.5, .9, .34, M.frame, 0, .45, -.04, g); box(1.02, .1, .56, M.dark, 0, .95, 0, g); box(.9, .04, .5, glow(color, .9), 0, 1.01, 0, g);
    box(1.1, .06, .62, M.frame, 0, .03, 0, g);
    plane(.94, .6, new THREE.MeshBasicMaterial({ map: screenTex(t.title, hex(color)), toneMapped: false }), 0, 1.42, .03, g).rotation.x = -.42;
    box(1.02, .68, .05, M.frame, 0, 1.41, -.01, g).rotation.x = -.42;
    /* Haz holográfico con un icono flotante: cambia a verde cuando ya se ha consultado */
    const beam = cyl(.03, .22, 1, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0, 1.75, -.12, g, 16);
    const holo = new THREE.Mesh(iconGeo(t.icon), t.holoMat); holo.position.set(0, 2.42, -.12); g.add(holo);
    const hw = wire(new THREE.OctahedronGeometry(.28), 0xffffff, .6); hw.position.copy(holo.position); g.add(hw);
    t.halo = halo(color, 1.1, 0, 2.42, -.12, .55, g);
    const ring = flat(new THREE.Mesh(new THREE.RingGeometry(1.22, 1.3, 48), t.ringMat)); ring.position.set(0, .016, .95); g.add(ring);
    blocks.push([t.x - .52, t.z - .52, t.x + .52, t.z + .52]);
    updaters.push((time) => { holo.rotation.y = time * 1.6; hw.rotation.y = -time * .8; hw.rotation.x = time * .5; holo.position.y = hw.position.y = 2.42 + Math.sin(time * 2 + t.x) * .07; beam.material.opacity = .1 + Math.sin(time * 3 + t.z) * .04; });
  }
  function markDone(t) {
    if (state.done.has(t.id)) return;
    state.done.add(t.id);
    t.holoMat.color.setHex(OK_COLOR); t.ringMat.color.setHex(OK_COLOR); if (t.halo) t.halo.material.color.setHex(OK_COLOR);
  }

  /* ---------- 6. Decoración de salas ---------- */
  function pedestal(x, z, color, r = .7) {
    cyl(r, r * 1.2, .9, M.dark, x, .45, z, scene, 28); cyl(r * 1.25, r * 1.25, .08, M.frame, x, .04, z, scene, 28);
    cyl(r * .9, r * .9, .05, glow(color), x, .92, z, scene, 28); halo(color, r * 3, x, 1.1, z, .35);
    blocks.push([x - r, z - r, x + r, z + r]);
  }
  function monitor(w, h, color, x, y, z, rotY) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
    box(w + .1, h + .1, .06, M.frame, 0, 0, -.035, g); plane(w, h, new THREE.MeshBasicMaterial({ map: codeTex(hex(color)), toneMapped: false }), 0, 0, 0, g);
    box(.1, .4, .06, M.frame, 0, -h / 2 - .2, -.06, g);
  }

  /* Puente de mando — presentación personal y objetivos */
  function decoratePuente() {
    const c = 0x4de3ff;
    for (const x of [-5, -2.5, 0, 2.5, 5]) {
      box(2.3, .9, .9, M.dark, x, .45, -18.85); box(2.3, .04, .9, glow(c, .85), x, .92, -18.85);
      plane(1.9, .6, new THREE.MeshBasicMaterial({ map: codeTex(hex(c)), toneMapped: false }), x, 1.22, -18.75).rotation.x = -.5;
      for (let i = 0; i < 4; i++) box(.1, .03, .1, glow(i % 2 ? 0xff6b9d : 0x5ef0a8), x - .8 + i * .22, .96, -18.5);
    }
    blocks.push([-6.2, -19.4, 6.2, -18.3]);
    /* Sillón de mando */
    box(.9, .16, .9, M.frame, 0, .5, -17); box(.9, 1.15, .16, M.frame, 0, 1.1, -16.58); box(.7, .9, .05, M.white, 0, 1.12, -16.67);
    cyl(.14, .3, .42, M.dark, 0, .21, -17); box(.12, .3, .7, M.dark, -.5, .7, -17); box(.12, .3, .7, M.dark, .5, .7, -17);
    blocks.push([-.55, -17.5, .55, -16.4]);
    /* Holograma central con un satélite en órbita */
    pedestal(0, -13.6, c, .8);
    const globe = new THREE.Group(); globe.position.set(0, 2.05, -13.6); scene.add(globe);
    globe.add(wire(new THREE.IcosahedronGeometry(.95, 1), c, .25));
    /* Retrato holográfico: la foto se tiñe del color de la sala y lleva líneas de barrido */
    if (window.CV_PHOTO) {
      const img = new Image();
      img.onload = () => {
        const tex = canvasTex(256, 256, (g, w, h) => {
          g.drawImage(img, 0, 0, w, h);
          const d = g.getImageData(0, 0, w, h), p = d.data;
          for (let i = 0; i < p.length; i += 4) {
            const l = (p[i] * .3 + p[i + 1] * .55 + p[i + 2] * .15) / 255, row = Math.floor(i / 4 / w);
            const k = (row % 3 === 0 ? .55 : 1) * (1 - l * .55), dx = (i / 4 % w) / w - .5, dy = row / h - .5, fade = Math.max(0, 1 - Math.hypot(dx, dy) * 1.9);
            p[i] = 77 * k + 60 * (1 - l); p[i + 1] = 227 * k; p[i + 2] = 255 * k; p[i + 3] = 255 * fade * (.35 + .65 * (1 - l));
          }
          g.putImageData(d, 0, 0);
        });
        const face = plane(1.25, 1.25, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }), 0, 0, 0, globe);
        face.userData.billboard = true;
      };
      img.src = window.CV_PHOTO;
    }
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.08, .014, 8, 64), glow(c, .8)); orbit.position.copy(globe.position); orbit.rotation.x = 1.2; scene.add(orbit);
    const sat = ball(.06, glow(0xffffff), 0, 0, 0);
    cyl(.7, .75, 1.1, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), 0, 1.5, -13.6, scene, 28);
    updaters.push((t) => { globe.children[0].rotation.y = t * .3; if (globe.children[1]) globe.children[1].quaternion.copy(camera.quaternion); globe.position.y = 2.05 + Math.sin(t * 1.2) * .05; orbit.rotation.z = t * .8; sat.position.set(Math.cos(t * 1.3) * 1.25, 2.05 + Math.sin(t * 1.3) * .5, -13.6 + Math.sin(t * 1.3) * 1.25); });
    /* Pantallas con la presentación y los objetivos */
    wallScreen(infoTex('COMANDANTE DE LA MISIÓN', [CV.nombre, ...CV.hero.roles.slice(0, 2), '«' + CV.hero.lema + '»'], hex(c), 1024, 600), 3.6, 2.1, -7.78, 2.35, -12.9, PI / 2, c);
    wallScreen(infoTex('OBJETIVOS DE LA MISIÓN', CV.sobre.objetivos.map(o => [o.texto, o.estado === 'done' ? '✓ OK' : 'SIGUIENTE']), hex(c), 1024, 600), 3.6, 2.1, 7.78, 2.35, -12.9, -PI / 2, c);
  }

  /* Laboratorio — DAM, programación, bases de datos y tecnologías */
  function decorateLab() {
    const c = 0x5ef0a8;
    box(7, .1, 1.05, M.frame, -9, .9, -9.3); box(6.8, .8, .9, M.dark, -9, .42, -9.3); box(7, .035, 1.05, glow(c, .85), -9, .96, -9.3);
    blocks.push([-12.5, -10, -5.5, -8.8]);
    for (const x of [-11.3, -9.4, -7.5]) { monitor(1.6, .95, c, x, 1.85, -9.5, 0); box(.9, .03, .3, M.dark, x, .99, -9.05); }
    /* Brazo robótico trabajando sobre el banco */
    const arm = new THREE.Group(); arm.position.set(-6.1, .97, -9.3); scene.add(arm);
    cyl(.16, .2, .14, M.frame, 0, .07, 0, arm); const a1 = new THREE.Group(); a1.position.y = .14; arm.add(a1);
    box(.1, .6, .1, M.white, 0, .3, 0, a1); ball(.08, M.frame, 0, .6, 0, a1);
    const a2 = new THREE.Group(); a2.position.y = .6; a1.add(a2); box(.08, .5, .08, M.white, 0, .25, 0, a2); ball(.05, glow(c), 0, .52, 0, a2);
    updaters.push(t => { arm.rotation.y = Math.sin(t * .7) * .9 - .6; a1.rotation.z = .35 + Math.sin(t * 1.1) * .25; a2.rotation.z = .9 + Math.sin(t * 1.6) * .4; });
    /* Mesa holográfica: una app multiplataforma en construcción (móvil + escritorio) */
    pedestal(-9, -5, c, .95);
    const proto = new THREE.Group(); proto.position.set(-9, 2, -5); scene.add(proto);
    const phone = wire(new THREE.BoxGeometry(.5, .95, .06), c); phone.position.x = -.6; proto.add(phone);
    plane(.42, .82, glow(c, .14), -.6, 0, 0, proto).material.side = THREE.DoubleSide;
    const screen = wire(new THREE.BoxGeometry(1.15, .72, .05), 0xffffff, .75); screen.position.set(.42, .1, 0); proto.add(screen);
    plane(1.05, .62, glow(0xffffff, .08), .42, .1, 0, proto).material.side = THREE.DoubleSide;
    const cube = wire(new THREE.BoxGeometry(.26, .26, .26), c); cube.position.set(.42, -.55, 0); proto.add(cube);
    updaters.push((t) => { proto.rotation.y = t * .55; cube.rotation.x = t * 1.5; proto.position.y = 2 + Math.sin(t * 1.4) * .06; });
    /* Holograma de base de datos: los tres discos clásicos */
    pedestal(-12.4, -1.5, c, .6);
    const db = new THREE.Group(); db.position.set(-12.4, 1.85, -1.5); scene.add(db);
    for (let i = 0; i < 3; i++) { const dsk = wire(new THREE.CylinderGeometry(.42, .42, .22, 20), i === 1 ? 0xffffff : c, .85); dsk.position.y = (i - 1) * .32; db.add(dsk); cyl(.4, .4, .2, glow(c, .1), 0, (i - 1) * .32, 0, db); }
    updaters.push(t => { db.rotation.y = -t * .6; db.position.y = 1.85 + Math.sin(t * 1.8) * .05; });
    /* Estantería de componentes y pantalla con los módulos del ciclo */
    box(.6, 2.2, 3, M.frame, -13.5, 1.1, -8); blocks.push([-14, -9.6, -13.1, -6.4]);
    for (let i = 0; i < 6; i++) box(.05, .12, .5, glow(i % 2 ? c : 0xffffff, .9), -13.18, .5 + (i % 3) * .7, -8.9 + Math.floor(i / 3) * 1.8);
    wallScreen(infoTex('CICLO DAM · MÓDULOS', CV.formacion[3].etiquetas, hex(c), 1024, 900), 2.8, 2.46, -6.3, 2.35, -.22, PI, c);
  }

  /* Núcleo de IA — especialización en inteligencia artificial */
  function decorateIA() {
    const c = 0x9b7bff, t = TERMS.find(x => x.core), zone = zoneById('ia');
    cyl(1.1, 1.4, .7, M.dark, 9, .35, -5, scene, 36); cyl(1.5, 1.5, .08, M.frame, 9, .04, -5, scene, 36); cyl(1, 1, .06, t.ringMat, 9, .72, -5, scene, 36);
    blocks.push([7.9, -6.1, 10.1, -3.9]);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.68, 0), t.holoMat); core.position.set(9, 2.1, -5); scene.add(core);
    const shell = wire(new THREE.IcosahedronGeometry(.95, 1), 0xffffff, .55); shell.position.copy(core.position); scene.add(shell);
    t.halo = halo(c, 4.2, 9, 2.1, -5, .55);
    const rings = [1.35, 1.6, 1.85].map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .02, 8, 80), glow(i === 1 ? 0xffffff : c, .85)); m.position.copy(core.position); scene.add(m); return m; });
    const pp = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) { const a = Math.random() * 2 * PI, r = 1.2 + Math.random() * 1.7; pp.set([Math.cos(a) * r, (Math.random() - .5) * 2.6, Math.sin(a) * r], i * 3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xd9ccff, size: .06, transparent: true, opacity: .95, toneMapped: false })); pts.position.copy(core.position); scene.add(pts);
    const pulse = new THREE.PointLight(c, 1, 9, 2); pulse.position.copy(core.position); scene.add(pulse);
    /* Circuitos en el suelo que salen del núcleo */
    for (let i = 0; i < 8; i++) { const a = i * PI / 4, len = i % 2 ? 2.2 : 3; flat(plane(.05, len, glow(c, .6), 9 + Math.sin(a) * (1.5 + len / 2), .013, -5 + Math.cos(a) * (1.5 + len / 2))).rotation.z = -a; }
    updaters.push((time) => {
      core.rotation.set(time * .5, time * .7, 0); shell.rotation.set(-time * .2, -time * .3, 0);
      rings[0].rotation.set(time * .9, 0, time * .3); rings[1].rotation.set(0, time * .7, time * .5); rings[2].rotation.set(time * .4, time * .6, 0);
      pts.rotation.y = time * .25; core.scale.setScalar(1 + Math.sin(time * 2.4) * .07);
      pulse.intensity = (1 + Math.sin(time * 2.4) * .5) * zone.power; t.halo.material.opacity = .45 + Math.sin(time * 2.4) * .15;
    });
    plane(2.4, .46, new THREE.MeshBasicMaterial({ map: textTex('NÚCLEO DE IA', hex(c), { size: 78 }), transparent: true, toneMapped: false }), 7.73, .42, -5).rotation.y = -PI / 2;
    /* Red neuronal holográfica en la pared: las neuronas se activan por capas */
    const nn = new THREE.Group(); nn.position.set(9, 2.3, -.24); nn.rotation.y = PI; scene.add(nn);
    const nodes = [], lp = [];
    [3, 5, 5, 2].forEach((n, li) => { for (let k = 0; k < n; k++) nodes.push({ li, m: ball(.085, glow(c), (li - 1.5) * 1.15, (k - (n - 1) / 2) * .5, 0, nn) }); });
    nodes.forEach(a => nodes.forEach(b => { if (b.li === a.li + 1) lp.push(a.m.position.x, a.m.position.y, 0, b.m.position.x, b.m.position.y, 0); }));
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    nn.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .3, toneMapped: false })));
    box(4.6, 2.9, .06, M.frame, 0, 0, -.06, nn); halo(c, 5, 0, 0, .3, .12, nn);
    updaters.push(time => nodes.forEach((n, i) => { const k = .5 + .5 * Math.sin(time * 3 - n.li * 1.3 + i * .7); n.m.material.color.setRGB(.61 + .39 * k, .48 + .52 * k, 1); n.m.scale.setScalar(.8 + k * .5); }));
    wallScreen(infoTex('ESPECIALIZACIÓN IA Y BIG DATA', CV.formacion[4].etiquetas, hex(c), 1024, 560), 2.9, 1.6, 6.2, 2.5, -9.78, 0, c);
    /* Bastidores de servidores con luces que parpadean */
    const leds = [];
    for (const z of [-8.6, -6.9, -3.1, -1.4]) { box(.9, 3, 1.5, M.dark, 13.35, 1.5, z); box(.04, 2.8, 1.36, M.frame, 12.89, 1.5, z); for (let i = 0; i < 6; i++) leds.push(box(.04, .05, 1.1, glow(i % 3 ? c : 0xffffff), 12.86, .5 + i * .42, z)); }
    blocks.push([12.8, -9.5, 14, -.5]);
    updaters.push((time) => leds.forEach((l, i) => { l.visible = Math.sin(time * (2 + (i % 5)) + i) > -.55; }));
  }

  /* Centro de comunicaciones — inglés B2, idiomas y contacto */
  function decorateCom() {
    const c = 0xff6b9d;
    cyl(.12, .2, 1.8, M.metal, 12, .9, 7.8); cyl(.5, .6, .12, M.frame, 12, .06, 7.8);
    const head = new THREE.Group(); head.position.set(12, 1.95, 7.8); scene.add(head);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 12, 0, 2 * PI, 0, .9), std({ color: 0xe9eef7, side: THREE.DoubleSide, metalness: .5, roughness: .3, envMapIntensity: 1.2 }));
    dish.rotation.x = PI * .62; dish.position.y = .5; head.add(dish);
    const tip = ball(.08, glow(c), 0, .55, .55, head); halo(c, .9, 0, .55, .55, .6, head);
    blocks.push([11, 6.8, 13, 8.8]);
    /* Radar en el suelo y globo terráqueo holográfico con satélites: los idiomas conectan */
    for (const r of [.8, 1.6, 2.4]) { const g = flat(new THREE.Mesh(new THREE.RingGeometry(r - .025, r, 72), glow(c, .6))); g.position.set(9, .013, 5); scene.add(g); }
    const sweep = flat(new THREE.Mesh(new THREE.CircleGeometry(2.4, 28, 0, .7), glow(c, .2))); sweep.position.set(9, .015, 5); scene.add(sweep);
    const globe = wire(new THREE.SphereGeometry(.85, 14, 10), c, .55); globe.position.set(9, 2.75, 5); scene.add(globe);
    ball(.8, glow(c, .06), 9, 2.75, 5); halo(c, 3.4, 9, 2.75, 5, .2);
    const sats = [0, 1].map(() => { const s = box(.12, .06, .06, glow(0xffffff), 0, 0, 0); box(.3, .01, .1, glow(c), 0, 0, 0, s); return s; });
    updaters.push((t) => {
      head.rotation.y = t * .5; sweep.rotation.z = -t * 1.4; tip.visible = Math.sin(t * 6) > 0; globe.rotation.y = t * .3;
      sats.forEach((s, i) => { const a = t * (.9 + i * .4) + i * 2; s.position.set(9 + Math.cos(a) * 1.3, 2.75 + Math.sin(a * (i ? 1 : .6)) * .5, 5 + Math.sin(a) * 1.3); });
    });
    /* Paneles de idiomas con su nivel */
    const lang = (code, name, level, pct) => canvasTex(640, 480, (g, w, h) => {
      g.fillStyle = '#060a13'; g.fillRect(0, 0, w, h); g.strokeStyle = hex(c); g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = hex(c); g.font = `700 190px ${FONT}`; g.fillText(code, 40, 210);
      g.fillStyle = '#eef3fb'; g.font = `500 52px ${FONT}`; g.fillText(name, 44, 290);
      g.fillStyle = '#fff'; g.textAlign = 'right'; fitText(g, level, 300, 60, 700, MONO); g.fillText(level, w - 44, 120); g.textAlign = 'left';
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(44, 350, w - 88, 26); g.fillStyle = hex(c); g.fillRect(44, 350, (w - 88) * pct, 26);
      g.fillStyle = '#8d98b3'; g.font = `400 26px ${MONO}`; g.fillText(code === 'EN' ? 'B2 FIRST · ACREDITADO' : 'LENGUA MATERNA', 44, 426);
    });
    CV.idiomas.slice(0, 2).forEach((l, i) => wallScreen(lang(l.codigo, l.titulo ? l.nombre + ' · Cambridge' : l.nombre, l.nivel.toUpperCase(), l.nivelNum / 100), 2, 1.5, 13.78, 2.4, 2.5 + i * 2.4, -PI / 2, c));
    box(.5, .9, 3.6, M.dark, 13.5, .45, 3.7); box(.5, .04, 3.6, glow(c, .85), 13.5, .92, 3.7); blocks.push([13.1, 1.8, 14, 5.6]);
    /* Señal de comunicaciones en movimiento */
    const waveTex = canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#060a13'; g.fillRect(0, 0, w, h); g.strokeStyle = hex(c); g.lineWidth = 3; g.beginPath();
      for (let x = 0; x <= w; x += 4) { const y = h / 2 + Math.sin(x * PI / 32) * 26 * Math.sin(x * PI / 256) + Math.sin(x * PI / 8) * 7; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
    waveTex.wrapS = THREE.RepeatWrapping; updaters.push((t, dt) => { waveTex.offset.x += dt * .25; });
    wallScreen(waveTex, 3, .8, 6.2, 2.5, 9.78, PI, c);
  }

  /* Archivo de misiones — formación académica anterior y certificados */
  function decorateArchivo() {
    const c = 0xffb454, cols = [c, 0xffffff, 0xff7a59];
    /* Las cuatro etapas de la formación, expuestas como cápsulas de una misión cumplida */
    const shapes = [new THREE.TetrahedronGeometry(.2), new THREE.BoxGeometry(.26, .26, .26), new THREE.OctahedronGeometry(.22), new THREE.IcosahedronGeometry(.24, 0)];
    CV.formacion.forEach((f, i) => {
      const x = -9.4, z = 2.3 + i * 1.5, last = i === CV.formacion.length - 1, col = last ? 0xffffff : c, name = (f.corto || f.titulo).toUpperCase();
      cyl(.46, .52, .3, M.frame, x, .15, z, scene, 24); cyl(.4, .4, .04, glow(col), x, .32, z, scene, 24);
      cyl(.38, .38, 1.45, M.glass, x, 1.06, z, scene, 24); cyl(.46, .46, .12, M.frame, x, 1.85, z, scene, 24);
      const gem = new THREE.Mesh(shapes[i % 4], glow(col)); gem.position.set(x, 1.05, z); scene.add(gem);
      halo(col, 1.3, x, 1.05, z, .45);
      plane(1.35, .5, new THREE.MeshBasicMaterial({ map: canvasTex(540, 200, (g, w, h) => {
        g.fillStyle = 'rgba(6,10,19,.85)'; g.fillRect(0, 0, w, h); g.fillStyle = hex(col); g.fillRect(0, 0, 10, h);
        g.font = `600 30px ${MONO}`; g.fillText('ETAPA 0' + (i + 1) + (f.periodo ? ' · ' + f.periodo : ''), 30, 56);
        g.fillStyle = '#fff'; fitText(g, name, w - 50, 76); g.fillText(name, 30, 142);
      }), transparent: true, toneMapped: false }), x + .1, 2.3, z).rotation.y = PI / 2;
      blocks.push([x - .46, z - .46, x + .46, z + .46]);
      updaters.push(t => { gem.rotation.set(t * .8 + i, t * 1.1, 0); gem.position.y = 1.05 + Math.sin(t * 1.6 + i) * .08; });
    });
    /* Estanterías con cápsulas de datos */
    const shelf = (x, z, w, d, h, alongZ) => {
      box(w, h, d, M.dark, x, h / 2, z); blocks.push([x - w / 2, z - d / 2, x + w / 2, z + d / 2]);
      const len = alongZ ? d : w, n = Math.floor(len / .55), rows = Math.floor(h / .7);
      for (let row = 0; row < rows; row++) for (let i = 0; i < n; i++) {
        if (Math.random() < .15) continue;
        const off = -len / 2 + .3 + i * .55, y = .5 + row * .66, m = glow(cols[(i + row) % 3], .92);
        if (alongZ) box(.06, .38, .26, m, x + w / 2 + .01, y, z + off); else box(.26, .38, .06, m, x + off, y, z - d / 2 - .01);
      }
    };
    shelf(-13.55, 5, .7, 7, 3, true);
    shelf(-10.6, 9.55, 4.6, .7, 1.7, false);
    /* Certificados enmarcados sobre la estantería */
    CV.certificados.slice(0, 5).map(x => x.titulo).forEach((txt, i) => {
      const tex = canvasTex(400, 260, (g, w, h) => {
        g.fillStyle = '#0b1220'; g.fillRect(0, 0, w, h); g.strokeStyle = hex(c); g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
        g.fillStyle = hex(c); g.font = `600 22px ${MONO}`; g.textAlign = 'center'; g.fillText('CERTIFICADO', w / 2, 56);
        g.fillStyle = '#fff'; g.font = `600 30px ${FONT}`; wrapText(g, txt, w / 2, 110, w - 60, 38);
        g.beginPath(); g.arc(w / 2, h - 44, 14, 0, 7); g.fillStyle = hex(c); g.fill();
      });
      wallScreen(tex, .84, .55, -12.5 + i * .96, 2.55, 9.8, PI, c, 0);
    });
  }

  /* Hangar de operaciones — experiencia laboral y prácticas */
  function decorateHangar() {
    const c = 0xffd23f;
    /* Plataforma de aterrizaje con franjas de seguridad */
    const padTex = canvasTex(512, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.lineWidth = 18; g.strokeStyle = '#ffd23f'; g.beginPath(); g.arc(256, 256, 236, 0, 7); g.stroke();
      g.lineWidth = 4; g.beginPath(); g.arc(256, 256, 200, 0, 7); g.stroke();
      g.save(); g.beginPath(); g.arc(256, 256, 236, 0, 7); g.arc(256, 256, 214, 0, 7, true); g.clip();
      g.fillStyle = '#111'; for (let a = 0; a < 40; a++) { g.save(); g.translate(256, 256); g.rotate(a * PI / 20); g.fillRect(200, -6, 60, 12); g.restore(); }
      g.restore();
      g.fillStyle = 'rgba(255,210,63,.85)'; g.font = `700 60px ${MONO}`; g.textAlign = 'center'; g.fillText('RB-01', 256, 470);
    });
    flat(plane(6, 6, new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: .75, depthWrite: false, toneMapped: false }), 0, .014, 15.4));

    /* Lanzadera */
    const ship = new THREE.Group(); ship.position.set(0, 1.25, 15.4); scene.add(ship);
    const hull = cyl(.78, .7, 3.6, M.white, 0, 0, 0, ship, 28); hull.rotation.z = PI / 2;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.78, 1.4, 28), M.white); nose.rotation.z = -PI / 2; nose.position.x = 2.5; ship.add(nose);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 16, 0, PI * 2, 0, PI / 2), std({ color: 0x0b1a36, metalness: 1, roughness: .05, envMapIntensity: 2.4, emissive: 0x0a2a55, emissiveIntensity: .5 }));
    cockpit.position.set(1.6, .48, 0); cockpit.scale.set(1.5, .7, .9); ship.add(cockpit);
    const band = cyl(.8, .8, .18, glow(c), -.4, 0, 0, ship, 28); band.rotation.z = PI / 2;
    for (const s of [-1, 1]) {
      const wing = box(2, .1, 1.7, M.frame, -.5, -.25, s * 1.5, ship); wing.rotation.y = s * .25;
      box(.5, .06, .06, glow(s > 0 ? 0x5ef0a8 : 0xff4d5e), -.1, -.18, s * 2.32, ship).userData.nav = true;
      const eng = cyl(.26, .3, .9, M.metal, -1.9, -.1, s * .5, ship, 18); eng.rotation.z = PI / 2;
    }
    box(1.1, 1, .08, M.frame, -1.5, .8, 0, ship).rotation.z = -.35;
    const flames = [-1, 1].map(s => { const f = cyl(.2, .2, .04, glow(0x9fdcff), -2.37, -.1, s * .5, ship, 18); f.rotation.z = PI / 2; halo(0x9fdcff, 1.1, -2.5, -.1, s * .5, .6, ship); return f; });
    for (const [lx, lz] of [[1.4, 0], [-1.2, .7], [-1.2, -.7]]) cyl(.05, .07, 1, M.frame, lx, -.75, lz, ship, 8);
    for (const s of [-1, 1]) { const lab = plane(1.6, .32, new THREE.MeshBasicMaterial({ map: textTex('RODRIGO STATION', '#1a2130', { w: 640, h: 128, size: 80 }), transparent: true }), -.2, .2, s * .79, ship); if (s < 0) lab.rotation.y = PI; }
    blocks.push([-2.8, 13, 3.4, 17.8]);
    updaters.push(t => { ship.position.y = 1.25 + Math.sin(t * .9) * .06; ship.rotation.z = Math.sin(t * .7) * .015; flames.forEach((f, i) => f.scale.set(1, 1, 1 + Math.sin(t * 20 + i) * .2)); });

    /* Contenedores de carga */
    const crate = (x, z, r) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g);
      box(1, .9, 1, std({ color: 0x6b5a2a, metalness: .5, roughness: .55 }), 0, .45, 0, g); box(1.02, .08, 1.02, glow(c, .8), 0, .7, 0, g);
      box(.8, .7, .8, M.frame, .1, 1.25, 0, g); blocks.push([x - .65, z - .65, x + .65, z + .65]); };
    crate(5.8, 11.1, .2); crate(5.8, 18.1, -.15); crate(-5.6, 11 + 4.1, .5);

    /* Pantallas de pared: registro de misiones y competencias */
    wallScreen(infoTex('REGISTRO DE MISIONES', CV.experiencia.map(e => [e.puesto.replace(' de desarrollo de software', ''), e.periodo]), hex(c), 1024, 560), 2.8, 1.55, -4.15, 2.35, 10.22, 0, c);
    wallScreen(infoTex('COMPETENCIAS', CV.sobre.blandas.slice(0, 5), hex(c), 1024, 560), 2.8, 1.55, 4.15, 2.35, 10.22, 0, c);
    /* Balizas que giran en la compuerta */
    const beacons = [-6.5, 6.5].map(x => { const b = new THREE.Group(); b.position.set(x, 3.6, 18.6); scene.add(b); ball(.12, glow(0xff9f1c), 0, 0, 0, b); const h = halo(0xff9f1c, 1.4, .3, 0, 0, .7, b); return b; });
    updaters.push(t => beacons.forEach(b => { b.rotation.y = t * 4; }));
  }

  /* ---------- 7. Astronauta ---------- */
  const player = { x: SPAWN.x, z: SPAWN.z, h: SPAWN.h, phase: 0, move: 0, run: 0, turn: 0 };
  const astro = new THREE.Group(), A = {};
  function buildAstronaut() {
    const suit = M.white, joint = std({ color: 0x3b455b, roughness: .65, metalness: .2 });
    const visorM = std({ color: 0x0b1a36, metalness: 1, roughness: .05, envMapIntensity: 2.6, emissive: 0x0a2a55, emissiveIntensity: .45 });
    astro.scale.setScalar(.8); scene.add(astro);
    /* Tronco superior: gira sobre la cadera para inclinarse al andar y al girar */
    const up = A.up = new THREE.Group(); up.position.y = .92; astro.add(up);
    cyl(.25, .22, .16, joint, 0, .02, 0, up); cyl(.275, .24, .52, suit, 0, .36, 0, up, 24);
    box(.3, .2, .09, joint, 0, .42, .24, up); box(.2, .07, .02, M.accent, 0, .45, .29, up); box(.05, .05, .02, glow(OK_COLOR), -.08, .36, .29, up); box(.05, .05, .02, glow(0xff6b9d), 0, .36, .29, up);
    ball(.125, suit, -.36, .56, 0, up); ball(.125, suit, .36, .56, 0, up);
    cyl(.2, .235, .08, joint, 0, .66, 0, up, 24);
    box(.46, .56, .2, suit, 0, .38, -.31, up); cyl(.075, .075, .46, joint, -.13, .38, -.44, up); cyl(.075, .075, .46, joint, .13, .38, -.44, up); box(.26, .05, .21, M.accent, 0, .67, -.31, up);
    /* Cabeza */
    const head = A.head = new THREE.Group(); head.position.y = .9; up.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.27, 28, 20), suit));
    const visor = new THREE.Mesh(new THREE.SphereGeometry(.215, 28, 20), visorM); visor.position.set(0, 0, .1); visor.scale.set(1, .8, .86); head.add(visor);
    for (const s of [-1, 1]) cyl(.07, .07, .05, joint, s * .265, 0, 0, head).rotation.z = PI / 2;
    cyl(.01, .01, .26, joint, .17, .32, -.08, head, 6); ball(.03, M.accent, .17, .46, -.08, head);
    /* Brazos y piernas articulados (hombro-codo, cadera-rodilla) */
    const arm = s => {
      const sh = new THREE.Group(); sh.position.set(s * .385, .55, 0); up.add(sh);
      cyl(.085, .08, .3, suit, 0, -.15, 0, sh); cyl(.09, .09, .04, M.accent, 0, -.09, 0, sh);
      const el = new THREE.Group(); el.position.y = -.3; sh.add(el);
      ball(.085, joint, 0, 0, 0, el); cyl(.08, .075, .26, suit, 0, -.14, 0, el); ball(.09, joint, 0, -.3, 0, el);
      return [sh, el];
    };
    const leg = s => {
      const hip = new THREE.Group(); hip.position.set(s * .13, .92, 0); astro.add(hip);
      cyl(.11, .1, .4, suit, 0, -.2, 0, hip);
      const kn = new THREE.Group(); kn.position.y = -.4; hip.add(kn);
      ball(.1, joint, 0, 0, 0, kn); cyl(.1, .09, .36, suit, 0, -.19, 0, kn); box(.2, .13, .32, joint, 0, -.43, .05, kn);
      return [hip, kn];
    };
    [A.aL, A.eL] = arm(-1); [A.aR, A.eR] = arm(1); [A.lL, A.kL] = leg(-1); [A.lR, A.kR] = leg(1);
    astro.traverse(o => { if (o.isMesh) o.castShadow = true; });
  }
  /* Animación por código: caminar, correr, girar y reposo */
  function animateAstronaut(t, dt) {
    const m = player.move, r = player.run, idle = 1 - m, s = Math.sin(player.phase), c = Math.cos(player.phase), amp = m * (.55 + .28 * r);
    A.lL.rotation.x = -s * amp; A.lR.rotation.x = s * amp;
    A.kL.rotation.x = .04 + Math.max(0, c) * amp * 1.35; A.kR.rotation.x = .04 + Math.max(0, -c) * amp * 1.35;
    A.aL.rotation.x = s * amp * .85; A.aR.rotation.x = -s * amp * .85;
    A.eL.rotation.x = -(.14 + .5 * m + Math.max(0, -s) * amp * .5 + Math.sin(t * 1.7) * .03 * idle);
    A.eR.rotation.x = -(.14 + .5 * m + Math.max(0, s) * amp * .5 + Math.sin(t * 1.7 + 1) * .03 * idle);
    A.aL.rotation.z = -.1 - Math.sin(t * 1.7) * .02 * idle; A.aR.rotation.z = .1 + Math.sin(t * 1.7) * .02 * idle;
    A.up.rotation.x = m * (.08 + .1 * r);                                         // se inclina hacia delante al avanzar
    A.up.rotation.z = -player.turn * .16 + Math.sin(t * .9) * .012 * idle;        // se ladea al girar; balanceo en reposo
    A.up.rotation.y = s * .09 * m;                                                // contragiro de hombros
    A.up.scale.y = 1 + Math.sin(t * 1.7) * .012 * idle;                           // respiración
    const lookIdle = Math.sin(t * .45) * .38 * Math.max(0, Math.sin(t * .13)) * idle;   // de vez en cuando mira a los lados
    A.head.rotation.y += ((lookIdle + player.turn * .35 * m) - A.head.rotation.y) * (1 - Math.exp(-6 * dt));
    A.head.rotation.x = Math.sin(t * .7) * .03 * idle;
    astro.position.set(player.x, Math.abs(s) * .05 * m, player.z);
    astro.rotation.y = player.h;
  }

  /* ---------- 8. Colisiones ---------- */
  /* ¿Está el punto dentro de la estación, a una distancia m de las paredes? (2 = bajo una puerta) */
  function inside(x, z, m) {
    for (const zn of ZONES) { const r = zn.rect; if (x >= r[0] + m && x <= r[2] - m && z >= r[1] + m && z <= r[3] - m) return 1; }
    for (const zn of ROOMS) {
      if (!zn.open) continue;
      const d = zn.door, along = DOOR_W / 2 - m, across = m + .2;
      if (d.axis === 'x' ? (Math.abs(x - d.x) <= along && Math.abs(z - d.z) <= across) : (Math.abs(z - d.z) <= along && Math.abs(x - d.x) <= across)) return 2;
    }
    return 0;
  }
  function canStand(x, z) {
    if (!inside(x, z, RADIUS)) return false;
    for (const b of blocks) if (x > b[0] - RADIUS && x < b[2] + RADIUS && z > b[1] - RADIUS && z < b[3] + RADIUS) return false;
    return true;
  }
  function zoneAt(x, z) { for (const zn of ZONES) { const r = zn.rect; if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) return zn; } return null; }

  /* ---------- 9. Controles ---------- */
  const keys = new Set(), joy = { x: 0, y: 0 };
  const cam = { yaw: 0, pitch: .4, dist: 6.4 };
  const canvas = renderer.domElement;
  const locked = () => document.pointerLockElement === canvas;
  const playing = () => state.started && !state.win;

  addEventListener('keydown', e => {
    if (e.code === 'Escape') { if (state.win) closeWin(); return; }
    if (!state.started) { if (e.code === 'Enter') start(); return; }
    if (e.target.tagName === 'INPUT') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (!playing()) return;
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyR') goHome();
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  /* Ratón: con el puntero capturado gira al moverlo; si no, gira al arrastrar. La rueda acerca o aleja */
  let drag = null;
  const rotate = (dx, dy, k) => { cam.yaw -= dx * k; cam.pitch = clamp(cam.pitch + dy * k * .8, .08, 1); };
  canvas.addEventListener('pointerdown', e => { if (!playing()) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 }; });
  addEventListener('pointermove', e => {
    if (!playing()) return;
    if (locked()) rotate(e.movementX, e.movementY, .0026);
    else if (drag && e.pointerId === drag.id) { rotate(e.clientX - drag.x, e.clientY - drag.y, .006); drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; }
  });
  addEventListener('pointerup', e => {
    if (drag && e.pointerId === drag.id) {
      if (drag.moved < 4 && e.pointerType === 'mouse' && playing()) lockPointer();   // un clic sin arrastre captura el ratón
      drag = null;
    }
  });
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (playing()) cam.dist = clamp(cam.dist + Math.sign(e.deltaY) * .6, 3.6, 9); }, { passive: false });
  function lockPointer() { try { const p = canvas.requestPointerLock && canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* se queda el modo arrastrar */ } }
  document.addEventListener('pointerlockchange', () => { $('#lock-hint').textContent = locked() ? '· Esc libera el ratón' : '· clic en la escena para capturar el ratón'; });

  /* Joystick táctil */
  (() => {
    const el = $('#stick'), knob = $('i', el); let id = null;
    const set = e => {
      const r = el.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / 40, dy = (e.clientY - r.top - r.height / 2) / 40;
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      joy.x = dx; joy.y = -dy; knob.style.transform = `translate(${dx * 32}px, ${dy * 32}px)`;
    };
    el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); set(e); });
    el.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
    const end = e => { if (e.pointerId === id) { id = null; joy.x = joy.y = 0; knob.style.transform = ''; } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  })();

  let nearest = null;
  function interact() { if (nearest && playing()) nearest.action(); }

  /* Teletransporte con fundido: es la base de la navegación por clics */
  function teleport(x, z, h) {
    const fade = $('#fade'); fade.classList.add('on');
    setTimeout(() => {
      player.x = x; player.z = z; player.h = h; cam.yaw = h + PI; cam.pitch = .4; camSnap = true;
      fade.classList.remove('on');
    }, 220);
  }
  function goHome() { if (state.win) closeWin(true); teleport(SPAWN.x, SPAWN.z, SPAWN.h); toast('De vuelta en el punto de inicio'); }
  function goToZone(id) {
    const zn = zoneById(id); if (state.win) closeWin(true);
    if (!zn.door) { teleport(SPAWN.x, SPAWN.z, SPAWN.h); return; }
    openDoor(zn, true); teleport(zn.entry[0], zn.entry[1], zn.entry[2]);
  }
  function goToTerminal(id) {
    const t = TERMS.find(x => x.id === id); if (state.win) closeWin(true);
    openDoor(zoneById(t.zone), true);
    teleport(t.x + t.fx * t.reach, t.z + t.fz * t.reach, t.rot + PI);
    setTimeout(() => openWin(t), 480);
  }

  /* ---------- 10. Interfaz (HUD) ---------- */
  let toastTimer, bannerTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
  /* Rótulo grande al entrar en una sala */
  function banner(kicker, title, sub, color) {
    const b = $('#banner'); b.style.setProperty('--zc', color);
    $('#banner-kicker').textContent = kicker; $('#banner-title').textContent = title; $('#banner-sub').textContent = sub;
    b.classList.add('show'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 2800);
  }

  /* Minimapa: medidas en píxeles CSS (s = píxeles por metro) */
  const MM = { s: 5, pad: 4, w: 148, h: 203 };
  function buildNav() {
    $('#zone-list').innerHTML = ROOMS.map(z => {
      const ts = TERMS.filter(t => t.zone === z.id);
      return `<li data-zone="${z.id}" style="--c:${hex(z.color)}">
        <button class="zone-btn" type="button" data-go-zone="${z.id}" title="Ir a ${esc(z.name)}"><i></i><span>${esc(z.name)}</span><em class="pips">${ts.map(t => `<b data-pip="${t.id}"></b>`).join('')}</em></button>
        <div class="terms"><div>${ts.map(t => `<button class="term-btn" type="button" data-go-term="${t.id}" title="Ir y consultar">${esc(t.title)}</button>`).join('')}</div></div>
      </li>`;
    }).join('');
    $('#nav-panel').addEventListener('click', e => {
      const z = e.target.closest('[data-go-zone]'), t = e.target.closest('[data-go-term]');
      if (z) goToZone(z.dataset.goZone); if (t) goToTerminal(t.dataset.goTerm);
      if (e.target.closest('button')) e.target.closest('button').blur();
    });
    $('#nav-toggle').addEventListener('click', () => { const c = $('#nav-panel').classList.toggle('closed'); $('#nav-toggle').setAttribute('aria-expanded', String(!c)); });
    if (innerWidth < 760) $('#nav-panel').classList.add('closed');
    $('#btn-home').addEventListener('click', e => { goHome(); e.currentTarget.blur(); });
    $('#prompt').addEventListener('click', interact);
    $('#minimap').addEventListener('click', e => {
      const r = e.currentTarget.getBoundingClientRect();
      const zn = zoneAt(((e.clientX - r.left) / r.width * MM.w - MM.pad) / MM.s - 14, ((e.clientY - r.top) / r.height * MM.h - MM.pad) / MM.s - 20);
      if (zn) goToZone(zn.id);
    });
  }
  function refreshHud() {
    const total = ROOMS.length + TERMS.length, got = state.visited.size + state.done.size;
    $('#hud-progress').textContent = Math.round(got / total * 100) + '%';
    $('#ring').style.strokeDashoffset = 94.25 * (1 - got / total);
    $('#meter-text').textContent = `${state.visited.size}/${ROOMS.length} salas · ${state.done.size}/${TERMS.length} terminales`;
    $$('#zone-list > li').forEach(li => { li.classList.toggle('visited', state.visited.has(li.dataset.zone)); li.classList.toggle('here', li.dataset.zone === state.zone); });
    $$('.term-btn').forEach(b => b.classList.toggle('done', state.done.has(b.dataset.goTerm)));
    $$('[data-pip]').forEach(b => b.classList.toggle('done', state.done.has(b.dataset.pip)));
    if (got === total && !state.complete) { state.complete = true; setTimeout(() => banner('100 % explorado', 'Misión completada', 'Gracias por recorrer la estación entera', hex(OK_COLOR)), 900); }
  }

  /* Minimapa: salas con su nombre, puertas, terminales y posición con cono de visión */
  const mm = (() => { const c = $('#minimap'), k = Math.min(devicePixelRatio || 1, 2); c.width = MM.w * k; c.height = MM.h * k; const g = c.getContext('2d'); g.scale(k, k); return g; })();
  const mx = x => (x + 14) * MM.s + MM.pad, mz = z => (z + 20) * MM.s + MM.pad;
  function drawMinimap(t) {
    mm.clearRect(0, 0, MM.w, MM.h);
    for (const z of ZONES) {
      const [x1, z1, x2, z2] = z.rect, seen = z.id === 'hall' || state.visited.has(z.id), here = z.id === state.zone;
      mm.fillStyle = hex(z.color); mm.globalAlpha = here ? .42 : seen ? .24 : .07; mm.fillRect(mx(x1) + 1, mz(z1) + 1, (x2 - x1) * MM.s - 2, (z2 - z1) * MM.s - 2);
      mm.globalAlpha = here ? 1 : seen ? .75 : .35; mm.strokeStyle = hex(z.color); mm.lineWidth = here ? 1.6 : 1; mm.strokeRect(mx(x1) + 1.5, mz(z1) + 1.5, (x2 - x1) * MM.s - 3, (z2 - z1) * MM.s - 3);
      if (z.short) { mm.globalAlpha = seen ? .95 : .5; mm.fillStyle = '#fff'; mm.font = '600 8px "JetBrains Mono", monospace'; mm.textAlign = 'center'; mm.fillText(z.short, mx((x1 + x2) / 2), mz(z1) + 13); }
    }
    mm.globalAlpha = 1;
    for (const z of ROOMS) {                                   // puertas: hueco en la pared, verde si está abierta
      const d = z.door, hw = DOOR_W / 2 * MM.s; mm.fillStyle = z.open ? '#5ef0a8' : '#0a0f1a';
      if (d.axis === 'x') mm.fillRect(mx(d.x) - hw, mz(d.z) - 2, hw * 2, 4); else mm.fillRect(mx(d.x) - 2, mz(d.z) - hw, 4, hw * 2);
    }
    for (const tm of TERMS) {
      const done = state.done.has(tm.id); mm.fillStyle = done ? '#5ef0a8' : '#ffffff'; mm.globalAlpha = done ? 1 : .6 + Math.sin(t * 3 + tm.x) * .3;
      mm.beginPath(); mm.arc(mx(tm.x), mz(tm.z), 2.2, 0, 7); mm.fill();
    }
    mm.globalAlpha = 1; mm.save(); mm.translate(mx(player.x), mz(player.z));
    mm.save(); mm.rotate(-cam.yaw); mm.fillStyle = 'rgba(255,255,255,.16)'; mm.beginPath(); mm.moveTo(0, 0); mm.arc(0, 0, 22, -PI / 2 - .55, -PI / 2 + .55); mm.closePath(); mm.fill(); mm.restore();
    mm.rotate(-player.h + PI); mm.fillStyle = '#fff'; mm.shadowColor = '#4de3ff'; mm.shadowBlur = 6;
    mm.beginPath(); mm.moveTo(0, -5.5); mm.lineTo(4, 4.5); mm.lineTo(0, 2.4); mm.lineTo(-4, 4.5); mm.closePath(); mm.fill(); mm.restore();
  }

  /* ---------- 11. Ventanas con el CV ----------
     Cada terminal tiene su propio formato de ventana (data-kind): no hay dos salas que se lean igual. */
  const KIND = { ident: 'perfil', objetivos: 'objetivos', stack: 'stack', dam: 'dam', ia: 'ia', rai: 'chat', contacto: 'contacto', idiomas: 'idiomas', academico: 'timeline', cursos: 'certs', socorrista: 'mision', monitor: 'mision', indra: 'mision' };
  const ESTADO = { done: 'Completado', goal: 'Siguiente meta' };
  const st = (s, txt) => `<span class="st ${s}">${esc(txt || ESTADO[s])}</span>`;
  const photo = () => `<img class="avatar" src="${esc(CV.foto)}" alt="Foto de ${esc(CV.nombre)}">`;
  const chips = (arr, cls = 'chips') => `<ul class="${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const two = n => String(n).padStart(2, '0');
  const fIA = CV.formacion[CV.formacion.length - 1], fDAM = CV.formacion[CV.formacion.length - 2];

  function mision(id) {
    const e = CV.experiencia.find(x => x.id === id), n = CV.experiencia.length - CV.experiencia.indexOf(e);
    return `<div class="report-head"><div><small>Informe de misión ${two(n)}</small><b>${esc(e.puesto)}</b></div><span class="stamp">Misión cumplida</span></div>
      <dl class="meta"><div><dt>Empresa</dt><dd>${esc(e.empresa)}</dd></div>${e.lugar ? `<div><dt>Lugar</dt><dd>${esc(e.lugar)}</dd></div>` : ''}
        <div><dt>Periodo</dt><dd>${esc(e.periodo)}</dd></div><div><dt>Tipo</dt><dd>${esc(e.tipo)}</dd></div></dl>
      <p>${esc(e.detalle)}</p>
      <h3>Tareas</h3><ul class="points">${e.tareas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <h3>Competencias adquiridas</h3>${chips(e.competencias)}`;
  }

  const RENDER = {
    ident: () => `<div class="w-hero">${photo()}<div><small class="kicker">Comandante de la misión</small><b class="w-name">${esc(CV.nombreCompleto)}</b>${chips(CV.hero.roles.slice(0, 2))}</div></div>
      <p class="big">${esc(CV.hero.lema)}</p><p>${esc(CV.hero.intro)}</p>
      <div class="stats">${CV.ficha.map(f => `<div><small>${esc(f.clave)}</small><b>${esc(f.valor)}</b></div>`).join('')}</div>`,
    objetivos: () => `<p>${esc(CV.sobre.perfil)}</p>
      <h3>Objetivos profesionales</h3><ul class="checks">${CV.sobre.objetivos.map(o => `<li class="${o.estado}"><i></i><span>${esc(o.texto)}</span>${o.estado === 'goal' ? st('goal') : ''}</li>`).join('')}</ul>
      <h3>Cómo trabajo</h3>${chips(CV.sobre.blandas)}
      <h3>Intereses</h3><div class="tiles">${CV.sobre.intereses.map(i => `<div><b>${esc(i.nombre)}</b><small>${esc(i.texto)}</small></div>`).join('')}</div>`,
    stack: () => `<p class="note">Tecnologías que he usado en el ciclo de DAM y en la especialización.</p>
      <div class="groups">${CV.stack.map((g, i) => `<section><h3><span>${two(i + 1)}</span>${esc(g.grupo)}</h3>${chips(g.items, 'tech')}</section>`).join('')}</div>`,
    dam: () => `<div class="banner-row"><div><b>${esc(fDAM.titulo)}</b><small>${esc(fDAM.centro)} · ${esc(fDAM.periodo)}</small></div>${st('done', 'Titulado')}</div>
      <p>${esc(fDAM.detalle)}</p>
      <h3>Módulos del ciclo</h3>${chips(fDAM.etiquetas, 'tags')}
      <div class="callout"><small>Prácticas (FCT)</small><b>Indra · 2027</b><span>Encontrarás el informe completo en el Hangar de operaciones.</span></div>`,
    ia: () => `<div class="banner-row"><div><b>${esc(fIA.titulo)}</b><small>${esc(fIA.centro)} · ${esc(fIA.periodo)}</small></div>${st('done', 'Completada')}</div>
      <p>${esc(fIA.detalle)} Es el paso que conecta el desarrollo de aplicaciones con la inteligencia artificial.</p>
      <h3>Módulos de la especialización</h3><ol class="nodes">${fIA.etiquetas.map((m, i) => `<li><span>${two(i + 1)}</span>${esc(m)}</li>`).join('')}</ol>
      <h3>Tecnologías</h3>${chips((CV.stack.find(g => /IA/.test(g.grupo)) || { items: [] }).items, 'tech')}`,
    rai: () => `<div class="chat-log" id="rai-log"><p class="ai">Hola, soy R-AI, el asistente de esta estación. Pregúntame lo que quieras sobre Rodrigo: respondo solo con datos de su currículum.</p></div>
      <div class="qa">${['¿Quién es Rodrigo?', '¿Tiene experiencia?', '¿Qué tecnologías usa?', '¿Sabe de IA?', '¿Qué nivel de inglés tiene?', '¿Eres una IA real?'].map(q => `<button type="button" data-q>${esc(q)}</button>`).join('')}</div>
      <form class="chat-in" id="rai-form" autocomplete="off"><input id="rai-input" type="text" maxlength="120" placeholder="Escribe tu pregunta…" spellcheck="false"><button type="submit" aria-label="Enviar">↵</button></form>`,
    contacto: () => { const c = CV.contacto; return `<div class="w-hero">${photo()}<div><small class="kicker">Canal abierto</small><b class="w-name">${esc(CV.nombre)}</b><span class="w-role">${esc(CV.hero.roles[0])}</span></div></div>
      <div class="links">
        <button type="button" data-copy="${esc(c.email)}"><small>Correo</small><b>${esc(c.email)}</b><em>Copiar</em></button>
        <button type="button" data-copy="${esc(c.telefono)}"><small>Teléfono</small><b>${esc(c.telefono)}</b><em>Copiar</em></button>
        <a href="${esc(c.github.url)}" target="_blank" rel="noopener"><small>GitHub</small><b>${esc(c.github.texto)}</b><em>Abrir ↗</em></a>
        <a href="${esc(c.instagram.url)}" target="_blank" rel="noopener"><small>Instagram</small><b>${esc(c.instagram.texto)}</b><em>Abrir ↗</em></a>
        <div><small>Ubicación</small><b>${esc(c.ubicacion)}</b></div>
        <div><small>Movilidad</small><b>${esc(c.extra)}</b></div>
      </div>
      <p class="cta"><a class="btn primary" href="mailto:${esc(c.email)}">Escribirme un correo</a></p>`; },
    idiomas: () => `<div class="langs">${CV.idiomas.map(l => `<div><span class="code">${esc(l.codigo)}</span><b>${esc(l.nombre)}</b><small>${esc(l.titulo || 'Lengua materna')}</small>
        <span class="lvl">${esc(l.nivel)}</span><div class="meter"><i data-w="${l.nivelNum}"></i></div></div>`).join('')}</div>
      <p>El inglés es el idioma de la documentación técnica y de muchos equipos de desarrollo: por eso lo acredité con un título oficial de Cambridge.</p>`,
    academico: () => `<ol class="tl">${[...CV.formacion].reverse().map(f => `<li><small>${esc(f.periodo)}</small><b>${esc(f.titulo)}</b><span>${esc(f.centro)}</span></li>`).join('')}</ol>`,
    cursos: () => `<p class="note">Formación complementaria que conservo porque dice mucho de cómo trabajo.</p>
      <div class="certs">${CV.certificados.map(c => `<div><small>${esc(c.tipo)} · ${esc(c.fecha)}</small><b>${esc(c.titulo)}</b></div>`).join('')}</div>`,
    socorrista: () => mision('socorrista'),
    monitor: () => mision('monitor'),
    indra: () => mision('indra')
  };

  /* R-AI: la lógica de respuestas está en js/rai.js (compartida con la versión clásica) */
  const raiAnswer = window.raiAnswer;
  function raiAsk(text) {
    text = text.trim(); if (!text) return;
    const log = $('#rai-log'); if (!log) return;
    const add = (cls, txt) => { const p = document.createElement('p'); p.className = cls; p.textContent = txt; log.appendChild(p); log.scrollTop = log.scrollHeight; return p; };
    add('me', text);
    const think = add('ai think', '…');
    setTimeout(() => { think.remove(); add('ai', raiAnswer(text)); }, 380);
  }

  let closeTimer;
  function openWin(t) {
    if (state.win) return;
    clearTimeout(closeTimer);
    const zone = zoneById(t.zone), w = $('#win'), win = $('.win', w);
    state.win = t; keys.clear(); joy.x = joy.y = 0;
    if (locked()) document.exitPointerLock();
    $('#prompt').hidden = true;
    win.style.setProperty('--zc', hex(zone.color)); win.dataset.kind = KIND[t.id] || '';
    $('#win-zone').textContent = zone.name; $('#win-title').textContent = t.title;
    $('#win-body').innerHTML = RENDER[t.id](); $('#win-body').scrollTop = 0;
    w.classList.remove('closing'); w.hidden = false;
    (t.id === 'rai' ? $('#rai-input') : $('#win-close')).focus();
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#win-body [data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; })));
    markDone(t); refreshHud();
  }
  function closeWin(instant) {
    if (!state.win) return;
    state.win = null; const w = $('#win');
    if (document.activeElement) document.activeElement.blur();
    if (instant === true) { w.hidden = true; return; }
    w.classList.add('closing'); closeTimer = setTimeout(() => { w.hidden = true; w.classList.remove('closing'); }, 200);
  }
  $('#win-close').addEventListener('click', () => closeWin());
  $('#win').addEventListener('click', e => {
    if (e.target.id === 'win') return closeWin();
    const q = e.target.closest('[data-q]');
    if (q) raiAsk(q.textContent);
    const c = e.target.closest('[data-copy]');
    if (c) { const em = $('em', c), done = () => { if (em) em.textContent = 'Copiado ✓'; }; navigator.clipboard ? navigator.clipboard.writeText(c.dataset.copy).then(done, done) : done(); }
  });
  $('#win').addEventListener('submit', e => { e.preventDefault(); const i = $('#rai-input'); if (i) { raiAsk(i.value); i.value = ''; } });

  /* ---------- 12. Bucle principal ---------- */
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  let camSnap = true, last = performance.now(), time = 0, frame = 0;

  function update(dt) {
    /* Movimiento relativo a la cámara */
    let mvx = 0, mvz = 0, running = false;
    if (playing()) {
      mvx = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + joy.x;
      mvz = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + joy.y;
      cam.yaw += ((keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)) * 2.2 * dt;
      running = keys.has('ShiftLeft') || keys.has('ShiftRight');
    }
    const len = Math.hypot(mvx, mvz); if (len > 1) { mvx /= len; mvz /= len; }
    const amt = Math.min(1, len), prevH = player.h;
    if (amt > .05) {
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
      const vx = fx * mvz - fz * mvx, vz = fz * mvz + fx * mvx;
      const speed = (running ? 6.8 : 4.2) * dt;
      const nx = player.x + vx * speed, nz = player.z + vz * speed;
      if (canStand(nx, player.z)) player.x = nx;
      if (canStand(player.x, nz)) player.z = nz;
      player.h += angDiff(player.h, Math.atan2(vx, vz)) * (1 - Math.exp(-11 * dt));
      player.phase += dt * (running ? 11.5 : 8.2) * amt;
    }
    const k = 1 - Math.exp(-9 * dt);
    player.move += (amt - player.move) * k;
    player.run += ((running && amt > .05 ? 1 : 0) - player.run) * k;
    player.turn += (clamp(angDiff(prevH, player.h) / Math.max(dt, .001) / 5, -1, 1) - player.turn) * k;
    animateAstronaut(time, dt);
    keyLight.position.set(player.x + .5, 4.05, player.z + .7); keyLight.target.position.set(player.x, 0, player.z);

    /* Cámara: detrás y por encima del astronauta, sin atravesar paredes */
    const hd = Math.cos(cam.pitch) * cam.dist, dx = Math.sin(cam.yaw) * hd, dz = Math.cos(cam.yaw) * hd;
    let f = 1, underDoor = false;
    for (let i = 1; i <= 20; i++) {
      const q = i / 20, w = inside(player.x + dx * q, player.z + dz * q, .34);
      if (!w) { f = (i - 1) / 20; break; }
      if (w === 2) underDoor = true;
    }
    f = Math.max(.14, f);
    /* Si la línea de visión cruza una puerta, la cámara baja para pasar bajo el dintel */
    const cy = Math.min(underDoor ? DOOR_H - .8 : WALL_H - .5, 1.5 + Math.sin(cam.pitch) * cam.dist * (0.4 + 0.6 * f));
    camPos.set(player.x + dx * f, cy, player.z + dz * f);
    if (camSnap) { camera.position.copy(camPos); camSnap = false; } else camera.position.lerp(camPos, 1 - Math.exp(-10 * dt));
    /* Mira un poco por delante del astronauta: así queda en el tercio inferior y deja ver la sala */
    look.set(player.x - Math.sin(cam.yaw) * 1.1, 1.25, player.z - Math.cos(cam.yaw) * 1.1); camera.lookAt(look);

    /* Zona actual y zonas visitadas */
    const zn = zoneAt(player.x, player.z);
    if (zn && zn.id !== state.zone) {
      state.zone = zn.id; $('#hud-zone').textContent = zn.name;
      if (zn.door && state.started) {
        const first = !state.visited.has(zn.id); state.visited.add(zn.id);
        banner(first ? `Sala descubierta · ${state.visited.size}/${ROOMS.length}` : 'Sala', zn.name, zn.sub, hex(zn.color));
      }
      refreshHud();
    }

    /* Elemento interactivo más cercano */
    nearest = null; let best = 1e9;
    for (const it of interactables) {
      if (!it.active) continue;
      const d = Math.hypot(it.x - player.x, it.z - player.z);
      if (d < it.r && d < best) { best = d; nearest = it; }
    }
    const pr = $('#prompt');
    if (nearest && playing()) { if (pr.dataset.for !== nearest.label) { pr.dataset.for = nearest.label; pr.innerHTML = `<kbd>E</kbd> ${esc(nearest.label)}`; } pr.hidden = false; }
    else pr.hidden = true;
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
    for (const u of updaters) u(time, dt);
    update(dt);
    if (++frame % 3 === 0) drawMinimap(time);
    renderer.render(scene, camera);
  }

  function start() {
    if (state.started) return;
    state.started = true; $('#start').classList.add('out'); $('#hud').hidden = false;
    if (matchMedia('(pointer: fine)').matches) lockPointer();
    setTimeout(() => banner('Bienvenido a bordo', 'Pasillo central', 'Acércate a una puerta y pulsa E', hex(ACCENT)), 500);
  }
  $('#start-btn').addEventListener('click', start);

  function init() {
    buildArchitecture();
    ROOMS.forEach(buildDoor);
    TERMS.forEach(buildTerminal);
    decoratePuente(); decorateLab(); decorateIA(); decorateCom(); decorateArchivo(); decorateHangar();
    /* Todo el mobiliario opaco proyecta sombra; paredes, suelos, cristales y luces no */
    scene.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial && !o.userData.arch && !o.material.transparent) o.castShadow = true; });
    buildAstronaut();
    buildNav(); refreshHud();
    cam.yaw = player.h + PI;
    requestAnimationFrame(loop);
  }
  /* Espera (como mucho 1,2 s) a las fuentes para que los rótulos 3D salgan con la tipografía buena */
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1200))]).then(init, init);

  /* Acceso para depurar desde la consola */
  window.__station = { state, player, cam, goToZone, goToTerminal, goHome, canStand, keys, renderer };
})();
