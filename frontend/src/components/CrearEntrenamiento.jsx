import { useState, useEffect } from 'react';
import {
  Search, Check, X, Save, Dumbbell, ImageOff, Loader2, Settings,
  Sparkles, Filter,
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

const GRUPOS = ['Todos', 'Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Pierna', 'Core', 'Cardio'];

const formatearSegundos = (segundos) => {
  if (!segundos) return '';
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const etiquetaRegistro = (tipo) => {
  const map = {
    peso_reps:          'Peso + reps',
    reps:               'Solo reps',
    duracion:           'Duración',
    distancia_duracion: 'Distancia + duración',
  };
  return map[tipo] || tipo;
};

export default function CrearEntrenamiento({
  volverAMisRutinas,
  rutinaAEditar = null,
  onGuardado = null,
}) {
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const [nombreRutina, setNombreRutina] = useState('');
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const esEdicion = Boolean(rutinaAEditar?.id_entrenamiento);

  useEffect(() => {
    const cargarEjercicios = async () => {
      const token = localStorage.getItem('token');
      try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/ejercicios', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const datos = await respuesta.json();
        if (respuesta.ok) {
          setEjercicios(Array.isArray(datos) ? datos.filter((e) => e.activo !== false) : []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarEjercicios();
  }, []);

  useEffect(() => {
    if (rutinaAEditar) {
      setNombreRutina(rutinaAEditar.nombre || '');
      setEjerciciosSeleccionados(
        (rutinaAEditar.ejercicios || []).map((ej) => ({
          ...ej,
          series:                     ej.series_objetivo ?? ej.series_default ?? 3,
          descanso:                   ej.tiempo_descanso_segundos ?? ej.descanso_default_segundos ?? 90,
          reps_objetivo_min:          ej.reps_objetivo_min ?? '',
          reps_objetivo_max:          ej.reps_objetivo_max ?? '',
          duracion_objetivo_segundos: ej.duracion_objetivo_segundos ?? '',
          distancia_objetivo_metros:  ej.distancia_objetivo_metros ?? '',
        })),
      );
    } else {
      setNombreRutina('');
      setEjerciciosSeleccionados([]);
    }
  }, [rutinaAEditar]);

  const construirEjercicioSeleccionado = (ejercicio) => ({
    ...ejercicio,
    series:                     ejercicio.series_default ?? 3,
    descanso:                   ejercicio.descanso_default_segundos ?? 90,
    reps_objetivo_min:          ejercicio.reps_min_default ?? '',
    reps_objetivo_max:          ejercicio.reps_max_default ?? '',
    duracion_objetivo_segundos: ejercicio.duracion_default_segundos ?? '',
    distancia_objetivo_metros:  ejercicio.distancia_default_metros ?? '',
  });

  const toggleEjercicio = (ejercicio) => {
    setEjerciciosSeleccionados((prev) => {
      const yaExiste = prev.find((e) => e.id_ejercicio === ejercicio.id_ejercicio);
      if (yaExiste) return prev.filter((e) => e.id_ejercicio !== ejercicio.id_ejercicio);
      return [...prev, construirEjercicioSeleccionado(ejercicio)];
    });
  };

  const actualizarParametro = (id_ejercicio, campo, valor) => {
    setEjerciciosSeleccionados((prev) =>
      prev.map((e) => (e.id_ejercicio === id_ejercicio ? { ...e, [campo]: valor } : e)),
    );
  };

  const guardarRutina = async () => {
    if (guardando) return;
    setGuardando(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        nombre: nombreRutina.trim(),
        ejercicios: ejerciciosSeleccionados.map((e) => ({
          id_ejercicio:               e.id_ejercicio,
          series:                     Number(e.series),
          descanso:                   Number(e.descanso),
          reps_objetivo_min:          e.usa_repeticiones ? (e.reps_objetivo_min === '' ? null : Number(e.reps_objetivo_min)) : null,
          reps_objetivo_max:          e.usa_repeticiones ? (e.reps_objetivo_max === '' ? null : Number(e.reps_objetivo_max)) : null,
          duracion_objetivo_segundos: e.usa_duracion     ? (e.duracion_objetivo_segundos === '' ? null : Number(e.duracion_objetivo_segundos)) : null,
          distancia_objetivo_metros:  e.usa_distancia    ? (e.distancia_objetivo_metros === '' ? null : Number(e.distancia_objetivo_metros)) : null,
        })),
      };

      const url = esEdicion
        ? `http://127.0.0.1:5000/api/entrenamientos/${rutinaAEditar.id_entrenamiento}`
        : 'http://127.0.0.1:5000/api/entrenamientos';
      const method = esEdicion ? 'PUT' : 'POST';

      const respuesta = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await respuesta.json().catch(() => null);

      if (respuesta.ok) {
        if (onGuardado) onGuardado();
        else volverAMisRutinas();
      } else {
        alert(data?.error || data?.detalle || 'No se pudo guardar.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const ejerciciosFiltrados = ejercicios.filter((ej) => {
    const coincideGrupo = filtroGrupo === 'Todos' || ej.grupo_muscular === filtroGrupo;
    const coincideBusqueda = ej.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideGrupo && coincideBusqueda;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {esEdicion ? 'Editar rutina' : 'Crear nueva rutina'}
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            {esEdicion
              ? 'Modifica ejercicios y objetivos de una rutina ya creada.'
              : 'Elige ejercicios del catálogo y configura series, descansos y objetivos.'}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Nombre de la rutina"
            value={nombreRutina}
            onChange={(e) => setNombreRutina(e.target.value)}
            className="flex-1 md:w-64 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
          <button
            onClick={guardarRutina}
            disabled={ejerciciosSeleccionados.length === 0 || nombreRutina.trim() === '' || guardando}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-5 rounded-lg transition-all whitespace-nowrap"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2} />}
            {esEdicion ? 'Guardar cambios' : 'Guardar rutina'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GRUPOS.map((grupo) => (
            <button
              key={grupo}
              onClick={() => setFiltroGrupo(grupo)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${filtroGrupo === grupo
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'}
              `}
            >
              {grupo}
            </button>
          ))}
        </div>
      </div>

      {ejerciciosSeleccionados.length > 0 && (
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg px-4 py-3 flex items-center gap-2 mb-6">
          <Check className="w-4 h-4 text-sky-400" strokeWidth={2.5} />
          <span className="text-sky-300 font-medium text-sm">
            <span className="font-semibold">{ejerciciosSeleccionados.length}</span>{' '}
            {ejerciciosSeleccionados.length === 1 ? 'ejercicio seleccionado' : 'ejercicios seleccionados'}
          </span>
        </div>
      )}

      {/* Catálogo */}
      {cargando ? (
        <div className="text-center py-16 text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando catálogo...
        </div>
      ) : ejerciciosFiltrados.length === 0 ? (
        <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-xl p-12 text-center">
          <Search className="w-6 h-6 text-neutral-600 mx-auto mb-3" strokeWidth={2} />
          <p className="text-neutral-400 text-sm">No hay ejercicios que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
          {ejerciciosFiltrados.map((ejercicio) => {
            const estaSeleccionado = ejerciciosSeleccionados.some((e) => e.id_ejercicio === ejercicio.id_ejercicio);

            return (
              <button
                key={ejercicio.id_ejercicio}
                onClick={() => toggleEjercicio(ejercicio)}
                className={`
                  relative text-left bg-neutral-900 rounded-xl overflow-hidden transition-all
                  ${estaSeleccionado
                    ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-neutral-950'
                    : 'border border-neutral-800 hover:border-neutral-700'}
                `}
              >
                {estaSeleccionado && (
                  <div className="absolute top-2 right-2 bg-sky-500 text-white rounded-full p-1 z-10">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                )}

                <div className="h-28 bg-neutral-950 relative overflow-hidden">
                  {ejercicio.imagen_url ? (
                    <img
                      src={ejercicio.imagen_url}
                      alt={ejercicio.nombre}
                      className={`w-full h-full object-cover transition-opacity ${estaSeleccionado ? 'opacity-60' : ''}`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <ImageOff className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-white text-xs leading-tight mb-2 line-clamp-2">
                    {ejercicio.nombre}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {ejercicio.grupo_muscular && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorGrupo(ejercicio.grupo_muscular)}`}>
                        {ejercicio.grupo_muscular}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Configuración */}
      {ejerciciosSeleccionados.length > 0 && (
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4 text-sky-400" strokeWidth={2} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Configura cada ejercicio
            </h3>
          </div>

          <div className="space-y-3">
            {ejerciciosSeleccionados.map((ej, index) => (
              <div key={ej.id_ejercicio} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Nombre y grupo */}
                  <div className="flex items-center gap-3 lg:w-56 flex-shrink-0">
                    <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 font-semibold flex items-center justify-center text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="text-white font-medium text-sm block truncate">{ej.nombre}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorGrupo(ej.grupo_muscular)}`}>
                          {ej.grupo_muscular}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {etiquetaRegistro(ej.tipo_registro)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Series</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ej.series}
                        onChange={(e) => actualizarParametro(ej.id_ejercicio, 'series', e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Descanso (s)</label>
                      <input
                        type="number"
                        min="0"
                        value={ej.descanso}
                        onChange={(e) => actualizarParametro(ej.id_ejercicio, 'descanso', e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                    </div>

                    {ej.usa_repeticiones && (
                      <>
                        <div>
                          <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Reps mín</label>
                          <input
                            type="number"
                            min="1"
                            value={ej.reps_objetivo_min}
                            onChange={(e) => actualizarParametro(ej.id_ejercicio, 'reps_objetivo_min', e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Reps máx</label>
                          <input
                            type="number"
                            min="1"
                            value={ej.reps_objetivo_max}
                            onChange={(e) => actualizarParametro(ej.id_ejercicio, 'reps_objetivo_max', e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                          />
                        </div>
                      </>
                    )}

                    {ej.usa_duracion && (
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Duración (s)</label>
                        <input
                          type="number"
                          min="1"
                          value={ej.duracion_objetivo_segundos}
                          onChange={(e) => actualizarParametro(ej.id_ejercicio, 'duracion_objetivo_segundos', e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                        {ej.duracion_objetivo_segundos && (
                          <p className="text-[10px] text-neutral-500 mt-1">≈ {formatearSegundos(Number(ej.duracion_objetivo_segundos))}</p>
                        )}
                      </div>
                    )}

                    {ej.usa_distancia && (
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500 mb-1">Distancia (m)</label>
                        <input
                          type="number"
                          min="1"
                          value={ej.distancia_objetivo_metros}
                          onChange={(e) => actualizarParametro(ej.id_ejercicio, 'distancia_objetivo_metros', e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleEjercicio(ej)}
                    className="flex items-center justify-center gap-1 text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-2 rounded-md text-xs font-medium transition-colors lg:self-center flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}