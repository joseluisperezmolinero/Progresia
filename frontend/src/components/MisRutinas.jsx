import { useEffect, useState } from 'react';
import {
  Dumbbell, Eye, Pencil, Trash2, Play, X, ImageOff, Loader2, Star,
  Repeat, Timer, Route, Target,
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

const formatearSegundos = (segundos) => {
  const total = Number(segundos || 0);
  if (!total) return '0 s';
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const describirObjetivos = (ejercicio) => {
  const partes = [];

  if (ejercicio.usa_repeticiones) {
    if (ejercicio.reps_objetivo_min && ejercicio.reps_objetivo_max) {
      partes.push(`${ejercicio.reps_objetivo_min}–${ejercicio.reps_objetivo_max} reps`);
    } else if (ejercicio.reps_objetivo_min) {
      partes.push(`mín. ${ejercicio.reps_objetivo_min} reps`);
    } else if (ejercicio.reps_objetivo_max) {
      partes.push(`máx. ${ejercicio.reps_objetivo_max} reps`);
    }
  }

  if (ejercicio.usa_duracion && ejercicio.duracion_objetivo_segundos) {
    partes.push(formatearSegundos(ejercicio.duracion_objetivo_segundos));
  }

  if (ejercicio.usa_distancia && ejercicio.distancia_objetivo_metros) {
    partes.push(`${ejercicio.distancia_objetivo_metros} m`);
  }

  return partes.length > 0 ? partes.join(' · ') : 'Objetivo libre';
};

export default function MisRutinas({ irAEntrenar, onEditar }) {
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [previewAbierta, setPreviewAbierta] = useState(false);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [rutinaPreview, setRutinaPreview] = useState(null);

  useEffect(() => {
    const cargarRutinas = async () => {
      const token = localStorage.getItem('token');
      try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/entrenamientos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const datos = await respuesta.json();
        if (respuesta.ok) setRutinas(datos);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarRutinas();
  }, []);

  const borrarRutina = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta rutina? Esta acción no se puede deshacer.')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setRutinas((prev) => prev.filter((r) => r.id_entrenamiento !== id));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || 'No se pudo eliminar la rutina.');
      }
    } catch (error) {
      console.error('Error al borrar rutina:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  const cerrarPreview = () => {
    setPreviewAbierta(false);
    setRutinaPreview(null);
  };

  const editarRutina = async (id) => {
    if (!onEditar) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        if (previewAbierta) cerrarPreview();
        onEditar(data);
      } else {
        alert(data?.error || 'No se pudo cargar la rutina.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor.');
    }
  };

  const abrirPreview = async (id) => {
    const token = localStorage.getItem('token');
    setPreviewAbierta(true);
    setCargandoPreview(true);
    setRutinaPreview(null);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok) setRutinaPreview(data);
      else        setRutinaPreview({ error: data?.error || 'No se pudo cargar la vista previa.' });
    } catch (error) {
      setRutinaPreview({ error: 'Error de conexión al cargar la rutina.' });
    } finally {
      setCargandoPreview(false);
    }
  };

  const comenzarEntrenamiento = () => {
    if (!rutinaPreview?.id_entrenamiento) return;
    const id = rutinaPreview.id_entrenamiento;
    cerrarPreview();
    irAEntrenar(id);
  };

  if (cargando) {
    return (
      <div className="p-10 flex items-center justify-center text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando tus rutinas...
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">Mis Rutinas</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Gestiona y entrena con tus rutinas guardadas.
        </p>
      </header>

      {rutinas.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-xl p-16 text-center">
          <div className="inline-flex w-12 h-12 items-center justify-center bg-neutral-800 rounded-lg mb-4">
            <Dumbbell className="w-5 h-5 text-neutral-500" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No tienes rutinas guardadas</h3>
          <p className="text-sm text-neutral-500">Crea tu primera rutina o genera un plan inteligente para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rutinas.map((rutina) => (
            <div
              key={rutina.id_entrenamiento}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-white leading-tight">{rutina.nombre}</h3>
                {rutina.es_predeterminado && (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-300 text-[11px] px-2 py-1 rounded-md font-medium uppercase tracking-wider border border-emerald-500/20">
                    <Star className="w-3 h-3" strokeWidth={2.5} />
                    Sugerida
                  </span>
                )}
              </div>

              <p className="text-neutral-500 text-sm mb-6">
                <span className="uppercase tracking-wider text-[11px] font-medium text-neutral-600">Objetivo</span>
                <span className="block text-neutral-300 mt-0.5 capitalize">{rutina.objetivo}</span>
              </p>

              <div className="mt-auto flex gap-2 flex-wrap">
                <button
                  onClick={() => abrirPreview(rutina.id_entrenamiento)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" strokeWidth={2} />
                  Ver
                </button>

                {!rutina.es_predeterminado && (
                  <>
                    <button
                      onClick={() => editarRutina(rutina.id_entrenamiento)}
                      className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
                      title="Editar rutina"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => borrarRutina(rutina.id_entrenamiento)}
                      className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-red-500/10 text-red-400 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL PREVIEW ─────────────────────────────────── */}
      {previewAbierta && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={cerrarPreview}
        >
          <div
            className="w-full max-w-3xl h-[85vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div>
                <h3 className="text-xl font-semibold text-white">Vista previa</h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Revisa el contenido antes de empezar.
                </p>
              </div>
              <button
                onClick={cerrarPreview}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cargandoPreview ? (
                <div className="text-center py-16 text-neutral-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Cargando vista previa...
                </div>
              ) : rutinaPreview?.error ? (
                <div className="text-center py-16">
                  <p className="text-red-400 font-medium mb-2">No se pudo cargar la rutina</p>
                  <p className="text-neutral-500 text-sm">{rutinaPreview.error}</p>
                </div>
              ) : rutinaPreview ? (
                <div className="flex flex-col gap-5">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                    <h4 className="text-xl font-semibold text-white">{rutinaPreview.nombre}</h4>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="text-neutral-500">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-600 mr-1.5">Objetivo</span>
                        <span className="text-neutral-300 capitalize">{rutinaPreview.objetivo}</span>
                      </span>
                      <span className="text-neutral-700">·</span>
                      <span className="text-sky-400 font-medium">
                        {rutinaPreview.ejercicios?.length || 0} ejercicios
                      </span>
                    </div>
                  </div>

                  {!rutinaPreview.ejercicios || rutinaPreview.ejercicios.length === 0 ? (
                    <div className="text-center py-10 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <p className="text-amber-300 font-medium">Esta rutina no tiene ejercicios.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rutinaPreview.ejercicios.map((ejercicio, index) => (
                        <div
                          key={`${ejercicio.id_ejercicio}-${index}`}
                          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex gap-4"
                        >
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0 border border-neutral-800">
                            {ejercicio.imagen_url ? (
                              <img
                                src={ejercicio.imagen_url}
                                alt={ejercicio.nombre}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                <ImageOff className="w-5 h-5" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-6 h-6 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <h5 className="text-base font-medium text-white truncate">{ejercicio.nombre}</h5>
                            </div>

                            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${colorGrupo(ejercicio.grupo_muscular)} mb-2`}>
                              {ejercicio.grupo_muscular}
                            </span>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Repeat className="w-3 h-3 text-neutral-500" strokeWidth={2} />
                                {ejercicio.series_objetivo} series
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3 text-neutral-500" strokeWidth={2} />
                                {formatearSegundos(ejercicio.tiempo_descanso_segundos)} descanso
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-neutral-500" strokeWidth={2} />
                                {describirObjetivos(ejercicio)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t border-neutral-800 p-5">
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cerrarPreview}
                  className="px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>

                {!rutinaPreview?.es_predeterminado && onEditar && rutinaPreview && (
                  <button
                    onClick={() => editarRutina(rutinaPreview.id_entrenamiento)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-sm font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={2} />
                    Editar
                  </button>
                )}

                <button
                  onClick={comenzarEntrenamiento}
                  disabled={!rutinaPreview || !!rutinaPreview.error || !rutinaPreview.ejercicios?.length}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  <Play className="w-4 h-4 fill-current" strokeWidth={2} />
                  Empezar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}