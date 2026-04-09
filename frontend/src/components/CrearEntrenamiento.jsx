import { useState, useEffect } from 'react';

const GRUPOS = ['Todos', 'Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Pierna', 'Core', 'Cardio'];

const formatearSegundos = (segundos) => {
  if (!segundos) return '';
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export default function CrearEntrenamiento({ volverAMisRutinas }) {
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const [nombreRutina, setNombreRutina] = useState('');
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);

  useEffect(() => {
    const cargarEjercicios = async () => {
      const token = localStorage.getItem('token');
      try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/ejercicios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const datos = await respuesta.json();
        if (respuesta.ok) {
          setEjercicios(Array.isArray(datos) ? datos.filter(e => e.activo !== false) : []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarEjercicios();
  }, []);

  const construirEjercicioSeleccionado = (ejercicio) => ({
    ...ejercicio,
    series: ejercicio.series_default ?? 3,
    descanso: ejercicio.descanso_default_segundos ?? 90,
    reps_objetivo_min: ejercicio.reps_min_default ?? '',
    reps_objetivo_max: ejercicio.reps_max_default ?? '',
    duracion_objetivo_segundos: ejercicio.duracion_default_segundos ?? '',
    distancia_objetivo_metros: ejercicio.distancia_default_metros ?? ''
  });

  const toggleEjercicio = (ejercicio) => {
    setEjerciciosSeleccionados(prev => {
      const yaExiste = prev.find(e => e.id_ejercicio === ejercicio.id_ejercicio);
      if (yaExiste) {
        return prev.filter(e => e.id_ejercicio !== ejercicio.id_ejercicio);
      }
      return [...prev, construirEjercicioSeleccionado(ejercicio)];
    });
  };

  const actualizarParametro = (id_ejercicio, campo, valor) => {
    setEjerciciosSeleccionados(prev =>
      prev.map(e =>
        e.id_ejercicio === id_ejercicio ? { ...e, [campo]: valor } : e
      )
    );
  };

  const guardarRutina = async () => {
    const token = localStorage.getItem('token');

    try {
      const payload = {
        nombre: nombreRutina.trim(),
        ejercicios: ejerciciosSeleccionados.map(e => ({
          id_ejercicio: e.id_ejercicio,
          series: Number(e.series),
          descanso: Number(e.descanso),
          reps_objetivo_min: e.usa_repeticiones ? (e.reps_objetivo_min === '' ? null : Number(e.reps_objetivo_min)) : null,
          reps_objetivo_max: e.usa_repeticiones ? (e.reps_objetivo_max === '' ? null : Number(e.reps_objetivo_max)) : null,
          duracion_objetivo_segundos: e.usa_duracion ? (e.duracion_objetivo_segundos === '' ? null : Number(e.duracion_objetivo_segundos)) : null,
          distancia_objetivo_metros: e.usa_distancia ? (e.distancia_objetivo_metros === '' ? null : Number(e.distancia_objetivo_metros)) : null
        }))
      };

      const respuesta = await fetch('http://127.0.0.1:5000/api/entrenamientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await respuesta.json().catch(() => null);

      if (respuesta.ok) {
        alert('¡Rutina guardada con éxito! 💪');
        volverAMisRutinas();
      } else {
        alert(data?.error || data?.detalle || 'Hubo un error al guardar.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  const ejerciciosFiltrados = ejercicios.filter(ej => {
    const coincideGrupo = filtroGrupo === 'Todos' || ej.grupo_muscular === filtroGrupo;
    const coincideBusqueda = ej.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideGrupo && coincideBusqueda;
  });

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

  const etiquetaRegistro = (tipo) => {
    const map = {
      peso_reps: 'Peso + reps',
      reps: 'Solo reps',
      duracion: 'Duración',
      distancia_duracion: 'Distancia + duración'
    };
    return map[tipo] || tipo;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Crear Nueva Rutina 📝</h2>
          <p className="text-gray-500 text-sm">Pon nombre, elige ejercicios y configura objetivos según el tipo de ejercicio.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Ej: Torso pesado"
            value={nombreRutina}
            onChange={(e) => setNombreRutina(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
          />
          <button
            onClick={guardarRutina}
            disabled={ejerciciosSeleccionados.length === 0 || nombreRutina.trim() === ''}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-6 rounded-lg transition-colors whitespace-nowrap shadow-md"
          >
            Guardar Rutina
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍 Buscar ejercicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 text-sm w-full sm:w-56"
        />

        <div className="flex flex-wrap gap-2">
          {GRUPOS.map(grupo => (
            <button
              key={grupo}
              onClick={() => setFiltroGrupo(grupo)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filtroGrupo === grupo
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {grupo}
            </button>
          ))}
        </div>
      </div>

      {ejerciciosSeleccionados.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-blue-600 font-black text-lg">{ejerciciosSeleccionados.length}</span>
          <span className="text-blue-700 font-medium text-sm">
            {ejerciciosSeleccionados.length === 1 ? 'ejercicio seleccionado' : 'ejercicios seleccionados'}
          </span>
        </div>
      )}

      {cargando ? (
        <div className="text-center py-10 text-gray-500 font-semibold animate-pulse">
          Cargando catálogo... ⏳
        </div>
      ) : (
        <>
          {ejerciciosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No hay ejercicios que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {ejerciciosFiltrados.map((ejercicio) => {
                const estaSeleccionado = ejerciciosSeleccionados.some(e => e.id_ejercicio === ejercicio.id_ejercicio);

                return (
                  <div
                    key={ejercicio.id_ejercicio}
                    onClick={() => toggleEjercicio(ejercicio)}
                    className={`relative rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      estaSeleccionado
                        ? 'ring-4 ring-blue-500 shadow-md transform scale-[0.98]'
                        : 'border border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    {estaSeleccionado && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 z-10 shadow-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    <div className="h-28 bg-gray-100 relative overflow-hidden">
                      {ejercicio.imagen_url ? (
                        <img
                          src={ejercicio.imagen_url}
                          alt={ejercicio.nombre}
                          className={`w-full h-full object-cover transition-opacity ${estaSeleccionado ? 'opacity-75' : ''}`}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">💪</div>
                      )}
                    </div>

                    <div className="p-3 bg-white">
                      <h3 className="font-bold text-gray-800 text-xs leading-tight mb-1.5">{ejercicio.nombre}</h3>
                      <div className="flex flex-wrap gap-1">
                        {ejercicio.grupo_muscular && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorGrupo(ejercicio.grupo_muscular)}`}>
                            {ejercicio.grupo_muscular}
                          </span>
                        )}
                        {ejercicio.tipo_registro && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {etiquetaRegistro(ejercicio.tipo_registro)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {ejerciciosSeleccionados.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">⚙️ Configura cada ejercicio</h3>

          <div className="flex flex-col gap-4">
            {ejerciciosSeleccionados.map((ej, index) => (
              <div key={ej.id_ejercicio} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-3 w-full md:w-1/3">
                    <div className="bg-blue-600 text-white font-black w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-sm block">{ej.nombre}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${colorGrupo(ej.grupo_muscular)}`}>
                          {ej.grupo_muscular}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          {etiquetaRegistro(ej.tipo_registro)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Series</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ej.series}
                        onChange={(e) => actualizarParametro(ej.id_ejercicio, 'series', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Descanso (seg)</label>
                      <input
                        type="number"
                        min="0"
                        value={ej.descanso}
                        onChange={(e) => actualizarParametro(ej.id_ejercicio, 'descanso', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {ej.usa_repeticiones && (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Reps mín.</label>
                          <input
                            type="number"
                            min="1"
                            value={ej.reps_objetivo_min}
                            onChange={(e) => actualizarParametro(ej.id_ejercicio, 'reps_objetivo_min', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Reps máx.</label>
                          <input
                            type="number"
                            min="1"
                            value={ej.reps_objetivo_max}
                            onChange={(e) => actualizarParametro(ej.id_ejercicio, 'reps_objetivo_max', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {ej.usa_duracion && (
                      <div>
                        <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Duración objetivo (seg)</label>
                        <input
                          type="number"
                          min="1"
                          value={ej.duracion_objetivo_segundos}
                          onChange={(e) => actualizarParametro(ej.id_ejercicio, 'duracion_objetivo_segundos', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {ej.duracion_objetivo_segundos && (
                          <p className="text-xs text-gray-400 mt-1">≈ {formatearSegundos(Number(ej.duracion_objetivo_segundos))}</p>
                        )}
                      </div>
                    )}

                    {ej.usa_distancia && (
                      <div>
                        <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Distancia objetivo (m)</label>
                        <input
                          type="number"
                          min="1"
                          value={ej.distancia_objetivo_metros}
                          onChange={(e) => actualizarParametro(ej.id_ejercicio, 'distancia_objetivo_metros', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:self-center">
                    <button
                      onClick={() => toggleEjercicio(ej)}
                      className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}