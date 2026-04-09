import { useState, useEffect, useRef } from 'react';

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

  const sesionIniciada = useRef(false);
  const idSesionRef = useRef(null);

  const manejarCambioRpe = (valor) => {
    if (valor === '') {
      setRpe('');
      return;
    }

    if (!/^\d+$/.test(valor)) return;

    const numero = Number(valor);
    if (numero >= 1 && numero <= 10) {
      setRpe(valor);
    }
  };

  const manejarBlurRpe = () => {
    if (rpe === '') setRpe('8');
  };

  const limpiarCampos = () => {
    setPeso('');
    setReps('');
    setDuracion('');
    setDistancia('');
    setRpe('8');
  };

  useEffect(() => {
    const arrancarSesion = async () => {
      if (sesionIniciada.current) return;
      sesionIniciada.current = true;

      const token = localStorage.getItem('token');

      try {
        const resRutina = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${idEntrenamiento}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const datosRutina = await resRutina.json();
        setRutina(datosRutina);

        if (!resRutina.ok || datosRutina.error || !datosRutina.ejercicios || datosRutina.ejercicios.length === 0) {
          setCargando(false);
          return;
        }

        const resSesion = await fetch('http://127.0.0.1:5000/api/sesiones/iniciar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id_entrenamiento: idEntrenamiento })
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
      alert('Introduce un peso válido.');
      return;
    }

    if (ejercicioActual.usa_repeticiones && (reps === '' || Number(reps) <= 0)) {
      alert('Introduce unas repeticiones válidas.');
      return;
    }

    if (ejercicioActual.usa_duracion && (duracion === '' || Number(duracion) <= 0)) {
      alert('Introduce una duración válida en segundos.');
      return;
    }

    if (ejercicioActual.usa_distancia && (distancia === '' || Number(distancia) <= 0)) {
      alert('Introduce una distancia válida.');
      return;
    }

    if (!rpe || Number(rpe) < 1 || Number(rpe) > 10) {
      alert('El RPE debe estar entre 1 y 10.');
      return;
    }

    try {
      const respuesta = await fetch(`http://127.0.0.1:5000/api/sesiones/${idSesion}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id_ejercicio: ejercicioActual.id_ejercicio,
          num_serie: serieActual,
          peso_kg: ejercicioActual.usa_peso ? Number(peso) : null,
          repeticiones: ejercicioActual.usa_repeticiones ? Number(reps) : null,
          duracion_segundos: ejercicioActual.usa_duracion ? Number(duracion) : null,
          distancia_metros: ejercicioActual.usa_distancia ? Number(distancia) : null,
          rpe_fatiga: Number(rpe)
        })
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

  const saltarSerie = () => {
    avanzarProgreso();
  };

  const salirSinGuardar = async () => {
    const confirmar = window.confirm('¿Seguro que quieres salir? No se guardará ningún progreso de esta sesión.');
    if (!confirmar) return;

    const token = localStorage.getItem('token');
    const sesionId = idSesionRef.current;

    if (sesionId) {
      try {
        await fetch(`http://127.0.0.1:5000/api/sesiones/${sesionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notas })
      });

      alert('¡Entrenamiento guardado! 💪');
      volverAMisRutinas();
    } catch (error) {
      console.error(error);
    }
  };

  if (cargando) {
    return <div className="p-10 text-center font-bold text-gray-500 animate-pulse">Entrando en el gimnasio... ⏳</div>;
  }

  if (!rutina || rutina.error) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center max-w-lg mx-auto mt-10">
        <h2 className="text-2xl font-black text-red-500 mb-2">¡Ups! Algo salió mal</h2>
        <p className="text-gray-500 font-medium mb-6">{rutina?.error || 'No hemos podido cargar la rutina.'}</p>
        <button onClick={volverAMisRutinas} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl w-full">
          Volver a mis rutinas
        </button>
      </div>
    );
  }

  if (!rutina.ejercicios || rutina.ejercicios.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-yellow-200 text-center max-w-lg mx-auto mt-10">
        <span className="text-6xl mb-4 block opacity-80">🚧</span>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Rutina Vacía</h2>
        <p className="text-gray-500 font-medium mb-8">
          Esta rutina no tiene ningún ejercicio asignado.
        </p>
        <button onClick={salirSinGuardar} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl w-full shadow-sm">
          Cancelar y Volver
        </button>
      </div>
    );
  }

  if (indiceEjercicio >= rutina.ejercicios.length) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-green-200 text-center max-w-lg mx-auto">
        <h2 className="text-3xl font-extrabold mb-4">🏆 ¡Fin del entreno!</h2>
        <textarea
          placeholder="Notas finales"
          className="w-full border p-3 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-blue-500"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        <button onClick={finalizarEntrenamiento} className="bg-green-600 w-full text-white font-bold py-3 rounded-xl">
          Guardar Todo
        </button>
      </div>
    );
  }

  const ejercicio = rutina.ejercicios[indiceEjercicio];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{rutina.nombre}</h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            Ejercicio {indiceEjercicio + 1} de {rutina.ejercicios.length}
          </p>
        </div>

        <button
          onClick={salirSinGuardar}
          className="text-red-500 hover:text-red-700 font-bold border border-red-200 hover:border-red-400 hover:bg-red-50 px-4 py-2 rounded-xl transition-all text-sm"
        >
          Salir ✕
        </button>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(indiceEjercicio / rutina.ejercicios.length) * 100}%` }}
        />
      </div>

      {descansando ? (
        <div className="text-center py-10 bg-blue-50 rounded-xl">
          <p className="text-gray-500 font-bold mb-2 uppercase text-xs tracking-widest">Descanso</p>
          <div className="text-6xl font-black text-blue-600 mb-4">
            {Math.floor(tiempoDescanso / 60)}:{(tiempoDescanso % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Próximo: <span className="font-bold text-gray-600">{ejercicio.nombre}</span>
          </p>
          <button onClick={() => setDescansando(false)} className="mt-2 bg-blue-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            Saltar descanso ⏭️
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
            {ejercicio.imagen_url && !imgError ? (
              <>
                <img
                  src={ejercicio.imagen_url}
                  alt={ejercicio.nombre}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
                  <h3 className="text-white text-xl font-black">{ejercicio.nombre}</h3>
                  {ejercicio.grupo_muscular && (
                    <span className="text-white/70 text-xs font-bold uppercase tracking-widest">{ejercicio.grupo_muscular}</span>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <span className="text-5xl">💪</span>
                <h3 className="text-gray-700 font-black text-xl">{ejercicio.nombre}</h3>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h4 className="font-black text-gray-800 mb-5 text-lg">
              Serie <span className="text-blue-600">{serieActual}</span> / {ejercicio.series_objetivo}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {ejercicio.usa_peso && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">Peso (kg)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="border border-gray-200 p-3 rounded-xl text-center font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              )}

              {ejercicio.usa_repeticiones && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Reps {ejercicio.reps_objetivo_min && ejercicio.reps_objetivo_max ? `(${ejercicio.reps_objetivo_min}-${ejercicio.reps_objetivo_max})` : ''}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="border border-gray-200 p-3 rounded-xl text-center font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              )}

              {ejercicio.usa_duracion && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Duración (seg) {ejercicio.duracion_objetivo_segundos ? `(${ejercicio.duracion_objetivo_segundos}s)` : ''}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    className="border border-gray-200 p-3 rounded-xl text-center font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              )}

              {ejercicio.usa_distancia && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">
                    Distancia (m) {ejercicio.distancia_objetivo_metros ? `(${ejercicio.distancia_objetivo_metros}m)` : ''}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={distancia}
                    onChange={(e) => setDistancia(e.target.value)}
                    className="border border-gray-200 p-3 rounded-xl text-center font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-bold uppercase">RPE (1-10)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="8"
                  value={rpe}
                  onChange={(e) => manejarCambioRpe(e.target.value)}
                  onBlur={manejarBlurRpe}
                  className="border border-gray-200 p-3 rounded-xl text-center font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={registrarSerie}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-colors shadow-sm"
              >
                ✓ Registrar Serie
              </button>

              <button
                onClick={saltarSerie}
                className="bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold px-5 rounded-xl transition-colors"
              >
                Saltar
              </button>
            </div>
          </div>

          <textarea
            placeholder="Anotaciones de la sesión"
            className="w-full border border-gray-200 p-3 rounded-xl text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}