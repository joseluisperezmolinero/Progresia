import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Dumbbell, FileText, AlertTriangle, PlusCircle,
  LogOut, Shield, Search, RefreshCw, Pencil, Trash2, UserCog, UserMinus,
  Loader2, AlertCircle, CheckCircle2, Info, XCircle, Save, Clock, ChevronDown,
  Activity, Database, TrendingUp, BarChart3, Menu, X, ArrowLeft,
} from 'lucide-react';
import AdminEjerciciosPanel from './AdminEjerciciosPanel';

const API_BASE = 'http://127.0.0.1:5000/api/admin';

const ESTADOS_INCIDENCIA = ['Abierta', 'En progreso', 'Resuelta', 'Cerrada'];
const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];
const CATEGORIAS = ['general', 'backend', 'frontend', 'base_de_datos', 'seguridad', 'api'];

const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  try { return new Date(fecha).toLocaleString(); } catch { return fecha; }
};

// ── Colores de estado y tipo ──────────────────────────────────────────
const colorTipoLog = (tipo = '') => {
  const t = String(tipo).toUpperCase();
  if (t === 'ERROR')   return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (t === 'WARNING') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (t === 'INFO')    return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
  return 'bg-neutral-800 text-neutral-300 border-neutral-700';
};

const iconoTipoLog = (tipo = '') => {
  const t = String(tipo).toUpperCase();
  if (t === 'ERROR')   return XCircle;
  if (t === 'WARNING') return AlertTriangle;
  if (t === 'INFO')    return Info;
  return Info;
};

const colorEstadoIncidencia = (estado = '') => {
  const e = String(estado).toLowerCase();
  if (e === 'abierta')      return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (e === 'en progreso')  return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (e === 'resuelta')     return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (e === 'cerrada')      return 'bg-neutral-800 text-neutral-400 border-neutral-700';
  return 'bg-neutral-800 text-neutral-300 border-neutral-700';
};

const colorPrioridad = (prioridad = '') => {
  const p = String(prioridad).toLowerCase();
  if (p === 'critica') return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (p === 'alta')    return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
  if (p === 'media')   return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (p === 'baja')    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  return 'bg-neutral-800 text-neutral-300 border-neutral-700';
};

// ── Componentes auxiliares ────────────────────────────────────────────
const NavItem = ({ icon: Icon, label, active, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
      ${active
        ? 'bg-white text-neutral-900'
        : highlight
          ? 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/20'
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}
    `}
  >
    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
    <span>{label}</span>
  </button>
);

const KpiCard = ({ label, valor, icon: Icon, iconClass }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${iconClass}`} strokeWidth={2} />
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">{label}</h3>
    </div>
    <p className="text-3xl font-semibold text-white">{valor}</p>
  </div>
);

