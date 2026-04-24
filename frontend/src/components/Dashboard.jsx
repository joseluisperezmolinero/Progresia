import { useEffect, useState, useMemo } from 'react';
import {
  Home, Dumbbell, Sparkles, PlusCircle, History, BarChart3, LogOut,
  Flame, TrendingUp, Trophy, Target, CheckCircle2, Lightbulb, ArrowRight,
  Menu, X,
  // Iconos para las categorías del Tip del día
  Apple, Pill, Scale, HeartPulse, Moon, Brain, Zap,
  Activity, CalendarDays, Layers, ShieldAlert, Sunrise, FlaskConical,
} from 'lucide-react';
import DashboardAdmin from './DashboardAdmin';
import CrearEntrenamiento from './CrearEntrenamiento';
import MisRutinas from './MisRutinas';
import SesionActiva from './SesionActiva';
import Historial from './Historial';
import Metricas from './Metricas';
import PlanInteligente from './PlanInteligente';
import { CONSEJOS_FITNESS, CATEGORIAS_TIP } from '../utils/tipsFitness';

/* ══════════════════════════════════════════════════════
   Mapa de iconos y colores para las categorías de tips.
   Cada tip del día se renderiza con el icono y color que
   corresponda a su categoría. Si no hay match, cae al default.
   ══════════════════════════════════════════════════════ */
