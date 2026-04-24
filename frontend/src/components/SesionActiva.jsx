import { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, X, Check, SkipForward, ZoomIn, Trophy, Loader2, AlertCircle,
  Timer as TimerIcon, Save, Construction,
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

export default function SesionActiva({ idEntrenamiento, volverAMisRutinas }) {
  const [rutina, setRutina] = useState(null);
  const [idSesion, setIdSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [indiceEjercicio, setIndiceEjercicio] = useState(0);
  const [serieActual, setSerieActual] = useState(1);

  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');
  const [duracion, setDuracion] = useState('');
  const [distancia, setDistancia] = useState('');
  const [rpe, setRpe] = useState('8');

  const [notas, setNotas] = useState('');
  const [tiempoDescanso, setTiempoDescanso] = useState(0);
  const [descansando, setDescansando] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(false);

  const sesionIniciada = useRef(false);
  const idSesionRef = useRef(null);

  const manejarCambioRpe = (valor) => {
    if (valor === '') { setRpe(''); return; }
    if (!/^\d+$/.test(valor)) return;
    const numero = Number(valor);
    if (numero >= 1 && numero <= 10) setRpe(valor);
  };

  const manejarBlurRpe = () => {
    if (rpe === '') setRpe('8');
  };

  const limpiarCampos = () => {
    setPeso(''); setReps(''); setDuracion(''); setDistancia(''); setRpe('8');
  };

  useEffect(() => {
    const arrancarSesion = async () => {
      if (sesionIniciada.current) return;
      sesionIniciada.current = true;
      const token = localStorage.getItem('token');

      try {
        const resRutina = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${idEntrenamiento}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const datosRutina = await resRutina.json();
        setRutina(datosRutina);

        if (!resRutina.ok || datosRutina.error || !datosRutina.ejercicios || datosRutina.ejercicios.length === 0) {
          setCargando(false);
          return;
        }

        const resSesion = await fetch('http://127.0.0.1:5000/api/sesiones/iniciar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id_entrenamiento: idEntrenamiento }),
        });
        const datosSesion = await resSesion.json();
        setIdSesion(datosSesion.sesion.id_sesion);
        idSesionRef.current = datosSesion.sesion.id_sesion;
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    arrancarSesion();
  }, [idEntrenamiento]);

  useEffect(() => {
    let intervalo;
    if (descansando && tiempoDescanso > 0) {
      intervalo = setInterval(() => setTiempoDescanso((t) => t - 1), 1000);
    } else if (tiempoDescanso === 0 && descansando) {
      setDescansando(false);
    }
    return () => clearInterval(intervalo);
  }, [descansando, tiempoDescanso]);

  useEffect(() => {
    setImgError(false);
    setImagenAmpliada(false);
    limpiarCampos();
  }, [indiceEjercicio]);

  const avanzarProgreso = () => {
    const ejercicioActual = rutina.ejercicios[indiceEjercicio];
    if (serieActual < ejercicioActual.series_objetivo) {
      setSerieActual(serieActual + 1);
    } else {
      if (indiceEjercicio < rutina.ejercicios.length - 1) {
        setIndiceEjercicio(indiceEjercicio + 1);
        setSerieActual(1);
      } else {
        setIndiceEjercicio(rutina.ejercicios.length);
      }
    }
    limpiarCampos();
  };

  const registrarSerie = async () => {
    const token = localStorage.getItem('token');
    const ejercicioActual = rutina.ejercicios[indiceEjercicio];

    if (ejercicioActual.usa_peso && (peso === '' || Number(peso) < 0)) {
      alert('Introduce un peso válido.'); return;
    }
    if (ejercicioActual.usa_repeticiones && (reps === '' || Number(reps) <= 0)) {
      alert('Introduce unas repeticiones válidas.'); return;
    }
    if (ejercicioActual.usa_duracion && (duracion === '' || Number(duracion) <= 0)) {
      alert('Introduce una duración válida en segundos.'); return;
    }
    if (ejercicioActual.usa_distancia && (distancia === '' || Number(distancia) <= 0)) {
      alert('Introduce una distancia válida.'); return;
    }
    if (!rpe || Number(rpe) < 1 || Number(rpe) > 10) {
      alert('El RPE debe estar entre 1 y 10.'); return;
    }

    try {
      const respuesta = await fetch(`http://127.0.0.1:5000/api/sesiones/${idSesion}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id_ejercicio:      ejercicioActual.id_ejercicio,
          num_serie:         serieActual,
          peso_kg:           ejercicioActual.usa_peso         ? Number(peso)     : null,
          repeticiones:      ejercicioActual.usa_repeticiones ? Number(reps)     : null,
          duracion_segundos: ejercicioActual.usa_duracion     ? Number(duracion) : null,
          distancia_metros:  ejercicioActual.usa_distancia    ? Number(distancia): null,
          rpe_fatiga:        Number(rpe),
        }),
      });

      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        alert(data?.error || data?.detalle || 'No se pudo registrar la serie.');
        return;
      }

      setTiempoDescanso(ejercicioActual.tiempo_descanso_segundos || 0);
      setDescansando((ejercicioActual.tiempo_descanso_segundos || 0) > 0);
      avanzarProgreso();
    } catch (error) {
      console.error(error);
      alert('Error de conexión al registrar la serie.');
    }
  };

  const saltarSerie = () => avanzarProgreso();

  const salirSinGuardar = async () => {
    if (!window.confirm('¿Salir sin guardar? Perderás el progreso de esta sesión.')) return;
    const token = localStorage.getItem('token');
    const sesionId = idSesionRef.current;
    if (sesionId) {
      try {
        await fetch(`http://127.0.0.1:5000/api/sesiones/${sesionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Error al eliminar sesión:', error);
      }
    }
    volverAMisRutinas();
  };

  const finalizarEntrenamiento = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://127.0.0.1:5000/api/sesiones/${idSesion}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notas }),
      });
      volverAMisRutinas();
    } catch (error) {
      console.error(error);
    }
  };

  // ── ESTADOS ──────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="p-10 flex items-center justify-center text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Preparando tu sesión...
      </div>
    );
  }

  if (!rutina || rutina.error) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Algo salió mal</h2>
          <p className="text-neutral-400 text-sm mb-6">{rutina?.error || 'No se pudo cargar la rutina.'}</p>
          <button
            onClick={volverAMisRutinas}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Volver a mis rutinas
          </button>
        </div>
      </div>
    );
  }

  if (!rutina.ejercicios || rutina.ejercicios.length === 0) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-amber-500/30 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Construction className="w-5 h-5 text-amber-400" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Rutina vacía</h2>
          <p className="text-neutral-400 text-sm mb-6">Esta rutina no tiene ejercicios asignados.</p>
          <button
            onClick={salirSinGuardar}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium py-2.5 rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (indiceEjercicio >= rutina.ejercicios.length) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-emerald-500/30 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-emerald-400" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-1">¡Entrenamiento completado!</h2>
            <p className="text-neutral-400 text-sm">Añade tus notas finales y guarda la sesión.</p>
          </div>

          <textarea
            placeholder="Notas opcionales sobre tu sesión..."
            rows={4}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 mb-4 resize-none"
          />

          <button
            onClick={finalizarEntrenamiento}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" strokeWidth={2} />
            Guardar sesión
          </button>
        </div>
      </div>
    );
  }

  const ejercicio = rutina.ejercicios[indiceEjercicio];
  const progreso = (indiceEjercicio / rutina.ejercicios.length) * 100;

  return (
    <>
      <div className="p-4 lg:p-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">{rutina.nombre}</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ejercicio {indiceEjercicio + 1} de {rutina.ejercicios.length}
            </p>
          </div>

          <button
            onClick={salirSinGuardar}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <X className="w-4 h-4" strokeWidth={2} />
            Salir
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-neutral-900 border border-neutral-800 h-1.5 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>

        {descansando ? (
          /* ── DESCANSO ─────────────────────────── */
          <div className="bg-neutral-900 border border-sky-500/30 rounded-xl p-6 lg:p-10 text-center">
            <div className="flex items-center justify-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <TimerIcon className="w-4 h-4" strokeWidth={2} />
              Descanso
            </div>

            <div className="text-6xl font-semibold text-white tabular-nums mb-5">
              {Math.floor(tiempoDescanso / 60)}:{(tiempoDescanso % 60).toString().padStart(2, '0')}
            </div>

            <p className="text-sm text-neutral-400 mb-6">
              Próximo ejercicio: <span className="text-neutral-200 font-medium">{ejercicio.nombre}</span>
            </p>

            <button
              onClick={() => setDescansando(false)}
              className="flex items-center gap-2 bg-white text-neutral-900 font-medium px-5 py-2.5 rounded-lg mx-auto hover:bg-neutral-200 transition-colors"
            >
              <SkipForward className="w-4 h-4" strokeWidth={2} />
              Saltar descanso
            </button>
          </div>
        ) : (
          /* ── EJERCICIO ACTIVO ──────────────────── */
          <div className="flex flex-col gap-5">
            {/* Imagen / hero */}
            <div className="relative w-full h-56 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
              {ejercicio.imagen_url && !imgError ? (
                <>
                  <button
                    type="button"
                    onClick={() => setImagenAmpliada(true)}
                    className="w-full h-full cursor-zoom-in"
                    title="Pulsa para ampliar"
                  >
                    <img
                      src={ejercicio.imagen_url}
                      alt={ejercicio.nombre}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-5 py-4 pointer-events-none">
                    <h3 className="text-white text-xl font-semibold">{ejercicio.nombre}</h3>
                    {ejercicio.grupo_muscular && (
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border mt-1.5 ${colorGrupo(ejercicio.grupo_muscular)}`}>
                        {ejercicio.grupo_muscular}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-md pointer-events-none">
                    <ZoomIn className="w-3 h-3" strokeWidth={2.5} />
                    Ampliar
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Dumbbell className="w-8 h-8 text-neutral-600" strokeWidth={1.5} />
                  <h3 className="text-white font-semibold text-lg">{ejercicio.nombre}</h3>
                  {ejercicio.grupo_muscular && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${colorGrupo(ejercicio.grupo_muscular)}`}>
                      {ejercicio.grupo_muscular}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Panel de registro */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-sm font-semibold text-white">
                  Serie <span className="text-sky-400">{serieActual}</span>
                  <span className="text-neutral-500"> / {ejercicio.series_objetivo}</span>
                </h4>
                {ejercicio.tiempo_descanso_segundos > 0 && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <TimerIcon className="w-3.5 h-3.5" strokeWidth={2} />
                    Descanso: {ejercicio.tiempo_descanso_segundos}s
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {ejercicio.usa_peso && (
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 text-center font-semibold text-xl text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                  </div>
                )}

                {ejercicio.usa_repeticiones && (
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
                      Reps
                      {ejercicio.reps_objetivo_min && ejercicio.reps_objetivo_max && (
                        <span className="text-sky-400 ml-1 normal-case tracking-normal">
                          ({ejercicio.reps_objetivo_min}–{ejercicio.reps_objetivo_max})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 text-center font-semibold text-xl text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                  </div>
                )}

                {ejercicio.usa_duracion && (
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
                      Duración (s)
                      {ejercicio.duracion_objetivo_segundos && (
                        <span className="text-sky-400 ml-1 normal-case tracking-normal">
                          ({ejercicio.duracion_objetivo_segundos}s)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={duracion}
                      onChange={(e) => setDuracion(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 text-center font-semibold text-xl text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                  </div>
                )}

                {ejercicio.usa_distancia && (
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
                      Distancia (m)
                      {ejercicio.distancia_objetivo_metros && (
                        <span className="text-sky-400 ml-1 normal-case tracking-normal">
                          ({ejercicio.distancia_objetivo_metros}m)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={distancia}
                      onChange={(e) => setDistancia(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 text-center font-semibold text-xl text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
                    RPE <span className="text-neutral-600 normal-case tracking-normal">(1–10)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="8"
                    value={rpe}
                    onChange={(e) => manejarCambioRpe(e.target.value)}
                    onBlur={manejarBlurRpe}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 text-center font-semibold text-xl text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={registrarSerie}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium py-3 rounded-lg transition-all"
                >
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  Registrar serie
                </button>

                <button
                  onClick={saltarSerie}
                  className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium px-4 rounded-lg transition-colors"
                >
                  <SkipForward className="w-4 h-4" strokeWidth={2} />
                  Saltar
                </button>
              </div>
            </div>

            <textarea
              placeholder="Anotaciones de la sesión..."
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-300 placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 resize-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* Modal de imagen ampliada */}
      {imagenAmpliada && ejercicio.imagen_url && !imgError && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImagenAmpliada(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImagenAmpliada(false)}
              className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>

            <div className="flex items-center justify-center max-h-[90vh]">
              <img
                src={ejercicio.imagen_url}
                alt={ejercicio.nombre}
                className="w-full max-h-[90vh] object-contain"
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-6 py-6">
              <h3 className="text-white text-xl font-semibold">{ejercicio.nombre}</h3>
              {ejercicio.grupo_muscular && (
                <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border mt-1.5 ${colorGrupo(ejercicio.grupo_muscular)}`}>
                  {ejercicio.grupo_muscular}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}