import { useEffect, useState } from 'react';
import { Calendar, Clock, Inbox, Loader2, FileText } from 'lucide-react';

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
          headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
    });
    setSesionDetalle(await res.json());
  };

  const sesionesFiltradas = sesiones.filter((s) => {
    if (!filtroValor) return true;
    const fechaLocal = new Date(s.fecha_inicio);
    const year = fechaLocal.getFullYear();
    const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const day = String(fechaLocal.getDate()).padStart(2, '0');

    if (tipoFiltro === 'dia')  return `${year}-${month}-${day}` === filtroValor;
    if (tipoFiltro === 'mes')  return `${year}-${month}` === filtroValor;
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
    return partes.join(' · ');
  };

  if (cargando) {
    return (
      <div className="p-10 flex items-center justify-center text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando historial...
      </div>
    );
  }

  const PillBtn = ({ active, children, onClick }) => (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-xs font-medium rounded-md transition-all
        ${active
          ? 'bg-white text-neutral-900'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
        }
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Historial</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Revisa todos tus entrenamientos completados.
        </p>
      </header>

      {/* Filtros */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 mb-6 inline-flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
        <div className="flex bg-neutral-950 p-1 rounded-lg">
          <PillBtn active={tipoFiltro === 'dia'}  onClick={() => cambiarTipoFiltro('dia')}>Día</PillBtn>
          <PillBtn active={tipoFiltro === 'mes'}  onClick={() => cambiarTipoFiltro('mes')}>Mes</PillBtn>
          <PillBtn active={tipoFiltro === 'anio'} onClick={() => cambiarTipoFiltro('anio')}>Año</PillBtn>
        </div>

        <div className="h-px md:h-7 w-full md:w-px bg-neutral-800" />

        <div className="relative flex-1 md:flex-none">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
          {tipoFiltro === 'dia' && (
            <input
              type="date"
              value={filtroValor}
              onChange={(e) => setFiltroValor(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          )}
          {tipoFiltro === 'mes' && (
            <input
              type="month"
              value={filtroValor}
              onChange={(e) => setFiltroValor(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          )}
          {tipoFiltro === 'anio' && (
            <input
              type="number"
              min="2020"
              max="2100"
              placeholder="Buscar por año"
              value={filtroValor}
              onChange={(e) => setFiltroValor(e.target.value)}
              className="w-full md:w-48 bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {sesionesFiltradas.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-xl p-12 text-center">
              <div className="inline-flex w-10 h-10 items-center justify-center bg-neutral-800 rounded-lg mb-3">
                <Inbox className="w-4 h-4 text-neutral-500" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Sin resultados</h3>
              <p className="text-xs text-neutral-500">No hemos encontrado entrenamientos para esta fecha.</p>
            </div>
          ) : (
            sesionesFiltradas.map((s) => {
              const activa = sesionDetalle && sesionDetalle[0]?.id_sesion === s.id_sesion;
              return (
                <button
                  key={s.id_sesion}
                  onClick={() => verDetalle(s.id_sesion)}
                  className={`
                    w-full text-left bg-neutral-900 border rounded-xl p-5 transition-all
                    ${activa ? 'border-sky-500/40' : 'border-neutral-800 hover:border-neutral-700'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-neutral-400 capitalize">
                      {new Date(s.fecha_inicio).toLocaleDateString(undefined, {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] bg-sky-500/10 text-sky-300 px-2 py-1 rounded-md font-medium border border-sky-500/20">
                      <Clock className="w-3 h-3" strokeWidth={2.5} />
                      {s.duracion_minutos ? `${s.duracion_minutos} min` : '0 min'}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {s.nombre_rutina || 'Entrenamiento libre'}
                  </h3>

                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(s.fecha_inicio).toLocaleTimeString(undefined, {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>

                  {s.notas && (
                    <p className="text-xs text-neutral-400 italic mt-3 border-l-2 border-sky-500/30 pl-3">
                      {s.notas}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detalle */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 min-h-[400px] sticky top-0 self-start">
          {sesionDetalle ? (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-4 h-4 text-sky-400" strokeWidth={2} />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                  Resumen de la sesión
                </h3>
              </div>

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                {[...new Set(sesionDetalle.map((i) => i.nombre_ejercicio))].map((nombreEj) => (
                  <div key={nombreEj}>
                    <h4 className="font-medium text-sky-400 text-sm mb-2">{nombreEj}</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {sesionDetalle.filter((d) => d.nombre_ejercicio === nombreEj).map((serie) => (
                        <div
                          key={serie.id_serie}
                          className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-800"
                        >
                          <span className="text-xs font-medium text-neutral-500">Serie {serie.num_serie}</span>
                          <div className="text-right">
                            <span className="font-semibold text-white text-sm">
                              {formatearSerie(serie)}
                            </span>
                            {serie.rpe_fatiga && (
                              <span className="block text-[11px] font-medium text-neutral-500 mt-0.5">
                                RPE {serie.rpe_fatiga}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4 text-neutral-600" strokeWidth={2} />
              </div>
              <p className="text-sm max-w-xs">Selecciona una sesión de la lista para ver su detalle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}