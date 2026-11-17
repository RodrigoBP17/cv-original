/* ==========================================================================
   R-AI · asistente simulado del currículum (lo usan la estación 3D y la versión clásica)
   No hay ningún modelo de IA detrás: busca palabras clave y responde SOLO con
   datos de js/data.js. Si no encuentra la respuesta, lo dice en lugar de inventar.
   ========================================================================== */
window.raiAnswer = (raw) => {
  const CV = window.CV, c = CV.contacto;
  const q = String(raw).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const has = (...w) => w.some(x => q.includes(x));
  const fIA = CV.formacion[CV.formacion.length - 1];

  if (q === 'futuro' || q === 'el futuro') return 'Comando oculto encontrado. Más allá de ' + CV.year + ': seguir aprendiendo. La IA cambia tan rápido que el verdadero objetivo es no dejar de actualizarse nunca.';
  if (/\b(eres|chatgpt|real)\b/.test(q)) return 'No soy una IA real: soy un asistente simulado que busca palabras clave y responde solo con datos de este currículum. Si no sé algo, lo digo.';
  if (has('hola', 'buenas', 'hey')) return '¡Hola! Pregúntame por su experiencia, formación, tecnologías, idiomas o contacto.';
  if (has('gracias')) return 'A ti por explorar.';
  if (has('experiencia', 'trabaj', 'empleo', 'socorr', 'monitor', 'playa', 'indra', 'practica', 'empresa'))
    return 'Experiencia:\n' + CV.experiencia.map(e => `· ${e.puesto} — ${e.empresa}${e.lugar ? ', ' + e.lugar : ''} (${e.periodo})`).join('\n');
  if (/\bia\b/.test(q) || has('inteligencia', 'artificial', 'big data', 'machine', 'especializ'))
    return `Sí. Ha completado el ${fIA.titulo} (${fIA.periodo}) en el ${fIA.centro.split(' · ')[0]}.\nMódulos: ${fIA.etiquetas.join(', ')}.`;
  if (has('ingles', 'idioma', 'b2', 'cambridge', 'english'))
    return CV.idiomas.map(l => `${l.nombre}: ${l.nivel}${l.titulo ? ' (' + l.titulo + ')' : ''}`).join('\n');
  if (has('tecnolog', 'lenguaje', 'java', 'kotlin', 'programa', 'stack', 'herramienta', 'sabe hacer', 'framework', 'base de datos', 'sql', 'habilidad'))
    return CV.stack.slice(0, 4).map(g => `${g.grupo}: ${g.items.join(', ')}`).join('\n');
  if (has('formacion', 'estudi', 'dam', 'bachiller', 'eso', 'primaria', 'titul', 'academ'))
    return CV.formacion.map(f => `· ${f.titulo} (${f.periodo})`).join('\n');
  if (has('contact', 'correo', 'email', 'telefono', 'github', 'instagram', 'llamar'))
    return `Correo: ${c.email}\nTeléfono: ${c.telefono}\nGitHub: ${c.github.texto}\nInstagram: ${c.instagram.texto}`;
  if (has('objetivo', 'meta', 'quiere', 'plan')) return CV.sobre.objetivos.map(o => `${o.estado === 'done' ? '✓' : '○'} ${o.texto}`).join('\n');
  if (has('certific', 'curso', 'diploma', 'auxilios')) return CV.certificados.map(x => `· ${x.tipo}: ${x.titulo} (${x.fecha})`).join('\n');
  if (has('carnet', 'coche', 'vehiculo', 'conducir')) return c.extra + '.';
  if (has('quien', 'perfil', 'presenta', 'rodrigo', 'sobre')) return CV.sobre.perfil;
  if (has('ayuda', 'que puedes')) return 'Puedo hablarte de: experiencia, formación, tecnologías, IA, idiomas, certificados, objetivos y contacto. Y hay una palabra secreta…';
  return 'No tengo ese dato y prefiero no inventarlo. Prueba con experiencia, formación, tecnologías, IA, idiomas o contacto.';
};