export default function DashboardAdmin() {
  const [adminName, setAdminName] = useState('Administrador');
  const [adminId, setAdminId] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('resumen');
  const [cargando, setCargando] = useState(true);

  /* ── Sidebar móvil ───────────────────────────────────────
     Mismo patrón que el Dashboard normal: cerrado por defecto,
     se abre con la hamburguesa, se cierra al cambiar de vista. */
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  useEffect(() => { setSidebarAbierto(false); }, [vistaActiva]);
  useEffect(() => {
    if (sidebarAbierto) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarAbierto]);
  const [errorGeneral, setErrorGeneral] = useState('');

  const [resumen, setResumen] = useState({
    total_usuarios: 0, total_admins: 0, total_sesiones: 0,
    sesiones_completadas: 0, incidencias_abiertas: 0, total_logs: 0,
  });

  const [logs, setLogs] = useState([]);
  const [tipoLogFiltro, setTipoLogFiltro] = useState('');

  const [incidencias, setIncidencias] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formUsuario, setFormUsuario] = useState({ nombre: '', apellidos: '', email: '' });
  const [procesandoUsuario, setProcesandoUsuario] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [filtroRolUsuario, setFiltroRolUsuario] = useState('todos');

  const [formIncidencia, setFormIncidencia] = useState({
    titulo: '', descripcion: '', prioridad: 'media', categoria: 'general', notas_seguimiento: '',
  });
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [actualizandoIncidencia, setActualizandoIncidencia] = useState({ estado: '', notas_seguimiento: '' });

  /* En móvil alternamos entre lista/detalle dentro de Usuarios e Incidencias.
     En xl+ se ven ambos lado a lado. */
  const [vistaMobileUsuarios, setVistaMobileUsuarios] = useState('lista');
  const [vistaMobileIncidencias, setVistaMobileIncidencias] = useState('lista');

  /* Reset al cambiar de pestaña */
  useEffect(() => {
    setVistaMobileUsuarios('lista');
    setVistaMobileIncidencias('lista');
  }, [vistaActiva]);


  const token = localStorage.getItem('token');

  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const texto = busquedaUsuario.trim().toLowerCase();
      const coincideBusqueda = !texto ||
        usuario.nombre?.toLowerCase().includes(texto) ||
        usuario.apellidos?.toLowerCase().includes(texto) ||
        usuario.email?.toLowerCase().includes(texto);
      const coincideRol = filtroRolUsuario === 'todos' ||
        (filtroRolUsuario === 'admin' && usuario.es_admin) ||
        (filtroRolUsuario === 'usuario' && !usuario.es_admin);
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busquedaUsuario, filtroRolUsuario]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const cargarPerfil = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/usuarios/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo obtener el perfil');
    const data = await res.json();
    if (!data.es_admin) throw new Error('Tu usuario no tiene permisos de administrador');
    setAdminName(data.nombre?.trim() || 'Administrador');
    setAdminId(data.id_usuario);
  };

  const cargarResumen = async () => {
    const res = await fetch(`${API_BASE}/resumen`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar el resumen del sistema');
    setResumen(data);
  };

  const cargarLogs = async (tipo = '') => {
    const query = tipo ? `?tipo_evento=${encodeURIComponent(tipo)}` : '';
    const res = await fetch(`${API_BASE}/logs${query}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los logs');
    setLogs(Array.isArray(data) ? data : []);
  };

  const cargarIncidencias = async (estado = '') => {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    const res = await fetch(`${API_BASE}/incidencias${query}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las incidencias');
    const lista = Array.isArray(data) ? data : [];
    setIncidencias(lista);
    if (incidenciaSeleccionada) {
      const actualizada = lista.find((i) => i.id_incidencia === incidenciaSeleccionada.id_incidencia);
      setIncidenciaSeleccionada(actualizada || null);
      if (actualizada) {
        setActualizandoIncidencia({
          estado: actualizada.estado || '',
          notas_seguimiento: actualizada.notas_seguimiento || '',
        });
      }
    }
  };

  const cargarUsuarios = async () => {
    try {
      setCargandoUsuarios(true);
      const res = await fetch(`${API_BASE}/usuarios`, { headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setErrorGeneral(error.message || 'Error al cargar usuarios');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      if (!token) { window.location.reload(); return; }
      try {
        setCargando(true);
        setErrorGeneral('');
        await cargarPerfil();
        await Promise.all([cargarResumen(), cargarLogs(), cargarIncidencias(), cargarUsuarios()]);
      } catch (error) {
        console.error(error);
        setErrorGeneral(error.message || 'Error al cargar el panel de administración');
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, [token]);

  const handleCrearIncidencia = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    try {
      const res = await fetch(`${API_BASE}/incidencias`, {
        method: 'POST', headers, body: JSON.stringify(formIncidencia),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la incidencia');
      setFormIncidencia({ titulo: '', descripcion: '', prioridad: 'media', categoria: 'general', notas_seguimiento: '' });
      await cargarIncidencias(estadoFiltro);
      await cargarResumen();
      setVistaActiva('incidencias');
    } catch (error) {
      setErrorGeneral(error.message || 'Error al crear la incidencia');
    }
  };

  const seleccionarIncidencia = (incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setActualizandoIncidencia({
      estado: incidencia.estado || '',
      notas_seguimiento: incidencia.notas_seguimiento || '',
    });
    setVistaMobileIncidencias('detalle');
  };

  const handleActualizarIncidencia = async (e) => {
    e.preventDefault();
    if (!incidenciaSeleccionada) return;
    setErrorGeneral('');
    try {
      const res = await fetch(`${API_BASE}/incidencias/${incidenciaSeleccionada.id_incidencia}`, {
        method: 'PUT', headers, body: JSON.stringify(actualizandoIncidencia),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la incidencia');
      await cargarIncidencias(estadoFiltro);
      await cargarResumen();
    } catch (error) {
      setErrorGeneral(error.message || 'Error al actualizar la incidencia');
    }
  };

  const cambiarRolAdmin = async (usuario) => {
    try {
      setErrorGeneral('');
      const res = await fetch(`${API_BASE}/usuarios/${usuario.id_usuario}/rol`, {
        method: 'PUT', headers, body: JSON.stringify({ es_admin: !usuario.es_admin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el rol');
      await cargarUsuarios();
      await cargarResumen();
    } catch (error) {
      setErrorGeneral(error.message || 'Error al actualizar el rol');
    }
  };

  const abrirEdicionUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setFormUsuario({
      nombre: usuario.nombre || '',
      apellidos: usuario.apellidos || '',
      email: usuario.email || '',
    });
    setVistaMobileUsuarios('detalle');
  };

  const cerrarEdicionUsuario = () => {
    setUsuarioEditando(null);
    setFormUsuario({ nombre: '', apellidos: '', email: '' });
    setVistaMobileUsuarios('lista');
  };

  const guardarEdicionUsuario = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    try {
      setProcesandoUsuario(true);
      setErrorGeneral('');
      const res = await fetch(`${API_BASE}/usuarios/${usuarioEditando.id_usuario}`, {
        method: 'PUT', headers, body: JSON.stringify(formUsuario),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el usuario');
      await cargarUsuarios();
      cerrarEdicionUsuario();
    } catch (error) {
      setErrorGeneral(error.message || 'Error al actualizar usuario');
    } finally {
      setProcesandoUsuario(false);
    }
  };

  const eliminarUsuario = async (usuario) => {
    const confirmado = window.confirm(
      `¿Eliminar al usuario ${usuario.nombre} ${usuario.apellidos || ''}? Esta acción es irreversible.`
    );
    if (!confirmado) return;
    try {
      setErrorGeneral('');
      const res = await fetch(`${API_BASE}/usuarios/${usuario.id_usuario}`, {
        method: 'DELETE', headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el usuario');
      await cargarUsuarios();
      await cargarResumen();
      if (usuarioEditando?.id_usuario === usuario.id_usuario) cerrarEdicionUsuario();
    } catch (error) {
      setErrorGeneral(error.message || 'Error al eliminar usuario');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando panel de administración...
      </div>
    );
  }

  const tituloVista = {
    resumen:           'Resumen del sistema',
    usuarios:          'Gestión de usuarios',
    ejercicios:        'Catálogo de ejercicios',
    logs:              'Registro del sistema',
    incidencias:       'Incidencias técnicas',
    'nueva-incidencia': 'Nueva incidencia',
  }[vistaActiva];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 lg:flex">
      {/* ══════════════════════════════════════════════════════
          TOPBAR MÓVIL — solo aparece en <lg
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
          <div className="leading-tight">
            <span className="text-base font-semibold tracking-tight text-white block">Progresia</span>
            <span className="text-[9px] uppercase tracking-widest text-sky-400 font-medium">Admin</span>
          </div>
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

      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-72 lg:w-64 h-screen
          bg-neutral-900 border-r border-neutral-800
          flex flex-col p-5 self-start
          transition-transform duration-300 ease-out
          ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/logo_sin_nombre.png"
                alt="Progresia"
                className="block w-full h-full object-contain scale-[1.22]"
                draggable={false}
              />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight block leading-tight text-white">Progresia</span>
              <span className="text-[10px] uppercase tracking-widest text-sky-400 font-medium">Admin</span>
            </div>
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
        <p className="text-xs text-neutral-500 mb-8 px-2">Hola, {adminName}</p>

        <nav className="flex-1 space-y-1">
          <NavItem icon={LayoutDashboard} label="Resumen"             active={vistaActiva === 'resumen'}           onClick={() => setVistaActiva('resumen')} />
          <NavItem icon={Users}           label="Usuarios"            active={vistaActiva === 'usuarios'}          onClick={() => setVistaActiva('usuarios')} />
          <NavItem icon={Dumbbell}        label="Ejercicios"          active={vistaActiva === 'ejercicios'}        onClick={() => setVistaActiva('ejercicios')} />
          <NavItem icon={FileText}        label="Logs"                active={vistaActiva === 'logs'}              onClick={() => setVistaActiva('logs')} />
          <NavItem icon={AlertTriangle}   label="Incidencias"         active={vistaActiva === 'incidencias'}       onClick={() => setVistaActiva('incidencias')} />
          <NavItem icon={PlusCircle}      label="Nueva incidencia"    active={vistaActiva === 'nueva-incidencia'}  highlight onClick={() => setVistaActiva('nueva-incidencia')} />
        </nav>

        <button
          onClick={cerrarSesion}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* ── MAIN ────────────────────────────────────────── */}
      <main className="flex-1 p-4 lg:p-10 min-h-screen">
        <header className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">{tituloVista}</h1>
            <p className="text-neutral-400 mt-1 text-sm">
              Supervisión técnica y mantenimiento de la plataforma.
            </p>
          </div>
          <div className="text-xs font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg capitalize">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        {errorGeneral && (
          <div className="mb-6 flex items-start gap-2 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm font-medium">{errorGeneral}</span>
          </div>
        )}

        {/* ── RESUMEN ───────────────────────────────────── */}
        {vistaActiva === 'resumen' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              <KpiCard label="Usuarios totales"      valor={resumen.total_usuarios}       icon={Users}         iconClass="text-sky-400" />
              <KpiCard label="Administradores"       valor={resumen.total_admins}         icon={Shield}        iconClass="text-indigo-400" />
              <KpiCard label="Sesiones registradas"  valor={resumen.total_sesiones}       icon={Activity}      iconClass="text-emerald-400" />
              <KpiCard label="Sesiones completadas"  valor={resumen.sesiones_completadas} icon={CheckCircle2}  iconClass="text-emerald-400" />
              <KpiCard label="Incidencias abiertas"  valor={resumen.incidencias_abiertas} icon={AlertTriangle} iconClass="text-red-400" />
              <KpiCard label="Logs totales"          valor={resumen.total_logs}           icon={FileText}      iconClass="text-neutral-400" />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5">Estado rápido</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" strokeWidth={2} />
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">Supervisión</p>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Desde aquí controlas usuarios, actividad general, trazabilidad del sistema e incidencias técnicas.
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-neutral-400" strokeWidth={2} />
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Siguiente paso</p>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Revisa las incidencias abiertas y consulta los logs si detectas errores o anomalías.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USUARIOS ──────────────────────────────────── */}
        {vistaActiva === 'usuarios' && (
          <div className="xl:grid xl:grid-cols-2 xl:gap-6">
            <div className={`
              ${vistaMobileUsuarios === 'detalle' ? 'hidden xl:block' : 'block'}
              bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6
            `}>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Usuarios del sistema</h3>
                  <p className="text-sm text-neutral-400 mt-0.5">
                    Gestiona permisos y edita perfiles.
                  </p>
                </div>
                <button
                  onClick={cargarUsuarios}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                  Recargar
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellidos o email"
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filtroRolUsuario}
                    onChange={(e) => setFiltroRolUsuario(e.target.value)}
                    className="w-full sm:w-auto bg-neutral-950 border border-neutral-800 rounded-lg px-3 pr-9 py-2 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50 cursor-pointer"
                  >
                    <option value="todos" className="bg-neutral-900">Todos los roles</option>
                    <option value="admin" className="bg-neutral-900">Solo administradores</option>
                    <option value="usuario" className="bg-neutral-900">Solo usuarios</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
                </div>
              </div>

              <p className="text-xs text-neutral-500 mb-4">
                Mostrando {usuariosFiltrados.length} de {usuarios.length}
              </p>

              {cargandoUsuarios ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-neutral-400 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando usuarios...
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
                  No hay usuarios que coincidan con los filtros.
                </div>
              ) : (
                <div className="space-y-2">
                  {usuariosFiltrados.map((usuario) => (
                    <div
                      key={usuario.id_usuario}
                      className={`
                        border rounded-lg p-4 transition-colors
                        ${usuarioEditando?.id_usuario === usuario.id_usuario
                          ? 'border-sky-500/40 bg-sky-500/5'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'}
                      `}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white truncate">
                              {usuario.nombre} {usuario.apellidos || ''}
                            </p>
                            <span className={`
                              text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider
                              ${usuario.es_admin
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'}
                            `}>
                              {usuario.es_admin ? 'Admin' : 'Usuario'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{usuario.email}</p>
                          <p className="text-[10px] text-neutral-600 mt-1.5 uppercase tracking-wider">
                            ID #{usuario.id_usuario} · Alta: {formatearFecha(usuario.fecha_registro)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => cambiarRolAdmin(usuario)}
                            disabled={Number(usuario.id_usuario) === Number(adminId)}
                            className={`
                              flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                              disabled:opacity-40 disabled:cursor-not-allowed
                              ${usuario.es_admin
                                ? 'bg-neutral-800 hover:bg-red-500/10 text-neutral-300 hover:text-red-300'
                                : 'bg-neutral-800 hover:bg-emerald-500/10 text-neutral-300 hover:text-emerald-300'}
                            `}
                          >
                            {usuario.es_admin
                              ? <UserMinus className="w-3.5 h-3.5" strokeWidth={2} />
                              : <UserCog className="w-3.5 h-3.5" strokeWidth={2} />}
                            {usuario.es_admin ? 'Quitar admin' : 'Hacer admin'}
                          </button>

                          <button
                            onClick={() => abrirEdicionUsuario(usuario)}
                            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                            Editar
                          </button>

                          <button
                            onClick={() => eliminarUsuario(usuario)}
                            disabled={Number(usuario.id_usuario) === Number(adminId)}
                            className="flex items-center gap-1 bg-neutral-800 hover:bg-red-500/10 text-red-400 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`
              ${vistaMobileUsuarios === 'lista' ? 'hidden xl:block' : 'block'}
              bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6
              mt-6 xl:mt-0
            `}>
              {/* Botón volver — SOLO MÓVIL */}
              <button
                type="button"
                onClick={cerrarEdicionUsuario}
                className="xl:hidden flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors mb-4 -ml-1"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                Volver al listado
              </button>

              {!usuarioEditando ? (
                <div className="bg-neutral-950 border border-dashed border-neutral-800 rounded-lg p-8 text-center text-neutral-500 text-sm">
                  <Pencil className="w-5 h-5 mx-auto mb-2 opacity-60" strokeWidth={2} />
                  Selecciona un usuario para editarlo.
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-white">Editar usuario</h3>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      Usuario #{usuarioEditando.id_usuario}
                    </p>
                  </div>

                  <form onSubmit={guardarEdicionUsuario} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Nombre</label>
                      <input
                        type="text"
                        value={formUsuario.nombre}
                        onChange={(e) => setFormUsuario((p) => ({ ...p, nombre: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Apellidos</label>
                      <input
                        type="text"
                        value={formUsuario.apellidos}
                        onChange={(e) => setFormUsuario((p) => ({ ...p, apellidos: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={formUsuario.email}
                        onChange={(e) => setFormUsuario((p) => ({ ...p, email: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={procesandoUsuario}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-all"
                      >
                        {procesandoUsuario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2} />}
                        {procesandoUsuario ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button
                        type="button"
                        onClick={cerrarEdicionUsuario}
                        className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── EJERCICIOS ────────────────────────────────── */}
        {vistaActiva === 'ejercicios' && (
          <AdminEjerciciosPanel onError={setErrorGeneral} onRefreshResumen={cargarResumen} />
        )}

        {/* ── LOGS ──────────────────────────────────────── */}
        {vistaActiva === 'logs' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Registro de eventos</h3>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Errores, advertencias e información del sistema.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={tipoLogFiltro}
                    onChange={(e) => setTipoLogFiltro(e.target.value)}
                    className="w-full md:w-auto bg-neutral-950 border border-neutral-800 rounded-lg px-3 pr-9 py-2 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50 cursor-pointer"
                  >
                    <option value="" className="bg-neutral-900">Todos</option>
                    <option value="INFO" className="bg-neutral-900">INFO</option>
                    <option value="WARNING" className="bg-neutral-900">WARNING</option>
                    <option value="ERROR" className="bg-neutral-900">ERROR</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
                </div>
                <button
                  onClick={() => cargarLogs(tipoLogFiltro)}
                  className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors"
                >
                  Filtrar
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
                No hay logs para mostrar.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const Icono = iconoTipoLog(log.tipo_evento);
                  return (
                    <div
                      key={log.id_log}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium uppercase tracking-wider ${colorTipoLog(log.tipo_evento)}`}>
                            <Icono className="w-3 h-3" strokeWidth={2.5} />
                            {log.tipo_evento}
                          </span>
                          <span className="text-xs text-neutral-500">Log #{log.id_log}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{formatearFecha(log.fecha_hora)}</span>
                      </div>
                      <p className="text-neutral-200 text-sm leading-relaxed mb-2">
                        {log.detalle || 'Sin detalle'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Usuario: {log.nombre ? `${log.nombre} ${log.apellidos || ''}`.trim() : 'Sistema'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INCIDENCIAS ───────────────────────────────── */}
        {vistaActiva === 'incidencias' && (
          <div className="xl:grid xl:grid-cols-2 xl:gap-6">
            <div className={`
              ${vistaMobileIncidencias === 'detalle' ? 'hidden xl:block' : 'block'}
              bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6
            `}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Listado de incidencias</h3>
                  <p className="text-sm text-neutral-400 mt-0.5">
                    Selecciona una para editar su estado.
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <select
                      value={estadoFiltro}
                      onChange={(e) => setEstadoFiltro(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 pr-9 py-2 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50 cursor-pointer"
                    >
                      <option value="" className="bg-neutral-900">Todos</option>
                      {ESTADOS_INCIDENCIA.map((e) => <option key={e} value={e} className="bg-neutral-900">{e}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
                  </div>
                  <button
                    onClick={() => cargarIncidencias(estadoFiltro)}
                    className="bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors"
                  >
                    Filtrar
                  </button>
                </div>
              </div>

              {incidencias.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
                  No hay incidencias registradas.
                </div>
              ) : (
                <div className="space-y-2">
                  {incidencias.map((incidencia) => {
                    const activa = incidenciaSeleccionada?.id_incidencia === incidencia.id_incidencia;
                    return (
                      <button
                        key={incidencia.id_incidencia}
                        onClick={() => seleccionarIncidencia(incidencia)}
                        className={`
                          w-full text-left rounded-lg border p-4 transition-colors
                          ${activa
                            ? 'border-sky-500/40 bg-sky-500/5'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'}
                        `}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{incidencia.titulo}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              #{incidencia.id_incidencia} · {incidencia.categoria || 'general'}
                            </p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 ${colorEstadoIncidencia(incidencia.estado)}`}>
                            {incidencia.estado}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-sm line-clamp-2">{incidencia.descripcion}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider ${colorPrioridad(incidencia.prioridad)}`}>
                            {incidencia.prioridad}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-neutral-500 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {formatearFecha(incidencia.fecha_actualizacion || incidencia.fecha_reporte)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`
              ${vistaMobileIncidencias === 'lista' ? 'hidden xl:block' : 'block'}
              bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6
              mt-6 xl:mt-0
            `}>
              {/* Botón volver — SOLO MÓVIL */}
              <button
                type="button"
                onClick={() => setVistaMobileIncidencias('lista')}
                className="xl:hidden flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors mb-4 -ml-1"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                Volver al listado
              </button>

              {!incidenciaSeleccionada ? (
                <div className="bg-neutral-950 border border-dashed border-neutral-800 rounded-lg p-8 text-center text-neutral-500 text-sm">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-60" strokeWidth={2} />
                  Selecciona una incidencia para verla.
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{incidenciaSeleccionada.titulo}</h3>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          Incidencia #{incidenciaSeleccionada.id_incidencia}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider ${colorEstadoIncidencia(incidenciaSeleccionada.estado)}`}>
                        {incidenciaSeleccionada.estado}
                      </span>
                    </div>

                    <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                      {incidenciaSeleccionada.descripcion}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mb-1">Prioridad</p>
                        <p className="font-medium text-neutral-200 capitalize">{incidenciaSeleccionada.prioridad || 'media'}</p>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mb-1">Categoría</p>
                        <p className="font-medium text-neutral-200 capitalize">{incidenciaSeleccionada.categoria || 'general'}</p>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mb-1">Reportada</p>
                        <p className="font-medium text-neutral-200 text-[11px]">{formatearFecha(incidenciaSeleccionada.fecha_reporte)}</p>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mb-1">Actualizada</p>
                        <p className="font-medium text-neutral-200 text-[11px]">{formatearFecha(incidenciaSeleccionada.fecha_actualizacion)}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleActualizarIncidencia} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Estado</label>
                      <div className="relative">
                        <select
                          value={actualizandoIncidencia.estado}
                          onChange={(e) => setActualizandoIncidencia((p) => ({ ...p, estado: e.target.value }))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 pr-10 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50"
                        >
                          {ESTADOS_INCIDENCIA.map((e) => <option key={e} value={e} className="bg-neutral-900">{e}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Notas de seguimiento</label>
                      <textarea
                        rows={6}
                        value={actualizandoIncidencia.notas_seguimiento}
                        onChange={(e) => setActualizandoIncidencia((p) => ({ ...p, notas_seguimiento: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 resize-none transition-colors"
                        placeholder="Información técnica sobre el avance, causa o resolución..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm py-2.5 rounded-lg transition-all"
                    >
                      <Save className="w-4 h-4" strokeWidth={2} />
                      Guardar cambios
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── NUEVA INCIDENCIA ──────────────────────────── */}
        {vistaActiva === 'nueva-incidencia' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 lg:p-6 max-w-3xl">
            <h3 className="text-lg font-semibold text-white mb-1">Registrar incidencia técnica</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Documenta la anomalía para poder seguirla y resolverla.
            </p>

            <form onSubmit={handleCrearIncidencia} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Título</label>
                <input
                  type="text"
                  value={formIncidencia.titulo}
                  onChange={(e) => setFormIncidencia((p) => ({ ...p, titulo: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                  placeholder="Ej. Error al guardar sesión desde móvil"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Descripción</label>
                <textarea
                  rows={5}
                  value={formIncidencia.descripcion}
                  onChange={(e) => setFormIncidencia((p) => ({ ...p, descripcion: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 resize-none transition-colors"
                  placeholder="Describe la incidencia con el mayor detalle posible..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Prioridad</label>
                  <div className="relative">
                    <select
                      value={formIncidencia.prioridad}
                      onChange={(e) => setFormIncidencia((p) => ({ ...p, prioridad: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 pr-10 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50 capitalize"
                    >
                      {PRIORIDADES.map((p) => <option key={p} value={p} className="bg-neutral-900 capitalize">{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Categoría</label>
                  <div className="relative">
                    <select
                      value={formIncidencia.categoria}
                      onChange={(e) => setFormIncidencia((p) => ({ ...p, categoria: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 pr-10 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-sky-500/50 capitalize"
                    >
                      {CATEGORIAS.map((c) => <option key={c} value={c} className="bg-neutral-900">{c.replace(/_/g, ' ')}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" strokeWidth={2} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Estado inicial</label>
                  <input
                    type="text"
                    value="Abierta"
                    disabled
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-1.5">Notas de seguimiento</label>
                <textarea
                  rows={3}
                  value={formIncidencia.notas_seguimiento}
                  onChange={(e) => setFormIncidencia((p) => ({ ...p, notas_seguimiento: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 resize-none transition-colors"
                  placeholder="Opcional. Primeras observaciones o contexto técnico."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm py-3 rounded-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" strokeWidth={2} />
                Registrar incidencia
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}