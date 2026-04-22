import { useEffect, useState } from 'react';
import {
  Home, Dumbbell, Sparkles, PlusCircle, History, BarChart3, LogOut,
  Flame, TrendingUp, Trophy, Target, CheckCircle2, Lightbulb, ArrowRight
} from 'lucide-react';
import DashboardAdmin from './DashboardAdmin';
import CrearEntrenamiento from './CrearEntrenamiento';
import MisRutinas from './MisRutinas';
import SesionActiva from './SesionActiva';
import Historial from './Historial';
import Metricas from './Metricas';
import PlanInteligente from './PlanInteligente';
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

const NIVELES_ATLETA = [
  { nombre: 'Iniciado',   min: 0,   max: 29  },
  { nombre: 'Constante',  min: 30,  max: 69  },
  { nombre: 'Intermedio', min: 70,  max: 129 },
  { nombre: 'Avanzado',   min: 130, max: 219 },
  { nombre: 'Élite',      min: 220, max: null }
];

const obtenerProgresoAtleta = (totalSesiones) => {
  const sesiones = Math.max(0, Number(totalSesiones || 0));
  const indiceNivel = NIVELES_ATLETA.findIndex(
    (nivel) => sesiones >= nivel.min && (nivel.max === null || sesiones <= nivel.max)
  );
  const nivelActual = NIVELES_ATLETA[indiceNivel >= 0 ? indiceNivel : 0];
  const siguienteNivel = NIVELES_ATLETA[indiceNivel + 1] || null;

  if (!siguienteNivel || nivelActual.max === null) {
    return {
      nivelActual, siguienteNivel: null, porcentaje: 100,
      sesionesActuales: sesiones, sesionesParaSiguiente: 0,
      textoProgreso: `${sesiones} sesiones · nivel máximo`,
    };
  }

  const sesionesEnNivel = sesiones - nivelActual.min;
  const totalSesionesNivel = (nivelActual.max - nivelActual.min) + 1;
  const porcentaje = Math.max(6, Math.min(100, Math.round((sesionesEnNivel / totalSesionesNivel) * 100)));
  const sesionesRestantes = Math.max(0, siguienteNivel.min - sesiones);

  return {
    nivelActual, siguienteNivel, porcentaje,
    sesionesActuales: sesiones, sesionesParaSiguiente: sesionesRestantes,
    textoProgreso: `${sesionesRestantes} sesiones para ${siguienteNivel.nombre}`,
  };
};

