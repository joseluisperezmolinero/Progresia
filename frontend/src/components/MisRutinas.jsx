import { useEffect, useState } from 'react';

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
      partes.push(`${ejercicio.reps_objetivo_min}-${ejercicio.reps_objetivo_max} reps`);
    } else if (ejercicio.reps_objetivo_min) {
      partes.push(`mín. ${ejercicio.reps_objetivo_min} reps`);
    } else if (ejercicio.reps_objetivo_max) {
      partes.push(`máx. ${ejercicio.reps_objetivo_max} reps`);
    }
  }

  if (ejercicio.usa_duracion && ejercicio.duracion_objetivo_segundos) {
    partes.push(`${formatearSegundos(ejercicio.duracion_objetivo_segundos)}`);
  }

  if (ejercicio.usa_distancia && ejercicio.distancia_objetivo_metros) {
    partes.push(`${ejercicio.distancia_objetivo_metros} m`);
  }

  return partes.length > 0 ? partes.join(' • ') : 'Objetivo libre';
};

const colorGrupo = (grupo) => {
  const map = {
    'Pecho': 'bg-blue-100 text-blue-700',
    'Espalda': 'bg-indigo-100 text-indigo-700',
    'Hombro': 'bg-purple-100 text-purple-700',
    'Bíceps': 'bg-orange-100 text-orange-700',
    'Tríceps': 'bg-red-100 text-red-700',
    'Pierna': 'bg-green-100 text-green-700',
    'Core': 'bg-yellow-100 text-yellow-700',
    'Cardio': 'bg-pink-100 text-pink-700',
  };
  return map[grupo] || 'bg-gray-100 text-gray-600';
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
          headers: { Authorization: `Bearer ${token}` }
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
    const confirmar = window.confirm('🚨 ¿Seguro que quieres borrar esta rutina?');
    if (!confirmar) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setRutinas(prev => prev.filter(r => r.id_entrenamiento !== id));
        alert('Rutina eliminada correctamente 🗑️');
      } else {
        alert(data?.error || data?.detalle || 'No se pudo borrar la rutina.');
        console.error('Error al borrar rutina:', data);
      }
    } catch (error) {
      console.error('Error de conexión al borrar rutina:', error);
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
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        if (previewAbierta) cerrarPreview();
        onEditar(data);
      } else {
        alert(data?.error || data?.detalle || 'No se pudo cargar la rutina para editar.');
      }
    } catch (error) {
      console.error('Error al cargar rutina para editar:', error);
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
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setRutinaPreview(data);
      } else {
        setRutinaPreview({ error: data?.error || data?.detalle || 'No se pudo cargar la vista previa.' });
      }
    } catch (error) {
      console.error('Error al cargar preview:', error);
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
    return <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Cargando tus rutinas... ⏳</div>;
  }

  return (
    <>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[60vh]">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Mis Rutinas 📋</h2>

        {rutinas.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">Aún no tienes rutinas guardadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rutinas.map((rutina) => (
              <div
                key={rutina.id_entrenamiento}
                className="border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all bg-white flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-800">{rutina.nombre}</h3>
                  {rutina.es_predeterminado && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">
                      Sugerida
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm font-medium mb-6">
                  Objetivo: <span className="text-gray-700">{rutina.objetivo}</span>
                </p>

                <div className="mt-auto flex gap-2 flex-wrap">
                  <button
                    onClick={() => abrirPreview(rutina.id_entrenamiento)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 rounded-lg transition-colors"
                  >
                    Ver rutina
                  </button>

                  {!rutina.es_predeterminado && (
                    <button
                      onClick={() => editarRutina(rutina.id_entrenamiento)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2.5 px-4 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                  )}

                  {!rutina.es_predeterminado && (
                    <button
                      onClick={() => borrarRutina(rutina.id_entrenamiento)}
                      className="px-4 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-lg transition-colors"
                      title="Eliminar rutina"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewAbierta && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={cerrarPreview}
        >
          <div
            className="w-full max-w-4xl h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Vista previa de la rutina</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Comprueba el contenido antes de empezar a entrenar.
                </p>
              </div>

              <button
                onClick={cerrarPreview}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold px-3"
              >
                ×
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
              {cargandoPreview ? (
                <div className="text-center py-14 text-gray-500 font-bold animate-pulse">
                  Cargando vista previa... ⏳
                </div>
              ) : rutinaPreview?.error ? (
                <div className="text-center py-14">
                  <p className="text-red-500 font-bold mb-2">No se pudo cargar la rutina</p>
                  <p className="text-gray-500">{rutinaPreview.error}</p>
                </div>
              ) : rutinaPreview ? (
                <div className="flex flex-col gap-6">
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                    <h4 className="text-2xl font-black text-gray-900">{rutinaPreview.nombre}</h4>
                    <p className="text-gray-500 mt-1">
                      Objetivo: <span className="text-gray-700 font-medium">{rutinaPreview.objetivo}</span>
                    </p>
                    <p className="text-sm text-blue-600 font-bold mt-3">
                      {rutinaPreview.ejercicios?.length || 0} ejercicios en esta rutina
                    </p>
                  </div>

                  {!rutinaPreview.ejercicios || rutinaPreview.ejercicios.length === 0 ? (
                    <div className="text-center py-10 bg-yellow-50 border border-yellow-200 rounded-2xl">
                      <p className="text-yellow-700 font-bold">Esta rutina no tiene ejercicios.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pr-1">
                      {rutinaPreview.ejercicios.map((ejercicio, index) => (
                        <div
                          key={`${ejercicio.id_ejercicio}-${index}`}
                          className="border border-gray-200 rounded-2xl p-4 bg-white"
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              {ejercicio.imagen_url ? (
                                <img
                                  src={ejercicio.imagen_url}
                                  alt={ejercicio.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                                  💪
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <h5 className="text-lg font-black text-gray-900">{ejercicio.nombre}</h5>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${colorGrupo(ejercicio.grupo_muscular)}`}>
                                  {ejercicio.grupo_muscular}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-bold text-gray-800">Series:</span> {ejercicio.series_objetivo}</p>
                                <p><span className="font-bold text-gray-800">Descanso:</span> {formatearSegundos(ejercicio.tiempo_descanso_segundos)}</p>
                                <p><span className="font-bold text-gray-800">Objetivo:</span> {describirObjetivos(ejercicio)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white p-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={cerrarPreview}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                >
                  Cancelar
                </button>

                {!rutinaPreview?.es_predeterminado && onEditar && (
                  <button
                    onClick={() => editarRutina(rutinaPreview.id_entrenamiento)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition-colors"
                  >
                    Editar rutina
                  </button>
                )}

                <button
                  onClick={comenzarEntrenamiento}
                  disabled={!rutinaPreview || !!rutinaPreview.error || !rutinaPreview.ejercicios?.length}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-black transition-colors"
                >
                  Comenzar entrenamiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}