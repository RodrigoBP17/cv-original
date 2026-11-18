/* ==========================================================================
   Currículum · lógica de la web
   Índice: 1. Utilidades   2. Pintado de secciones   3. Puesta en marcha
           4. Portada (texto y red neuronal)   5. Navegación y scroll
           6. Desplegables, pestañas y foco de luz   7. Registro de exploración
           8. Asistente R-AI   9. PDF y contacto   10. Arranque
   Los contenidos están en js/data.js: aquí no hay textos del currículum.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- 1. Utilidades ---------- */
  const CV = window.CV;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento: no pasa nada */ } }
  };
  const ESTADO = { done: 'Completado', progress: 'En curso', goal: 'Objetivo' };
  const nivel = v => v >= 95 ? 'Nativo' : v >= 80 ? 'Avanzado' : v >= 60 ? 'Sólido' : v >= 40 ? 'Intermedio' : v >= 20 ? 'Básico' : 'Por aprender';


  /* ---------- 2. Pintado de secciones ---------- */
  const ICONOS = {
    ia: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/><circle cx="12" cy="12" r="1.6"/></svg>',
    idioma: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
    curso: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.6 5 2.6-1.5-7.5"/></svg>'
  };

  function renderAll() {
    const fIA = CV.formacion[CV.formacion.length - 1];
    const chipList = (arr, cls = 'tech-grid') => `<ul class="${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;

    /* Portada */
    $('#hero-lema').textContent = CV.hero.lema;
    $('#hero-intro').textContent = CV.hero.intro;
    $('#ficha-code').innerHTML =
      `{\n` +
      CV.ficha.map(f => `  <span class="k">"${esc(f.clave)}"</span>: <span class="v">"${esc(f.valor)}"</span>`).join(',\n') + '\n}';

    /* Sobre mí */
    $('#about-perfil').textContent = CV.sobre.perfil;
    $('#intereses').innerHTML = CV.sobre.intereses.map((it, i) =>
      `<button class="chip" type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(it.nombre)}</button>`).join('');
    $('#interes-texto').textContent = CV.sobre.intereses[0].texto;
    $('#objetivos').innerHTML = CV.sobre.objetivos.map(o =>
      `<li data-state="${o.estado}"><span class="check">✓</span><span class="txt">${esc(o.texto)}</span><span class="badge">${o.estado === 'done' ? 'Conseguido' : 'Siguiente meta'}</span></li>`).join('');

    /* Experiencia: tarjetas tipo "informe de misión" */
    $('#exp').innerHTML = [...CV.experiencia].reverse().map((e, i) => `
      <article class="card exp-card reveal" data-id="${e.id}">
        <p class="exp-top"><span class="exp-num">Misión 0${i + 1}</span><span class="exp-when">${esc(e.periodo)}</span></p>
        <h3>${esc(e.puesto)}</h3>
        <p class="exp-where">${esc(e.empresa)}${e.lugar ? ' · ' + esc(e.lugar) : ''} <span>${esc(e.tipo)}</span></p>
        <ul class="points">${e.tareas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        ${chipList(e.competencias, 'exp-chips')}
      </article>`).join('');

    /* Línea temporal de formación */
    $('#timeline').innerHTML = '<div class="tl-line"><i id="tl-fill"></i></div>' + CV.formacion.map((f, i) => {
      const sub = [f.centro, f.periodo].filter(Boolean).join(' · ');
      return `<article class="tl-item reveal" data-state="${f.estado}">
        <span class="tl-dot"></span>
        <div class="card tl-card">
          <button class="tl-head" type="button" aria-expanded="false" aria-controls="tl-${i}" data-mission="timeline">
            <span class="tl-step">Etapa 0${i + 1}</span>
            <span class="tl-title">${esc(f.titulo)}</span>
            <span class="badge">${ESTADO[f.estado]}</span>
            <span class="chev"></span>
            ${sub ? `<span class="tl-sub">${esc(sub)}</span>` : ''}
          </button>
          <div class="collapse" id="tl-${i}" inert><div><div class="collapse-in">
            <p>${esc(f.detalle)}</p>
            ${f.etiquetas.length ? `<p class="tags-title">Módulos</p><ul class="tags">${f.etiquetas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          </div></div></div>
        </div>
      </article>`;
    }).join('');

    /* Especialización y certificaciones */
    const en = CV.idiomas.find(l => l.codigo === 'EN');
    const certs = [
      { icono: 'ia', titulo: fIA.titulo, entidad: `${fIA.centro} · ${fIA.periodo}`, etiqueta: 'Completada', detalle: fIA.detalle, puntos: fIA.etiquetas },
      { icono: 'idioma', titulo: `Inglés ${en.nivel} · ${en.titulo}`, entidad: 'Cambridge English', etiqueta: 'Acreditado', detalle: 'Titulación oficial de nivel B2: me permite trabajar con documentación técnica y comunicarme en entornos profesionales en inglés.', puntos: ['Lectura de documentación técnica', 'Comunicación oral y escrita en entornos profesionales'] },
      { icono: 'curso', titulo: 'Socorrismo y primeros auxilios', entidad: 'Diplomas y certificado · 2022', etiqueta: 'Obtenido', detalle: 'La base que me permitió trabajar como socorrista y monitor en Playa Park.', puntos: CV.certificados.slice(0, 3).map(c => `${c.tipo} · ${c.titulo}`) },
      { icono: 'curso', titulo: 'Otros certificados', entidad: 'Certificados · 2022', etiqueta: 'Obtenido', detalle: 'Formación complementaria previa al ciclo de DAM.', puntos: CV.certificados.slice(3).map(c => `${c.tipo} · ${c.titulo}`) }
    ];
    $('#cert-sub').textContent = 'Mi especialización, mi título de inglés y los certificados que conservo.';
    $('#certs').innerHTML = certs.map((c, i) =>
      `<article class="card cert reveal" data-state="done">
        <button class="cert-head" type="button" aria-expanded="false" aria-controls="cert-${i}" data-mission="cert">
          <span class="cert-icon">${ICONOS[c.icono] || ICONOS.curso}</span>
          <span><span class="cert-title">${esc(c.titulo)}</span><br><span class="cert-ent">${esc(c.entidad)}</span></span>
          <span class="chev"></span>
          <span class="cert-foot"><span class="badge">${esc(c.etiqueta)}</span></span>
        </button>
        <div class="collapse" id="cert-${i}" inert><div><div class="collapse-in">
          <p>${esc(c.detalle)}</p>
          <ul class="points">${c.puntos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        </div></div></div>
      </article>`).join('');

    /* Habilidades: pestañas con las tecnologías reales + idiomas y habilidades personales */
    $('#skill-tabs').innerHTML = CV.stack.map((h, i) =>
      `<button class="tab" type="button" role="tab" aria-selected="${i === 0}" aria-controls="sp-${i}" data-i="${i}">${esc(h.grupo)}</button>`).join('');
    $('#skill-panels').innerHTML = CV.stack.map((h, i) =>
      `<div class="skill-panel" id="sp-${i}" role="tabpanel" ${i ? 'hidden' : ''}>${chipList(h.items)}</div>`).join('');
    $('#skills-extra').innerHTML = `
      <div class="card reveal"><h3>Idiomas</h3><div class="langs">${CV.idiomas.map(l => `
        <div class="lang"><span class="lang-code">${esc(l.codigo)}</span><div><b>${esc(l.nombre)} · ${esc(l.nivel)}</b><small>${esc(l.titulo || 'Lengua materna')}</small>
        <div class="bar"><div class="bar-fill" data-v="${l.nivelNum}"></div></div></div></div>`).join('')}</div></div>
      <div class="card reveal"><h3>Cómo trabajo</h3>${chipList(CV.sobre.blandas, 'soft')}</div>`;

    /* Contacto */
    const c = CV.contacto;
    const item = (tag, attrs, label, value, action) =>
      `<${tag} class="contact-item" ${attrs}><div><small>${label}</small><span>${esc(value)}</span></div>${action ? `<em>${action}</em>` : ''}</${tag}>`;
    $('#contact').innerHTML = `
      <img class="avatar" src="${esc(CV.foto)}" alt="Foto de ${esc(CV.nombre)}" width="132" height="132">
      <div>
        <h3>${esc(CV.nombreCompleto)}</h3>
        <p class="role">${esc(CV.hero.roles.slice(0, 2).join(' · '))}</p>
        <div class="contact-list">
          ${item('button', `type="button" data-copy="${esc(c.email)}"`, 'Correo', c.email, 'Copiar')}
          ${item('button', `type="button" data-copy="${esc(c.telefono)}"`, 'Teléfono', c.telefono, 'Copiar')}
          ${item('a', `href="${esc(c.github.url)}" target="_blank" rel="noopener"`, 'GitHub', c.github.texto, 'Abrir ↗')}
          ${item('a', `href="${esc(c.instagram.url)}" target="_blank" rel="noopener"`, 'Instagram', c.instagram.texto, 'Abrir ↗')}
          ${item('div', '', 'Ubicación', c.ubicacion)}
          ${item('div', '', 'Movilidad', c.extra)}
        </div>
        <div class="contact-cta">
          <a class="btn primary" href="mailto:${esc(c.email)}">Escribirme</a>
          <a class="btn" href="${encodeURI(CV.pdf)}" download data-pdf>Descargar CV en PDF</a>
        </div>
      </div>`;
  }

  /* ---------- 3. Puesta en marcha ---------- */
  function startUp() {
    $$('.bar-fill').forEach(el => { el.style.width = el.dataset.v + '%'; });
    startTyper();
    scramble($('#hero-name'), CV.nombre);
  }

