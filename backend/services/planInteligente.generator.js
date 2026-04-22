// ══════════════════════════════════════════════════════════════════════════
//  planInteligente_generator.js
//  Generador de planes de entrenamiento inteligentes — versión consolidada.
//
//  Estructura:
//    1. Constantes y utilidades
//    2. Clasificación de ejercicios (grupo, perfil, compuesto, equipamiento)
//    3. Scoring
//    4. Slots y plantillas (día y semana)
//    5. Motor de selección
//    6. Configuración de volumen (series, reps, descanso, duración)
//    7. Estimación y ajuste de duración
//    8. Orquestadores y entry point
// ══════════════════════════════════════════════════════════════════════════

// ─── 1. CONSTANTES Y UTILIDADES ───────────────────────────────────────────

const OBJETIVOS_VALIDOS     = ['perder_grasa','ganar_musculo','fuerza','resistencia','tonificar','salud_general'];
const NIVELES_VALIDOS       = ['principiante','intermedio','avanzado'];
const EQUIPAMIENTOS_VALIDOS = ['gimnasio_completo','mancuernas','sin_equipamiento','barras_dominadas','mixto'];
const MODOS_VALIDOS         = ['dia','semana'];
const ENFOQUES_DIA_VALIDOS  = ['pecho','espalda','pierna','hombro','brazos','core','cardio','full_body'];
const PREFERENCIAS_VALIDAS  = ['equilibrado','mas_fuerza','mas_cardio'];

const OBJETIVOS_METABOLICOS = new Set(['perder_grasa','resistencia','salud_general']);

const STOPWORDS = new Set(['de','del','con','en','para','por','a','al','la','el','los','las','y']);

const clamp   = (n, min, max) => Math.max(min, Math.min(max, n));
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const norm = (texto = '') =>
  String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const incluye = (texto, lista) => lista.some(item => texto.includes(item));

// ─── 2. CLASIFICACIÓN ──────────────────────────────────────────────────────

const GRUPOS_CANONICOS = {
  pecho: 'Pecho', espalda: 'Espalda', hombro: 'Hombro', hombros: 'Hombro',
  biceps: 'Biceps', triceps: 'Triceps',
  pierna: 'Pierna', piernas: 'Pierna', gluteo: 'Pierna',
  core: 'Core', abdomen: 'Core', cardio: 'Cardio',
};

const canonizarGrupo = (grupo = '') => GRUPOS_CANONICOS[norm(grupo)] || grupo;
const grupoNorm = (grupo) => norm(canonizarGrupo(grupo));

const obtenerRaizNombre = (ejercicio) =>
  norm(ejercicio.nombre || '')
    .split(/\s+/).filter(Boolean).filter(t => !STOPWORDS.has(t))
    .slice(0, 2).join(' ');

const esCompuesto = (ejercicio) => {
  const n = norm(ejercicio.nombre || '');
  return incluye(n, [
    'press','sentadilla','peso muerto','dominada','dominadas',
    'jalon','remo','prensa','hip thrust','zancada','zancadas',
    'split squat','landmine','fondos','flexion','flexiones','chin-up'
  ]);
};

const esComplejoParaPrincipiante = (ejercicio) => {
  const n = norm(ejercicio.nombre || '');
  return incluye(n, [
    'peso muerto convencional','peso muerto sumo','remo pendlay',
    'sentadilla frontal','buenos dias','clean','snatch','arrancada','pistol'
  ]);
};

const esPocoRecomendable = (ejercicio) => {
  const n = norm(ejercicio.nombre || '');
  return incluye(n, ['remo al menton','upright row']);
};

const detectarPerfil = (ejercicio) => {
  const n = norm(ejercicio.nombre || '');
  const g = grupoNorm(ejercicio.grupo_muscular || '');

  if (g === 'pecho') {
    if (incluye(n, ['apertura','fly','crossover','contractora','peck deck','cruce'])) return 'chest_isolation';
    if (incluye(n, ['press','fondos','flexion','flexiones']))                          return 'push_horizontal_compound';
    return 'chest_isolation';
  }
  if (g === 'espalda') {
    if (incluye(n, ['dominada','dominadas','jalon','pulldown']))        return 'pull_vertical';
    if (incluye(n, ['remo','row']))                                     return 'row_horizontal';
    if (incluye(n, ['pullover','face pull']))                           return 'upper_back_rear_delt';
    return 'row_horizontal';
  }
  if (g === 'hombro') {
    if (incluye(n, ['press','arnold','landmine','pike']))               return 'push_vertical_compound';
    if (incluye(n, ['lateral']))                                        return 'shoulder_lateral_isolation';
    if (incluye(n, ['pajaro','rear','posterior','face pull']))          return 'shoulder_rear_isolation';
    if (incluye(n, ['frontal','front']))                                return 'shoulder_front_isolation';
    return 'shoulder_lateral_isolation';
  }
  if (g === 'biceps') {
    if (incluye(n, ['chin-up','dominada'])) return 'biceps_compound';
    return 'biceps_isolation';
  }
  if (g === 'triceps') {
    if (incluye(n, ['press cerrado','fondos'])) return 'triceps_compound';
    return 'triceps_isolation';
  }
  if (g === 'pierna') {
    if (incluye(n, ['gemelo','calf']))                                        return 'calf_isolation';
    if (incluye(n, ['peso muerto rumano','rumano','buenos dias']))            return 'hinge_compound';
    if (incluye(n, ['curl femoral','femoral']))                               return 'hamstring_isolation';
    if (incluye(n, ['zancada','split squat','bulgara','bulgaro','step up']))  return 'unilateral_leg';
    if (incluye(n, ['hip thrust','puente','abduccion','glute','patada']))     return 'glute_assistance';
    if (incluye(n, ['sentadilla','prensa','hack squat','extension']))         return 'quad_compound';
    if (incluye(n, ['peso muerto']))                                          return 'hinge_compound';
    return 'quad_compound';
  }
  if (g === 'core') {
    if (ejercicio.usa_duracion)                                                return 'core_stability';
    if (incluye(n, ['plancha','hollow','dead bug','bird dog','pallof']))       return 'core_stability';
    return 'core_flexion_rotation';
  }
  if (g === 'cardio') {
    if (incluye(n, ['burpee','battle rope','box jump','comba','hiit',
                    'ski erg','sprint','salto','jumping','mountain climber'])) return 'cardio_interval';
    return 'cardio_steady';
  }
  return 'general';
};

// Equipamiento: qué tipos son compatibles con cada selección del usuario
const COMPAT_EQUIPAMIENTO = {
  gimnasio_completo: new Set(['gimnasio_completo','mancuernas','sin_equipamiento','barras_dominadas','mixto']),
  mancuernas:        new Set(['mancuernas','sin_equipamiento','mixto']),
  sin_equipamiento:  new Set(['sin_equipamiento']),
  barras_dominadas:  new Set(['barras_dominadas','sin_equipamiento','mixto']),
  mixto:             new Set(['mixto','sin_equipamiento','mancuernas','barras_dominadas']),
};

const esCompatibleEquipamiento = (ejercicio, equipamiento) => {
  const tipo = ejercicio.equipamiento_tipo;
  if (!tipo) return equipamiento === 'gimnasio_completo';
  return COMPAT_EQUIPAMIENTO[equipamiento]?.has(tipo) ?? false;
};

// ─── 3. SCORING ────────────────────────────────────────────────────────────

