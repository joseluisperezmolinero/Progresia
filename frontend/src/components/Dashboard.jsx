import { useEffect, useState } from 'react';
import CrearEntrenamiento from './CrearEntrenamiento';
import MisRutinas from './MisRutinas';
import SesionActiva from './SesionActiva';
import Historial from './Historial';
import Metricas from './Metricas';
import { CONSEJOS_FITNESS } from '../utils/tipsFitness';

const formatearDuracion = (segundos) => {
  const total = Number(segundos || 0);
  if (!total) return '0 s';
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins} min ${secs}s` : `${secs} s`;
};

const formatearDistancia = (metros) => {
  const total = Number(metros || 0);
  if (!total) return '0 m';
  if (total >= 1000) return `${(total / 1000).toFixed(2)} km`;
  return `${Math.round(total)} m`;
};

const elegirSerieParaReto = (detalle) => {
  if (!Array.isArray(detalle) || detalle.length === 0) return null;

  const puntuacion = (serie) => {
    const rpe = Number(serie.rpe_fatiga || 0);

    switch (serie.tipo_registro) {
      case 'peso_reps':
        return rpe * 100000 + Number(serie.peso_kg || 0) * 100 + Number(serie.repeticiones || 0);
      case 'distancia_duracion':
        return rpe * 100000 + Number(serie.distancia_metros || 0) * 10 + Number(serie.duracion_segundos || 0);
      case 'duracion':
        return rpe * 100000 + Number(serie.duracion_segundos || 0);
      case 'reps':
      default:
        return rpe * 100000 + Number(serie.repeticiones || 0);
    }
  };

  return [...detalle].sort((a, b) => puntuacion(b) - puntuacion(a))[0];
};

const generarSugerenciaReto = (serie) => {
  if (!serie) return null;

  const tipo = serie.tipo_registro;
  const grupo = serie.grupo_muscular;
  const nombreEj = serie.nombre_ejercicio;
  const peso = Number(serie.peso_kg || 0);
  const reps = Number(serie.repeticiones || 0);
  const duracion = Number(serie.duracion_segundos || 0);
  const distancia = Number(serie.distancia_metros || 0);
  const rpe = Number(serie.rpe_fatiga || 0);

  let sugerencia = '';

  if (tipo === 'peso_reps') {
    if (rpe <= 8 && reps >= 8) {
      sugerencia = `¡Fuiste sobrado la última vez! Sube el peso a ${(peso + 2.5).toFixed(1)} kg para seguir progresando.`;
    } else if (rpe >= 9 && reps < 8) {
      sugerencia = `Te costó bastante mover ${peso.toFixed(1)} kg. Mantén el peso o bájalo un poco para asegurar técnica y rango completo.`;
    } else {
      sugerencia = `Buen trabajo con ${peso.toFixed(1)} kg. Mantén el mismo peso e intenta sacar al menos una repetición más.`;
    }
    return { ejercicio: nombreEj, sugerencia };
  }

  if (tipo === 'reps') {
    if (grupo === 'Core') {
      if (rpe <= 7 && reps >= 15) {
        sugerencia = `Vas muy sólido en ${nombreEj}. La próxima vez intenta sacar 2-4 repeticiones más o hacerlas con más control y una pequeña pausa al final de cada repetición.`;
      } else if (rpe >= 9) {
        sugerencia = `En ${nombreEj} fuiste muy al límite. Mantén el mismo objetivo de repeticiones y céntrate en la técnica y el control del movimiento.`;
      } else {
        sugerencia = `Buen trabajo en ${nombreEj}. Intenta añadir 1-2 repeticiones más manteniendo buena técnica.`;
      }
      return { ejercicio: nombreEj, sugerencia };
    }

    if (grupo === 'Cardio') {
      if (rpe <= 7 && reps >= 20) {
        sugerencia = `Te vi con margen en ${nombreEj}. La próxima vez intenta aumentar un poco el volumen: 3-5 repeticiones más o el mismo trabajo con menos descanso.`;
      } else if (rpe >= 9) {
        sugerencia = `En ${nombreEj} el esfuerzo fue alto. Repite una marca parecida antes de subir más, buscando mejor ritmo y recuperación.`;
      } else {
        sugerencia = `Buen trabajo en ${nombreEj}. La siguiente sesión intenta mejorar un poco el rendimiento: 2-3 repeticiones más o un ritmo algo más constante.`;
      }
      return { ejercicio: nombreEj, sugerencia };
    }

    if (rpe <= 7 && reps >= 12) {
      sugerencia = `Tienes margen en ${nombreEj}. La próxima vez intenta añadir 1-3 repeticiones manteniendo una técnica limpia.`;
    } else if (rpe >= 9) {
      sugerencia = `En ${nombreEj} fuiste bastante al límite. Repite una marca parecida antes de progresar más.`;
    } else {
      sugerencia = `Buen trabajo en ${nombreEj}. Intenta mejorar ligeramente tu marca la próxima vez con 1-2 repeticiones extra.`;
    }

    return { ejercicio: nombreEj, sugerencia };
  }

  if (tipo === 'duracion') {
    const aumento = duracion < 60 ? 10 : duracion < 180 ? 15 : 30;

    if (grupo === 'Core') {
      if (rpe <= 7) {
        sugerencia = `Buen control en ${nombreEj}. La próxima vez intenta aguantar ${formatearDuracion(duracion + aumento)} manteniendo la postura firme.`;
      } else if (rpe >= 9) {
        sugerencia = `En ${nombreEj} fuiste al límite. Repite unos ${formatearDuracion(duracion)} y céntrate en braceo, respiración y técnica.`;
      } else {
        sugerencia = `Buen trabajo en ${nombreEj}. Intenta sumar ${aumento} segundos más en la próxima sesión.`;
      }
      return { ejercicio: nombreEj, sugerencia };
    }

    if (grupo === 'Cardio') {
      if (rpe <= 7) {
        sugerencia = `Tienes margen en ${nombreEj}. La próxima vez aumenta hasta ${formatearDuracion(duracion + aumento)} o mantén el tiempo con algo más de intensidad.`;
      } else if (rpe >= 9) {
        sugerencia = `El esfuerzo fue alto en ${nombreEj}. Repite unos ${formatearDuracion(duracion)} antes de subir el tiempo.`;
      } else {
        sugerencia = `Buen trabajo en ${nombreEj}. La siguiente sesión intenta añadir ${aumento} segundos o mantener el tiempo con mejor ritmo.`;
      }
      return { ejercicio: nombreEj, sugerencia };
    }

    sugerencia = `Intenta mantener ${formatearDuracion(duracion)} o subir hasta ${formatearDuracion(duracion + aumento)} en la próxima sesión.`;
    return { ejercicio: nombreEj, sugerencia };
  }

  if (tipo === 'distancia_duracion') {
    const extraDistancia = distancia < 1000 ? 100 : distancia < 3000 ? 200 : 300;

    if (rpe <= 7) {
      sugerencia = `Buen margen en ${nombreEj}. La próxima vez intenta llegar a ${formatearDistancia(distancia + extraDistancia)} en un tiempo parecido a ${formatearDuracion(duracion)}.`;
    } else if (rpe >= 9) {
      sugerencia = `En ${nombreEj} fuiste bastante exigido. Repite ${formatearDistancia(distancia)} en torno a ${formatearDuracion(duracion)} antes de subir carga cardiovascular.`;
    } else {
      sugerencia = `Buen trabajo en ${nombreEj}. Intenta mantener ${formatearDistancia(distancia)} y recortar un poco el tiempo, o subir unos ${extraDistancia} m la próxima vez.`;
    }

    return { ejercicio: nombreEj, sugerencia };
  }

  return null;
};

export default function Dashboard() {
  const [userName, setUserName] = useState('Atleta');
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [rutinaActivaId, setRutinaActivaId] = useState(null);
  const [rutinaAEditar, setRutinaAEditar] = useState(null);

  const [metricas, setMetricas] = useState({ total_sesiones: 0, volumen_total_kg: 0 });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [proximoReto, setProximoReto] = useState(null);

  const diaDelAnio = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const consejoDelDia = CONSEJOS_FITNESS[diaDelAnio % CONSEJOS_FITNESS.length];

  useEffect(() => {
    const obtenerDatosInicio = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.reload();
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const resPerfil = await fetch('http://127.0.0.1:5000/api/usuarios/perfil', { headers });
        if (resPerfil.ok) {
          const datos = await resPerfil.json();
          setUserName(datos.nombre.trim());
        } else {
          localStorage.removeItem('token');
          window.location.reload();
          return;
        }

        const resMetricas = await fetch('http://127.0.0.1:5000/api/metricas/resumen', { headers });
        if (resMetricas.ok) {
          setMetricas(await resMetricas.json());
        }

        const resHistorial = await fetch('http://127.0.0.1:5000/api/sesiones/historial', { headers });
        if (resHistorial.ok) {
          const historial = await resHistorial.json();
          const completadas = historial.filter(s => s.fecha_fin);
          setActividadReciente(completadas.slice(0, 3));

          if (completadas.length > 0) {
            const ultimaSesionId = completadas[0].id_sesion;
            const resDetalle = await fetch(`http://127.0.0.1:5000/api/sesiones/${ultimaSesionId}/detalle`, { headers });

            if (resDetalle.ok) {
              const detalle = await resDetalle.json();
              if (detalle.length > 0) {
                const serieReto = elegirSerieParaReto(detalle);
                const reto = generarSugerenciaReto(serieReto);
                setProximoReto(reto);
              } else {
                setProximoReto(null);
              }
            } else {
              setProximoReto(null);
            }
          } else {
            setProximoReto(null);
          }
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    obtenerDatosInicio();
  }, [vistaActiva]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-blue-700 text-white flex flex-col p-6 shadow-xl z-10">
        <h2 className="text-2xl font-bold mb-10 text-center flex items-center justify-center gap-2">
          <span>Progresia</span> <span className="text-xl">🏋️‍♂️</span>
        </h2>

        <nav className="flex-1 space-y-2 font-medium">
          <div
            onClick={() => setVistaActiva('inicio')}
            className={`p-3 rounded-xl cursor-pointer transition-all ${vistaActiva === 'inicio' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:bg-blue-600'}`}
          >
            Inicio
          </div>

          <div
            onClick={() => setVistaActiva('mis-rutinas')}
            className={`p-3 rounded-xl cursor-pointer transition-all ${vistaActiva === 'mis-rutinas' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:bg-blue-600'}`}
          >
            Mis Rutinas
          </div>

          <div
            onClick={() => {
              setRutinaAEditar(null);
              setVistaActiva('crear');
            }}
            className={`p-3 rounded-xl cursor-pointer transition-all ${vistaActiva === 'crear' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:bg-blue-600'}`}
          >
            Crear Entrenamiento
          </div>

          <div
            onClick={() => setVistaActiva('historial')}
            className={`p-3 rounded-xl cursor-pointer transition-all ${vistaActiva === 'historial' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:bg-blue-600'}`}
          >
            Historial
          </div>

          <div
            onClick={() => setVistaActiva('metricas')}
            className={`p-3 rounded-xl cursor-pointer transition-all ${vistaActiva === 'metricas' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'hover:bg-blue-600'}`}
          >
            Métricas
          </div>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto bg-blue-800 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
        >
          Cerrar Sesión
        </button>
      </div>

      <main className="flex-1 p-10 overflow-y-auto h-screen bg-[#F8FAFC]">
        {vistaActiva === 'inicio' && (
          <div className="animate-fadeIn max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">¡A por ello, {userName}! 💪</h1>
                <p className="text-gray-500 mt-2 font-medium text-lg">Hoy es un buen día para superar tus marcas.</p>
              </div>

              <div className="text-sm font-bold text-blue-700 bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm capitalize">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Sesiones Totales</h3>
                <p className="text-4xl font-black text-blue-600">{metricas.total_sesiones}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Volumen de Fuerza</h3>
                <p className="text-4xl font-black text-green-500">
                  {Number(metricas.volumen_total_kg || 0).toLocaleString()} <span className="text-base text-gray-400">kg</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-md text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10 text-8xl">🏅</div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Nivel de Atleta</h3>
                <p className="text-2xl font-black relative z-10">{metricas.total_sesiones > 25 ? 'Avanzado' : 'Iniciado'}</p>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-4 relative z-10 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(metricas.total_sesiones % 10) * 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 flex flex-col gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-7xl">🎯</div>
                  <h3 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">Tu Próximo Reto 🚀</h3>

                  {proximoReto ? (
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl">
                      <p className="text-blue-800 font-bold mb-1 uppercase text-xs tracking-wider">
                        Análisis para: {proximoReto.ejercicio}
                      </p>
                      <p className="text-blue-700 text-sm font-medium leading-relaxed">
                        "{proximoReto.sugerencia}"
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
                      <p className="text-gray-500 text-sm font-medium">
                        Registra tu primera sesión completada para que la app analice tus marcas y te proponga retos personalizados.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setVistaActiva('mis-rutinas')}
                    className="mt-6 w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Ir a Entrenar Ahora
                  </button>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl font-black text-gray-900">Actividad Reciente 📋</h3>
                    <button
                      onClick={() => setVistaActiva('historial')}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      Ver todo
                    </button>
                  </div>

                  {actividadReciente.length > 0 ? (
                    <div className="space-y-4">
                      {actividadReciente.map(sesion => (
                        <div
                          key={sesion.id_sesion}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
                        >
                          <div>
                            <h4 className="font-bold text-gray-800">{sesion.nombre_rutina || 'Entrenamiento'}</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {new Date(sesion.fecha_inicio).toLocaleDateString()} • {sesion.duracion_minutos || 0} min
                            </p>
                          </div>

                          <div className="bg-white p-2 rounded-lg shadow-sm text-xs font-bold text-green-600 border border-gray-100">
                            Completado ✔️
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic text-center py-6">Aún no hay actividad reciente.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gradient-to-b from-blue-600 to-blue-800 p-8 rounded-3xl text-white shadow-lg h-full flex flex-col relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl">💡</div>
                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="inline-flex items-center gap-2 mb-6 bg-white/20 w-fit px-4 py-2 rounded-xl border border-white/30 backdrop-blur-sm">
                      <span className="text-xs font-black uppercase tracking-widest text-white">Fitness Tip Diario</span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-4 leading-tight">{consejoDelDia.titulo}</h3>
                    <p className="text-blue-100 text-sm leading-relaxed font-medium mb-8">{consejoDelDia.texto}</p>

                    <div className="mt-auto pt-6 border-t border-blue-500/50">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Vuelve mañana para más</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'crear' && (
          <CrearEntrenamiento
            volverAMisRutinas={() => setVistaActiva('mis-rutinas')}
            rutinaAEditar={null}
          />
        )}

        {vistaActiva === 'editar' && (
          <CrearEntrenamiento
            volverAMisRutinas={() => {
              setRutinaAEditar(null);
              setVistaActiva('mis-rutinas');
            }}
            rutinaAEditar={rutinaAEditar}
            onGuardado={() => {
              setRutinaAEditar(null);
              setVistaActiva('mis-rutinas');
            }}
          />
        )}

        {vistaActiva === 'mis-rutinas' && (
          <MisRutinas
            irAEntrenar={(id) => {
              setRutinaActivaId(id);
              setVistaActiva('entrenar');
            }}
            onEditar={(rutina) => {
              setRutinaAEditar(rutina);
              setVistaActiva('editar');
            }}
          />
        )}

        {vistaActiva === 'entrenar' && (
          <SesionActiva
            idEntrenamiento={rutinaActivaId}
            volverAMisRutinas={() => setVistaActiva('inicio')}
          />
        )}

        {vistaActiva === 'historial' && <Historial />}

        {vistaActiva === 'metricas' && <Metricas />}
      </main>
    </div>
  );
}