const ICONOS_CATEGORIA_TIP = {
  [CATEGORIAS_TIP.HIPERTROFIA]:    { icon: Dumbbell,     color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  [CATEGORIAS_TIP.PROGRESION]:     { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  [CATEGORIAS_TIP.NUTRICION]:      { icon: Apple,        color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  [CATEGORIAS_TIP.SUPLEMENTACION]: { icon: Pill,         color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  [CATEGORIAS_TIP.DEFINICION]:     { icon: Scale,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  [CATEGORIAS_TIP.FUERZA]:         { icon: Zap,          color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  [CATEGORIAS_TIP.RECUPERACION]:   { icon: Moon,         color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
  [CATEGORIAS_TIP.MENTALIDAD]:     { icon: Brain,        color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
  [CATEGORIAS_TIP.TECNICA]:        { icon: Layers,       color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
  [CATEGORIAS_TIP.CARDIO]:         { icon: HeartPulse,   color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20' },
  [CATEGORIAS_TIP.PROGRAMACION]:   { icon: CalendarDays, color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20' },
  [CATEGORIAS_TIP.ANATOMIA]:       { icon: Activity,     color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  [CATEGORIAS_TIP.LESIONES]:       { icon: ShieldAlert,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  [CATEGORIAS_TIP.HABITOS]:        { icon: Sunrise,      color: 'text-lime-400',    bg: 'bg-lime-500/10',    border: 'border-lime-500/20' },
  [CATEGORIAS_TIP.CIENCIA]:        { icon: FlaskConical, color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
};

const DEFAULT_ICONO_TIP = { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };

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

/* ══════════════════════════════════════════════════════
   SPARKLINE — minigráfico SVG inline
   Recibe array de números, los normaliza y dibuja línea + área
   ══════════════════════════════════════════════════════ */
const Sparkline = ({ data, color = '#0ea5e9', height = 36, strokeWidth = 1.5 }) => {
  /* Si no hay datos reales, mostrar una línea plana muy sutil */
  if (!data || data.length < 2) {
    return (
      <svg viewBox={`0 0 100 ${height}`} className="w-full block" preserveAspectRatio="none">
        <line
          x1="0" y1={height / 2} x2="100" y2={height / 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
          className="text-neutral-700"
        />
      </svg>
    );
  }

  const width = 100;
  const padding = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rango = max - min || 1;

  /* Normalizar puntos al viewBox */
  const puntos = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((v - min) / rango) * (height - padding * 2);
    return [x, y];
  });

  const pathLine = puntos.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const pathArea = `${pathLine} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sparkline-grad-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full block"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathArea} fill={`url(#${gradId})`} />
      <path d={pathLine} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

/* ══════════════════════════════════════════════════════
   Calcular datos de sparklines a partir del historial
   ══════════════════════════════════════════════════════ */
const calcularSparklines = (historial) => {
  if (!Array.isArray(historial) || historial.length === 0) {
    return { sesiones: [], volumen: [] };
  }

  /* Agrupar por día de los últimos 14 días */
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = 14;

  const mapaDias = {};
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    mapaDias[key] = { sesiones: 0, volumen: 0 };
  }

  historial.forEach((s) => {
    if (!s.fecha_fin) return;
    const key = new Date(s.fecha_inicio).toISOString().split('T')[0];
    if (mapaDias[key] !== undefined) {
      mapaDias[key].sesiones += 1;
      mapaDias[key].volumen += Number(s.volumen_kg || 0);
    }
  });

  const ordenado = Object.values(mapaDias);
  return {
    sesiones: ordenado.map((d) => d.sesiones),
    volumen: ordenado.map((d) => d.volumen),
  };
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

  /* ── Sidebar móvil ───────────────────────────────────────
     En móvil el sidebar empieza cerrado y se abre con la
     hamburguesa. Al cambiar de vista se cierra solo. */
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  /* Cerrar sidebar móvil cada vez que cambia la vista */
  useEffect(() => { setSidebarAbierto(false); }, [vistaActiva]);

  /* Bloquear scroll del body cuando el sidebar móvil está abierto */
  useEffect(() => {
    if (sidebarAbierto) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarAbierto]);

  const [metricas, setMetricas] = useState({ total_sesiones: 0, volumen_total_kg: 0 });
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [proximoReto, setProximoReto] = useState(null);

  const progresoAtleta = obtenerProgresoAtleta(metricas.total_sesiones);
  const sparklines = useMemo(() => calcularSparklines(historialCompleto), [historialCompleto]);

  const diaDelAnio = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const consejoDelDia = CONSEJOS_FITNESS[diaDelAnio % CONSEJOS_FITNESS.length];
  const tipIcono = ICONOS_CATEGORIA_TIP[consejoDelDia?.categoria] || DEFAULT_ICONO_TIP;
  const TipIconComponent = tipIcono.icon;

  /* Saludo dinámico según hora del día */
  const saludoHora = (() => {
    const h = new Date().getHours();
    if (h < 6)  return 'Buenas noches';
    if (h < 13) return 'Buenos días';
    if (h < 21) return 'Buenas tardes';
    return 'Buenas noches';
  })();

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
          setHistorialCompleto(completadas);
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 lg:flex">
      {/* ══════════════════════════════════════════════════════
          TOPBAR MÓVIL — solo aparece en <lg
          Hamburguesa + logo. En escritorio queda oculta.
          ══════════════════════════════════════════════════════ */}
      <header className="lg:hidden sticky top-0 z-30 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="/logo_sin_nombre.png"
              alt="Progresia"
              className="block w-full h-full object-contain scale-[1.22]"
              draggable={false}
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">Progresia</span>
        </div>

        <button
          type="button"
          onClick={() => setSidebarAbierto(true)}
          aria-label="Abrir menú"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-300 hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════
          OVERLAY MÓVIL — fondo oscuro al abrir el sidebar.
          Solo visible cuando sidebarAbierto && <lg.
          Click cierra el menú.
          ══════════════════════════════════════════════════════ */}
      {sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════════════
          SIDEBAR
          - Escritorio (lg+): fijo a la izquierda, w-64, exactamente igual que antes.
          - Móvil: panel deslizante. Oculto fuera de pantalla (-translate-x-full)
            y se desliza con sidebarAbierto.
          ══════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-72 lg:w-64 h-screen
          bg-neutral-900 border-r border-neutral-800
          flex flex-col p-5
          transition-transform duration-300 ease-out
          ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Cabecera del sidebar — botón cerrar en móvil */}
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={() => setSidebarAbierto(false)}
            aria-label="Cerrar menú"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
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

      {/* ══════════════════════════════════════════════════════
          MAIN — con patrón de puntos sutil de fondo
          Escritorio: scroll propio dentro del main (h-screen)
          Móvil: sin scroll propio, usa el del body
          ══════════════════════════════════════════════════════ */}
      <main
        className="flex-1 relative lg:overflow-y-auto lg:h-screen"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {vistaActiva === 'inicio' && (
          <>
            {/* ── HERO con foto + gradiente ───────────────────── */}
            <div className="relative h-48 lg:h-64 overflow-hidden border-b border-neutral-800">
              <img
                src="/foto_auth.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                draggable={false}
              />
              {/* Gradiente: oscurece arriba y a la derecha para que se lea el texto */}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 via-transparent to-neutral-950" />
              {/* Halo azul sutil */}
              <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

              <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-10 flex items-center">
                <div className="flex justify-between items-center w-full gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] lg:text-xs font-semibold uppercase tracking-[0.22em] text-sky-300 mb-2 lg:mb-3">
                      Panel principal
                    </p>
                    <h1 className="text-2xl lg:text-4xl font-semibold tracking-tight text-white">
                      {saludoHora}, {userName}
                    </h1>
                    <p className="text-neutral-300 mt-1.5 lg:mt-2 text-sm lg:text-base">
                      Hoy es un buen día para superar tus marcas.
                    </p>
                  </div>
                  {/* Fecha solo en escritorio — en móvil no cabe junto al saludo */}
                  <div className="hidden lg:block text-xs font-medium text-neutral-300 bg-neutral-900/60 backdrop-blur-sm border border-neutral-700 px-4 py-2 rounded-lg capitalize whitespace-nowrap">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-10 max-w-7xl mx-auto">
              {/* ── STATS con sparklines ──────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Sesiones totales */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
                  {/* Tinte sutil de color */}
                  <div className="absolute inset-0 bg-sky-500/[0.03] pointer-events-none" />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                          <Flame className="w-4 h-4 text-sky-400" strokeWidth={2} />
                        </div>
                        <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                          Sesiones totales
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-4">
                      <p className="text-3xl font-semibold text-white leading-none">
                        {metricas.total_sesiones}
                      </p>
                      <div className="flex-1 max-w-[120px] h-9">
                        <Sparkline data={sparklines.sesiones} color="#38bdf8" />
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-2">Últimos 14 días</p>
                  </div>
                </div>

                {/* Volumen */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                      </div>
                      <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                        Volumen total
                      </h3>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-4">
                      <p className="text-3xl font-semibold text-white leading-none">
                        {Number(metricas.volumen_total_kg || 0).toLocaleString()}
                        <span className="text-sm text-neutral-500 ml-1 font-normal">kg</span>
                      </p>
                      <div className="flex-1 max-w-[120px] h-9">
                        <Sparkline data={sparklines.volumen} color="#34d399" />
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-2">Últimos 14 días</p>
                  </div>
                </div>

                {/* Nivel de atleta */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800/60 border border-neutral-700 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-500/[0.03] pointer-events-none" />
                  {/* Decoración sutil: trofeo gigante a la derecha con opacidad mínima */}
                  <Trophy
                    className="absolute -right-4 -bottom-4 w-28 h-28 text-amber-500/5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-400" strokeWidth={2} />
                      </div>
                      <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                        Nivel de atleta
                      </h3>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-3 mb-3">
                      <div>
                        <p className="text-2xl font-semibold text-white leading-tight">{progresoAtleta.nivelActual.nombre}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
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

                    <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-500">
                      <span>{progresoAtleta.nivelActual.nombre}</span>
                      <span className="text-sky-400">{progresoAtleta.textoProgreso}</span>
                      <span>{progresoAtleta.siguienteNivel ? progresoAtleta.siguienteNivel.nombre : 'Máximo'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Plan Inteligente */}
              <button
                onClick={irAPlanInteligente}
                className="w-full mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl p-6 text-white transition-all group text-left relative overflow-hidden"
              >
                {/* Decoración sutil */}
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative flex items-center gap-4">
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
                  <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6">
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
                  <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6">
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
                  <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                    {/* Glow del color de la categoría */}
                    <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full ${tipIcono.bg} blur-3xl pointer-events-none opacity-50`} />

                    {/* Cabecera: etiqueta + categoría */}
                    <div className="relative flex items-center justify-between gap-2 mb-5">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-neutral-400" strokeWidth={2} />
                        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                          Tip del día
                        </span>
                      </div>
                      {consejoDelDia?.categoria && (
                        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${tipIcono.bg} ${tipIcono.color} ${tipIcono.border}`}>
                          {consejoDelDia.categoria}
                        </span>
                      )}
                    </div>

                    {/* Icono grande según categoría */}
                    <div className={`relative w-12 h-12 rounded-xl ${tipIcono.bg} border ${tipIcono.border} flex items-center justify-center mb-4`}>
                      <TipIconComponent className={`w-6 h-6 ${tipIcono.color}`} strokeWidth={2} aria-hidden="true" />
                    </div>

                    <h3 className="relative text-xl font-semibold text-white mb-3 leading-tight">
                      {consejoDelDia.titulo}
                    </h3>
                    <p className="relative text-neutral-400 text-sm leading-relaxed flex-1">
                      {consejoDelDia.texto}
                    </p>

                    <div className="relative mt-6 pt-6 border-t border-neutral-800">
                      <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-600">
                        Vuelve mañana para más
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
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