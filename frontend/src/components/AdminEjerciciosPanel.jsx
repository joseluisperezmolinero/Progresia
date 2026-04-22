import { useEffect, useMemo, useState } from 'react';
import {
  Search, Pencil, Eye, EyeOff, Plus, Save, Loader2, ChevronDown,
  Dumbbell, Image as ImageIcon, Link2, X,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5000/api/admin';

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

const TIPOS_REGISTRO = ['peso_reps', 'reps', 'duracion', 'distancia_duracion'];
const TIPOS_EJERCICIO = ['fuerza', 'cardio', 'movilidad', 'core'];
const EQUIPAMIENTOS = ['gimnasio_completo', 'mancuernas', 'sin_equipamiento', 'barras_dominadas', 'mixto'];

const crearFormInicial = () => ({
  nombre: '', grupo_muscular: 'Pecho', imagen_url: '',
  tipo_ejercicio: 'fuerza', tipo_registro: 'peso_reps',
  usa_peso: true, usa_repeticiones: true, usa_duracion: false, usa_distancia: false,
  series_default: 3, descanso_default_segundos: 60,
  reps_min_default: 8, reps_max_default: 12,
  duracion_default_segundos: '', distancia_default_metros: '',
  activo: true, demo_url: '', equipamiento_tipo: 'gimnasio_completo',
});

const aplicarTipoRegistro = (tipo, prev) => {
  const next = { ...prev, tipo_registro: tipo };
  if (tipo === 'peso_reps')           { next.usa_peso = true;  next.usa_repeticiones = true;  next.usa_duracion = false; next.usa_distancia = false; }
  else if (tipo === 'reps')           { next.usa_peso = false; next.usa_repeticiones = true;  next.usa_duracion = false; next.usa_distancia = false; }
  else if (tipo === 'duracion')       { next.usa_peso = false; next.usa_repeticiones = false; next.usa_duracion = true;  next.usa_distancia = false; }
  else if (tipo === 'distancia_duracion') { next.usa_peso = false; next.usa_repeticiones = false; next.usa_duracion = true; next.usa_distancia = true; }
  return next;
};

const etiquetaRegistro = (tipo) => ({
  peso_reps: 'Peso + reps',
  reps: 'Solo reps',
  duracion: 'Duración',
  distancia_duracion: 'Distancia + duración',
}[tipo] || tipo);

const etiquetaTipoEjercicio = (tipo) => ({
  fuerza: 'Fuerza', cardio: 'Cardio', movilidad: 'Movilidad', core: 'Core',
}[tipo] || tipo);

const etiquetaEquipamiento = (tipo) => ({
  gimnasio_completo: 'Gimnasio completo',
  mancuernas: 'Mancuernas',
  sin_equipamiento: 'Sin equipamiento',
  barras_dominadas: 'Barras + peso corporal',
  mixto: 'Mixto',
}[tipo] || tipo);

const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className={`
      w-4 h-4 rounded border flex items-center justify-center transition-all
      ${checked ? 'bg-sky-500 border-sky-500' : 'bg-neutral-900 border-neutral-700 group-hover:border-neutral-500'}
    `}>
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

const SelectField = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 pr-9 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50 cursor-pointer transition-colors"
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
  </div>
);

