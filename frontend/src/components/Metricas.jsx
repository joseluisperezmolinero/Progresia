import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
import {
  Flame, TrendingUp, Clock, Trophy, BarChart3, Target, Crown, Calendar,
  CalendarDays, CheckCircle2, Medal, TrendingDown, ArrowRight,
  ChevronDown, Loader2, Activity,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const formatMinutos = (min) => {
  const total = Number(min || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? `${m}m` : ''}`;
};

const formatSegundos = (seg) => {
  const total = Number(seg || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const formatDistancia = (m) => {
  const total = Number(m || 0);
  if (total >= 1000) return `${(total / 1000).toFixed(2)} km`;
  return `${Math.round(total)} m`;
};

const getEvolutionConfig = (tipo) => {
  switch (tipo) {
    case 'peso_reps':
      return { primaryKey: 'peso_maximo', secondaryKey: 'volumen_sesion', primaryLabel: 'Peso máximo', secondaryLabel: 'Volumen sesión', prLabel: 'Récord personal' };
    case 'reps':
      return { primaryKey: 'reps_maximas', secondaryKey: 'reps_totales', primaryLabel: 'Mejor serie', secondaryLabel: 'Reps totales', prLabel: 'Mejor serie' };
    case 'duracion':
      return { primaryKey: 'duracion_total_segundos', secondaryKey: 'duracion_maxima', primaryLabel: 'Duración total', secondaryLabel: 'Mejor serie', prLabel: 'Mejor duración' };
    case 'distancia_duracion':
      return { primaryKey: 'distancia_total_metros', secondaryKey: 'duracion_total_segundos', primaryLabel: 'Distancia total', secondaryLabel: 'Duración total', prLabel: 'Mejor distancia' };
    default:
      return { primaryKey: 'peso_maximo', secondaryKey: 'volumen_sesion', primaryLabel: 'Valor principal', secondaryLabel: 'Valor secundario', prLabel: 'Mejor marca' };
  }
};

const formatMetricValue = (key, value) => {
  const num = Number(value || 0);
  switch (key) {
    case 'peso_maximo':              return `${num.toFixed(1)} kg`;
    case 'volumen_sesion':           return `${Math.round(num).toLocaleString('es-ES')} kg`;
    case 'reps_maximas':
    case 'reps_totales':             return `${Math.round(num)} reps`;
    case 'duracion_maxima':
    case 'duracion_total_segundos':  return formatSegundos(num);
    case 'distancia_maxima':
    case 'distancia_total_metros':   return formatDistancia(num);
    default:                         return `${num}`;
  }
};

const getAxisUnit = (key) => {
  switch (key) {
    case 'peso_maximo':
    case 'volumen_sesion':           return ' kg';
    case 'reps_maximas':
    case 'reps_totales':             return ' reps';
    case 'duracion_maxima':
    case 'duracion_total_segundos':  return ' s';
    case 'distancia_maxima':
    case 'distancia_total_metros':   return ' m';
    default:                         return '';
  }
};

// ──────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ──────────────────────────────────────────────────────────────────────

const PillBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 text-sm font-medium rounded-md transition-all
      ${active ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}
    `}
  >
    {children}
  </button>
);

const KpiCard = ({ titulo, valor, unidad, icon: Icon, iconClass, sub }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">{titulo}</h3>
    </div>
    <p className="text-3xl font-semibold text-white">
      {valor}
      {unidad && <span className="text-sm text-neutral-500 ml-1.5 font-normal">{unidad}</span>}
    </p>
    {sub && <p className="text-xs text-neutral-500 mt-1.5">{sub}</p>}
  </div>
);