/* ---------- 4. Portada ---------- */
  let typerTimer;
  function startTyper() {
    clearTimeout(typerTimer);
    const el = $('#typed'), list = CV.hero.roles;
    if (reduce) { el.textContent = list[0]; return; }
    let i = 0, j = 0, del = false;
    (function tick() {
      const w = list[i];
      el.textContent = w.slice(0, j);
      let t;
      if (!del) { if (j < w.length) { j++; t = 55; } else { del = true; t = 1700; } }
      else if (j > 0) { j--; t = 26; }
      else { del = false; i = (i + 1) % list.length; t = 320; }
      typerTimer = setTimeout(tick, t);
    })();
  }

  /* Efecto "descifrado" del nombre */
  function scramble(el, text) {
    if (reduce) { el.textContent = text; return; }
    const chars = '01<>/{}[]#$%&ABCDEFXYZ';
    const start = performance.now(), dur = 900;
    (function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const shown = Math.floor(p * text.length);
      el.textContent = text.split('').map((ch, i) =>
        i < shown || ch === ' ' ? ch : chars[Math.floor(Math.random() * chars.length)]).join('');
      if (p < 1) requestAnimationFrame(frame); else el.textContent = text;
    })(start);
  }

  /* Red neuronal del fondo: nodos conectados que reaccionan al ratón */
  const net = (() => {
    const cv = $('#net'), ctx = cv.getContext('2d');
    let w = 0, h = 0, nodes = [], rgb = '77,227,255', rgb2 = '155,123,255', running = false, visible = true, raf = 0;
    const mouse = { x: -999, y: -999 };
    const LINK = 135;

    function recolor() { // relee los colores de acento definidos en el CSS
      const cs = getComputedStyle(document.body);
      rgb = cs.getPropertyValue('--a-rgb').trim() || rgb;
      rgb2 = cs.getPropertyValue('--b-rgb').trim() || rgb2;
      if (!running) draw();
    }
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(90, Math.round(w * h / 15000)));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .8
      }));
      if (!running) draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / LINK) * .22})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 190) {
          ctx.strokeStyle = `rgba(${rgb2},${(1 - dm / 190) * .7})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${rgb},${dm < 190 ? 1 : .65})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, dm < 190 ? a.r + 1.2 : a.r, 0, 6.283); ctx.fill();
      }
    }
    function loop() {
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      const should = visible && !document.hidden && !reduce;
      if (should && !running) { running = true; loop(); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    }
    function init() {
      resize();
      addEventListener('resize', resize);
      const hero = $('#inicio');
      hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
      /* Solo se anima mientras la portada está en pantalla */
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(hero);
      document.addEventListener('visibilitychange', sync);
      sync();
    }
    return { init, recolor };
  })();

  /* ---------- 5. Navegación y scroll ---------- */
  function initNav() {
    const menu = $('#menu'), pill = $('.pill'), burger = $('#burger'), links = $$('#menu a');
    let active = null;
    const movePill = () => {
      if (!active) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      pill.style.width = active.offsetWidth + 'px';
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    const setActive = id => {
      active = links.find(a => a.getAttribute('href') === '#' + id) || null;
      links.forEach(a => a.classList.toggle('active', a === active));
      movePill();
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(s => io.observe(s));
    addEventListener('resize', movePill);
    if (document.fonts) document.fonts.ready.then(movePill);

    const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeHud(); $('#reward').hidden = true; } });

    /* Barra de progreso de lectura y relleno de la línea temporal */
    const bar = $('#scrollbar'), nav = $('#nav');
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      nav.classList.toggle('scrolled', scrollY > 30);
      const tl = $('#timeline'), fill = $('#tl-fill');
      const r = tl.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * .6 - r.top) / r.height));
      fill.style.transform = `scaleY(${p})`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  function initReveal() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  }

  /* ---------- 6. Desplegables, pestañas y foco de luz ---------- */
  function initInteractions() {
    /* Tarjetas que se expanden (línea temporal y certificaciones) */
    document.addEventListener('click', e => {
      const head = e.target.closest('button[aria-controls][aria-expanded]:not(.tab):not(.hud-btn)');
      if (head) {
        const open = head.getAttribute('aria-expanded') !== 'true';
        const panel = document.getElementById(head.getAttribute('aria-controls'));
        head.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('open', open);
        panel.toggleAttribute('inert', !open);
        if (open && head.dataset.mission) discover(head.dataset.mission);
      }
      if (e.target.closest('a[href="estacion.html"]')) discover('station');
      if (e.target.closest('[data-pdf]')) downloadPDF();
      const copy = e.target.closest('[data-copy]');
      if (copy) copyText(copy.dataset.copy);
    });

    /* Intereses */
    $('#intereses').addEventListener('click', e => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      $$('#intereses .chip').forEach(c => c.setAttribute('aria-selected', String(c === chip)));
      $('#interes-texto').textContent = CV.sobre.intereses[+chip.dataset.i].texto;
    });

    /* Pestañas de habilidades */
    $('#skill-tabs').addEventListener('click', e => {
      const tab = e.target.closest('.tab'); if (!tab) return;
      $$('#skill-tabs .tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      $$('.skill-panel').forEach((p, i) => { p.hidden = i !== +tab.dataset.i; });
      /* Reinicia las barras del panel para que se animen al entrar */
      const fills = $$(`#sp-${tab.dataset.i} .bar-fill`);
      fills.forEach(f => { f.style.transition = 'none'; f.style.width = '0'; });
      requestAnimationFrame(() => requestAnimationFrame(() => fills.forEach(f => { f.style.transition = ''; f.style.width = f.dataset.v + '%'; })));
      discover('skills');
    });

    /* Foco de luz que sigue al ratón dentro de cada tarjeta */
    document.addEventListener('pointermove', e => {
      const card = e.target.closest && e.target.closest('.card'); if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  }

  /* ---------- 7. Registro de exploración ---------- */
  const MISIONES = [
    ['station', 'Entrar en la estación 3D'],
    ['timeline', 'Desplegar una etapa de la formación'],
    ['cert', 'Abrir una certificación'],
    ['skills', 'Cambiar de categoría en habilidades'],
    ['ai', 'Hacer una pregunta al asistente R-AI'],
    ['copy', 'Copiar un dato de contacto'],
    ['pdf', 'Descargar el currículum en PDF'],
    ['secret', '??? · un comando oculto']
  ];
  let found = new Set(store.get('cv-found', []).filter(id => MISIONES.some(m => m[0] === id)));

  function renderHud() {
    $('#hud-list').innerHTML = MISIONES.map(([id, txt]) =>
      `<li class="${found.has(id) ? 'found' : ''}">${id === 'secret' && found.has(id) ? 'Encontrar el comando oculto' : txt}</li>`).join('');
    $('#hud-count').textContent = `${found.size}/${MISIONES.length}`;
    $('#hud-ring').style.strokeDashoffset = 97.4 * (1 - found.size / MISIONES.length);
  }
  function discover(id) {
    if (found.has(id)) return;
    found.add(id);
    store.set('cv-found', [...found]);
    renderHud();
    const btn = $('#hud-btn');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    if (found.size === MISIONES.length) setTimeout(() => { $('#reward').hidden = false; $('#reward-close').focus(); }, 900);
    else toast(`Descubierto ${found.size}/${MISIONES.length} · ${MISIONES.find(m => m[0] === id)[1].replace('??? · un', 'Un')}`);
  }
  function closeHud() { $('#hud-panel').hidden = true; $('#hud-btn').setAttribute('aria-expanded', 'false'); }
  function initHud() {
    renderHud();
    $('#hud-btn').addEventListener('click', () => {
      const p = $('#hud-panel'); p.hidden = !p.hidden;
      $('#hud-btn').setAttribute('aria-expanded', String(!p.hidden));
    });
    $('#hud-reset').addEventListener('click', () => { found = new Set(); store.set('cv-found', []); renderHud(); toast('Registro reiniciado'); });
    $('#reward-close').addEventListener('click', () => { $('#reward').hidden = true; });
    $('#reward').addEventListener('click', e => { if (e.target.id === 'reward') e.target.hidden = true; });
    document.addEventListener('click', e => { if (!e.target.closest('#hud')) closeHud(); });
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- 8. Asistente R-AI ----------
     Asistente simulado: busca palabras clave y responde SOLO con datos de data.js.
     No hay ningún modelo de IA detrás, y él mismo lo dice si se le pregunta. */
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const has = (q, ...words) => words.some(w => q.includes(w));

  /* Comandos propios de esta página; el resto de preguntas las responde js/rai.js */
  function answer(raw) {
    const q = norm(raw);
    if (q === 'futuro' || q === 'el futuro') discover('secret');
    if (has(q, 'ayuda', 'help', 'comando', 'que puedes', 'que sabes')) return [
      'Puedes preguntarme con tus palabras o usar estos comandos:',
      '  perfil · experiencia · formacion · ia · ingles · tecnologias',
      '  certificados · objetivos · contacto · profesor · estacion · pdf · limpiar',
      'Hay un comando más que no aparece aquí…'];
    if (has(q, 'limpiar', 'clear', 'cls')) return 'CLEAR';
    if (has(q, 'estacion', '3d', 'juego', 'astronauta')) return ['La versión 3D de este currículum es una estación espacial con seis salas.', 'Tienes el acceso en el botón «Explorar la estación 3D» de la portada.'];
    if (has(q, 'pdf', 'descarg', 'imprim')) { downloadPDF(true); return ['Descargando el currículum en PDF…']; }
    if (has(q, 'profesor', 'profesora', 'docente', 'evalu', 'nota', 'ipe')) return [
      'Para quien evalúa este proyecto de IPE:',
      '· Formación: Bachillerato Tecnológico, Grado Superior en DAM (2025–2027) y especialización en IA y Big Data (2027–2028).',
      '· Experiencia: socorrista (2025) y monitor (2026) en Playa Park, y prácticas en Indra (2027).',
      '· Idiomas: español nativo e inglés B2 First de Cambridge.',
      'Consejo: abre el círculo de abajo a la derecha y entra en la estación 3D.'];
    const res = window.raiAnswer(raw).split('\n');
    return res;
  }

  function initTerminal() {
    const out = $('#term-out'), form = $('#term-form'), input = $('#term-input');
    const line = (cls, txt) => { const p = document.createElement('p'); p.className = cls; p.textContent = txt; out.appendChild(p); out.scrollTop = out.scrollHeight; return p; };
    let busy = false;

    function ask(text) {
      text = text.trim();
      if (!text || busy) return;
      line('me', text);
      discover('ai');
      const res = answer(text);
      if (res === 'CLEAR') { out.innerHTML = ''; return; }
      busy = true;
      const think = line('ai think', 'procesando ');
      setTimeout(() => {
        think.remove();
        res.forEach((l, i) => setTimeout(() => {
          line(i === 0 ? 'ai hl' : 'ai', l);
          if (i === res.length - 1) busy = false;
        }, reduce ? 0 : i * 130));
      }, reduce ? 0 : 450);
    }

    form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
    const chips = ['Soy profesor/a', '¿Tiene experiencia?', '¿Qué tecnologías usa?', '¿Sabe de IA?', '¿Eres una IA real?', 'ayuda'];
    $('#term-chips').innerHTML = chips.map(c => `<button type="button">${esc(c)}</button>`).join('');
    $('#term-chips').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); });
    line('ai hl', 'R-AI v1.0 · asistente del currículum de Rodrigo Bartolomé');
    line('ai', 'Pregúntame lo que quieras sobre su perfil, o pulsa una sugerencia.');
  }

  /* ---------- 9. PDF y contacto ---------- */
  /* El botón es un enlace con "download": aquí solo se registra; desde R-AI se lanza la descarga */
  function downloadPDF(fromChat) {
    discover('pdf');
    toast('Descargando «' + CV.pdf + '»');
    if (fromChat === true) { const a = document.createElement('a'); a.href = encodeURI(CV.pdf); a.download = CV.pdf; document.body.appendChild(a); a.click(); a.remove(); }
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      /* Alternativa para navegadores sin permiso de portapapeles */
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* nada */ }
      ta.remove();
    }
    discover('copy');
    toast('Copiado: ' + text);
  }

  /* ---------- 10. Arranque ---------- */
  function boot(done) {
    const el = $('#boot'), log = $('#boot-log');
    let seen = false;
    try { seen = sessionStorage.getItem('cv-boot') === '1'; sessionStorage.setItem('cv-boot', '1'); } catch { /* nada */ }
    let finished = false;
    const finish = () => { if (finished) return; finished = true; el.classList.add('done'); done(); };
    if (reduce || seen) { finish(); return; }
    const lines = ['> cargando perfil: rodrigo_bartolome.cv', '> perfil ................ Rodrigo Bartolomé', '> formación ............. verificada', '> iniciando sistemas', '> ██████████████████ OK'];
    let i = 0;
    const t = setInterval(() => {
      if (finished) { clearInterval(t); return; }
      log.textContent += lines[i++] + '\n';
      if (i === lines.length) { clearInterval(t); setTimeout(finish, 480); }
    }, 300);
    $('#boot-skip').addEventListener('click', finish);
    addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') finish(); }, { once: true });
  }

  renderAll();
  net.init();
  initNav();
  initInteractions();
  initHud();
  initTerminal();
  boot(() => { startUp(); initReveal(); });
})();
