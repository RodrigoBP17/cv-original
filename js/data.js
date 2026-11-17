/* ==========================================================================
   DATOS DEL CURRÍCULUM (año 2029) — el único archivo que necesitas editar.
   --------------------------------------------------------------------------
   Lo usan las tres piezas del proyecto: la estación 3D (estacion.html),
   la versión clásica (index.html) y el CV para PDF (cv.html).
   Estados: 'done' (completado) · 'goal' (siguiente meta)
   ========================================================================== */

window.CV = {
  nombre: 'Rodrigo Bartolomé',
  nombreCompleto: 'Rodrigo Bartolomé Pozuelo',
  iniciales: 'RB',
  foto: 'img/rodrigo.jpg',
  year: 2029,

  /* ---------- Presentación ---------- */
  hero: {
    lema: 'Construyo aplicaciones que aprenden.',
    roles: ['Desarrollador de Aplicaciones Multiplataforma', 'Especialista en IA y Big Data', 'Inglés B2 · Cambridge'],
    intro: 'Técnico Superior en DAM con especialización en Inteligencia Artificial y Big Data. Desarrollo aplicaciones de escritorio, móviles y web, y me gusta integrar la IA allí donde de verdad aporta.'
  },

  /* Ficha de "estado de la misión" (portada y pasillo de la estación) */
  ficha: [
    { clave: 'dam',      valor: 'finalizado' },
    { clave: 'practicas', valor: 'Indra' },
    { clave: 'ia',       valor: 'IA y Big Data' },
    { clave: 'ingles',   valor: 'B2 First' }
  ],

  /* ---------- Sobre mí ---------- */
  sobre: {
    perfil: 'Soy desarrollador de aplicaciones multiplataforma especializado en Inteligencia Artificial y Big Data. Combino una base técnica sólida en Java, Kotlin, C# y bases de datos con formación específica en IA, y aporto algo que aprendí trabajando como socorrista y monitor: responsabilidad, calma bajo presión y trabajo en equipo.',
    intereses: [
      { nombre: 'Programación',            texto: 'Resolver problemas con código y ver cómo una idea se convierte en algo que funciona.' },
      { nombre: 'Apps multiplataforma',    texto: 'Aplicaciones que funcionen igual de bien en ordenador, tablet y móvil.' },
      { nombre: 'Inteligencia Artificial', texto: 'Cómo aprenden los modelos y cómo aplicarlos a problemas reales.' },
      { nombre: 'Datos',                   texto: 'Sacar información útil de grandes volúmenes de datos.' },
      { nombre: 'Diseño de interfaces',    texto: 'Que usar una aplicación resulte claro, rápido y agradable.' },
      { nombre: 'Aprendizaje continuo',    texto: 'En este sector no se termina de estudiar nunca, y eso me gusta.' }
    ],
    objetivos: [
      { texto: 'Finalizar el Grado Superior en DAM',                  estado: 'done' },
      { texto: 'Hacer las prácticas en una empresa tecnológica',      estado: 'done' },
      { texto: 'Acreditar el nivel B2 de inglés',                     estado: 'done' },
      { texto: 'Especializarme en Inteligencia Artificial y Big Data', estado: 'done' },
      { texto: 'Desarrollar aplicaciones con IA integrada en un equipo profesional', estado: 'goal' }
    ],
    blandas: ['Responsabilidad', 'Trabajo en equipo', 'Calma bajo presión', 'Trato con niños y familias', 'Capacidad de reacción', 'Aprendizaje continuo']
  },

  /* ---------- Experiencia ---------- */
  experiencia: [
    {
      id: 'indra',
      puesto: 'Prácticas de desarrollo de software (FCT)',
      empresa: 'Indra',
      lugar: '',
      periodo: '2027',
      tipo: 'Prácticas del ciclo DAM',
      detalle: 'Formación en centro de trabajo del Grado Superior en DAM: mi primera experiencia desarrollando software dentro de un equipo profesional.',
      tareas: ['Desarrollo de software en un entorno profesional', 'Trabajo con metodologías y herramientas de un equipo real', 'Aplicación práctica de lo aprendido en el ciclo'],
      competencias: ['Trabajo en equipo', 'Entorno profesional', 'Desarrollo de software']
    },
    {
      id: 'monitor',
      puesto: 'Monitor de parque acuático',
      empresa: 'Playa Park',
      lugar: 'Ciudad Real',
      periodo: 'Jun – Sep 2026',
      tipo: 'Temporada de verano',
      detalle: 'Monitor durante la temporada de verano en el parque acuático Playa Park de Ciudad Real.',
      tareas: ['Atención y acompañamiento de usuarios en las atracciones', 'Aplicación de las normas de uso y seguridad', 'Coordinación con el equipo de socorristas'],
      competencias: ['Trato con niños y familias', 'Comunicación', 'Trabajo en equipo']
    },
    {
      id: 'socorrista',
      puesto: 'Socorrista',
      empresa: 'Playa Park',
      lugar: 'Ciudad Real',
      periodo: 'Jun – Sep 2025',
      tipo: 'Temporada de verano',
      detalle: 'Socorrista durante la temporada de verano en el parque acuático Playa Park de Ciudad Real.',
      tareas: ['Vigilancia y prevención en piscinas y atracciones acuáticas', 'Atención de primeros auxilios', 'Cumplimiento de las normas de seguridad'],
      competencias: ['Responsabilidad', 'Calma bajo presión', 'Capacidad de reacción']
    }
  ],

  /* ---------- Formación académica (de la más antigua a la más reciente) ---------- */
  formacion: [
    { titulo: 'Educación Primaria', corto: 'Primaria', centro: 'CEIP Benito Pérez Galdós · Miguelturra', periodo: '2012 – 2018', estado: 'done',
      detalle: 'Donde empezó todo: las bases de todo lo que vino después.', etiquetas: [] },
    { titulo: 'Educación Secundaria Obligatoria (ESO)', corto: 'ESO', centro: 'IES Campo de Calatrava · Miguelturra', periodo: '2018 – 2022', estado: 'done',
      detalle: 'Título de Graduado en ESO. Aquí apareció mi interés por la informática y la tecnología.', etiquetas: [] },
    { titulo: 'Bachillerato Tecnológico', corto: 'Bachillerato', centro: 'IES Campo de Calatrava · Miguelturra', periodo: '2022 – 2024', estado: 'done',
      detalle: 'Bachillerato en la modalidad tecnológica: el paso previo a elegir el camino del desarrollo de software.', etiquetas: [] },
    { titulo: 'Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)', corto: 'DAM', centro: 'IES Maestre de Calatrava · Ciudad Real', periodo: '2025 – 2027', estado: 'done',
      detalle: 'Técnico Superior en Desarrollo de Aplicaciones Multiplataforma, con prácticas (FCT) en Indra.',
      etiquetas: ['Programación', 'Bases de datos', 'Acceso a datos', 'Desarrollo de interfaces', 'Programación multimedia y dispositivos móviles', 'Programación de servicios y procesos', 'Sistemas de gestión empresarial', 'Lenguajes de marcas', 'Entornos de desarrollo', 'Sistemas informáticos', 'Proyecto intermodular'] },
    { titulo: 'Curso de Especialización en Inteligencia Artificial y Big Data', corto: 'IA y Big Data', centro: 'IES Maestre de Calatrava · Ciudad Real', periodo: '2027 – 2028', estado: 'done',
      detalle: 'Especialización oficial de FP en Inteligencia Artificial y Big Data.',
      etiquetas: ['Modelos de inteligencia artificial', 'Sistemas de aprendizaje automático', 'Programación de inteligencia artificial', 'Sistemas de Big Data', 'Big Data aplicado'] }
  ],

  /* ---------- Idiomas ---------- */
  idiomas: [
    { codigo: 'ES', nombre: 'Español', nivel: 'Nativo', nivelNum: 100, titulo: '' },
    { codigo: 'EN', nombre: 'Inglés', nivel: 'B2', nivelNum: 70, titulo: 'Cambridge English: B2 First' }
  ],

  /* ---------- Cursos y certificados (formación complementaria, 2022) ---------- */
  certificados: [
    { titulo: 'Socorrista en instalaciones acuáticas', tipo: 'Diploma', fecha: '2022' },
    { titulo: 'Primeros auxilios', tipo: 'Diploma', fecha: '2022' },
    { titulo: 'Uso y manejo del DEA (desfibrilador)', tipo: 'Certificado', fecha: '2022' },
    { titulo: 'Controlador de accesos', tipo: 'Certificado', fecha: '2022' },
    { titulo: 'Mantenimiento integral de piscinas', tipo: 'Certificado', fecha: '2022' }
  ],

  /* ---------- Habilidades técnicas (tecnologías usadas en DAM y en la especialización) ---------- */
  stack: [
    { grupo: 'Lenguajes',        items: ['Java', 'Kotlin', 'C#', 'Python', 'SQL', 'HTML y CSS', 'JavaScript', 'XML'] },
    { grupo: 'Frameworks y UI',  items: ['Spring Boot', 'Jetpack Compose', 'Avalonia UI (.NET)', 'Bootstrap 5', 'Log4j'] },
    { grupo: 'Bases de datos',   items: ['Oracle Database', 'MySQL', 'CRUD y patrón MVC', 'DBeaver', 'SQL Developer'] },
    { grupo: 'Herramientas',     items: ['Git y GitHub', 'Docker', 'Postman', 'IntelliJ IDEA', 'Android Studio', 'Visual Studio', 'Eclipse', 'VS Code'] },
    { grupo: 'Sistemas y gestión', items: ['Programación multiproceso e hilos', 'ERP y CRM: Odoo y ERPNext'] },
    { grupo: 'IA y datos',       items: ['Aprendizaje automático', 'Modelos de IA', 'Big Data', 'Python para IA'] }
  ],

  /* ---------- Contacto ---------- */
  contacto: {
    email:     'robarpo06@gmail.com',
    telefono:  '622 004 187',
    github:    { texto: 'github.com/RodrigoBP17', url: 'https://github.com/RodrigoBP17' },
    instagram: { texto: '@rodrii.bp', url: 'https://www.instagram.com/rodrii.bp/' },
    ubicacion: 'Miguelturra, Ciudad Real',
    extra:     'Permisos de conducir A1 y B · Vehículo propio'
  },

  /* Nombre del PDF que se descarga */
  pdf: 'CV original de Rodrigo Bartolome.pdf'
};
