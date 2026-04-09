import { useEffect, useState } from 'react';

export default function Historial() {
  const [sesiones, setSesiones] = useState([]);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [tipoFiltro, setTipoFiltro] = useState('mes');
  const [filtroValor, setFiltroValor] = useState('');

  useEffect(() => {
    const cargarHistorial = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://127.0.0.1:5000/api/sesiones/historial', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSesiones(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarHistorial();
  }, []);

  const verDetalle = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://127.0.0.1:5000/api/sesiones/${id}/detalle`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setSesionDetalle(await res.json());
  };

  const sesionesFiltradas = sesiones.filter(s => {
    if (!filtroValor) return true;

    const fechaLocal = new Date(s.fecha_inicio);
    const year = fechaLocal.getFullYear();
    const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const day = String(fechaLocal.getDate()).padStart(2, '0');

    if (tipoFiltro === 'dia') return `${year}-${month}-${day}` === filtroValor;
    if (tipoFiltro === 'mes') return `${year}-${month}` === filtroValor;
    if (tipoFiltro === 'anio') return `${year}` === filtroValor;
    return true;
  });

  const cambiarTipoFiltro = (nuevoTipo) => {
    setTipoFiltro(nuevoTipo);
    setFiltroValor('');
  };

  const formatearSerie = (serie) => {
    if (serie.usa_peso && serie.usa_repeticiones) {
      return `${serie.peso_kg} kg × ${serie.repeticiones} reps`;
    }

    const partes = [];

    if (serie.usa_repeticiones && serie.repeticiones != null) partes.push(`${serie.repeticiones} reps`);
    if (serie.usa_duracion && serie.duracion_segundos != null) partes.push(`${serie.duracion_segundos} s`);
    if (serie.usa_distancia && serie.distancia_metros != null) partes.push(`${serie.distancia_metros} m`);
    if (serie.usa_peso && serie.peso_kg != null) partes.push(`${serie.peso_kg} kg`);

    return partes.join(' • ');
  };

  if (cargando) return <div className="p-10 text-center animate-pulse">Cargando tu progreso... 📈</div>;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-extrabold text-gray-800">Historial de Entrenamientos 📚</h2>

      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm inline-flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button onClick={() => cambiarTipoFiltro('dia')} className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${tipoFiltro === 'dia' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Día</button>
          <button onClick={() => cambiarTipoFiltro('mes')} className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${tipoFiltro === 'mes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Mes</button>
          <button onClick={() => cambiarTipoFiltro('anio')} className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${tipoFiltro === 'anio' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Año</button>
        </div>

        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

        <div className="relative w-full md:w-auto flex-1 md:flex-none">
          {tipoFiltro === 'dia' && <input type="date" value={filtroValor} onChange={(e) => setFiltroValor(e.target.value)} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-4 pr-4 py-2 text-sm font-semibold text-gray-700 outline-none transition-all cursor-pointer" />}
          {tipoFiltro === 'mes' && <input type="month" value={filtroValor} onChange={(e) => setFiltroValor(e.target.value)} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-4 pr-4 py-2 text-sm font-semibold text-gray-700 outline-none transition-all cursor-pointer" />}
          {tipoFiltro === 'anio' && <input type="number" min="2020" max="2100" placeholder="Buscar por año..." value={filtroValor} onChange={(e) => setFiltroValor(e.target.value)} className="w-full md:w-48 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-4 pr-4 py-2 text-sm font-semibold text-gray-700 outline-none transition-all" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {sesionesFiltradas.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Sin resultados</h3>
              <p className="text-sm text-gray-500">No hemos encontrado entrenamientos para esta fecha.</p>
            </div>
          ) : (
            sesionesFiltradas.map(s => (
              <div
                key={s.id_sesion}
                onClick={() => verDetalle(s.id_sesion)}
                className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex flex-col mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600 group-hover:text-blue-600 transition-colors capitalize">
                      {new Date(s.fecha_inicio).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider flex-shrink-0 ml-2">
                      {s.duracion_minutos ? `${s.duracion_minutos} min` : '0 min'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-gray-400 mt-1">
                    {new Date(s.fecha_inicio).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-900">{s.nombre_rutina || 'Entrenamiento Libre'}</h3>
                {s.notas && <p className="text-sm text-gray-500 italic mt-3 border-l-2 border-blue-200 pl-3">"{s.notas}"</p>}
              </div>
            ))
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
          {sesionDetalle ? (
            <div>
              <h3 className="text-2xl font-black border-b border-gray-100 pb-4 mb-6 text-gray-800">Resumen del día</h3>
              <div className="space-y-6">
                {[...new Set(sesionDetalle.map(item => item.nombre_ejercicio))].map(nombreEj => (
                  <div key={nombreEj}>
                    <h4 className="font-bold text-blue-700 text-sm mb-3">{nombreEj}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {sesionDetalle.filter(d => d.nombre_ejercicio === nombreEj).map(serie => (
                        <div key={serie.id_serie} className="flex justify-between items-center bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                          <span className="font-bold text-gray-500 text-sm">Serie {serie.num_serie}</span>
                          <div className="text-right">
                            <span className="font-extrabold text-gray-900 text-lg">
                              {formatearSerie(serie)}
                            </span>
                            <span className="block text-xs font-bold text-gray-400 mt-0.5">RPE {serie.rpe_fatiga}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="font-medium text-center max-w-xs">Selecciona una sesión en la lista para ver el detalle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}