export default function AdminEjerciciosPanel({ onError, onRefreshResumen }) {
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const [modo, setModo] = useState('crear');
  const [ejercicioEditando, setEjercicioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(crearFormInicial());

  const token = localStorage.getItem('token');
  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token]
  );

  const gruposDisponibles = useMemo(() => {
    const grupos = [...new Set(ejercicios.map((e) => e.grupo_muscular).filter(Boolean))];
    return ['Todos', ...grupos.sort((a, b) => a.localeCompare(b))];
  }, [ejercicios]);

  const tiposDisponibles = useMemo(() => {
    const tipos = [...new Set(ejercicios.map((e) => e.tipo_ejercicio).filter(Boolean))];
    return ['Todos', ...tipos.sort((a, b) => a.localeCompare(b))];
  }, [ejercicios]);

  const ejerciciosFiltrados = useMemo(() => {
    return ejercicios.filter((e) => {
      const cG = filtroGrupo === 'Todos' || e.grupo_muscular === filtroGrupo;
      const cT = filtroTipo === 'Todos' || e.tipo_ejercicio === filtroTipo;
      const b = busqueda.toLowerCase();
      const cB = e.nombre?.toLowerCase().includes(b) ||
                 e.grupo_muscular?.toLowerCase().includes(b) ||
                 e.tipo_ejercicio?.toLowerCase().includes(b);
      return cG && cT && cB;
    });
  }, [ejercicios, filtroGrupo, filtroTipo, busqueda]);

  const cargarEjercicios = async (filtro = filtroActivo) => {
    try {
      setCargando(true);
      onError?.('');
      let query = '';
      if (filtro === 'activos') query = '?activo=true';
      if (filtro === 'inactivos') query = '?activo=false';
      const res = await fetch(`${API_BASE}/ejercicios${query}`, { headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los ejercicios');
      setEjercicios(Array.isArray(data) ? data : []);
    } catch (error) {
      onError?.(error.message || 'Error al cargar ejercicios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarEjercicios('todos'); }, []); // eslint-disable-line

  const abrirCrear = () => {
    setModo('crear');
    setEjercicioEditando(null);
    setForm(crearFormInicial());
    onError?.('');
  };

  const abrirEditar = (ejercicio) => {
    setModo('editar');
    setEjercicioEditando(ejercicio);
    setForm({
      nombre: ejercicio.nombre || '',
      grupo_muscular: ejercicio.grupo_muscular || 'Pecho',
      imagen_url: ejercicio.imagen_url || '',
      tipo_ejercicio: ejercicio.tipo_ejercicio || 'fuerza',
      tipo_registro: ejercicio.tipo_registro || 'peso_reps',
      usa_peso: Boolean(ejercicio.usa_peso),
      usa_repeticiones: Boolean(ejercicio.usa_repeticiones),
      usa_duracion: Boolean(ejercicio.usa_duracion),
      usa_distancia: Boolean(ejercicio.usa_distancia),
      series_default: ejercicio.series_default ?? 3,
      descanso_default_segundos: ejercicio.descanso_default_segundos ?? 60,
      reps_min_default: ejercicio.reps_min_default ?? '',
      reps_max_default: ejercicio.reps_max_default ?? '',
      duracion_default_segundos: ejercicio.duracion_default_segundos ?? '',
      distancia_default_metros: ejercicio.distancia_default_metros ?? '',
      activo: Boolean(ejercicio.activo),
      demo_url: ejercicio.demo_url || '',
      equipamiento_tipo: ejercicio.equipamiento_tipo || 'gimnasio_completo',
    });
    onError?.('');
  };

  const guardarEjercicio = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      onError?.('');
      const url = modo === 'crear'
        ? `${API_BASE}/ejercicios`
        : `${API_BASE}/ejercicios/${ejercicioEditando.id_ejercicio}`;
      const method = modo === 'crear' ? 'POST' : 'PUT';

      const payload = {
        ...form,
        series_default: form.series_default === '' ? null : Number(form.series_default),
        descanso_default_segundos: form.descanso_default_segundos === '' ? null : Number(form.descanso_default_segundos),
        reps_min_default: form.reps_min_default === '' ? null : Number(form.reps_min_default),
        reps_max_default: form.reps_max_default === '' ? null : Number(form.reps_max_default),
        duracion_default_segundos: form.duracion_default_segundos === '' ? null : Number(form.duracion_default_segundos),
        distancia_default_metros: form.distancia_default_metros === '' ? null : Number(form.distancia_default_metros),
      };

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el ejercicio');

      await cargarEjercicios();
      await onRefreshResumen?.();

      if (modo === 'crear') setForm(crearFormInicial());
      else if (data.ejercicio) abrirEditar(data.ejercicio);
    } catch (error) {
      onError?.(error.message || 'Error al guardar ejercicio');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoActivo = async (ejercicio) => {
    try {
      onError?.('');
      const res = await fetch(`${API_BASE}/ejercicios/${ejercicio.id_ejercicio}/activo`, {
        method: 'PATCH', headers, body: JSON.stringify({ activo: !ejercicio.activo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el estado');
      await cargarEjercicios();
      await onRefreshResumen?.();
      if (ejercicioEditando?.id_ejercicio === ejercicio.id_ejercicio && data.ejercicio) {
        abrirEditar(data.ejercicio);
      }
    } catch (error) {
      onError?.(error.message || 'Error al actualizar estado');
    }
  };

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      {/* ── LISTA ─────────────────────────────────────────── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Catálogo global</h3>
            <p className="text-sm text-neutral-400 mt-0.5">
              Activa, desactiva y edita ejercicios del sistema.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <SelectField value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
              <option value="todos" className="bg-neutral-900">Todos</option>
              <option value="activos" className="bg-neutral-900">Activos</option>
              <option value="inactivos" className="bg-neutral-900">Inactivos</option>
            </SelectField>
            <button
              onClick={() => cargarEjercicios(filtroActivo)}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium py-2 px-3 rounded-lg transition-colors whitespace-nowrap"
            >
              Filtrar
            </button>
            <button
              onClick={abrirCrear}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Nuevo
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={2} />
              <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
            <SelectField value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              {tiposDisponibles.map((t) => (
                <option key={t} value={t} className="bg-neutral-900">
                  {t === 'Todos' ? 'Todos los tipos' : etiquetaTipoEjercicio(t)}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {gruposDisponibles.map((grupo) => (
              <button
                key={grupo}
                onClick={() => setFiltroGrupo(grupo)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${filtroGrupo === grupo
                    ? 'bg-white text-neutral-900'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'}
                `}
              >
                {grupo}
              </button>
            ))}
          </div>

          <p className="text-xs text-neutral-500">
            Mostrando {ejerciciosFiltrados.length} de {ejercicios.length}
          </p>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-neutral-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando ejercicios...
          </div>
        ) : ejerciciosFiltrados.length === 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
            No hay ejercicios que coincidan con los filtros.
          </div>
        ) : (
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {ejerciciosFiltrados.map((ejercicio) => {
              const activo = ejercicioEditando?.id_ejercicio === ejercicio.id_ejercicio;
              return (
                <div
                  key={ejercicio.id_ejercicio}
                  className={`
                    border rounded-lg p-4 transition-colors
                    ${activo
                      ? 'border-sky-500/40 bg-sky-500/5'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'}
                  `}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{ejercicio.nombre}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {etiquetaTipoEjercicio(ejercicio.tipo_ejercicio)} · {etiquetaRegistro(ejercicio.tipo_registro)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorGrupo(ejercicio.grupo_muscular)}`}>
                          {ejercicio.grupo_muscular}
                        </span>
                        <span className={`
                          text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider
                          ${ejercicio.activo
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-500 border-neutral-700'}
                        `}>
                          {ejercicio.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {etiquetaEquipamiento(ejercicio.equipamiento_tipo || 'gimnasio_completo')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => abrirEditar(ejercicio)}
                        className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                        Editar
                      </button>
                      <button
                        onClick={() => cambiarEstadoActivo(ejercicio)}
                        className={`
                          flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                          ${ejercicio.activo
                            ? 'bg-neutral-800 hover:bg-red-500/10 text-red-300'
                            : 'bg-neutral-800 hover:bg-emerald-500/10 text-emerald-300'}
                        `}
                      >
                        {ejercicio.activo
                          ? <><EyeOff className="w-3.5 h-3.5" strokeWidth={2} />Desactivar</>
                          : <><Eye    className="w-3.5 h-3.5" strokeWidth={2} />Activar</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FORMULARIO ────────────────────────────────────── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {modo === 'crear' ? 'Crear ejercicio' : 'Editar ejercicio'}
            </h3>
            <p className="text-sm text-neutral-400 mt-0.5">
              Configura cómo se comporta en rutinas y planes.
            </p>
          </div>
          {modo === 'editar' && (
            <button
              onClick={abrirCrear}
              className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={guardarEjercicio} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
              placeholder="Ej. Press banca con mancuernas"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Grupo muscular</label>
              <SelectField
                value={form.grupo_muscular}
                onChange={(e) => setForm((p) => ({ ...p, grupo_muscular: e.target.value }))}
              >
                {gruposDisponibles.filter((g) => g !== 'Todos').map((g) => (
                  <option key={g} value={g} className="bg-neutral-900">{g}</option>
                ))}
              </SelectField>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Tipo de ejercicio</label>
              <SelectField
                value={form.tipo_ejercicio}
                onChange={(e) => setForm((p) => ({ ...p, tipo_ejercicio: e.target.value }))}
              >
                {TIPOS_EJERCICIO.map((t) => (
                  <option key={t} value={t} className="bg-neutral-900">{etiquetaTipoEjercicio(t)}</option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Tipo de registro</label>
              <SelectField
                value={form.tipo_registro}
                onChange={(e) => setForm((p) => aplicarTipoRegistro(e.target.value, p))}
              >
                {TIPOS_REGISTRO.map((t) => (
                  <option key={t} value={t} className="bg-neutral-900">{etiquetaRegistro(t)}</option>
                ))}
              </SelectField>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Equipamiento</label>
              <SelectField
                value={form.equipamiento_tipo}
                onChange={(e) => setForm((p) => ({ ...p, equipamiento_tipo: e.target.value }))}
              >
                {EQUIPAMIENTOS.map((t) => (
                  <option key={t} value={t} className="bg-neutral-900">{etiquetaEquipamiento(t)}</option>
                ))}
              </SelectField>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">URL imagen</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={2} />
              <input
                type="text"
                value={form.imagen_url}
                onChange={(e) => setForm((p) => ({ ...p, imagen_url: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="/ejercicios/imagenes/ejemplo.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">URL demo</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={2} />
              <input
                type="text"
                value={form.demo_url}
                onChange={(e) => setForm((p) => ({ ...p, demo_url: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Series por defecto</label>
              <input
                type="number"
                value={form.series_default}
                onChange={(e) => setForm((p) => ({ ...p, series_default: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                min="1"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Descanso default (s)</label>
              <input
                type="number"
                value={form.descanso_default_segundos}
                onChange={(e) => setForm((p) => ({ ...p, descanso_default_segundos: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                min="0"
              />
            </div>
          </div>

          {(form.tipo_registro === 'peso_reps' || form.tipo_registro === 'reps') && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Reps mín. default</label>
                <input
                  type="number"
                  value={form.reps_min_default}
                  onChange={(e) => setForm((p) => ({ ...p, reps_min_default: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Reps máx. default</label>
                <input
                  type="number"
                  value={form.reps_max_default}
                  onChange={(e) => setForm((p) => ({ ...p, reps_max_default: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                  min="0"
                />
              </div>
            </div>
          )}

          {(form.tipo_registro === 'duracion' || form.tipo_registro === 'distancia_duracion') && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Duración default (s)</label>
                <input
                  type="number"
                  value={form.duracion_default_segundos}
                  onChange={(e) => setForm((p) => ({ ...p, duracion_default_segundos: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                  min="0"
                />
              </div>
              {form.tipo_registro === 'distancia_duracion' && (
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Distancia default (m)</label>
                  <input
                    type="number"
                    value={form.distancia_default_metros}
                    onChange={(e) => setForm((p) => ({ ...p, distancia_default_metros: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    min="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Config auto */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-3">
              Configuración automática
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'usa_peso',         label: 'peso' },
                { key: 'usa_repeticiones', label: 'reps' },
                { key: 'usa_duracion',     label: 'duración' },
                { key: 'usa_distancia',    label: 'distancia' },
              ].map((item) => (
                <span
                  key={item.key}
                  className={`
                    text-[10px] font-medium px-2 py-1 rounded border uppercase tracking-wider
                    ${form[item.key]
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                      : 'bg-neutral-800 text-neutral-500 border-neutral-700'}
                  `}
                >
                  {item.label}: {form[item.key] ? 'sí' : 'no'}
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <Checkbox
              checked={form.activo}
              onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
              label="Ejercicio activo"
            />

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-5 rounded-lg transition-all"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2} />}
              {guardando ? 'Guardando...' : modo === 'crear' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}