const elegirSerieParaReto = (detalle) => {
  if (!Array.isArray(detalle) || detalle.length === 0) return null;
  const puntuacion = (serie) => {
    const rpe = Number(serie.rpe_fatiga || 0);
    switch (serie.tipo_registro) {
      case 'peso_reps':          return rpe * 100000 + Number(serie.peso_kg || 0) * 100 + Number(serie.repeticiones || 0);
      case 'distancia_duracion': return rpe * 100000 + Number(serie.distancia_metros || 0) * 10 + Number(serie.duracion_segundos || 0);
      case 'duracion':           return rpe * 100000 + Number(serie.duracion_segundos || 0);
      default:                   return rpe * 100000 + Number(serie.repeticiones || 0);
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
      sugerencia = `Fuiste sobrado la última vez. Sube el peso a ${(peso + 2.5).toFixed(1)} kg para seguir progresando.`;
    } else if (rpe >= 9 && reps < 8) {
      sugerencia = `Te costó bastante mover ${peso.toFixed(1)} kg. Mantén el peso o bájalo un poco para asegurar técnica y rango completo.`;
    } else {
      sugerencia = `Buen trabajo con ${peso.toFixed(1)} kg. Mantén el mismo peso e intenta sacar al menos una repetición más.`;
    }
    return { ejercicio: nombreEj, sugerencia };
  }

  if (tipo === 'reps') {
    if (grupo === 'Core') {
      if (rpe <= 7 && reps >= 15)      sugerencia = `Vas muy sólido en ${nombreEj}. Intenta sacar 2-4 repeticiones más o hacerlas con más control.`;
      else if (rpe >= 9)               sugerencia = `En ${nombreEj} fuiste al límite. Mantén el mismo objetivo y céntrate en la técnica.`;
      else                             sugerencia = `Buen trabajo en ${nombreEj}. Intenta añadir 1-2 repeticiones más manteniendo buena técnica.`;
      return { ejercicio: nombreEj, sugerencia };
    }
    if (grupo === 'Cardio') {
      if (rpe <= 7 && reps >= 20)      sugerencia = `Te vi con margen en ${nombreEj}. Aumenta volumen: 3-5 repeticiones más o menos descanso.`;
      else if (rpe >= 9)               sugerencia = `En ${nombreEj} el esfuerzo fue alto. Repite una marca parecida antes de subir.`;
      else                             sugerencia = `Buen trabajo en ${nombreEj}. Intenta 2-3 repeticiones más o un ritmo más constante.`;
      return { ejercicio: nombreEj, sugerencia };
    }
    if (rpe <= 7 && reps >= 12)        sugerencia = `Tienes margen en ${nombreEj}. Añade 1-3 repeticiones manteniendo técnica limpia.`;
    else if (rpe >= 9)                 sugerencia = `En ${nombreEj} fuiste al límite. Repite la marca antes de progresar más.`;
    else                               sugerencia = `Buen trabajo en ${nombreEj}. Mejora ligeramente con 1-2 repeticiones extra.`;
    return { ejercicio: nombreEj, sugerencia };
  }

  if (tipo === 'duracion') {
    const aumento = duracion < 60 ? 10 : duracion < 180 ? 15 : 30;
    if (grupo === 'Core') {
      if (rpe <= 7)      sugerencia = `Buen control en ${nombreEj}. Intenta aguantar ${formatearDuracion(duracion + aumento)} con postura firme.`;
      else if (rpe >= 9) sugerencia = `En ${nombreEj} fuiste al límite. Repite ${formatearDuracion(duracion)} y céntrate en la técnica.`;
      else               sugerencia = `Buen trabajo en ${nombreEj}. Suma ${aumento} segundos más en la próxima sesión.`;
      return { ejercicio: nombreEj, sugerencia };
    }
    if (grupo === 'Cardio') {
      if (rpe <= 7)      sugerencia = `Tienes margen en ${nombreEj}. Aumenta hasta ${formatearDuracion(duracion + aumento)} o sube intensidad.`;
      else if (rpe >= 9) sugerencia = `El esfuerzo fue alto en ${nombreEj}. Repite ${formatearDuracion(duracion)} antes de subir.`;
      else               sugerencia = `Buen trabajo. Añade ${aumento} segundos o mantén el tiempo con mejor ritmo.`;
      return { ejercicio: nombreEj, sugerencia };
    }
    sugerencia = `Mantén ${formatearDuracion(duracion)} o sube hasta ${formatearDuracion(duracion + aumento)} en la próxima sesión.`;
    return { ejercicio: nombreEj, sugerencia };
  }

  if (tipo === 'distancia_duracion') {
    const extraDistancia = distancia < 1000 ? 100 : distancia < 3000 ? 200 : 300;
    if (rpe <= 7)      sugerencia = `Buen margen en ${nombreEj}. Intenta llegar a ${formatearDistancia(distancia + extraDistancia)} en un tiempo parecido a ${formatearDuracion(duracion)}.`;
    else if (rpe >= 9) sugerencia = `En ${nombreEj} fuiste exigido. Repite ${formatearDistancia(distancia)} en torno a ${formatearDuracion(duracion)} antes de subir.`;
    else               sugerencia = `Buen trabajo. Mantén ${formatearDistancia(distancia)} y recorta tiempo, o sube ${extraDistancia} m.`;
    return { ejercicio: nombreEj, sugerencia };
  }

  return null;
};