const HeroCard = ({ gradient, icon: Icon, label, valor, sub }) => (
  <div className={`${gradient} rounded-xl p-6 text-white relative overflow-hidden flex items-center gap-5 border border-white/10`}>
    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0">
      <Icon className="w-5 h-5" strokeWidth={2} />
    </div>
    <div className="relative z-10 min-w-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest opacity-80 mb-1">{label}</h4>
      <p className="text-2xl font-semibold truncate">{valor}</p>
      <p className="text-sm opacity-80 mt-0.5">{sub}</p>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────

export default function Metricas() {
  const [vista, setVista] = useState('general');

  const [metricasGlobales, setMetricasGlobales] = useState({
    total_sesiones: 0, volumen_total_kg: 0,
    distancia_total_metros: 0, duracion_total_segundos: 0,
  });

  const [historial, setHistorial] = useState([]);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [rachaActual, setRachaActual] = useState(0);
  const [rachaMaxima, setRachaMaxima] = useState(0);

  const [datosMensuales, setDatosMensuales] = useState([]);
  const [mejorMes, setMejorMes] = useState(null);
  const [comparativaMes, setComparativaMes] = useState({ actual: 0, anterior: 0 });
  const [frecuenciaSemanal, setFrecuenciaSemanal] = useState(0);
  const [mejorSemana, setMejorSemana] = useState(null);

  const [ejercicios, setEjercicios] = useState([]);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState('');
  const [ejercicioMeta, setEjercicioMeta] = useState(null);
  const [datosEvolucion, setDatosEvolucion] = useState([]);
  const [cargandoEvolucion, setCargandoEvolucion] = useState(false);
  const [prEjercicio, setPrEjercicio] = useState(null);
  const [comparativaUltimas, setComparativaUltimas] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const resMetricas = await fetch('http://127.0.0.1:5000/api/metricas/resumen', { headers });
        if (resMetricas.ok) setMetricasGlobales(await resMetricas.json());

        const resHistorial = await fetch('http://127.0.0.1:5000/api/sesiones/historial', { headers });
        if (resHistorial.ok) {
          const hist = await resHistorial.json();
          const completadas = hist.filter((s) => s.fecha_fin);
          setHistorial(completadas);

          const minutosTotales = completadas.reduce((acc, s) => acc + (parseInt(s.duracion_minutos, 10) || 0), 0);
          setTiempoTotal(minutosTotales);

          const diasConEntreno = [...new Set(completadas.map((s) => new Date(s.fecha_inicio).toDateString()))]
            .map((d) => new Date(d)).sort((a, b) => b - a);

          let racha = 0, maxRacha = 0, contRacha = 1;
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);

          if (diasConEntreno.length > 0) {
            const ultimo = new Date(diasConEntreno[0]);
            ultimo.setHours(0, 0, 0, 0);
            const diffDias = Math.floor((hoy - ultimo) / 86400000);

            if (diffDias <= 1) {
              racha = 1;
              for (let i = 1; i < diasConEntreno.length; i++) {
                const diff = Math.floor((diasConEntreno[i - 1] - diasConEntreno[i]) / 86400000);
                if (diff === 1) racha++; else break;
              }
            }

            for (let i = 1; i < diasConEntreno.length; i++) {
              const diff = Math.floor((diasConEntreno[i - 1] - diasConEntreno[i]) / 86400000);
              if (diff === 1) { contRacha++; maxRacha = Math.max(maxRacha, contRacha); }
              else contRacha = 1;
            }
            maxRacha = Math.max(maxRacha, racha, 1);
          }

          setRachaActual(racha);
          setRachaMaxima(maxRacha);

          const mesesMap = {};
          completadas.forEach((s) => {
            const f = new Date(s.fecha_inicio);
            const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
            const label = f.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            if (!mesesMap[key]) mesesMap[key] = { mes: label.charAt(0).toUpperCase() + label.slice(1), sesiones: 0, minutos: 0 };
            mesesMap[key].sesiones++;
            mesesMap[key].minutos += parseInt(s.duracion_minutos, 10) || 0;
          });

          const sortedMeses = Object.entries(mesesMap).sort(([a], [b]) => a.localeCompare(b));
          const dataBarras = sortedMeses.map(([, v]) => v);
          setDatosMensuales(dataBarras);

          if (dataBarras.length > 0) {
            setMejorMes(dataBarras.reduce((max, m) => (m.sesiones > max.sesiones ? m : max), dataBarras[0]));
          }

          const ahora = new Date();
          const claveActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
          const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
          const claveAnterior = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;

          setComparativaMes({
            actual: mesesMap[claveActual]?.sesiones || 0,
            anterior: mesesMap[claveAnterior]?.sesiones || 0,
          });

          const hace4Sem = new Date();
          hace4Sem.setDate(hace4Sem.getDate() - 28);
          const recientes = completadas.filter((s) => new Date(s.fecha_inicio) >= hace4Sem);
          setFrecuenciaSemanal(Number((recientes.length / 4).toFixed(1)));

          const semanasMap = {};
          completadas.forEach((s) => {
            const f = new Date(s.fecha_inicio);
            const ini = new Date(f);
            ini.setDate(f.getDate() - f.getDay());
            const key = ini.toLocaleDateString('es-ES');
            semanasMap[key] = (semanasMap[key] || 0) + 1;
          });
          const maxSem = Object.entries(semanasMap).reduce(
            (max, [k, v]) => (v > max.count ? { semana: k, count: v } : max),
            { semana: null, count: 0 }
          );
          setMejorSemana(maxSem.semana ? maxSem : null);
        }

        const resEj = await fetch('http://127.0.0.1:5000/api/ejercicios', { headers });
        if (resEj.ok) {
          const data = await resEj.json();
          setEjercicios(Array.isArray(data) ? data.filter((e) => e.activo !== false) : []);
        }
      } catch (err) {
        console.error('Error cargando métricas:', err);
      }
    };

    cargarDatos();
  }, []);

  const cargarEvolucion = async (idEjercicio) => {
    setEjercicioSeleccionado(idEjercicio);
    setDatosEvolucion([]);
    setEjercicioMeta(null);
    setPrEjercicio(null);
    setComparativaUltimas(null);
    if (!idEjercicio) return;

    setCargandoEvolucion(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/metricas/evolucion/${idEjercicio}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setCargandoEvolucion(false); return; }

      const payload = await res.json();
      const meta = payload?.ejercicio || null;
      const datos = Array.isArray(payload?.evolucion) ? payload.evolucion : [];
      setEjercicioMeta(meta);
      if (datos.length === 0) { setDatosEvolucion([]); return; }

      const evo = datos.map((d) => ({
        ...d,
        fechaCorta: new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      }));
      setDatosEvolucion(evo);

      const cfg = getEvolutionConfig(meta?.tipo_registro);
      const pr = evo.reduce((max, i) => (Number(i[cfg.primaryKey]) > Number(max[cfg.primaryKey]) ? i : max), evo[0]);
      setPrEjercicio(pr);

      if (evo.length >= 2) {
        const ultima = evo[evo.length - 1];
        const penultima = evo[evo.length - 2];
        setComparativaUltimas({
          ultima, penultima,
          primaryKey: cfg.primaryKey, secondaryKey: cfg.secondaryKey,
          diffPrimary: Number(ultima[cfg.primaryKey]) - Number(penultima[cfg.primaryKey]),
          diffSecondary: cfg.secondaryKey ? Number(ultima[cfg.secondaryKey]) - Number(penultima[cfg.secondaryKey]) : null,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoEvolucion(false);
    }
  };

  const diffPct = comparativaMes.anterior > 0
    ? (((comparativaMes.actual - comparativaMes.anterior) / comparativaMes.anterior) * 100).toFixed(0)
    : comparativaMes.actual > 0 ? '+100' : '0';

  const nombreEjercicioSeleccionado =
    ejercicioMeta?.nombre ||
    ejercicios.find((e) => String(e.id_ejercicio) === String(ejercicioSeleccionado))?.nombre || '';

  const evolutionConfig = getEvolutionConfig(ejercicioMeta?.tipo_registro);
  const { primaryKey, secondaryKey } = evolutionConfig;

  // ── Tooltips de Recharts ────────────────────────────────────
  const TooltipLinea = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 min-w-[140px] shadow-xl">
        <p className="text-sky-400 font-medium text-[11px] mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-white">{formatMetricValue(primaryKey, payload[0].value)}</p>
      </div>
    );
  };

  const TooltipSecundaria = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 min-w-[140px] shadow-xl">
        <p className="text-emerald-400 font-medium text-[11px] mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-white">{formatMetricValue(secondaryKey, payload[0].value)}</p>
      </div>
    );
  };

  const TooltipBarra = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 shadow-xl">
        <p className="text-emerald-400 font-medium text-[11px] mb-0.5">{label}</p>
        <p className="text-lg font-semibold text-white">
          {payload[0].value} <span className="text-xs text-neutral-400 font-normal">sesiones</span>
        </p>
        {payload[1] && <p className="text-xs text-violet-300 mt-0.5">{formatMinutos(payload[1].value)}</p>}
      </div>
    );
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-sky-400" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">Análisis</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Centro de Métricas</h1>
          <p className="text-neutral-400 mt-1 text-sm">Tus datos transformados en progreso real.</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-1 flex">
          {[
            { id: 'general', label: 'Resumen' },
            { id: 'ejercicios', label: 'Por ejercicio' },
            { id: 'logros', label: 'Logros' },
          ].map((t) => (
            <PillBtn key={t.id} active={vista === t.id} onClick={() => setVista(t.id)}>
              {t.label}
            </PillBtn>
          ))}
        </div>
      </header>

      {/* ── VISTA GENERAL ───────────────────────────────── */}
      {vista === 'general' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              titulo="Sesiones"
              valor={metricasGlobales.total_sesiones}
              icon={Flame}
              iconClass="text-sky-400"
              sub={`~${frecuenciaSemanal} sesiones/semana`}
            />
            <KpiCard
              titulo="Volumen total"
              valor={Number(metricasGlobales.volumen_total_kg || 0).toLocaleString('es-ES')}
              unidad="kg"
              icon={TrendingUp}
              iconClass="text-emerald-400"
              sub="Solo ejercicios con peso"
            />
            <KpiCard
              titulo="Tiempo entrenado"
              valor={formatMinutos(tiempoTotal)}
              icon={Clock}
              iconClass="text-violet-400"
              sub={`${Math.floor(tiempoTotal / 60)}h acumuladas`}
            />
            <KpiCard
              titulo="Racha actual"
              valor={rachaActual}
              unidad="días"
              icon={Activity}
              iconClass="text-amber-400"
              sub={`Máxima: ${rachaMaxima} días`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mes actual vs anterior */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-4">
                Mes actual vs anterior
              </h3>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <p className="text-[11px] text-neutral-500 mb-0.5">Este mes</p>
                  <p className="text-2xl font-semibold text-white">{comparativaMes.actual}</p>
                </div>
                <div className="text-neutral-700 text-sm mb-1">vs</div>
                <div>
                  <p className="text-[11px] text-neutral-500 mb-0.5">Anterior</p>
                  <p className="text-2xl font-semibold text-neutral-500">{comparativaMes.anterior}</p>
                </div>
                <div className={`
                  ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border
                  ${Number(diffPct) >= 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-300 border-red-500/20'}
                `}>
                  {Number(diffPct) >= 0
                    ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                    : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
                  {Math.abs(diffPct)}%
                </div>
              </div>
            </div>

            {/* Frecuencia semanal */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-3">
                Frecuencia semanal
              </h3>
              <p className="text-2xl font-semibold text-white mb-1">
                {frecuenciaSemanal}
                <span className="text-sm text-neutral-500 ml-1.5 font-normal">días/sem</span>
              </p>
              <p className="text-xs text-neutral-500 mb-3">Promedio 4 últimas semanas</p>
              <div className="flex gap-1">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full ${i < Math.round(frecuenciaSemanal) ? 'bg-sky-500' : 'bg-neutral-800'}`}
                  />
                ))}
              </div>
            </div>

            {/* Mejor mes */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-3">
                Mejor mes
              </h3>
              {mejorMes ? (
                <>
                  <p className="text-xl font-semibold text-amber-400">{mejorMes.mes}</p>
                  <p className="text-xs text-neutral-400 mt-1.5">
                    {mejorMes.sesiones} sesiones · {formatMinutos(mejorMes.minutos)}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">Tu mes más activo</p>
                </>
              ) : (
                <p className="text-neutral-500 text-sm italic">Sin datos suficientes</p>
              )}
            </div>
          </div>

          {/* Frecuencia mensual */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Frecuencia mensual</h3>
            <p className="text-sm text-neutral-400 mb-5">Sesiones completadas por mes</p>
            {datosMensuales.length > 0 ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosMensuales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} />
                    <Tooltip content={<TooltipBarra />} cursor={{ fill: '#171717' }} />
                    <Bar dataKey="sesiones" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-neutral-500 text-sm py-10">Registra sesiones para ver la gráfica.</p>
            )}
          </div>

          {/* Tiempo total por mes */}
          {datosMensuales.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Tiempo total por mes</h3>
              <p className="text-sm text-neutral-400 mb-5">Minutos acumulados de entrenamiento</p>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosMensuales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} unit="min" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #404040', borderRadius: 8 }}
                      labelStyle={{ color: '#8b5cf6', fontWeight: 500 }}
                      formatter={(v) => [formatMinutos(v), 'Tiempo']}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutos"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#gradViolet)"
                      dot={{ r: 4, fill: '#8b5cf6', stroke: '#0a0a0a', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VISTA POR EJERCICIO ─────────────────────────── */}
      {vista === 'ejercicios' && (
        <div className="flex flex-col gap-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Evolución por ejercicio</h3>
                <p className="text-sm text-neutral-400 mt-0.5">Adaptado al tipo de registro de cada uno</p>
              </div>
              <div className="relative w-full md:w-80">
                <select
                  value={ejercicioSeleccionado}
                  onChange={(e) => cargarEvolucion(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm py-2.5 pl-4 pr-10 rounded-lg appearance-none focus:outline-none focus:border-sky-500/50 cursor-pointer transition-colors"
                >
                  <option value="" className="bg-neutral-900">Selecciona un ejercicio...</option>
                  {ejercicios.map((ej) => (
                    <option key={ej.id_ejercicio} value={ej.id_ejercicio} className="bg-neutral-900">
                      {ej.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
              </div>
            </div>
          </div>

          {prEjercicio && ejercicioMeta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PR */}
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5 flex items-center gap-4">
                <div className="w-11 h-11 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Medal className="w-5 h-5 text-amber-300" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300 mb-0.5">
                    {evolutionConfig.prLabel}
                  </p>
                  <p className="text-2xl font-semibold text-white truncate">
                    {formatMetricValue(primaryKey, prEjercicio[primaryKey])}
                  </p>
                  <p className="text-xs text-amber-200/70 mt-0.5">{prEjercicio.fechaCorta}</p>
                </div>
              </div>

              {comparativaUltimas && (
                <>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-3">
                      Última vs penúltima
                    </p>
                    <div className="flex gap-3 items-end">
                      <div>
                        <p className="text-[10px] text-neutral-500">{comparativaUltimas.penultima.fechaCorta}</p>
                        <p className="text-lg font-semibold text-neutral-400">
                          {formatMetricValue(primaryKey, comparativaUltimas.penultima[primaryKey])}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-600 mb-1" strokeWidth={2} />
                      <div>
                        <p className="text-[10px] text-sky-400">{comparativaUltimas.ultima.fechaCorta}</p>
                        <p className="text-lg font-semibold text-white">
                          {formatMetricValue(primaryKey, comparativaUltimas.ultima[primaryKey])}
                        </p>
                      </div>
                    </div>
                    <div className={`
                      mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border
                      ${comparativaUltimas.diffPrimary >= 0
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-300 border-red-500/20'}
                    `}>
                      {comparativaUltimas.diffPrimary >= 0
                        ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                        : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
                      {formatMetricValue(primaryKey, Math.abs(comparativaUltimas.diffPrimary))}
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-3">
                      {evolutionConfig.secondaryLabel}
                    </p>
                    <div className="flex gap-3 items-end">
                      <div>
                        <p className="text-[10px] text-neutral-500">{comparativaUltimas.penultima.fechaCorta}</p>
                        <p className="text-lg font-semibold text-neutral-400">
                          {formatMetricValue(secondaryKey, comparativaUltimas.penultima[secondaryKey])}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-600 mb-1" strokeWidth={2} />
                      <div>
                        <p className="text-[10px] text-sky-400">{comparativaUltimas.ultima.fechaCorta}</p>
                        <p className="text-lg font-semibold text-white">
                          {formatMetricValue(secondaryKey, comparativaUltimas.ultima[secondaryKey])}
                        </p>
                      </div>
                    </div>
                    <div className={`
                      mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border
                      ${Number(comparativaUltimas.diffSecondary || 0) >= 0
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-300 border-red-500/20'}
                    `}>
                      {Number(comparativaUltimas.diffSecondary || 0) >= 0
                        ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                        : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
                      {formatMetricValue(secondaryKey, Math.abs(comparativaUltimas.diffSecondary || 0))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Gráfica principal */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">{evolutionConfig.primaryLabel}</h3>
            <p className="text-sm text-neutral-400 mb-5">
              {nombreEjercicioSeleccionado
                ? `${evolutionConfig.primaryLabel} por sesión — ${nombreEjercicioSeleccionado}`
                : 'Selecciona un ejercicio arriba'}
            </p>

            <div className="min-h-[360px] flex flex-col justify-center">
              {!ejercicioSeleccionado ? (
                <div className="text-center text-neutral-500 py-16">
                  <Target className="w-6 h-6 mx-auto mb-2 opacity-60" strokeWidth={2} />
                  <p className="text-sm">Elige un ejercicio para ver su evolución</p>
                </div>
              ) : cargandoEvolucion ? (
                <div className="text-center text-sky-400 py-16 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analizando historial...</span>
                </div>
              ) : datosEvolucion.length > 0 ? (
                <div className="w-full h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosEvolucion} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                      <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} unit={getAxisUnit(primaryKey)} />
                      <Tooltip content={<TooltipLinea />} cursor={{ stroke: '#404040', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      {prEjercicio && (
                        <ReferenceLine
                          y={prEjercicio[primaryKey]}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: `PR: ${formatMetricValue(primaryKey, prEjercicio[primaryKey])}`,
                            fill: '#f59e0b', fontSize: 11, fontWeight: 600,
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey={primaryKey}
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#0ea5e9', stroke: '#0a0a0a', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-neutral-500 py-16">
                  <p className="text-sm">Sin registros suficientes para este ejercicio.</p>
                </div>
              )}
            </div>
          </div>

          {/* Gráfica secundaria */}
          {datosEvolucion.length > 1 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">{evolutionConfig.secondaryLabel}</h3>
              <p className="text-sm text-neutral-400 mb-5">
                {evolutionConfig.secondaryLabel} por sesión — {nombreEjercicioSeleccionado}
              </p>
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosEvolucion} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} unit={getAxisUnit(secondaryKey)} />
                    <Tooltip content={<TooltipSecundaria />} />
                    <Area
                      type="monotone"
                      dataKey={secondaryKey}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#gradEmerald)"
                      dot={{ r: 3, fill: '#10b981', stroke: '#0a0a0a', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VISTA LOGROS ──────────────────────────────── */}
      {vista === 'logros' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HeroCard
              gradient="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30"
              icon={Crown}
              label="Volumen de fuerza"
              valor={`${Number(metricasGlobales.volumen_total_kg || 0).toLocaleString('es-ES')} kg`}
              sub={`En ${metricasGlobales.total_sesiones} sesiones completadas`}
            />
            <HeroCard
              gradient="bg-gradient-to-br from-orange-500/20 to-red-500/10 border-orange-500/30"
              icon={Flame}
              label="Racha máxima"
              valor={`${rachaMaxima} días seguidos`}
              sub={`Racha actual: ${rachaActual} ${rachaActual === 1 ? 'día' : 'días'}`}
            />
            <HeroCard
              gradient="bg-gradient-to-br from-indigo-500/20 to-violet-600/10 border-indigo-500/30"
              icon={Calendar}
              label="Mejor mes"
              valor={mejorMes ? mejorMes.mes : '—'}
              sub={mejorMes ? `${mejorMes.sesiones} sesiones · ${formatMinutos(mejorMes.minutos)}` : 'Sin datos'}
            />
            <HeroCard
              gradient="bg-gradient-to-br from-teal-500/20 to-emerald-600/10 border-teal-500/30"
              icon={CalendarDays}
              label="Mejor semana"
              valor={mejorSemana ? `${mejorSemana.count} sesiones` : '—'}
              sub={mejorSemana ? `Semana del ${mejorSemana.semana}` : 'Sin datos'}
            />
          </div>

          {/* Estadísticas globales */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5">Estadísticas globales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                <p className="text-2xl font-semibold text-sky-400">{metricasGlobales.total_sesiones}</p>
                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-1">Sesiones</p>
              </div>
              <div className="text-center p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                <p className="text-2xl font-semibold text-violet-400">{formatMinutos(tiempoTotal)}</p>
                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-1">Tiempo</p>
              </div>
              <div className="text-center p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                <p className="text-2xl font-semibold text-emerald-400">{frecuenciaSemanal}</p>
                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-1">Días/sem</p>
              </div>
              <div className="text-center p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                <p className="text-2xl font-semibold text-amber-400">{rachaActual}</p>
                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-1">Racha</p>
              </div>
            </div>
          </div>

          {/* Muro de récords */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Medal className="w-4 h-4 text-amber-400" strokeWidth={2} />
              <h3 className="text-lg font-semibold text-white">Muro de récords personales</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-5">
              Selecciona un ejercicio en la pestaña "Por ejercicio" para ver su mejor marca.
            </p>

            {prEjercicio && nombreEjercicioSeleccionado ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-lg p-4 text-center">
                  <Medal className="w-5 h-5 text-amber-300 mx-auto mb-2" strokeWidth={2} />
                  <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-widest truncate">
                    {nombreEjercicioSeleccionado}
                  </p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {formatMetricValue(primaryKey, prEjercicio[primaryKey])}
                  </p>
                  <p className="text-[10px] text-amber-200/60 mt-0.5">{prEjercicio.fechaCorta}</p>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-neutral-950 border border-dashed border-neutral-800 rounded-lg p-4 text-center opacity-40">
                    <Medal className="w-5 h-5 text-neutral-600 mx-auto mb-2" strokeWidth={2} />
                    <p className="text-[10px] font-medium text-neutral-600 uppercase tracking-widest">Próximo PR</p>
                    <p className="text-lg font-semibold text-neutral-700 mt-1">—</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Press banca', 'Sentadilla', 'Plancha', 'Cinta'].map((nombre) => (
                  <div key={nombre} className="bg-neutral-950 border border-dashed border-neutral-800 rounded-lg p-4 text-center opacity-50">
                    <Medal className="w-5 h-5 text-neutral-600 mx-auto mb-2" strokeWidth={2} />
                    <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">{nombre}</p>
                    <p className="text-lg font-semibold text-neutral-700 mt-1">—</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimas sesiones */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5">Últimas sesiones</h3>
            {historial.length > 0 ? (
              <div className="space-y-2">
                {historial.slice(0, 5).map((sesion) => {
                  const duracion = sesion.duracion_minutos || 0;
                  return (
                    <div
                      key={sesion.id_sesion}
                      className="flex items-center justify-between p-4 bg-neutral-950 rounded-lg border border-neutral-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center text-sky-300 font-semibold text-sm">
                          {new Date(sesion.fecha_inicio).getDate()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {sesion.nombre_rutina || 'Entrenamiento libre'}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {new Date(sesion.fecha_inicio).toLocaleDateString('es-ES', {
                              weekday: 'long', day: 'numeric', month: 'long',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-md">
                          {formatMinutos(duracion)}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                          Completado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm text-center py-8">Aún no hay sesiones registradas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}