const scoreEjercicio = (ejercicio, objetivo, nivel) => {
  let s = 0;
  const compuesto = esCompuesto(ejercicio);
  const perfil    = detectarPerfil(ejercicio);
  const g         = grupoNorm(ejercicio.grupo_muscular || '');
  const esCardio  = g === 'cardio';
  const esCore    = g === 'core';
  const aisladoBrazos = ['biceps_isolation','triceps_isolation'].includes(perfil);

  switch (objetivo) {
    case 'fuerza':
      if (ejercicio.tipo_registro === 'peso_reps') s += 6;
      if (compuesto) s += 6;
      if (esCardio)  s -= 10;
      if (['chest_isolation','biceps_isolation','triceps_isolation'].includes(perfil)) s -= 3;
      break;
    case 'ganar_musculo':
      if (ejercicio.tipo_registro === 'peso_reps') s += 4;
      if (ejercicio.tipo_registro === 'reps')      s += 2;
      if (compuesto) s += 2;
      if (['chest_isolation','shoulder_lateral_isolation','shoulder_rear_isolation',
           'biceps_isolation','triceps_isolation','hamstring_isolation',
           'glute_assistance'].includes(perfil)) s += 3;
      if (esCardio) s -= 8;
      break;
    case 'tonificar':
      if (ejercicio.tipo_registro === 'peso_reps') s += 3;
      if (ejercicio.tipo_registro === 'reps')      s += 3;
      if (compuesto) s += 1;
      if (['chest_isolation','shoulder_lateral_isolation','biceps_isolation',
           'triceps_isolation','glute_assistance','hamstring_isolation'].includes(perfil)) s += 2;
      if (esCore)   s += 1;
      if (esCardio) s -= 3;
      break;
    case 'perder_grasa':
      if (esCardio) s += 6;
      if (esCore)   s += 2;
      if (ejercicio.usa_duracion || ejercicio.usa_distancia) s += 4;
      if (compuesto) s += 2;
      if (aisladoBrazos) s -= 5;
      break;
    case 'resistencia':
      if (ejercicio.usa_duracion || ejercicio.usa_distancia) s += 5;
      if (ejercicio.tipo_registro === 'reps') s += 3;
      if (esCardio)  s += 4;
      if (compuesto) s += 1;
      if (aisladoBrazos) s -= 4;
      break;
    case 'salud_general':
      if (compuesto) s += 2;
      if (ejercicio.usa_duracion || ejercicio.usa_distancia) s += 2;
      if (esCore)   s += 2;
      if (esCardio) s += 2;
      if (aisladoBrazos) s -= 2;
      break;
  }

  if (nivel === 'principiante') {
    if (esComplejoParaPrincipiante(ejercicio)) s -= 15;
    if (compuesto) s -= 1;
  }
  if (nivel === 'avanzado' && compuesto) s += 2;
  if (esPocoRecomendable(ejercicio)) s -= 10;

  return s;
};

const ordenarPool = (pool, objetivo, nivel) =>
  shuffle(pool).sort((a, b) => scoreEjercicio(b, objetivo, nivel) - scoreEjercicio(a, objetivo, nivel));

// ─── 4. SLOTS Y PLANTILLAS ─────────────────────────────────────────────────

const slot = (grupo, perfiles = [], extra = {}) => ({ grupo, perfiles, ...extra });

/**
 * Cuántos ejercicios tiene una sesión según minutos y nivel.
 * Calibrado para que un compuesto-pesado + accesorios llenen la sesión.
 */
const ejerciciosPorSesion = (minutos, nivel) => {
  let total;
  if (minutos <= 25)      total = 3;
  else if (minutos <= 35) total = 4;
  else if (minutos <= 45) total = 5;
  else if (minutos <= 55) total = 6;
  else if (minutos <= 65) total = 7;
  else if (minutos <= 75) total = 8;
  else if (minutos <= 85) total = 9;
  else                    total = 10;

  if (nivel === 'principiante') total = Math.min(total, 6);
  if (nivel === 'avanzado' && minutos >= 60) total += 1;

  return clamp(total, 3, 11);
};

const topeEjerciciosSesion = (minutos) => {
  if (minutos <= 30) return 6;
  if (minutos <= 45) return 8;
  if (minutos <= 60) return 10;
  if (minutos <= 75) return 12;
  if (minutos <= 90) return 13;
  return 14;
};

/**
 * Toma la plantilla completa y extrae los slots que entran según total,
 * reservando huecos para core/cardio si el usuario los ha marcado.
 */
const prepararSlots = (plantillaCompleta, total, { incluyeCore, incluyeCardio }) => {
  const principales = plantillaCompleta.filter(s => !s.flag);
  const coreSlots   = incluyeCore   ? plantillaCompleta.filter(s => s.flag === 'core')            : [];
  const cardioSlots = incluyeCardio ? plantillaCompleta.filter(s => s.flag === 'cardio_optional') : [];

  const reservaCore   = coreSlots.length   > 0 ? 1 : 0;
  const reservaCardio = cardioSlots.length > 0 ? 1 : 0;
  const espacioPrinc  = Math.max(1, total - reservaCore - reservaCardio);

  const final = [...principales.slice(0, espacioPrinc)];
  if (reservaCore)   final.push(coreSlots[0]);
  if (reservaCardio) final.push(cardioSlots[0]);

  return final.slice(0, total);
};

// ── Plantillas de enfoque (modo día) ──────────────────────────────────────
//
// IMPORTANTE: cada plantilla tiene slots principales (sin flag) que garantizan
// que el grupo principal del enfoque aparece al menos 2-3 veces, y luego
// accesorios + flags opcionales (core y cardio_optional).