// ── Item de navegación lateral ──────────────────────────────────────
const NavItem = ({ icon: Icon, label, active, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
      transition-all group
      ${active
        ? 'bg-white text-neutral-900'
        : highlight
          ? 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/20'
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
      }
    `}
  >
    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
    <span>{label}</span>
  </button>
);

export default function Dashboard() {
  const [userName, setUserName] = useState('Atleta');
  const [esAdmin, setEsAdmin] = useState(false);
  const [perfilCargado, setPerfilCargado] = useState(false);

  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [rutinaActivaId, setRutinaActivaId] = useState(null);
  const [rutinaAEditar, setRutinaAEditar] = useState(null);

  const [metricas, setMetricas] = useState({ total_sesiones: 0, volumen_total_kg: 0 });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [proximoReto, setProximoReto] = useState(null);

  const progresoAtleta = obtenerProgresoAtleta(metricas.total_sesiones);

  const diaDelAnio = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const consejoDelDia = CONSEJOS_FITNESS[diaDelAnio % CONSEJOS_FITNESS.length];

  useEffect(() => {
    const obtenerDatosInicio = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.reload(); return; }
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const resPerfil = await fetch('http://127.0.0.1:5000/api/usuarios/perfil', { headers });
        if (resPerfil.ok) {
          const datos = await resPerfil.json();
          setUserName(datos.nombre.trim());
          setEsAdmin(Boolean(datos.es_admin));
          setPerfilCargado(true);
          if (datos.es_admin) return;
        } else {
          localStorage.removeItem('token');
          window.location.reload();
          return;
        }

        const resMetricas = await fetch('http://127.0.0.1:5000/api/metricas/resumen', { headers });
        if (resMetricas.ok) setMetricas(await resMetricas.json());

        const resHistorial = await fetch('http://127.0.0.1:5000/api/sesiones/historial', { headers });
        if (resHistorial.ok) {
          const historial = await resHistorial.json();
          const completadas = historial.filter((s) => s.fecha_fin);
          setActividadReciente(completadas.slice(0, 3));

          if (completadas.length > 0) {
            const ultimaSesionId = completadas[0].id_sesion;
            const resDetalle = await fetch(`http://127.0.0.1:5000/api/sesiones/${ultimaSesionId}/detalle`, { headers });
            if (resDetalle.ok) {
              const detalle = await resDetalle.json();
              if (detalle.length > 0) {
                const serieReto = elegirSerieParaReto(detalle);
                setProximoReto(generarSugerenciaReto(serieReto));
              }
            }
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

  const irAPlanInteligente = () => setVistaActiva('plan-inteligente');

  if (!perfilCargado) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-medium">
        Cargando panel...
      </div>
    );
  }

  if (esAdmin) return <DashboardAdmin />;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-5 z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
  <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
    <img
      src="/logo_sin_nombre.png"
      alt="Progresia"
      className="block w-full h-full object-contain scale-[1.22]"
      draggable={false}
    />
  </div>
  <span className="text-lg font-semibold tracking-tight">Progresia</span>
