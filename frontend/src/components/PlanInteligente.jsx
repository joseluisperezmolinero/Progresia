import { useEffect, useState } from 'react';
import {
  Flame, Dumbbell, Zap, Activity, Heart, Sparkles, Building2, Home,
  PersonStanding, Minus, Puzzle, Sparkle, Trash2, Eye, Play, Loader2,
  Repeat, Timer, Target, AlertCircle, ChevronRight, Save, X,
} from 'lucide-react';

// ── Paleta grupos musculares ──────────────────────────────────────────
const COLOR_GRUPO = {
  'Pecho':   'bg-sky-500/10 text-sky-300 border-sky-500/20',
  'Espalda': 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  'Hombro':  'bg-violet-500/10 text-violet-300 border-violet-500/20',
  'Biceps':  'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Bíceps':  'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Triceps': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  'Tríceps': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  'Pierna':  'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'Core':    'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  'Cardio':  'bg-pink-500/10 text-pink-300 border-pink-500/20',
};
const colorGrupo = (g) => COLOR_GRUPO[g] || 'bg-neutral-700/40 text-neutral-300 border-neutral-600/30';

const OBJETIVOS = [
  { valor: 'perder_grasa',  label: 'Perder grasa',       icon: Flame },
  { valor: 'ganar_musculo', label: 'Ganar músculo',      icon: Dumbbell },
  { valor: 'fuerza',        label: 'Aumentar fuerza',    icon: Zap },
  { valor: 'resistencia',   label: 'Mejorar resistencia',icon: Activity },
  { valor: 'tonificar',     label: 'Tonificar',          icon: Sparkle },
  { valor: 'salud_general', label: 'Salud general',      icon: Heart },
];

const NIVELES = [
  { valor: 'principiante', label: 'Principiante', desc: 'Empezando' },
  { valor: 'intermedio',   label: 'Intermedio',   desc: '6+ meses' },
  { valor: 'avanzado',     label: 'Avanzado',     desc: '2+ años' },
];

const EQUIPAMIENTO = [
  { valor: 'gimnasio_completo', label: 'Gimnasio completo',      icon: Building2 },
  { valor: 'mancuernas',        label: 'Solo mancuernas',        icon: Home },
  { valor: 'sin_equipamiento',  label: 'Sin equipamiento',       icon: PersonStanding },
  { valor: 'barras_dominadas',  label: 'Barras + peso corporal', icon: Minus },
  { valor: 'mixto',             label: 'Material mixto',         icon: Puzzle },
];

const ENFOQUES_DIA = [
  { valor: 'pecho',     label: 'Pecho' },
  { valor: 'espalda',   label: 'Espalda' },
  { valor: 'pierna',    label: 'Pierna' },
  { valor: 'hombro',    label: 'Hombro' },
  { valor: 'brazos',    label: 'Brazos' },
  { valor: 'core',      label: 'Core' },
  { valor: 'cardio',    label: 'Cardio' },
  { valor: 'full_body', label: 'Full Body' },
];

const DIAS_SEMANA = [2, 3, 4, 5, 6];

const PREFERENCIAS = [
  { valor: 'equilibrado', label: 'Equilibrado' },
  { valor: 'mas_fuerza',  label: 'Más fuerza' },
  { valor: 'mas_cardio',  label: 'Más cardio' },
];

