import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';

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
      return {
        primaryKey: 'peso_maximo',
        secondaryKey: 'volumen_sesion',
        primaryLabel: 'Peso máximo',
        secondaryLabel: 'Volumen sesión',
        prLabel: 'Récord Personal',
      };
    case 'reps':
      return {
        primaryKey: 'reps_maximas',
        secondaryKey: 'reps_totales',
        primaryLabel: 'Mejor serie',
        secondaryLabel: 'Reps totales',
        prLabel: 'Mejor Serie',
      };
    case 'duracion':
      return {
        primaryKey: 'duracion_total_segundos',
        secondaryKey: 'duracion_maxima',
        primaryLabel: 'Duración total',
        secondaryLabel: 'Mejor serie',
        prLabel: 'Mejor Duración',
      };
    case 'distancia_duracion':
      return {
        primaryKey: 'distancia_total_metros',
        secondaryKey: 'duracion_total_segundos',
        primaryLabel: 'Distancia total',
        secondaryLabel: 'Duración total',
        prLabel: 'Mejor Distancia',
      };
    default:
      return {
        primaryKey: 'peso_maximo',
        secondaryKey: 'volumen_sesion',
        primaryLabel: 'Valor principal',
        secondaryLabel: 'Valor secundario',
        prLabel: 'Mejor marca',
      };
  }
};

const formatMetricValue = (key, value) => {
  const num = Number(value || 0);

  switch (key) {
    case 'peso_maximo':
      return `${num.toFixed(1)} kg`;
    case 'volumen_sesion':
      return `${Math.round(num).toLocaleString('es-ES')} kg`;
    case 'reps_maximas':
    case 'reps_totales':
      return `${Math.round(num)} reps`;
    case 'duracion_maxima':
    case 'duracion_total_segundos':
      return formatSegundos(num);
    case 'distancia_maxima':
    case 'distancia_total_metros':
      return formatDistancia(num);
    default:
      return `${num}`;
  }
};

const getAxisUnit = (key) => {
  switch (key) {
    case 'peso_maximo':
    case 'volumen_sesion':
      return ' kg';
    case 'reps_maximas':
    case 'reps_totales':
      return ' reps';
    case 'duracion_maxima':
    case 'duracion_total_segundos':
      return ' s';
    case 'distancia_maxima':
    case 'distancia_total_metros':
      return ' m';
    default:
      return '';
  }
};