</div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={Home}        label="Inicio"              active={vistaActiva === 'inicio'}       onClick={() => setVistaActiva('inicio')} />
          <NavItem icon={Dumbbell}    label="Mis Rutinas"         active={vistaActiva === 'mis-rutinas'}  onClick={() => setVistaActiva('mis-rutinas')} />
          <NavItem icon={Sparkles}    label="Plan Inteligente"    active={vistaActiva === 'plan-inteligente'} highlight onClick={irAPlanInteligente} />
          <NavItem icon={PlusCircle}  label="Crear Entrenamiento" active={vistaActiva === 'crear'}        onClick={() => { setRutinaAEditar(null); setVistaActiva('crear'); }} />
          <NavItem icon={History}     label="Historial"           active={vistaActiva === 'historial'}    onClick={() => setVistaActiva('historial')} />
          <NavItem icon={BarChart3}   label="Métricas"            active={vistaActiva === 'metricas'}     onClick={() => setVistaActiva('metricas')} />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto h-screen">
        {vistaActiva === 'inicio' && (
          <div className="p-10 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-start mb-10">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Hola, {userName}
                </h1>
                <p className="text-neutral-400 mt-1 text-sm">
                  Hoy es un buen día para superar tus marcas.
                </p>
              </div>
              <div className="text-xs font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg capitalize">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Sesiones totales */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-sky-400" strokeWidth={2} />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">Sesiones totales</h3>
                </div>
                <p className="text-3xl font-semibold text-white">{metricas.total_sesiones}</p>
              </div>

              {/* Volumen */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">Volumen total</h3>
                </div>
                <p className="text-3xl font-semibold text-white">
                  {Number(metricas.volumen_total_kg || 0).toLocaleString()}
                  <span className="text-base text-neutral-500 ml-1.5 font-normal">kg</span>
                </p>
              </div>

              {/* Nivel de atleta */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" strokeWidth={2} />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">Nivel de atleta</h3>
                </div>

                <div className="flex items-end justify-between gap-4 mb-3">
                  <div>
                    <p className="text-2xl font-semibold text-white">{progresoAtleta.nivelActual.nombre}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {progresoAtleta.sesionesActuales} sesiones completadas
                    </p>
                  </div>
                  <span className="text-sm font-medium text-sky-400">{progresoAtleta.porcentaje}%</span>
                </div>

                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progresoAtleta.porcentaje}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-neutral-500">
                  <span>{progresoAtleta.nivelActual.nombre}</span>
                  <span className="text-sky-400">{progresoAtleta.textoProgreso}</span>
                  <span>{progresoAtleta.siguienteNivel ? progresoAtleta.siguienteNivel.nombre : 'Máximo'}</span>
                </div>
              </div>
            </div>

            {/* CTA Plan Inteligente */}
            <button
              onClick={irAPlanInteligente}
              className="w-full mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl p-6 text-white transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Sparkles className="w-6 h-6" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-200 mb-0.5">Recomendado</p>
                  <h3 className="text-lg font-semibold">Genera tu Plan Inteligente</h3>
                  <p className="text-sky-100/80 text-sm mt-0.5">
                    Responde unas preguntas y recibirás una rutina personalizada según tu objetivo y equipamiento.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Próximo reto */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Target className="w-4 h-4 text-sky-400" strokeWidth={2} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Tu próximo reto</h3>
                  </div>

                  {proximoReto ? (
                    <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg p-5">
                      <p className="text-sky-300 font-medium text-xs uppercase tracking-wider mb-2">
                        Análisis: {proximoReto.ejercicio}
                      </p>
                      <p className="text-neutral-200 text-sm leading-relaxed">
                        {proximoReto.sugerencia}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                      <p className="text-neutral-500 text-sm leading-relaxed">
                        Registra tu primera sesión completada para que el sistema analice tus marcas y te proponga retos personalizados.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setVistaActiva('mis-rutinas')}
                    className="mt-5 w-full py-3 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                  >
                    Entrenar ahora
                  </button>
                </div>

                {/* Actividad reciente */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-neutral-400" strokeWidth={2} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Actividad reciente</h3>
                    </div>
                    <button
                      onClick={() => setVistaActiva('historial')}
                      className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Ver todo
                    </button>
                  </div>

                  {actividadReciente.length > 0 ? (
                    <div className="space-y-2">
                      {actividadReciente.map((sesion) => (
                        <div
                          key={sesion.id_sesion}
                          className="flex justify-between items-center p-4 bg-neutral-950 rounded-lg border border-neutral-800"
                        >
                          <div>
                            <h4 className="font-medium text-white text-sm">{sesion.nombre_rutina || 'Entrenamiento'}</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {new Date(sesion.fecha_inicio).toLocaleDateString()} · {sesion.duracion_minutos || 0} min
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Completado
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm text-center py-8">No hay actividad reciente.</p>
                  )}
                </div>
              </div>

              {/* Columna derecha - Tip */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-5">
                    <Lightbulb className="w-4 h-4 text-amber-400" strokeWidth={2} />
                    <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Tip del día</span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3 leading-tight">
                    {consejoDelDia.titulo}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed flex-1">
                    {consejoDelDia.texto}
                  </p>

                  <div className="mt-6 pt-6 border-t border-neutral-800">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-600">
                      Vuelve mañana para más
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'plan-inteligente' && (
          <PlanInteligente
            irAEntrenar={(id) => { setRutinaActivaId(id); setVistaActiva('entrenar'); }}
          />
        )}

        {vistaActiva === 'crear' && (
          <CrearEntrenamiento
            volverAMisRutinas={() => setVistaActiva('mis-rutinas')}
            rutinaAEditar={null}
          />
        )}

        {vistaActiva === 'editar' && (
          <CrearEntrenamiento
            volverAMisRutinas={() => { setRutinaAEditar(null); setVistaActiva('mis-rutinas'); }}
            rutinaAEditar={rutinaAEditar}
            onGuardado={() => { setRutinaAEditar(null); setVistaActiva('mis-rutinas'); }}
          />
        )}

        {vistaActiva === 'mis-rutinas' && (
          <MisRutinas
            irAEntrenar={(id) => { setRutinaActivaId(id); setVistaActiva('entrenar'); }}
            onEditar={(rutina) => { setRutinaAEditar(rutina); setVistaActiva('editar'); }}
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