const PLANTILLA_PECHO = [
  slot('Pecho',   ['push_horizontal_compound'],      { preferCompound: true }),
  slot('Pecho',   ['chest_isolation']),
  slot('Pecho',   ['push_horizontal_compound','chest_isolation']),
  slot('Hombro',  ['shoulder_lateral_isolation']),
  slot('Triceps', ['triceps_isolation']),
  slot('Pecho',   ['chest_isolation','push_horizontal_compound']),
  slot('Triceps', ['triceps_isolation']),
  slot('Hombro',  ['shoulder_rear_isolation']),
  slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_ESPALDA = [
  slot('Espalda', ['pull_vertical'],            { preferCompound: true }),
  slot('Espalda', ['row_horizontal'],           { preferCompound: true }),
  slot('Espalda', ['row_horizontal','upper_back_rear_delt']),
  slot('Biceps',  ['biceps_isolation']),
  slot('Hombro',  ['shoulder_rear_isolation','upper_back_rear_delt']),
  slot('Espalda', ['upper_back_rear_delt','row_horizontal']),
  slot('Biceps',  ['biceps_isolation']),
  slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_PIERNA = [
  slot('Pierna',  ['quad_compound'],            { preferCompound: true }),
  slot('Pierna',  ['hinge_compound'],           { preferCompound: true }),
  slot('Pierna',  ['unilateral_leg']),
  slot('Pierna',  ['hamstring_isolation','glute_assistance']),
  slot('Pierna',  ['glute_assistance','unilateral_leg']),
  slot('Pierna',  ['calf_isolation']),
  slot('Pierna',  ['unilateral_leg','glute_assistance']),
  slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_HOMBRO = [
  slot('Hombro',  ['push_vertical_compound'],       { preferCompound: true }),
  slot('Hombro',  ['shoulder_lateral_isolation']),
  slot('Hombro',  ['shoulder_rear_isolation']),
  slot('Hombro',  ['shoulder_lateral_isolation','shoulder_front_isolation']),
  slot('Triceps', ['triceps_isolation']),
  slot('Hombro',  ['shoulder_rear_isolation','shoulder_lateral_isolation']),
  slot('Pecho',   ['chest_isolation']),
  slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_BRAZOS = [
  slot('Biceps',  ['biceps_isolation']),
  slot('Triceps', ['triceps_isolation']),
  slot('Biceps',  ['biceps_isolation']),
  slot('Triceps', ['triceps_isolation']),
  slot('Biceps',  ['biceps_isolation']),
  slot('Triceps', ['triceps_isolation']),
  slot('Hombro',  ['shoulder_lateral_isolation']),
  slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_CORE_ENFOQUE = [
  slot('Core',    ['core_stability']),
  slot('Core',    ['core_flexion_rotation']),
  slot('Core',    ['core_stability','core_flexion_rotation']),
  slot('Core',    ['core_flexion_rotation','core_stability']),
  slot('Core',    ['core_stability']),
  slot('Core',    ['core_flexion_rotation']),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_CARDIO_ENFOQUE = [
  slot('Cardio',  ['cardio_steady','cardio_interval']),
  slot('Cardio',  ['cardio_interval','cardio_steady']),
  slot('Cardio',  ['cardio_interval','cardio_steady']),
  slot('Cardio',  ['cardio_steady','cardio_interval']),
  slot('Cardio',  ['cardio_interval','cardio_steady']),
  slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
];

const PLANTILLA_FB_HIPERTROFIA = [
  slot('Pierna',  ['quad_compound'],            { preferCompound: true }),
  slot('Pecho',   ['push_horizontal_compound'], { preferCompound: true }),
  slot('Espalda', ['pull_vertical','row_horizontal'], { preferCompound: true }),
  slot('Pierna',  ['hinge_compound','unilateral_leg']),
  slot('Hombro',  ['shoulder_lateral_isolation','push_vertical_compound']),
  slot('Biceps',  ['biceps_isolation']),
  slot('Triceps', ['triceps_isolation']),
  slot('Pierna',  ['glute_assistance','unilateral_leg']),
  slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const PLANTILLA_FB_METABOLICO = [
  slot('Pierna',  ['quad_compound'],            { preferCompound: true }),
  slot('Pecho',   ['push_horizontal_compound'], { preferCompound: true }),
  slot('Espalda', ['pull_vertical','row_horizontal'], { preferCompound: true }),
  slot('Pierna',  ['hinge_compound','unilateral_leg']),
  slot('Hombro',  ['shoulder_lateral_isolation','push_vertical_compound']),
  slot('Pierna',  ['glute_assistance','unilateral_leg']),
  slot('Core',    ['core_flexion_rotation','core_stability']),
  slot('Pierna',  ['unilateral_leg','glute_assistance']),
  slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
];

const obtenerPlantillaDia = (enfoque, objetivo) => {
  const metab = OBJETIVOS_METABOLICOS.has(objetivo);
  switch (enfoque) {
    case 'pecho':     return PLANTILLA_PECHO;
    case 'espalda':   return PLANTILLA_ESPALDA;
    case 'pierna':    return PLANTILLA_PIERNA;
    case 'hombro':    return PLANTILLA_HOMBRO;
    case 'brazos':    return PLANTILLA_BRAZOS;
    case 'core':      return PLANTILLA_CORE_ENFOQUE;
    case 'cardio':    return PLANTILLA_CARDIO_ENFOQUE;
    default:          return metab ? PLANTILLA_FB_METABOLICO : PLANTILLA_FB_HIPERTROFIA;
  }
};

// ── Plantillas semanales ──────────────────────────────────────────────────

const ESQUEMA_FULL_BODY_3 = [
  { nombre_dia: 'Full Body A', slots: [
    slot('Pierna',  ['quad_compound'],                     { preferCompound: true }),
    slot('Pecho',   ['push_horizontal_compound'],          { preferCompound: true }),
    slot('Espalda', ['row_horizontal','pull_vertical'],    { preferCompound: true }),
    slot('Hombro',  ['shoulder_lateral_isolation','push_vertical_compound']),
    slot('Pierna',  ['glute_assistance','unilateral_leg']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_steady','cardio_interval'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Full Body B', slots: [
    slot('Pierna',  ['hinge_compound','unilateral_leg'],   { preferCompound: true }),
    slot('Espalda', ['pull_vertical','row_horizontal'],    { preferCompound: true }),
    slot('Pecho',   ['chest_isolation','push_horizontal_compound']),
    slot('Hombro',  ['shoulder_rear_isolation','shoulder_lateral_isolation']),
    slot('Pierna',  ['hamstring_isolation','unilateral_leg']),
    slot('Triceps', ['triceps_isolation']),
    slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Full Body C', slots: [
    slot('Pierna',  ['unilateral_leg','glute_assistance']),
    slot('Pecho',   ['push_horizontal_compound','chest_isolation'], { preferCompound: true }),
    slot('Espalda', ['row_horizontal','pull_vertical'],             { preferCompound: true }),
    slot('Hombro',  ['shoulder_lateral_isolation','shoulder_rear_isolation']),
    slot('Pierna',  ['glute_assistance','calf_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'],  { flag: 'core' }),
    slot('Cardio',  ['cardio_steady','cardio_interval'],         { flag: 'cardio_optional' }),
  ]},
];

const ESQUEMA_PPL = [
  { nombre_dia: 'Push', slots: [
    slot('Pecho',   ['push_horizontal_compound'],        { preferCompound: true }),
    slot('Pecho',   ['chest_isolation']),
    slot('Hombro',  ['push_vertical_compound','shoulder_lateral_isolation']),
    slot('Hombro',  ['shoulder_lateral_isolation']),
    slot('Triceps', ['triceps_isolation']),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Pull', slots: [
    slot('Espalda', ['pull_vertical'],                    { preferCompound: true }),
    slot('Espalda', ['row_horizontal'],                   { preferCompound: true }),
    slot('Espalda', ['row_horizontal','upper_back_rear_delt']),
    slot('Hombro',  ['shoulder_rear_isolation','upper_back_rear_delt']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Legs', slots: [
    slot('Pierna',  ['quad_compound'],                    { preferCompound: true }),
    slot('Pierna',  ['hinge_compound'],                   { preferCompound: true }),
    slot('Pierna',  ['unilateral_leg']),
    slot('Pierna',  ['hamstring_isolation','glute_assistance']),
    slot('Pierna',  ['glute_assistance','unilateral_leg']),
    slot('Pierna',  ['calf_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
];

const ESQUEMA_2D = [
  { nombre_dia: 'Full Body A', slots: [
    slot('Pierna',  ['quad_compound'],                   { preferCompound: true }),
    slot('Pecho',   ['push_horizontal_compound'],        { preferCompound: true }),
    slot('Espalda', ['pull_vertical','row_horizontal'],  { preferCompound: true }),
    slot('Hombro',  ['shoulder_lateral_isolation']),
    slot('Pierna',  ['glute_assistance','unilateral_leg']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_steady','cardio_interval'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Full Body B', slots: [
    slot('Pierna',  ['hinge_compound','unilateral_leg'], { preferCompound: true }),
    slot('Espalda', ['row_horizontal','pull_vertical'],  { preferCompound: true }),
    slot('Pecho',   ['chest_isolation','push_horizontal_compound']),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Pierna',  ['hamstring_isolation','calf_isolation']),
    slot('Triceps', ['triceps_isolation']),
    slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
];

const ESQUEMA_4D_UL = [
  { nombre_dia: 'Upper A', slots: [
    slot('Pecho',   ['push_horizontal_compound'],        { preferCompound: true }),
    slot('Espalda', ['row_horizontal'],                  { preferCompound: true }),
    slot('Hombro',  ['push_vertical_compound','shoulder_lateral_isolation']),
    slot('Espalda', ['pull_vertical']),
    slot('Hombro',  ['shoulder_lateral_isolation']),
    slot('Triceps', ['triceps_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
  ]},
  { nombre_dia: 'Lower A', slots: [
    slot('Pierna',  ['quad_compound'],                   { preferCompound: true }),
    slot('Pierna',  ['hinge_compound'],                  { preferCompound: true }),
    slot('Pierna',  ['unilateral_leg']),
    slot('Pierna',  ['hamstring_isolation','glute_assistance']),
    slot('Pierna',  ['glute_assistance','unilateral_leg']),
    slot('Pierna',  ['calf_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_steady','cardio_interval'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Upper B', slots: [
    slot('Espalda', ['pull_vertical'],                   { preferCompound: true }),
    slot('Pecho',   ['chest_isolation','push_horizontal_compound']),
    slot('Hombro',  ['shoulder_lateral_isolation','shoulder_rear_isolation']),
    slot('Espalda', ['row_horizontal','upper_back_rear_delt']),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Triceps', ['triceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  ]},
  { nombre_dia: 'Lower B', slots: [
    slot('Pierna',  ['glute_assistance','hinge_compound']),
    slot('Pierna',  ['quad_compound','unilateral_leg']),
    slot('Pierna',  ['hamstring_isolation']),
    slot('Pierna',  ['unilateral_leg','glute_assistance']),
    slot('Pierna',  ['glute_assistance']),
    slot('Pierna',  ['calf_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
];

const ESQUEMA_5D = [
  ESQUEMA_PPL[0], ESQUEMA_PPL[1], ESQUEMA_PPL[2],
  { nombre_dia: 'Torso', slots: [
    slot('Pecho',   ['push_horizontal_compound','chest_isolation']),
    slot('Espalda', ['row_horizontal','pull_vertical'], { preferCompound: true }),
    slot('Hombro',  ['shoulder_lateral_isolation']),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Triceps', ['triceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Pierna y Core', slots: [
    slot('Pierna',  ['glute_assistance','quad_compound']),
    slot('Pierna',  ['unilateral_leg','hinge_compound']),
    slot('Pierna',  ['hamstring_isolation']),
    slot('Pierna',  ['calf_isolation']),
    slot('Pierna',  ['glute_assistance','unilateral_leg']),
    slot('Core',    ['core_stability']),
    slot('Core',    ['core_flexion_rotation'],                  { flag: 'core' }),
    slot('Cardio',  ['cardio_steady','cardio_interval'],        { flag: 'cardio_optional' }),
  ]},
];

const ESQUEMA_6D = [
  { nombre_dia: 'Push A', slots: [
    slot('Pecho',   ['push_horizontal_compound'],        { preferCompound: true }),
    slot('Pecho',   ['chest_isolation']),
    slot('Hombro',  ['push_vertical_compound','shoulder_lateral_isolation']),
    slot('Triceps', ['triceps_isolation']),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Hombro',  ['shoulder_lateral_isolation']),
    slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
  ]},
  { nombre_dia: 'Pull A', slots: [
    slot('Espalda', ['pull_vertical'],                   { preferCompound: true }),
    slot('Espalda', ['row_horizontal'],                  { preferCompound: true }),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Espalda', ['upper_back_rear_delt']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  ]},
  { nombre_dia: 'Legs A', slots: [
    slot('Pierna',  ['quad_compound'],                   { preferCompound: true }),
    slot('Pierna',  ['hinge_compound'],                  { preferCompound: true }),
    slot('Pierna',  ['unilateral_leg']),
    slot('Pierna',  ['hamstring_isolation','glute_assistance']),
    slot('Pierna',  ['glute_assistance','unilateral_leg']),
    slot('Pierna',  ['calf_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
  { nombre_dia: 'Push B', slots: [
    slot('Pecho',   ['push_horizontal_compound','chest_isolation']),
    slot('Hombro',  ['push_vertical_compound']),
    slot('Hombro',  ['shoulder_lateral_isolation']),
    slot('Triceps', ['triceps_isolation','triceps_compound']),
    slot('Pecho',   ['chest_isolation']),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Core',    ['core_flexion_rotation','core_stability'], { flag: 'core' }),
  ]},
  { nombre_dia: 'Pull B', slots: [
    slot('Espalda', ['row_horizontal'],                  { preferCompound: true }),
    slot('Espalda', ['pull_vertical'],                   { preferCompound: true }),
    slot('Hombro',  ['shoulder_rear_isolation']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Espalda', ['upper_back_rear_delt']),
    slot('Biceps',  ['biceps_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
  ]},
  { nombre_dia: 'Legs B', slots: [
    slot('Pierna',  ['glute_assistance','hinge_compound']),
    slot('Pierna',  ['quad_compound','unilateral_leg']),
    slot('Pierna',  ['hamstring_isolation']),
    slot('Pierna',  ['unilateral_leg']),
    slot('Pierna',  ['glute_assistance']),
    slot('Pierna',  ['calf_isolation']),
    slot('Core',    ['core_stability','core_flexion_rotation'], { flag: 'core' }),
    slot('Cardio',  ['cardio_interval','cardio_steady'],        { flag: 'cardio_optional' }),
  ]},
];

const obtenerEsquemaSemanal = (dias, objetivo) => {
  if (dias === 2) return ESQUEMA_2D;
  if (dias === 3) return OBJETIVOS_METABOLICOS.has(objetivo) ? ESQUEMA_FULL_BODY_3 : ESQUEMA_PPL;
  if (dias === 4) return ESQUEMA_4D_UL;
  if (dias === 5) return ESQUEMA_5D;
  if (dias === 6) return ESQUEMA_6D;
  return ESQUEMA_FULL_BODY_3;
};

// ─── 5. MOTOR DE SELECCIÓN ────────────────────────────────────────────────

const obtenerFamiliaDia = (nombreDia = '') => {
  const n = norm(nombreDia);
  if (n.includes('push'))                                          return 'push';
  if (n.includes('pull'))                                          return 'pull';
  if (n.includes('leg') || n.includes('pierna') || n.includes('lower')) return 'lower';
  if (n.includes('upper') || n.includes('torso'))                  return 'upper';
  if (n.includes('full body'))                                     return 'full_body';
  if (n.includes('cardio'))                                        return 'cardio';
  if (n.includes('core'))                                          return 'core';
  return 'general';
};

const PERFILES_PRINCIPALES = {
  push:      new Set(['push_horizontal_compound','push_vertical_compound']),
  pull:      new Set(['pull_vertical','row_horizontal']),
  lower:     new Set(['quad_compound','hinge_compound','unilateral_leg']),
  upper:     new Set(['push_horizontal_compound','pull_vertical','row_horizontal','push_vertical_compound']),
  full_body: new Set(['quad_compound','hinge_compound','push_horizontal_compound','pull_vertical','row_horizontal']),
  cardio:    new Set(['cardio_interval','cardio_steady']),
  core:      new Set(['core_stability','core_flexion_rotation']),
};

/**
 * Límite de ejercicios por grupo dentro de una sesión.
 */
/**
 * Máximo de ejercicios de un grupo por día.
 *
 * En los días con enfoque centrado en un grupo (familias `lower`, `core`,
 * `cardio`, y los enfoques día 'pecho', 'espalda', 'hombro', 'brazos'),
 * ese grupo principal puede copar casi toda la sesión.
 *
 * Para sesiones largas (≥75 min) los caps se escalan un poco para permitir
 * más variedad cuando el catálogo da para ello.
 */
const maxPorGrupoEnDia = (familia, grupoCanon, totalSlots, objetivo, minutosSesion = 60) => {
  const g = norm(grupoCanon);
  const metab = OBJETIVOS_METABOLICOS.has(objetivo);
  const larga = minutosSesion >= 70;   // escalar caps en sesiones largas
  const xl    = minutosSesion >= 90;   // muy largas

  // Bonus para grupos accesorios en sesiones largas
  const bonus = larga ? (xl ? 2 : 1) : 0;

  if (familia === 'push') {
    if (g === 'pecho')   return 5 + bonus;
    if (g === 'hombro')  return 3 + bonus;
    if (g === 'triceps') return (metab ? 1 : 3) + bonus;
    if (g === 'core')    return (metab ? 2 : 1) + bonus;
    if (g === 'cardio')  return 1;
  }
  if (familia === 'pull') {
    if (g === 'espalda') return 5 + bonus;
    if (g === 'hombro')  return 2 + bonus;
    if (g === 'biceps')  return (metab ? 1 : 3) + bonus;
    if (g === 'core')    return (metab ? 2 : 1) + bonus;
    if (g === 'cardio')  return 1;
  }
  if (familia === 'lower') {
    if (g === 'pierna')  return 8;
    if (g === 'core')    return (metab ? 2 : 1) + bonus;
    if (g === 'cardio')  return 1;
  }
  if (familia === 'upper') {
    if (g === 'pecho')   return 3 + bonus;
    if (g === 'espalda') return 3 + bonus;
    if (g === 'hombro')  return 2 + bonus;
    if (g === 'biceps')  return (metab ? 0 : 2) + bonus;
    if (g === 'triceps') return (metab ? 0 : 2) + bonus;
    if (g === 'core')    return (metab ? 2 : 1) + bonus;
    if (g === 'cardio')  return 1;
  }
  if (familia === 'full_body') {
    if (g === 'pierna')  return (metab ? 4 : 3) + bonus;
    if (g === 'pecho')   return 2 + bonus;
    if (g === 'espalda') return 2 + bonus;
    if (g === 'hombro')  return 2 + bonus;
    if (g === 'biceps')  return (metab ? 0 : 1) + bonus;
    if (g === 'triceps') return (metab ? 0 : 1) + bonus;
    if (g === 'core')    return (metab ? 3 : 2) + bonus;
    if (g === 'cardio')  return 1;
    return 1;
  }
  if (familia === 'cardio') {
    if (g === 'cardio') return 7;
    if (g === 'core')   return 2 + bonus;
  }
  if (familia === 'core') {
    if (g === 'core')   return 8 + bonus;
    if (g === 'cardio') return 1;
  }
  // family 'general' = enfoques día pecho/espalda/hombro/brazos
  return 5 + bonus;
};

const crearEstadoDia = () => ({
  ids:        new Set(),
  raices:     new Set(),
  perfiles:   new Map(),
  grupos:     new Map(),
  compuestos: 0,
});

const registrarEnEstado = (estado, ejercicio) => {
  const perfil = detectarPerfil(ejercicio);
  const raiz   = obtenerRaizNombre(ejercicio);
  const g      = grupoNorm(ejercicio.grupo_muscular || '');
  estado.ids.add(ejercicio.id_ejercicio);
  estado.raices.add(raiz);
  estado.perfiles.set(perfil, (estado.perfiles.get(perfil) || 0) + 1);
  estado.grupos.set(g,         (estado.grupos.get(g)         || 0) + 1);
  if (esCompuesto(ejercicio)) estado.compuestos += 1;
};

const elegirCandidato = ({
  pool, slotDef, meta, estadoDia, usoPlanMap, usoFamiliaMap,
  familiaDia, modoCardio, totalSlots,
}) => {
  const grupoCanon  = grupoNorm(slotDef.grupo);
  const grupoActual = estadoDia.grupos.get(grupoCanon) || 0;
  const maxGrupo    = maxPorGrupoEnDia(familiaDia, slotDef.grupo, totalSlots, meta.objetivo, meta.minutos_sesion);

  if (grupoActual >= maxGrupo) return null;

  const raicesFamilia    = usoFamiliaMap.get(familiaDia) || new Set();
  const perfilesPrinc    = PERFILES_PRINCIPALES[familiaDia] || new Set();
  const perfilesPref     = slotDef.perfiles || [];

  const evaluar = (ejercicio) => {
    const perfil    = detectarPerfil(ejercicio);
    const raiz      = obtenerRaizNombre(ejercicio);
    const repPerfil = estadoDia.perfiles.get(perfil) || 0;
    const repPlan   = usoPlanMap.get(ejercicio.id_ejercicio) || 0;

    let s = scoreEjercicio(ejercicio, meta.objetivo, meta.nivel);

    if (perfilesPref.includes(perfil)) s += 14;
    if (slotDef.preferCompound  &&  esCompuesto(ejercicio)) s += 5;
    if (slotDef.preferCompound  && !esCompuesto(ejercicio)) s -= 5;
    if (slotDef.preferIsolation &&  esCompuesto(ejercicio)) s -= 5;

    s -= (perfilesPrinc.has(perfil) ? repPerfil * 8 : repPerfil * 4);
    s -= repPlan * 6;
    if (raicesFamilia.has(raiz))    s -= 12;
    if (estadoDia.raices.has(raiz)) s -= 100;

    if (esCompuesto(ejercicio) && estadoDia.compuestos >= 4) s -= 5;
    if (meta.nivel === 'principiante' && perfilesPrinc.has(perfil) && repPerfil >= 1) s -= 5;

    return s;
  };

  const candidatos = pool.filter(e => !estadoDia.ids.has(e.id_ejercicio));
  if (candidatos.length === 0) return null;

  const elegido = [...candidatos].sort((a, b) => evaluar(b) - evaluar(a))[0];
  if (!elegido) return null;

  registrarEnEstado(estadoDia, elegido);
  usoPlanMap.set(elegido.id_ejercicio, (usoPlanMap.get(elegido.id_ejercicio) || 0) + 1);
  if (!usoFamiliaMap.has(familiaDia)) usoFamiliaMap.set(familiaDia, new Set());
  usoFamiliaMap.get(familiaDia).add(obtenerRaizNombre(elegido));

  return configurarEjercicio(elegido, meta, {
    modoCardio: slotDef.grupo === 'Cardio' ? modoCardio : undefined,
  });
};

const seleccionarPorSlots = ({
  catalogo, slots, meta, usoPlanMap, usoFamiliaMap,
  modoCardio = 'finisher', nombreDia = 'Entrenamiento',
}) => {
  const estadoDia  = crearEstadoDia();
  const familiaDia = obtenerFamiliaDia(nombreDia);
  const ejercicios = [];

  for (const slotDef of slots) {
    const pool = ordenarPool(
      catalogo.filter(e =>
        canonizarGrupo(e.grupo_muscular) === slotDef.grupo &&
        e.activo !== false &&
        esCompatibleEquipamiento(e, meta.equipamiento)
      ),
      meta.objetivo, meta.nivel
    );
    const elegido = elegirCandidato({
      pool, slotDef, meta, estadoDia, usoPlanMap, usoFamiliaMap,
      familiaDia, modoCardio, totalSlots: slots.length,
    });
    if (elegido) ejercicios.push(elegido);
  }

  return { ejercicios, estadoDia };
};

// ─── 6. CONFIGURACIÓN DE VOLUMEN ──────────────────────────────────────────

const configurarCardio = (ejercicio, objetivo, modoCardio, minutosSesion) => {
  const defaultDur  = ejercicio.duracion_default_segundos || 0;
  const defaultDist = ejercicio.distancia_default_metros  || 0;

  if (modoCardio === 'principal') {
    const esLargo = defaultDur >= 600;
    if (esLargo) {
      return {
        series: 1, descanso: 0,
        duracion:  ejercicio.usa_duracion
          ? Math.max(defaultDur, minutosSesion >= 60 ? 1200 : 900)
          : null,
        distancia: ejercicio.usa_distancia
          ? Math.max(defaultDist, minutosSesion >= 60 ? 2500 : 1800)
          : null,
      };
    }
    // Ejercicio corto → intervalos
    return {
      series:   minutosSesion >= 60 ? 5 : 4,
      descanso: 45,
      duracion:  ejercicio.usa_duracion  ? (defaultDur  || 60)  : null,
      distancia: ejercicio.usa_distancia ? (defaultDist || 200) : null,
    };
  }

  // Finisher
  const metab    = OBJETIVOS_METABOLICOS.has(objetivo);
  const minDur   = metab ? 300 : 180;
  const topeDur  = metab ? 600 : 420;
  const minDist  = metab ? 800 : 500;
  const topeDist = metab ? 1500 : 1000;

  return {
    series: 1, descanso: 0,
    duracion:  ejercicio.usa_duracion  ? clamp(defaultDur  || minDur,  minDur,  topeDur)  : null,
    distancia: ejercicio.usa_distancia ? clamp(defaultDist || minDist, minDist, topeDist) : null,
  };
};

const empaquetar = (ejercicio, { series, descanso, repsMin, repsMax, duracion, distancia }) => ({
  id_ejercicio:               ejercicio.id_ejercicio,
  nombre:                     ejercicio.nombre,
  grupo_muscular:             ejercicio.grupo_muscular,
  tipo_registro:              ejercicio.tipo_registro,
  usa_peso:                   ejercicio.usa_peso,
  usa_repeticiones:           ejercicio.usa_repeticiones,
  usa_duracion:               ejercicio.usa_duracion,
  usa_distancia:              ejercicio.usa_distancia,
  imagen_url:                 ejercicio.imagen_url,
  series:                     clamp(Math.round(series), 1, 8),
  descanso:                   Math.round(descanso),
  reps_objetivo_min:          (repsMin   != null && ejercicio.usa_repeticiones) ? Math.round(repsMin)   : null,
  reps_objetivo_max:          (repsMax   != null && ejercicio.usa_repeticiones) ? Math.round(repsMax)   : null,
  duracion_objetivo_segundos: (duracion  != null && ejercicio.usa_duracion)     ? Math.round(duracion)  : null,
  distancia_objetivo_metros:  (distancia != null && ejercicio.usa_distancia)    ? Math.round(distancia) : null,
});

const configurarEjercicio = (ejercicio, meta, contexto = {}) => {
  const { objetivo, nivel } = meta;
  const compuesto = esCompuesto(ejercicio);
  const g = grupoNorm(ejercicio.grupo_muscular || '');

  // ── Cardio ──
  if (g === 'cardio') {
    if (ejercicio.tipo_registro === 'reps' && ejercicio.usa_repeticiones) {
      // burpees y similares → circuito con reps
      const series = nivel === 'avanzado' ? 4 : 3;
      const descanso = OBJETIVOS_METABOLICOS.has(objetivo) ? 45 : 60;
      return empaquetar(ejercicio, {
        series, descanso,
        repsMin:  ejercicio.reps_min_default ?? 10,
        repsMax:  ejercicio.reps_max_default ?? 20,
        duracion: null, distancia: null,
      });
    }
    const c = configurarCardio(ejercicio, objetivo, contexto.modoCardio || 'finisher', meta.minutos_sesion);
    return empaquetar(ejercicio, {
      series: c.series, descanso: c.descanso,
      repsMin: null, repsMax: null,
      duracion: c.duracion, distancia: c.distancia,
    });
  }

  // ── Core ──
  if (g === 'core') {
    if (ejercicio.usa_duracion) {
      const base = ejercicio.duracion_default_segundos || 20;
      const dur = objetivo === 'resistencia'  ? Math.max(base, 45)
                : objetivo === 'salud_general' ? Math.max(base, 40)
                : Math.max(base, 30);
      return empaquetar(ejercicio, {
        series: clamp(ejercicio.series_default || 3, 2, 4),
        descanso: 45,
        repsMin: null, repsMax: null,
        duracion: dur, distancia: null,
      });
    }
    return empaquetar(ejercicio, {
      series: 3, descanso: 45,
      repsMin: objetivo === 'resistencia' ? 15 : 10,
      repsMax: objetivo === 'resistencia' ? 25 : 20,
      duracion: null, distancia: null,
    });
  }

  // ── Ejercicios de duración (isométricos no-core ni cardio: raros) ──
  if (ejercicio.tipo_registro === 'duracion') {
    return empaquetar(ejercicio, {
      series: 3, descanso: 45,
      repsMin: null, repsMax: null,
      duracion: Math.max(ejercicio.duracion_default_segundos || 30, 30),
      distancia: null,
    });
  }

  // ── Fuerza ──
  if (objetivo === 'fuerza') {
    let series, descanso, repsMin, repsMax;
    if (nivel === 'principiante') {
      series = 3; descanso = compuesto ? 120 : 75;
      repsMin = compuesto ? 5 : 8; repsMax = compuesto ? 8 : 12;
    } else if (nivel === 'avanzado') {
      series = compuesto ? 5 : 3; descanso = compuesto ? 180 : 90;
      repsMin = compuesto ? 3 : 5; repsMax = compuesto ? 5 : 8;
    } else {
      series = compuesto ? 4 : 3; descanso = compuesto ? 150 : 90;
      repsMin = compuesto ? 4 : 6; repsMax = compuesto ? 6 : 10;
    }
    return empaquetar(ejercicio, { series, descanso, repsMin, repsMax, duracion: null, distancia: null });
  }

  // ── Ganar músculo ──
  if (objetivo === 'ganar_musculo') {
    let series, descanso, repsMin, repsMax;
    if (nivel === 'principiante') {
      series = 3; descanso = compuesto ? 90 : 60;
      repsMin = compuesto ? 8 : 10; repsMax = compuesto ? 12 : 15;
    } else if (nivel === 'avanzado') {
      series = compuesto ? 5 : 4; descanso = compuesto ? 90 : 75;
      repsMin = compuesto ? 6 : 8; repsMax = compuesto ? 10 : 15;
    } else {
      series = compuesto ? 4 : 3; descanso = compuesto ? 90 : 75;
      repsMin = compuesto ? 6 : 10; repsMax = compuesto ? 10 : 15;
    }
    return empaquetar(ejercicio, { series, descanso, repsMin, repsMax, duracion: null, distancia: null });
  }

  // ── Tonificar ──
  if (objetivo === 'tonificar') {
    let series, descanso, repsMin, repsMax;
    if (nivel === 'principiante') {
      series = 3; descanso = compuesto ? 60 : 45;
      repsMin = 12; repsMax = 15;
    } else if (nivel === 'avanzado') {
      series = compuesto ? 4 : 3; descanso = compuesto ? 75 : 45;
      repsMin = compuesto ? 10 : 12; repsMax = compuesto ? 15 : 20;
    } else {
      series = 3; descanso = compuesto ? 60 : 45;
      repsMin = compuesto ? 10 : 12; repsMax = compuesto ? 15 : 20;
    }
    return empaquetar(ejercicio, { series, descanso, repsMin, repsMax, duracion: null, distancia: null });
  }

  // ── Perder grasa ──
  if (objetivo === 'perder_grasa') {
    return empaquetar(ejercicio, {
      series:   nivel === 'avanzado' ? 4 : 3,
      descanso: compuesto ? 75 : 45,
      repsMin:  compuesto ? 8 : 12,
      repsMax:  compuesto ? 12 : 15,
      duracion: null, distancia: null,
    });
  }

  // ── Resistencia ──
  if (objetivo === 'resistencia') {
    return empaquetar(ejercicio, {
      series: 3, descanso: 60,
      repsMin: 12, repsMax: nivel === 'avanzado' ? 20 : 18,
      duracion: null, distancia: null,
    });
  }

  // ── Salud general ──
  return empaquetar(ejercicio, {
    series: 3, descanso: 75,
    repsMin: 10, repsMax: 15,
    duracion: null, distancia: null,
  });
};

// ─── 7. ESTIMACIÓN Y AJUSTE DE DURACIÓN ───────────────────────────────────

/**
 * Estimación calibrada en minutos por ejercicio.
 *   - Cada serie "útil" dura: entre 45s (aislamiento ligero) y 90s (compuesto pesado).
 *   - Descanso entre series = (series-1) * descanso_seg.
 *   - Más tiempo fijo de setup por ejercicio.
 */
const estimarMinutos = (ejercicio) => {
  const series      = Number(ejercicio.series || 1);
  const descanso    = Number(ejercicio.descanso || 0);
  const descansoMin = (Math.max(series - 1, 0) * descanso) / 60;
  const perfil      = detectarPerfil(ejercicio);

  // Ejercicios de duración explícita (cardio, core isométrico)
  if (ejercicio.usa_duracion && ejercicio.duracion_objetivo_segundos) {
    const trabajo = (ejercicio.duracion_objetivo_segundos / 60) * series;
    return trabajo + descansoMin + 0.5; // setup
  }

  // Ejercicios con distancia
  if (ejercicio.usa_distancia) {
    const t = ejercicio.duracion_objetivo_segundos
      ? ejercicio.duracion_objetivo_segundos / 60
      : Math.max(4, (ejercicio.distancia_objetivo_metros || 1000) / 250);
    return t * series + descansoMin + 0.5;
  }

  // Ejercicios con reps → tiempo por serie según perfil
  const compuestosPesados = new Set([
    'push_horizontal_compound','push_vertical_compound',
    'pull_vertical','row_horizontal',
    'quad_compound','hinge_compound',
  ]);
  let tiempoPorSerie;
  if (compuestosPesados.has(perfil))                      tiempoPorSerie = 1.3;
  else if (grupoNorm(ejercicio.grupo_muscular) === 'core') tiempoPorSerie = 0.7;
  else                                                     tiempoPorSerie = 1.0;

  return tiempoPorSerie * series + descansoMin + 0.7; // +0.7 setup
};

const estimarMinutosRutina = (ejercicios) =>
  Math.round(ejercicios.reduce((acc, ej) => acc + estimarMinutos(ej), 0));

// ── Grupos usados para rellenar cuando la sesión queda corta ──

const RELLENO_HIPERTROFIA = {
  push:      ['Pecho','Hombro','Triceps','Pecho','Hombro'],
  pull:      ['Espalda','Biceps','Espalda','Hombro','Biceps'],
  lower:     ['Pierna','Pierna','Pierna','Pierna','Pierna'],
  upper:     ['Pecho','Espalda','Hombro','Biceps','Triceps'],
  full_body: ['Pierna','Hombro','Pierna','Biceps','Triceps'],
  cardio:    ['Cardio','Cardio','Core'],
  core:      ['Core','Core','Core'],
  general:   ['Pecho','Espalda','Hombro','Pierna','Biceps','Triceps'],
};

const RELLENO_METABOLICO = {
  push:      ['Pecho','Hombro','Core','Cardio','Pecho','Hombro'],
  pull:      ['Espalda','Hombro','Core','Cardio','Espalda','Hombro'],
  lower:     ['Pierna','Core','Cardio','Pierna','Core'],
  upper:     ['Pecho','Espalda','Hombro','Core','Cardio'],
  full_body: ['Pierna','Core','Hombro','Cardio','Pierna','Core'],
  cardio:    ['Cardio','Cardio','Core','Cardio'],
  core:      ['Core','Core','Cardio','Core'],
  general:   ['Core','Cardio','Hombro','Pierna','Core'],
};

/**
 * Devuelve la lista de grupos para rellenar, respetando las flags del usuario.
 * En enfoque explícito cardio/core, no se filtran esos grupos.
 */
const obtenerGruposRelleno = (familia, objetivo, incluyeCore, incluyeCardio) => {
  const mapa = OBJETIVOS_METABOLICOS.has(objetivo) ? RELLENO_METABOLICO : RELLENO_HIPERTROFIA;
  const base = mapa[familia] || mapa.general;
  return base.filter(grupo => {
    if (grupo === 'Cardio' && !incluyeCardio && familia !== 'cardio') return false;
    if (grupo === 'Core'   && !incluyeCore   && familia !== 'core')   return false;
    return true;
  });
};

const PERFILES_RELLENO = {
  Pecho:   [['push_horizontal_compound'], ['chest_isolation']],
  Espalda: [['row_horizontal'], ['pull_vertical'], ['upper_back_rear_delt']],
  Hombro:  [['shoulder_lateral_isolation'], ['shoulder_rear_isolation']],
  Biceps:  [['biceps_isolation']],
  Triceps: [['triceps_isolation']],
  Pierna:  [['unilateral_leg','glute_assistance'], ['hamstring_isolation','glute_assistance'], ['calf_isolation']],
  Core:    [['core_stability','core_flexion_rotation'], ['core_flexion_rotation','core_stability']],
  Cardio:  [['cardio_interval','cardio_steady'], ['cardio_steady','cardio_interval']],
};

const esPrescindible = (ejercicio) => [
  'chest_isolation','shoulder_lateral_isolation','shoulder_rear_isolation',
  'shoulder_front_isolation','biceps_isolation','triceps_isolation',
  'hamstring_isolation','glute_assistance','calf_isolation',
  'core_stability','core_flexion_rotation','cardio_interval','cardio_steady',
  'upper_back_rear_delt',
].includes(detectarPerfil(ejercicio));

/**
 * Intenta añadir un ejercicio del grupo dado.
 * Si se pasa `techo`, no añadirá un ejercicio cuyos minutos excederían el techo.
 */
const intentarAgregar = ({
  ejercicios, catalogo, meta, nombreDia,
  usoPlanMap, usoFamiliaMap, modoCardio, grupoRelleno, techo,
}) => {
  const familia  = obtenerFamiliaDia(nombreDia);
  const opciones = PERFILES_RELLENO[grupoRelleno] || [[]];

  for (const perfiles of opciones) {
    const slotExtra = slot(grupoRelleno, perfiles);
    const estadoDia = crearEstadoDia();
    ejercicios.forEach(e => registrarEnEstado(estadoDia, e));

    const pool = ordenarPool(
      catalogo.filter(e =>
        canonizarGrupo(e.grupo_muscular) === grupoRelleno &&
        e.activo !== false &&
        esCompatibleEquipamiento(e, meta.equipamiento)
      ),
      meta.objetivo, meta.nivel
    );

    const extra = elegirCandidato({
      pool, slotDef: slotExtra, meta, estadoDia, usoPlanMap, usoFamiliaMap,
      familiaDia: familia, modoCardio, totalSlots: ejercicios.length + 1,
    });

    if (extra && !ejercicios.some(e => e.id_ejercicio === extra.id_ejercicio)) {
      // Si nos dan un techo, comprobamos que no lo pasemos con este nuevo ejercicio
      if (techo != null) {
        const actuales = estimarMinutosRutina(ejercicios);
        const coste = estimarMinutos(extra);
        if (actuales + coste > techo) continue; // este grupo excede, prueba siguiente perfil
      }
      ejercicios.push(extra);
      return true;
    }
  }
  return false;
};

/**
 * Sube series a compuestos/accesorios si nos quedamos cortos.
 * Estrategia: sube primero los compuestos más ligeros, luego los accesorios
 * sin peso, por último ejercicios de core con reps (no series de duración).
 */
/**
 * Calcula cuántos minutos costaría subir una serie a `ejercicio`.
 * = 1 serie de trabajo + 1 descanso adicional (porque series+1 descansos = series-1+1).
 */
const costeSubirSerie = (ejercicio) => {
  const nuevaSerie = ejercicio.series + 1;
  const antes  = estimarMinutos(ejercicio);
  const copia  = { ...ejercicio, series: nuevaSerie };
  const despues = estimarMinutos(copia);
  return despues - antes;
};

/**
 * Sube una serie a un ejercicio solo si el resultado no excede el techo.
 * Devuelve true si pudo subir, false si no.
 *
 * Estrategia por prioridad:
 *   1. Compuestos con peso, series < 5 (da más volumen efectivo).
 *   2. Cualquier ejercicio con reps, series < 5 (grupos principales antes).
 *   3. Core isométrico, series < 4.
 */
const intentarSubirSeries = (ejercicios, minutosActuales, techo) => {
  const margen = techo - minutosActuales;
  if (margen <= 0) return false;

  // Prioridad 1: compuestos con peso
  let candidatos = ejercicios
    .filter(e => esCompuesto(e) && e.series < 5 && e.reps_objetivo_min != null)
    .sort((a, b) => a.series - b.series);
  for (const c of candidatos) {
    if (costeSubirSerie(c) <= margen) { c.series += 1; return true; }
  }

  // Prioridad 2: cualquier ejercicio con reps
  const prioridadGrupo = { Pierna: 1, Pecho: 1, Espalda: 1, Hombro: 2, Triceps: 3, Biceps: 3, Core: 4, Cardio: 5 };
  candidatos = ejercicios
    .filter(e => e.reps_objetivo_min != null && e.series < 5)
    .sort((a, b) => {
      const pa = prioridadGrupo[a.grupo_muscular] || 9;
      const pb = prioridadGrupo[b.grupo_muscular] || 9;
      if (pa !== pb) return pa - pb;
      return a.series - b.series;
    });
  for (const c of candidatos) {
    if (costeSubirSerie(c) <= margen) { c.series += 1; return true; }
  }

  // Prioridad 3: core isométrico (se puede subir hasta 5 series)
  candidatos = ejercicios
    .filter(e => e.duracion_objetivo_segundos != null && e.grupo_muscular === 'Core' && e.series < 5)
    .sort((a, b) => a.series - b.series);
  for (const c of candidatos) {
    if (costeSubirSerie(c) <= margen) { c.series += 1; return true; }
  }

  // Prioridad 4: alargar duración de core isométrico (plancha, hollow)
  //   Útil cuando ya tenemos muchas series pero poca duración.
  candidatos = ejercicios
    .filter(e => e.duracion_objetivo_segundos != null
              && e.grupo_muscular === 'Core'
              && e.duracion_objetivo_segundos < 60);
  for (const c of candidatos) {
    const incremento = 15; // +15s por serie
    const nuevoCoste = (c.series * incremento) / 60;
    if (nuevoCoste <= margen) {
      c.duracion_objetivo_segundos += incremento;
      return true;
    }
  }

  return false;
};

const ajustarDuracion = ({
  ejerciciosIniciales, catalogo, meta, nombreDia,
  usoPlanMap, usoFamiliaMap, modoCardio,
}) => {
  const ejercicios = [...ejerciciosIniciales];
  const objetivoMin = Number(meta.minutos_sesion);

  // Banda de tolerancia
  const banda = {
    min: Math.max(18, objetivoMin - 5),
    max: objetivoMin + 5,
  };
  if (meta.nivel === 'principiante') { banda.min -= 2; banda.max -= 1; }

  const topeEjercicios = topeEjerciciosSesion(objetivoMin);
  const familia        = obtenerFamiliaDia(nombreDia);
  const gruposRelleno  = obtenerGruposRelleno(familia, meta.objetivo, meta.incluye_core, meta.incluye_cardio);

  let minutos = estimarMinutosRutina(ejercicios);

  // ── 1a. Si nos pasamos del máximo: quitar prescindibles ──
  let it = 0;
  while (minutos > banda.max && it < 8) {
    it++;
    const conIdx = [...ejercicios].map((ej, i) => ({ ej, i })).reverse();
    const idx = conIdx.find(x => esPrescindible(x.ej));
    if (!idx) break;
    ejercicios.splice(idx.i, 1);
    minutos = estimarMinutosRutina(ejercicios);
  }

  // ── 1b. Si seguimos pasados (no hay más prescindibles): bajar series ──
  // Nunca por debajo de 3 series para no descafeinar. Prioriza bajar los
  // que más series tengan (5 → 4, 4 → 3).
  it = 0;
  while (minutos > banda.max && it < 15) {
    it++;
    const cand = ejercicios
      .filter(e => e.series > 3)
      .sort((a, b) => b.series - a.series)[0];
    if (!cand) break;
    cand.series -= 1;
    minutos = estimarMinutosRutina(ejercicios);
  }

  // ── 2. Si quedamos cortos: añadir/subir series SIN pasarse del techo ──
  // El techo es banda.max. Así nunca se dispara la duración.
  let totalIt = 0;
  const MAX_IT = 30;

  while (minutos < banda.min && totalIt < MAX_IT) {
    totalIt++;
    let hecho = false;

    // 2a. Preferir añadir ejercicios si cabemos y no nos pasamos del techo
    if (ejercicios.length < topeEjercicios) {
      for (const grupo of gruposRelleno) {
        if (intentarAgregar({
          ejercicios, catalogo, meta, nombreDia,
          usoPlanMap, usoFamiliaMap, modoCardio,
          grupoRelleno: grupo,
          techo: banda.max,
        })) { hecho = true; break; }
      }
    }

    // 2b. Si no cupo, subir series respetando el techo
    if (!hecho) {
      hecho = intentarSubirSeries(ejercicios, minutos, banda.max);
    }

    if (!hecho) break;
    minutos = estimarMinutosRutina(ejercicios);
  }

  return { ejercicios, minutos_estimados: estimarMinutosRutina(ejercicios) };
};

// ─── 8. PREFERENCIA SEMANAL ───────────────────────────────────────────────

/**
 * Aplica la preferencia del usuario.
 *
 * Reglas de coherencia:
 *   - `mas_fuerza` + `incluye_cardio=false` → quita cardio opcional.
 *   - `mas_cardio` + `incluye_cardio=true`  → añade cardio principal en los días que no lo tengan.
 *   - `mas_cardio` + `incluye_cardio=false` → SE RESPETA incluye_cardio (la flag del usuario manda sobre la preferencia).
 */
const aplicarPreferencia = (dias, preferencia, incluyeCardio, total) => {
  if (preferencia === 'mas_cardio' && incluyeCardio) {
    return dias.map(dia => {
      const tieneCardioPrincipal = dia.slots.some(s => s.grupo === 'Cardio' && !s.flag);
      if (!tieneCardioPrincipal) {
        return {
          ...dia,
          slots: [...dia.slots, slot('Cardio', ['cardio_interval','cardio_steady'])]
                   .slice(0, total + 1),
        };
      }
      return dia;
    });
  }

  if (preferencia === 'mas_fuerza' && !incluyeCardio) {
    return dias.map(dia => ({
      ...dia,
      slots: dia.slots.filter(s => s.grupo !== 'Cardio'),
    }));
  }

  return dias;
};

// ─── 9. VALIDACIÓN Y NORMALIZACIÓN ────────────────────────────────────────

const validarPayload = (payload) => {
  const err = [];
  if (!MODOS_VALIDOS.includes(payload.modo))                 err.push('Modo no válido.');
  if (!OBJETIVOS_VALIDOS.includes(payload.objetivo))         err.push('Objetivo no válido.');
  if (!NIVELES_VALIDOS.includes(payload.nivel))              err.push('Nivel no válido.');
  if (!EQUIPAMIENTOS_VALIDOS.includes(payload.equipamiento)) err.push('Equipamiento no válido.');

  const mins = Number(payload.minutos_sesion);
  if (!mins || mins < 20 || mins > 180) err.push('Los minutos por sesión deben estar entre 20 y 180.');

  if (payload.modo === 'dia' && !ENFOQUES_DIA_VALIDOS.includes(payload.enfoque)) {
    err.push('Enfoque de día no válido.');
  }
  if (payload.modo === 'semana') {
    const dias = Number(payload.dias_semana);
    if (!dias || dias < 2 || dias > 6) err.push('Los días por semana deben estar entre 2 y 6.');
    if (payload.preferencia && !PREFERENCIAS_VALIDAS.includes(payload.preferencia)) {
      err.push('Preferencia no válida.');
    }
  }
  return err;
};

const normalizarPayload = (payload) => ({
  modo:           payload.modo,
  objetivo:       payload.objetivo,
  nivel:          payload.nivel,
  dias_semana:    payload.modo === 'semana' ? Number(payload.dias_semana) : null,
  minutos_sesion: Number(payload.minutos_sesion),
  equipamiento:   payload.equipamiento,
  enfoque:        payload.modo === 'dia' ? payload.enfoque : null,
  incluye_core:   Boolean(payload.incluye_core),
  incluye_cardio: Boolean(payload.incluye_cardio),
  preferencia:    payload.modo === 'semana' ? (payload.preferencia || 'equilibrado') : null,
});

// ─── 10. NOMBRES LEGIBLES ─────────────────────────────────────────────────

const NOMBRE_OBJETIVO = {
  perder_grasa:  'Pérdida de grasa',
  ganar_musculo: 'Hipertrofia',
  fuerza:        'Fuerza',
  resistencia:   'Resistencia',
  tonificar:     'Tonificación',
  salud_general: 'Salud general',
};

const NOMBRE_ENFOQUE = {
  pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro',
  brazos: 'Brazos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body',
};

// ─── 11. ORQUESTADORES ───────────────────────────────────────────────────

const generarPreviewDia = (meta, catalogo) => {
  const total     = ejerciciosPorSesion(meta.minutos_sesion, meta.nivel);
  const plantilla = obtenerPlantillaDia(meta.enfoque, meta.objetivo);

  const forzarCardio = meta.enfoque === 'cardio';
  const forzarCore   = meta.enfoque === 'core';

  const slots = prepararSlots(plantilla, total, {
    incluyeCore:   forzarCore   ? true : meta.incluye_core,
    incluyeCardio: forzarCardio ? true : meta.incluye_cardio,
  });

  const modoCardio = meta.enfoque === 'cardio' ? 'principal' : 'finisher';
  const nombreDia  = NOMBRE_ENFOQUE[meta.enfoque] || 'Entrenamiento';

  const usoPlanMap    = new Map();
  const usoFamiliaMap = new Map();

  const { ejercicios: base } = seleccionarPorSlots({
    catalogo, slots, meta, usoPlanMap, usoFamiliaMap, modoCardio, nombreDia,
  });

  const ajuste = ajustarDuracion({
    ejerciciosIniciales: base, catalogo, meta, nombreDia,
    usoPlanMap, usoFamiliaMap, modoCardio,
  });

  return {
    meta,
    plan: {
      nombre:    `${nombreDia} · ${NOMBRE_OBJETIVO[meta.objetivo]} · ${meta.minutos_sesion} min`,
      tipo_plan: 'dia',
      dias: [{
        nombre_dia:        nombreDia,
        posicion_plan:     1,
        minutos_estimados: ajuste.minutos_estimados,
        ejercicios:        ajuste.ejercicios,
      }],
    },
  };
};

const generarPreviewSemana = (meta, catalogo) => {
  const esquema = obtenerEsquemaSemanal(meta.dias_semana, meta.objetivo);
  const total   = ejerciciosPorSesion(meta.minutos_sesion, meta.nivel);

  // 1. Preparar slots según tamaño y flags
  let dias = esquema.map(dia => ({
    ...dia,
    slots: prepararSlots(dia.slots, total, {
      incluyeCore:   meta.incluye_core,
      incluyeCardio: meta.incluye_cardio,
    }),
  }));

  // 2. Aplicar preferencia semanal (respeta incluye_cardio)
  dias = aplicarPreferencia(dias, meta.preferencia, meta.incluye_cardio, total);

  // 3. Generar cada día compartiendo estado global
  const usoPlanMap    = new Map();
  const usoFamiliaMap = new Map();

  const diasGenerados = dias.map((dia, idx) => {
    // El día es de "cardio principal" solo si así lo indicamos explícitamente,
    // aquí lo dejamos como finisher siempre (los días semanales no son dedicados
    // solo a cardio).
    const modoCardio = 'finisher';

    const { ejercicios: base } = seleccionarPorSlots({
      catalogo, slots: dia.slots, meta, usoPlanMap, usoFamiliaMap,
      modoCardio, nombreDia: dia.nombre_dia,
    });

    const ajuste = ajustarDuracion({
      ejerciciosIniciales: base, catalogo, meta, nombreDia: dia.nombre_dia,
      usoPlanMap, usoFamiliaMap, modoCardio,
    });

    return {
      nombre_dia:        dia.nombre_dia,
      posicion_plan:     idx + 1,
      minutos_estimados: ajuste.minutos_estimados,
      ejercicios:        ajuste.ejercicios,
    };
  });

  return {
    meta,
    plan: {
      nombre:    `${NOMBRE_OBJETIVO[meta.objetivo]} · ${meta.dias_semana} días · ${meta.minutos_sesion} min`,
      tipo_plan: 'semana',
      dias:      diasGenerados,
    },
  };
};

// ─── 12. ENTRY POINT ──────────────────────────────────────────────────────

/**
 * Verifica que haya al menos 2 ejercicios compatibles para el grupo principal
 * del enfoque elegido. Si no, el plan no tendría sentido.
 */
const validarCoherenciaEnfoqueEquipamiento = (meta, catalogo) => {
  if (meta.modo !== 'dia') return null;

  const GRUPO_DEL_ENFOQUE = {
    pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna',
    hombro: 'Hombro', brazos: 'Biceps', core: 'Core', cardio: 'Cardio',
  };
  const grupoObjetivo = GRUPO_DEL_ENFOQUE[meta.enfoque];
  if (!grupoObjetivo) return null; // full_body sale sin validar

  // Para brazos validamos Biceps+Triceps combinados
  const grupos = meta.enfoque === 'brazos' ? ['Biceps', 'Triceps'] : [grupoObjetivo];

  const disponibles = catalogo.filter(e =>
    grupos.includes(canonizarGrupo(e.grupo_muscular)) &&
    esCompatibleEquipamiento(e, meta.equipamiento)
  );

  const minimoAceptable = meta.enfoque === 'brazos' || meta.enfoque === 'core' || meta.enfoque === 'cardio' ? 3 : 2;

  if (disponibles.length < minimoAceptable) {
    const nombreEnfoque = NOMBRE_ENFOQUE[meta.enfoque] || meta.enfoque;
    const nombreEquipo = {
      gimnasio_completo: 'Gimnasio completo',
      mancuernas:        'Solo mancuernas',
      sin_equipamiento:  'Sin equipamiento',
      barras_dominadas:  'Barras + peso corporal',
      mixto:             'Material mixto',
    }[meta.equipamiento] || meta.equipamiento;
    return `No hay suficientes ejercicios de ${nombreEnfoque.toLowerCase()} disponibles con "${nombreEquipo}". Prueba con otro equipamiento o enfoque.`;
  }
  return null;
};

const generarPreviewPlanInteligente = (payload, catalogo) => {
  const errores = validarPayload(payload);
  if (errores.length > 0) {
    const err = new Error(errores.join(' '));
    err.statusCode = 400;
    throw err;
  }

  const meta = normalizarPayload(payload);
  const catalogoActivo = catalogo.filter(e => e.activo !== false);

  if (catalogoActivo.length === 0) {
    const err = new Error('No hay ejercicios activos en el catálogo.');
    err.statusCode = 400;
    throw err;
  }

  const errCoherencia = validarCoherenciaEnfoqueEquipamiento(meta, catalogoActivo);
  if (errCoherencia) {
    const err = new Error(errCoherencia);
    err.statusCode = 400;
    throw err;
  }

  return meta.modo === 'dia'
    ? generarPreviewDia(meta, catalogoActivo)
    : generarPreviewSemana(meta, catalogoActivo);
};

module.exports = { generarPreviewPlanInteligente };