export default function Metricas() {
  const [vista, setVista] = useState('general');

  const [metricasGlobales, setMetricasGlobales] = useState({
    total_sesiones: 0,
    volumen_total_kg: 0,
    distancia_total_metros: 0,
    duracion_total_segundos: 0
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
        if (resMetricas.ok) {
          setMetricasGlobales(await resMetricas.json());
        }

        const resHistorial = await fetch('http://127.0.0.1:5000/api/sesiones/historial', { headers });
        if (resHistorial.ok) {
          const hist = await resHistorial.json();
          const completadas = hist.filter(s => s.fecha_fin);
          setHistorial(completadas);

          const minutosTotales = completadas.reduce((acc, sesion) => acc + (parseInt(sesion.duracion_minutos, 10) || 0), 0);
          setTiempoTotal(minutosTotales);

          const diasConEntreno = [...new Set(completadas.map(s => new Date(s.fecha_inicio).toDateString()))]
            .map(d => new Date(d))
            .sort((a, b) => b - a);

          let racha = 0;
          let maxRacha = 0;
          let contRacha = 1;
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
                if (diff === 1) racha++;
                else break;
              }
            }

            for (let i = 1; i < diasConEntreno.length; i++) {
              const diff = Math.floor((diasConEntreno[i - 1] - diasConEntreno[i]) / 86400000);
              if (diff === 1) {
                contRacha++;
                maxRacha = Math.max(maxRacha, contRacha);
              } else {
                contRacha = 1;
              }
            }

            maxRacha = Math.max(maxRacha, racha, 1);
          }

          setRachaActual(racha);
          setRachaMaxima(maxRacha);

          const mesesMap = {};
          completadas.forEach(s => {
            const fecha = new Date(s.fecha_inicio);
            const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const label = fecha.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            if (!mesesMap[key]) {
              mesesMap[key] = {
                mes: label.charAt(0).toUpperCase() + label.slice(1),
                sesiones: 0,
                minutos: 0
              };
            }
            mesesMap[key].sesiones++;
            mesesMap[key].minutos += parseInt(s.duracion_minutos, 10) || 0;
          });

          const sortedMeses = Object.entries(mesesMap).sort(([a], [b]) => a.localeCompare(b));
          const dataBarras = sortedMeses.map(([, v]) => v);
          setDatosMensuales(dataBarras);

          if (dataBarras.length > 0) {
            const mejor = dataBarras.reduce((max, m) => m.sesiones > max.sesiones ? m : max, dataBarras[0]);
            setMejorMes(mejor);
          } else {
            setMejorMes(null);
          }

          const ahora = new Date();
          const claveActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
          const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
          const claveAnterior = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;

          setComparativaMes({
            actual: mesesMap[claveActual]?.sesiones || 0,
            anterior: mesesMap[claveAnterior]?.sesiones || 0,
          });

          const hace4Semanas = new Date();
          hace4Semanas.setDate(hace4Semanas.getDate() - 28);
          const sesionesRecientes = completadas.filter(s => new Date(s.fecha_inicio) >= hace4Semanas);
          setFrecuenciaSemanal(Number((sesionesRecientes.length / 4).toFixed(1)));

          const semanasMap = {};
          completadas.forEach(s => {
            const fecha = new Date(s.fecha_inicio);
            const inicioSemana = new Date(fecha);
            inicioSemana.setDate(fecha.getDate() - fecha.getDay());
            const key = inicioSemana.toLocaleDateString('es-ES');
            semanasMap[key] = (semanasMap[key] || 0) + 1;
          });

          const maxSemana = Object.entries(semanasMap).reduce(
            (max, [k, v]) => (v > max.count ? { semana: k, count: v } : max),
            { semana: null, count: 0 }
          );
          setMejorSemana(maxSemana.semana ? maxSemana : null);
        }

        const resEj = await fetch('http://127.0.0.1:5000/api/ejercicios', { headers });
        if (resEj.ok) {
          const data = await resEj.json();
          setEjercicios(Array.isArray(data) ? data.filter(e => e.activo !== false) : []);
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
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setCargandoEvolucion(false);
        return;
      }

      const payload = await res.json();
      const meta = payload?.ejercicio || null;
      const datos = Array.isArray(payload?.evolucion) ? payload.evolucion : [];

      setEjercicioMeta(meta);

      if (datos.length === 0) {
        setDatosEvolucion([]);
        return;
      }

      const evolucion = datos.map(d => ({
        ...d,
        fechaCorta: new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      }));

      setDatosEvolucion(evolucion);

      const cfg = getEvolutionConfig(meta?.tipo_registro);
      const primaryKey = cfg.primaryKey;
      const secondaryKey = cfg.secondaryKey;

      const pr = evolucion.reduce((max, item) => (Number(item[primaryKey]) > Number(max[primaryKey]) ? item : max), evolucion[0]);
      setPrEjercicio(pr);

      if (evolucion.length >= 2) {
        const ultima = evolucion[evolucion.length - 1];
        const penultima = evolucion[evolucion.length - 2];

        setComparativaUltimas({
          ultima,
          penultima,
          primaryKey,
          secondaryKey,
          diffPrimary: Number(ultima[primaryKey]) - Number(penultima[primaryKey]),
          diffSecondary: secondaryKey ? (Number(ultima[secondaryKey]) - Number(penultima[secondaryKey])) : null
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
    ejercicios.find(e => String(e.id_ejercicio) === String(ejercicioSeleccionado))?.nombre ||
    '';

  const evolutionConfig = getEvolutionConfig(ejercicioMeta?.tipo_registro);
  const primaryKey = evolutionConfig.primaryKey;
  const secondaryKey = evolutionConfig.secondaryKey;

  const TooltipLinea = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-700 min-w-[160px]">
        <p className="font-bold text-blue-400 mb-1 text-xs">{label}</p>
        <p className="text-xl font-black">{formatMetricValue(primaryKey, payload[0].value)}</p>
      </div>
    );
  };

  const TooltipSecundaria = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-700 min-w-[160px]">
        <p className="font-bold text-green-400 mb-1 text-xs">{label}</p>
        <p className="text-xl font-black">{formatMetricValue(secondaryKey, payload[0].value)}</p>
      </div>
    );
  };

  const TooltipBarra = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-700">
        <p className="font-bold text-green-400 mb-1 text-xs">{label}</p>
        <p className="text-xl font-black">{payload[0].value} <span className="text-sm font-normal text-gray-400">sesiones</span></p>
        {payload[1] && <p className="text-sm text-purple-300 mt-1">{formatMinutos(payload[1].value)} entrenados</p>}
      </div>
    );
  };

  const KpiCard = ({ titulo, valor, unidad, icono, colorClase, sub }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">{titulo}</h3>
        <span className="text-xl">{icono}</span>
      </div>
      <p className={`text-4xl font-black ${colorClase}`}>
        {valor}
        {unidad && <span className="text-base font-medium text-gray-400 ml-1">{unidad}</span>}
      </p>
      {sub && <p className="text-xs text-gray-400 font-medium">{sub}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Centro de Análisis 📊</h2>
          <p className="text-gray-500 font-medium mt-1">Tus datos transformados en progreso real.</p>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
          {[
            { id: 'general', label: 'Resumen General' },
            { id: 'ejercicios', label: 'Por Ejercicio' },
            { id: 'logros', label: 'Logros y Récords' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setVista(tab.id)}
              className={`flex-1 md:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${vista === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {vista === 'general' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard titulo="Sesiones Totales" valor={metricasGlobales.total_sesiones} icono="🏋️" colorClase="text-blue-600" sub={`~${frecuenciaSemanal} sesiones/semana`} />
            <KpiCard titulo="Volumen de Fuerza" valor={Number(metricasGlobales.volumen_total_kg || 0).toLocaleString('es-ES')} unidad="kg" icono="⚖️" colorClase="text-green-600" sub="Solo ejercicios con peso" />
            <KpiCard titulo="Tiempo Entrenado" valor={formatMinutos(tiempoTotal)} icono="⏱️" colorClase="text-purple-600" sub={`${Math.floor(tiempoTotal / 60)}h en el gimnasio`} />
            <KpiCard titulo="Racha Actual" valor={rachaActual} unidad="días" icono="🔥" colorClase="text-orange-500" sub={`Máxima racha: ${rachaMaxima} días`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Mes Actual vs Anterior</h3>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Este mes</p>
                  <p className="text-3xl font-black text-blue-600">{comparativaMes.actual}</p>
                </div>
                <div className="text-gray-300 text-xl font-light mb-1">vs</div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Mes anterior</p>
                  <p className="text-3xl font-black text-gray-400">{comparativaMes.anterior}</p>
                </div>
                <div className={`ml-auto px-3 py-1.5 rounded-xl text-sm font-black ${Number(diffPct) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {Number(diffPct) >= 0 ? '↑' : '↓'} {Math.abs(diffPct)}%
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Frecuencia Semanal</h3>
              <p className="text-3xl font-black text-indigo-600">{frecuenciaSemanal}<span className="text-base font-medium text-gray-400 ml-1">días/sem</span></p>
              <p className="text-xs text-gray-400">Promedio de las últimas 4 semanas</p>
              <div className="flex gap-1 mt-1">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i < Math.round(frecuenciaSemanal) ? 'bg-indigo-500' : 'bg-gray-100'}`} />
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Mejor Mes Histórico</h3>
              {mejorMes ? (
                <>
                  <p className="text-2xl font-black text-yellow-500">{mejorMes.mes}</p>
                  <p className="text-sm font-bold text-gray-600">{mejorMes.sesiones} sesiones · {formatMinutos(mejorMes.minutos)}</p>
                  <p className="text-xs text-gray-400">Tu mes más activo de toda tu historia 🏆</p>
                </>
              ) : (
                <p className="text-gray-400 text-sm italic">Sin datos suficientes</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-2">Frecuencia Mensual 📅</h3>
            <p className="text-sm text-gray-400 mb-6">Número de sesiones completadas por mes</p>

            {datosMensuales.length > 0 ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosMensuales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                    <Tooltip content={<TooltipBarra />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="sesiones" fill="#10b981" radius={[8, 8, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 italic py-10">Registra sesiones para ver la gráfica mensual.</p>
            )}
          </div>

          {datosMensuales.length > 0 && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-2">Tiempo Total por Mes ⏱️</h3>
              <p className="text-sm text-gray-400 mb-6">Minutos de entrenamiento acumulados cada mes</p>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosMensuales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} unit="min" />
                    <Tooltip formatter={(v) => [formatMinutos(v), 'Tiempo']} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="minutos" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradPurple)" dot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === 'ejercicios' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Evolución por Ejercicio 💪</h3>
                <p className="text-sm text-gray-500 mt-1">Adaptado al tipo de registro de cada ejercicio</p>
              </div>

              <select
                value={ejercicioSeleccionado}
                onChange={(e) => cargarEvolucion(e.target.value)}
                className="w-full md:w-80 bg-blue-50 border-none text-blue-800 font-bold p-4 rounded-xl cursor-pointer focus:ring-4 focus:ring-blue-100 outline-none"
              >
                <option value="">🎯 Seleccionar ejercicio...</option>
                {ejercicios.map(ej => (
                  <option key={ej.id_ejercicio} value={ej.id_ejercicio}>{ej.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {prEjercicio && ejercicioMeta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-6 rounded-3xl shadow-md text-white flex items-center gap-4">
                <div className="text-4xl">🥇</div>
                <div>
                  <p className="text-yellow-100 text-xs font-bold uppercase tracking-widest">{evolutionConfig.prLabel}</p>
                  <p className="text-3xl font-black">{formatMetricValue(primaryKey, prEjercicio[primaryKey])}</p>
                  <p className="text-yellow-100 text-xs mt-1">{prEjercicio.fechaCorta}</p>
                </div>
              </div>

              {comparativaUltimas && (
                <>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Última vs Penúltima</p>
                    <div className="flex gap-4 items-end">
                      <div>
                        <p className="text-xs text-gray-400">{comparativaUltimas.penultima.fechaCorta}</p>
                        <p className="text-2xl font-black text-gray-400">{formatMetricValue(primaryKey, comparativaUltimas.penultima[primaryKey])}</p>
                      </div>
                      <div className="text-gray-200 text-lg">→</div>
                      <div>
                        <p className="text-xs text-blue-500">{comparativaUltimas.ultima.fechaCorta}</p>
                        <p className="text-2xl font-black text-blue-600">{formatMetricValue(primaryKey, comparativaUltimas.ultima[primaryKey])}</p>
                      </div>
                    </div>
                    <div className={`mt-3 inline-block px-3 py-1 rounded-xl text-xs font-black ${comparativaUltimas.diffPrimary >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {comparativaUltimas.diffPrimary >= 0 ? '↑' : '↓'} {formatMetricValue(primaryKey, Math.abs(comparativaUltimas.diffPrimary))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{evolutionConfig.secondaryLabel}</p>
                    <div className="flex gap-4 items-end">
                      <div>
                        <p className="text-xs text-gray-400">{comparativaUltimas.penultima.fechaCorta}</p>
                        <p className="text-2xl font-black text-gray-400">{formatMetricValue(secondaryKey, comparativaUltimas.penultima[secondaryKey])}</p>
                      </div>
                      <div className="text-gray-200 text-lg">→</div>
                      <div>
                        <p className="text-xs text-blue-500">{comparativaUltimas.ultima.fechaCorta}</p>
                        <p className="text-2xl font-black text-blue-600">{formatMetricValue(secondaryKey, comparativaUltimas.ultima[secondaryKey])}</p>
                      </div>
                    </div>
                    <div className={`mt-3 inline-block px-3 py-1 rounded-xl text-xs font-black ${Number(comparativaUltimas.diffSecondary || 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {Number(comparativaUltimas.diffSecondary || 0) >= 0 ? '↑' : '↓'} {formatMetricValue(secondaryKey, Math.abs(comparativaUltimas.diffSecondary || 0))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-1">{evolutionConfig.primaryLabel}</h3>
            <p className="text-sm text-gray-400 mb-6">
              {nombreEjercicioSeleccionado ? `${evolutionConfig.primaryLabel} por sesión — ${nombreEjercicioSeleccionado}` : 'Selecciona un ejercicio arriba'}
            </p>

            <div className="min-h-[360px] flex flex-col justify-center">
              {!ejercicioSeleccionado ? (
                <div className="text-center text-gray-400 py-16">
                  <div className="text-5xl mb-4 opacity-40">📈</div>
                  <p className="font-bold">Elige un ejercicio para ver su evolución</p>
                </div>
              ) : cargandoEvolucion ? (
                <div className="text-center text-blue-500 animate-pulse font-bold py-16">Analizando historial... ⏳</div>
              ) : datosEvolucion.length > 0 ? (
                <div className="w-full h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosEvolucion} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} unit={getAxisUnit(primaryKey)} />
                      <Tooltip content={<TooltipLinea />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                      {prEjercicio && (
                        <ReferenceLine
                          y={prEjercicio[primaryKey]}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          label={{ value: `PR: ${formatMetricValue(primaryKey, prEjercicio[primaryKey])}`, fill: '#f59e0b', fontSize: 11, fontWeight: 'bold' }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey={primaryKey}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 7 }}
                        animationDuration={1200}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-16">
                  <p className="font-bold">Sin registros suficientes para este ejercicio aún.</p>
                </div>
              )}
            </div>
          </div>

          {datosEvolucion.length > 1 && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-1">{evolutionConfig.secondaryLabel}</h3>
              <p className="text-sm text-gray-400 mb-6">{evolutionConfig.secondaryLabel} por sesión — {nombreEjercicioSeleccionado}</p>
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosEvolucion} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} unit={getAxisUnit(secondaryKey)} />
                    <Tooltip content={<TooltipSecundaria />} />
                    <Area
                      type="monotone"
                      dataKey={secondaryKey}
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#gradGreen)"
                      dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === 'logros' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden flex items-center gap-6">
              <div className="absolute -right-4 -bottom-4 opacity-20 text-8xl">🏆</div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm text-4xl">👑</div>
              <div className="relative z-10">
                <h4 className="text-yellow-100 text-xs font-bold uppercase tracking-widest mb-1">Volumen de Fuerza</h4>
                <p className="text-3xl font-black">{Number(metricasGlobales.volumen_total_kg || 0).toLocaleString('es-ES')} kg</p>
                <p className="text-yellow-100 text-sm mt-1">En {metricasGlobales.total_sesiones} sesiones completadas</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden flex items-center gap-6">
              <div className="absolute -right-4 -bottom-4 opacity-20 text-8xl">🔥</div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm text-4xl">🔥</div>
              <div className="relative z-10">
                <h4 className="text-red-100 text-xs font-bold uppercase tracking-widest mb-1">Racha Máxima</h4>
                <p className="text-3xl font-black">{rachaMaxima} días seguidos</p>
                <p className="text-red-100 text-sm mt-1">Racha actual: {rachaActual} {rachaActual === 1 ? 'día' : 'días'}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden flex items-center gap-6">
              <div className="absolute -right-4 -bottom-4 opacity-20 text-8xl">📅</div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm text-4xl">📆</div>
              <div className="relative z-10">
                <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Mejor Mes</h4>
                <p className="text-2xl font-black">{mejorMes ? mejorMes.mes : '—'}</p>
                <p className="text-indigo-100 text-sm mt-1">{mejorMes ? `${mejorMes.sesiones} sesiones · ${formatMinutos(mejorMes.minutos)}` : 'Sin datos aún'}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden flex items-center gap-6">
              <div className="absolute -right-4 -bottom-4 opacity-20 text-8xl">📋</div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm text-4xl">🗓️</div>
              <div className="relative z-10">
                <h4 className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Mejor Semana</h4>
                <p className="text-2xl font-black">{mejorSemana ? `${mejorSemana.count} sesiones` : '—'}</p>
                <p className="text-teal-100 text-sm mt-1">{mejorSemana ? `Semana del ${mejorSemana.semana}` : 'Sin datos aún'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6">📊 Estadísticas Globales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-blue-600">{metricasGlobales.total_sesiones}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Sesiones</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-purple-600">{formatMinutos(tiempoTotal)}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Tiempo Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-green-600">{frecuenciaSemanal}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Días/Semana</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-orange-500">{rachaActual}🔥</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Racha Actual</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">🏅 Muro de Récords Personales</h3>
            <p className="text-sm text-gray-400 mb-6">Selecciona un ejercicio en la pestaña "Por Ejercicio" para ver su mejor marca.</p>

            {prEjercicio && nombreEjercicioSeleccionado ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 p-5 rounded-2xl text-center">
                  <div className="text-3xl mb-2">🥇</div>
                  <p className="text-xs font-bold text-amber-600 uppercase truncate">{nombreEjercicioSeleccionado}</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{formatMetricValue(primaryKey, prEjercicio[primaryKey])}</p>
                  <p className="text-xs text-gray-400 mt-1">{prEjercicio.fechaCorta}</p>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-50 border border-dashed border-gray-200 p-5 rounded-2xl text-center opacity-40">
                    <div className="text-3xl mb-2">🥇</div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Próximo PR</p>
                    <p className="text-xl font-black text-gray-300 mt-1">--</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Press banca', 'Sentadilla', 'Plancha', 'Cinta'].map(nombre => (
                  <div key={nombre} className="bg-gray-50 border border-dashed border-gray-200 p-5 rounded-2xl text-center opacity-50">
                    <div className="text-3xl mb-2">🥇</div>
                    <p className="text-xs font-bold text-gray-400 uppercase">{nombre}</p>
                    <p className="text-xl font-black text-gray-300 mt-1">--</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6">Últimas Sesiones 🗓️</h3>
            {historial.length > 0 ? (
              <div className="flex flex-col gap-3">
                {historial.slice(0, 5).map(sesion => {
                  const duracion = sesion.duracion_minutos || 0;
                  return (
                    <div key={sesion.id_sesion} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm">
                          {new Date(sesion.fecha_inicio).getDate()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{sesion.nombre_rutina || 'Entrenamiento libre'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(sesion.fecha_inicio).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">{formatMinutos(duracion)}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-xl">✔ Completado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic text-center py-8">Aún no hay sesiones registradas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}