const formatearSegundos = (segundos) => {
  const total = Number(segundos || 0);
  if (!total) return '0 s';
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const describirObjetivo = (ej) => {
  const partes = [];
  if (ej.usa_repeticiones && ej.reps_objetivo_min && ej.reps_objetivo_max) partes.push(`${ej.reps_objetivo_min}–${ej.reps_objetivo_max} reps`);
  else if (ej.usa_repeticiones && ej.reps_objetivo_min)                    partes.push(`${ej.reps_objetivo_min}+ reps`);
  if (ej.usa_duracion && ej.duracion_objetivo_segundos)                    partes.push(formatearSegundos(ej.duracion_objetivo_segundos));
  if (ej.usa_distancia && ej.distancia_objetivo_metros)                    partes.push(`${ej.distancia_objetivo_metros} m`);
  return partes.join(' · ') || 'Libre';
};

// ── Componentes auxiliares ────────────────────────────────────────────
const OptionCard = ({ active, icon: Icon, label, desc, onClick }) => (
  <button
    onClick={onClick}
    className={`
      text-left p-4 rounded-lg border transition-all
      ${active
        ? 'bg-sky-500/10 border-sky-500/40 text-white'
        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/50'}
    `}
  >
    {Icon && (
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${active ? 'bg-sky-500/20' : 'bg-neutral-800'}`}>
        <Icon className={`w-4 h-4 ${active ? 'text-sky-300' : 'text-neutral-400'}`} strokeWidth={2} />
      </div>
    )}
    <div className={`text-sm font-medium ${active ? 'text-white' : ''}`}>{label}</div>
    {desc && <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>}
  </button>
);

const PillBtn = ({ active, children, onClick, small }) => (
  <button
    onClick={onClick}
    className={`
      ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
      font-medium rounded-md transition-all
      ${active ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}
    `}
  >
    {children}
  </button>
);

const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div
      className={`
        w-4 h-4 rounded border flex items-center justify-center transition-all
        ${checked
          ? 'bg-sky-500 border-sky-500'
          : 'bg-neutral-900 border-neutral-700 group-hover:border-neutral-500'}
      `}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <span className="text-sm text-neutral-300">{label}</span>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
  </label>
);

export default function PlanInteligente({ irAEntrenar }) {
  const [tab, setTab] = useState('generar');

  const [modo, setModo] = useState('dia');
  const [objetivo, setObjetivo] = useState('');
  const [nivel, setNivel] = useState('');
  const [minutosSesion, setMinutosSesion] = useState(60);
  const [equipamiento, setEquipamiento] = useState('');
  const [enfoque, setEnfoque] = useState('full_body');
  const [diasSemana, setDiasSemana] = useState(3);
  const [preferencia, setPreferencia] = useState('equilibrado');
  const [incluyeCore, setIncluyeCore] = useState(true);
  const [incluyeCardio, setIncluyeCardio] = useState(false);

  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const token = localStorage.getItem('token');

  const cargarPlanes = async () => {
    setCargandoPlanes(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/planes-inteligentes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPlanes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoPlanes(false);
    }
  };

  useEffect(() => {
    if (tab === 'guardados') cargarPlanes();
  }, [tab]);

  const generarPreview = async () => {
    setGenerando(true);
    setError('');
    setPreview(null);

    try {
      const payload = {
        modo, objetivo, nivel,
        minutos_sesion: Number(minutosSesion),
        equipamiento,
        enfoque: modo === 'dia' ? enfoque : null,
        dias_semana: modo === 'semana' ? Number(diasSemana) : null,
        preferencia: modo === 'semana' ? preferencia : null,
        incluye_core: incluyeCore,
        incluye_cardio: incluyeCardio,
      };

      const res = await fetch('http://127.0.0.1:5000/api/planes-inteligentes/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || 'No se pudo generar la preview.');
      setPreview(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error generando el plan.');
    } finally {
      setGenerando(false);
    }
  };

  const guardarPlan = async () => {
    if (!preview) return;
    setGuardando(true);
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/planes-inteligentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(preview),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || data?.detalle || 'No se pudo guardar el plan.');

      setPreview(null);
      setTab('guardados');
      await cargarPlanes();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al guardar el plan.');
    } finally {
      setGuardando(false);
    }
  };

  const verDetallePlan = async (id) => {
    setCargandoDetalle(true);
    setPlanSeleccionado(null);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/planes-inteligentes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el plan.');
      setPlanSeleccionado(data);
    } catch (err) {
      alert(err.message || 'Error al cargar el plan.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const borrarPlan = async (id) => {
    if (!window.confirm('¿Eliminar este plan inteligente?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/planes-inteligentes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar el plan.');
      if (planSeleccionado?.id_plan_inteligente === id) setPlanSeleccionado(null);
      await cargarPlanes();
    } catch (err) {
      alert(err.message || 'Error al eliminar el plan.');
    }
  };

  const formularioValido =
    objetivo && nivel && equipamiento && Number(minutosSesion) >= 20 &&
    (modo === 'dia' ? enfoque : Number(diasSemana) >= 2);

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto">
      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-sky-400" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Plan Inteligente
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">
            Genera tu rutina personalizada
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Responde unas preguntas y el sistema elegirá los ejercicios óptimos de tu catálogo.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-1 flex">
          <PillBtn active={tab === 'generar'}    onClick={() => setTab('generar')}>Generar</PillBtn>
          <PillBtn active={tab === 'guardados'} onClick={() => setTab('guardados')}>Mis planes</PillBtn>
        </div>
      </header>

      {/* ── TAB GENERAR ─────────────────────────────────────── */}
      {tab === 'generar' && (
        <div className="flex flex-col gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-8">
            {/* Modo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Tipo de plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <OptionCard
                  active={modo === 'dia'}
                  label="Entrenamiento de un día"
                  desc="Una sesión aislada"
                  onClick={() => setModo('dia')}
                />
                <OptionCard
                  active={modo === 'semana'}
                  label="Plan semanal"
                  desc="Varios días estructurados"
                  onClick={() => setModo('semana')}
                />
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Objetivo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {OBJETIVOS.map((o) => (
                  <OptionCard
                    key={o.valor}
                    active={objetivo === o.valor}
                    icon={o.icon}
                    label={o.label}
                    onClick={() => setObjetivo(o.valor)}
                  />
                ))}
              </div>
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Nivel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {NIVELES.map((n) => (
                  <OptionCard
                    key={n.valor}
                    active={nivel === n.valor}
                    label={n.label}
                    desc={n.desc}
                    onClick={() => setNivel(n.valor)}
                  />
                ))}
              </div>
            </div>

            {/* Equipamiento */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Equipamiento disponible
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EQUIPAMIENTO.map((e) => (
                  <OptionCard
                    key={e.valor}
                    active={equipamiento === e.valor}
                    icon={e.icon}
                    label={e.label}
                    onClick={() => setEquipamiento(e.valor)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Minutos */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Minutos por sesión
                </label>
                <input
                  type="number"
                  min="20"
                  max="180"
                  value={minutosSesion}
                  onChange={(e) => setMinutosSesion(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                />
              </div>

              {modo === 'dia' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Enfoque del día
                  </label>
                  <select
                    value={enfoque}
                    onChange={(e) => setEnfoque(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                  >
                    {ENFOQUES_DIA.map((op) => (
                      <option key={op.valor} value={op.valor} className="bg-neutral-900">{op.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Días por semana
                  </label>
                  <div className="flex gap-2">
                    {DIAS_SEMANA.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDiasSemana(d)}
                        className={`
                          w-11 h-11 rounded-lg font-semibold text-sm transition-all
                          ${diasSemana === d
                            ? 'bg-sky-500 text-white'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'}
                        `}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preferencia */}
            {modo === 'semana' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Preferencia
                </label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-1 inline-flex gap-1">
                  {PREFERENCIAS.map((p) => (
                    <PillBtn
                      key={p.valor}
                      active={preferencia === p.valor}
                      onClick={() => setPreferencia(p.valor)}
                    >
                      {p.label}
                    </PillBtn>
                  ))}
                </div>
              </div>
            )}

            {/* Opciones */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Opciones
              </label>
              <div className="flex flex-wrap gap-6">
                <Checkbox
                  checked={incluyeCore}
                  onChange={(e) => setIncluyeCore(e.target.checked)}
                  label="Incluir core"
                />
                <Checkbox
                  checked={incluyeCardio}
                  onChange={(e) => setIncluyeCardio(e.target.checked)}
                  label="Incluir cardio"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={generarPreview}
                disabled={!formularioValido || generando}
                className="
                  w-full flex items-center justify-center gap-2 py-3.5 rounded-lg
                  bg-gradient-to-r from-sky-500 to-indigo-600
                  hover:from-sky-400 hover:to-indigo-500
                  disabled:from-neutral-800 disabled:to-neutral-800
                  disabled:text-neutral-600 disabled:cursor-not-allowed
                  text-white font-semibold text-sm transition-all
                "
              >
                {generando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando preview...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                    Generar preview del plan
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-neutral-900 border border-sky-500/30 rounded-xl p-6 space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400 mb-2">
                    Preview sin guardar
                  </p>
                  <h3 className="text-xl font-semibold text-white">{preview.plan.nombre}</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    {preview.plan.tipo_plan === 'dia' ? 'Entrenamiento de un día' : 'Plan semanal'} ·{' '}
                    {preview.meta.minutos_sesion} min por sesión
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreview(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                    Descartar
                  </button>
                  <button
                    onClick={guardarPlan}
                    disabled={guardando}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {guardando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" strokeWidth={2} />
                    )}
                    {guardando ? 'Guardando...' : 'Guardar plan'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {preview.plan.dias.map((dia, idx) => (
                  <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="border-b border-neutral-800 px-5 py-4 flex items-center justify-between gap-3 flex-wrap bg-neutral-900/50">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-md bg-sky-500 text-white text-xs font-semibold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-base font-semibold text-white">{dia.nombre_dia}</h4>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md">
                        <Timer className="w-3 h-3" strokeWidth={2.5} />
                        ~ {dia.minutos_estimados} min
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      {dia.ejercicios.map((ej, i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-white text-sm">{ej.nombre}</span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${colorGrupo(ej.grupo_muscular)}`}>
                              {ej.grupo_muscular}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-neutral-500" strokeWidth={2} />
                              {ej.series} series
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3 text-neutral-500" strokeWidth={2} />
                              {formatearSegundos(ej.descanso)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-neutral-500" strokeWidth={2} />
                              {describirObjetivo(ej)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB GUARDADOS ──────────────────────────────────── */}
      {tab === 'guardados' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {cargandoPlanes ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Cargando planes...
              </div>
            ) : planes.length === 0 ? (
              <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-xl p-12 text-center">
                <Sparkles className="w-6 h-6 text-neutral-600 mx-auto mb-3" strokeWidth={2} />
                <p className="text-neutral-400 text-sm">No tienes planes guardados aún.</p>
              </div>
            ) : (
              planes.map((plan) => {
                const activo = planSeleccionado?.id_plan_inteligente === plan.id_plan_inteligente;
                return (
                  <div
                    key={plan.id_plan_inteligente}
                    className={`bg-neutral-900 border rounded-xl p-5 transition-all ${activo ? 'border-sky-500/40' : 'border-neutral-800 hover:border-neutral-700'}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white leading-tight">{plan.nombre}</h3>
                        <p className="text-xs text-neutral-500 mt-1.5">
                          {plan.tipo_plan === 'dia' ? 'Un día' : `${plan.dias_semana} días/semana`} · {plan.minutos_sesion} min
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-1 rounded flex-shrink-0">
                        <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                        IA
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => verDetallePlan(plan.id_plan_inteligente)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium py-2 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" strokeWidth={2} />
                        Ver
                      </button>
                      <button
                        onClick={() => borrarPlan(plan.id_plan_inteligente)}
                        className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-red-500/10 text-red-400 text-sm font-medium py-2 px-3 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 min-h-[500px]">
            {cargandoDetalle ? (
              <div className="text-center py-20 text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Cargando detalle...
              </div>
            ) : planSeleccionado ? (
              <div className="space-y-5">
                <div className="pb-4 border-b border-neutral-800">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400 mb-1">Plan guardado</p>
                  <h3 className="text-xl font-semibold text-white">{planSeleccionado.nombre}</h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    {planSeleccionado.tipo_plan === 'dia' ? 'Un día' : `${planSeleccionado.dias_semana} días/semana`} · {planSeleccionado.minutos_sesion} min
                  </p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {planSeleccionado.dias?.map((dia, idx) => (
                    <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
                      <div className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <h4 className="text-sm font-semibold text-white">{dia.nombre_dia}</h4>
                        <button
                          onClick={() => irAEntrenar(dia.id_entrenamiento)}
                          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" strokeWidth={2} />
                          Entrenar
                        </button>
                      </div>

                      <div className="p-3 space-y-2">
                        {dia.ejercicios.map((ej, i) => (
                          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="font-medium text-white text-sm">{ej.nombre}</span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorGrupo(ej.grupo_muscular)}`}>
                                {ej.grupo_muscular}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                              <span>{ej.series_objetivo} series</span>
                              <span>·</span>
                              <span>{formatearSegundos(ej.tiempo_descanso_segundos)}</span>
                              <span>·</span>
                              <span>{describirObjetivo({ ...ej, series: ej.series_objetivo })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-neutral-500">
                <div>
                  <ChevronRight className="w-5 h-5 mx-auto mb-2" strokeWidth={2} />
                  <p className="text-sm">Selecciona un plan para ver el detalle.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}