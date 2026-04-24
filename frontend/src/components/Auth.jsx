import { useState, useRef, useEffect, forwardRef } from 'react';
import {
  Mail,
  Lock,
  User,
  UserPlus,
  LogIn,
  Loader2,
  Activity,
  Sparkles,
  LineChart,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   VALIDACIÓN DE EMAIL
   ══════════════════════════════════════════════════════ */
const PASSWORD_MIN = 8;

/* Regex RFC 5322 simplificada — cubre el 99.9% de emails reales
   sin entrar en casos exóticos que la gente nunca usa */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/* Dominios populares — si el usuario escribe algo parecido pero mal,
   sugerimos la corrección. Incluye proveedores globales + comunes en España */
const DOMINIOS_COMUNES = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'outlook.es',
  'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com',
  'live.com', 'msn.com', 'protonmail.com', 'proton.me',
  'hotmail.es', 'terra.es', 'telefonica.net', 'movistar.es',
];

/* Distancia de Levenshtein — cuenta cuántos caracteres hay que
   cambiar para convertir una cadena en otra. Bajo = muy similar */
const distanciaLevenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matriz = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matriz[0][i] = i;
  for (let j = 0; j <= b.length; j++) matriz[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[j][i] = Math.min(
        matriz[j][i - 1] + 1,        // inserción
        matriz[j - 1][i] + 1,        // eliminación
        matriz[j - 1][i - 1] + coste // sustitución
      );
    }
  }

  return matriz[b.length][a.length];
};

/* Busca el dominio común más parecido al que escribió el usuario.
   Devuelve una sugerencia si hay 1-2 errores de tipeo (gmial → gmail) */
const sugerirDominio = (email) => {
  const partes = email.split('@');
  if (partes.length !== 2) return null;

  const dominio = partes[1].toLowerCase();

  // Si ya es un dominio común, no sugerir nada
  if (DOMINIOS_COMUNES.includes(dominio)) return null;

  // Solo sugerir si el dominio escrito parece ir en esa dirección
  // (evitar que "miempresa.com" sugiera "gmail.com")
  let mejorDistancia = 3; // máximo 2 errores de tipeo
  let mejorDominio = null;

  for (const candidato of DOMINIOS_COMUNES) {
    const d = distanciaLevenshtein(dominio, candidato);
    if (d > 0 && d < mejorDistancia) {
      mejorDistancia = d;
      mejorDominio = candidato;
    }
  }

  if (!mejorDominio) return null;

  return `${partes[0]}@${mejorDominio}`;
};

/* Valida formato y devuelve mensaje de error o null si es válido */
const validarEmail = (email) => {
  if (!email) return 'El correo es obligatorio.';
  if (!email.includes('@')) return 'Falta el símbolo @ en el correo.';
  if (!EMAIL_REGEX.test(email)) return 'El formato del correo no es válido.';
  return null;
};

/* ─── Input reutilizable ─────────────────────────────── */
const Input = forwardRef(function Input(
  { icon: Icon, rightSlot, hasError, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Icon
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
          hasError ? 'text-red-400' : 'text-neutral-500'
        }`}
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        ref={ref}
        {...props}
        aria-invalid={hasError || undefined}
        className={`
          w-full bg-neutral-900 border rounded-xl
          pl-10 ${rightSlot ? 'pr-11' : 'pr-4'} py-3 text-sm text-white
          placeholder-neutral-500
          focus:outline-none focus:ring-2
          transition-colors
          ${hasError
            ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15'
            : 'border-neutral-800 focus:border-sky-500/60 focus:ring-sky-500/15'}
        `}
      />
      {rightSlot && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
});

/* ─── Item de beneficio (hero izquierdo) ─────────────── */
function Benefit({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/15 flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-sky-300" strokeWidth={2} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-sm text-neutral-400 leading-relaxed mt-1">{text}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════ */
export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
  });

  /* Estado de validación del email */
  const [emailError, setEmailError] = useState('');      // error de formato
  const [emailSugerencia, setEmailSugerencia] = useState(''); // typo de dominio
  const [emailTocado, setEmailTocado] = useState(false); // para no validar prematuramente

  const firstInputRef = useRef(null);

  /* Auto-focus en el primer input al cambiar de modo */
  useEffect(() => {
    const id = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setMensaje('');
    setFormData((prev) => ({ ...prev, [name]: value }));

    /* Mientras escribe: limpiar errores de email.
       La validación se dispara en onBlur, no en cada tecla */
    if (name === 'email') {
      setEmailError('');
      setEmailSugerencia('');
    }
  };

  /* Al salir del campo de email, validamos */
  const handleEmailBlur = () => {
    setEmailTocado(true);
    const email = formData.email.trim();

    if (!email) {
      setEmailError('');
      setEmailSugerencia('');
      return;
    }

    const errorFormato = validarEmail(email);
    if (errorFormato) {
      setEmailError(errorFormato);
      setEmailSugerencia('');
      return;
    }

    setEmailError('');
    const sugerencia = sugerirDominio(email);
    setEmailSugerencia(sugerencia || '');
  };

  /* Aceptar la sugerencia de typo: reemplazar el email por la versión correcta */
  const aceptarSugerencia = () => {
    if (!emailSugerencia) return;
    setFormData((prev) => ({ ...prev, email: emailSugerencia }));
    setEmailSugerencia('');
    setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* Validación local antes de tocar el servidor */
    const errorFormato = validarEmail(formData.email.trim());
    if (errorFormato) {
      setEmailError(errorFormato);
      setEmailTocado(true);
      return;
    }

    if (!isLogin && formData.password.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
      return;
    }

    setCargando(true);
    setError('');
    setMensaje('');

    const ruta = isLogin ? '/api/usuarios/login' : '/api/usuarios/registro';

    try {
      const respuesta = await fetch(`http://127.0.0.1:5000${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        if (isLogin) {
          localStorage.setItem('token', datos.token);
          onLoginSuccess?.(datos.token);
        } else {
          setIsLogin(true);
          setMensaje('Cuenta creada correctamente. Ahora inicia sesión.');
          setFormData((prev) => ({
            ...prev,
            nombre: '',
            apellidos: '',
            password: '',
          }));
        }
      } else {
        setError(datos.error || 'No se pudo completar la operación.');
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const toggleModo = () => {
    setIsLogin((prev) => !prev);
    setError('');
    setMensaje('');
    setPasswordVisible(false);
    setEmailError('');
    setEmailSugerencia('');
    setEmailTocado(false);
  };

  const emailTieneError = emailTocado && Boolean(emailError);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-hidden">
      {/* Luces de fondo muy sutiles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-sky-500/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] rounded-full bg-indigo-500/8 blur-3xl" />
      </div>

      <div className="relative min-h-screen grid lg:grid-cols-2">
        {/* ═══════════════════════════════════════════════════════
            LADO IZQUIERDO — Hero limpio
            ═══════════════════════════════════════════════════════ */}
        <section className="hidden lg:flex relative min-h-screen overflow-hidden border-r border-white/5">
          <img
            src="/foto_auth.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/95 via-neutral-950/88 to-sky-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15),transparent_45%)]" />

          <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/logo_sin_nombre.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="block max-w-none"
                  style={{ width: '155%', height: '155%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div className="text-xl font-semibold tracking-tight text-white leading-none">
                  Progresia
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-sky-300/90 font-medium">
                  Plataforma de entrenamiento
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
                Organiza tu entrenamiento y
                <span className="text-sky-300"> mide tu progreso real</span>.
              </h1>
              <p className="text-neutral-300/85 text-base xl:text-lg leading-relaxed mt-6">
                Planifica tus sesiones, registra tus series y sigue la evolución de
                cada ejercicio en un único panel.
              </p>

              <div className="grid gap-5 mt-10">
                <Benefit
                  icon={Activity}
                  title="Rutinas según tu objetivo"
                  text="Ganar músculo, perder grasa, ganar fuerza, tonificar o mejorar resistencia."
                />
                <Benefit
                  icon={Sparkles}
                  title="Plan Inteligente"
                  text="Genera una rutina personalizada según tu nivel, equipamiento y tiempo disponible."
                />
                <Benefit
                  icon={LineChart}
                  title="Evolución medible"
                  text="Historial completo y métricas por ejercicio para decidir mejor cada semana."
                />
              </div>
            </div>

            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} Progresia
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            LADO DERECHO — Formulario
            ═══════════════════════════════════════════════════════ */}
        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10 xl:p-14 relative">
          <div className="w-full max-w-md relative z-10">
            {/* Marca compacta en móvil */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-xl bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/logo_sin_nombre.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="block max-w-none"
                  style={{ width: '150%', height: '150%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-white leading-none">
                  Progresia
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.26em] text-sky-300/90 font-medium">
                  Plataforma de entrenamiento
                </div>
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/30">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  {isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}
                </h2>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  {isLogin
                    ? 'Accede a tu panel para consultar tus rutinas, métricas e historial.'
                    : 'Regístrate para empezar a gestionar tu entrenamiento con Progresia.'}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {!isLogin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="nombre"
                        className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider"
                      >
                        Nombre
                      </label>
                      <Input
                        ref={firstInputRef}
                        icon={User}
                        id="nombre"
                        name="nombre"
                        type="text"
                        autoComplete="given-name"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="apellidos"
                        className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider"
                      >
                        Apellidos
                      </label>
                      <Input
                        icon={User}
                        id="apellidos"
                        name="apellidos"
                        type="text"
                        autoComplete="family-name"
                        value={formData.apellidos}
                        onChange={handleChange}
                        required
                        placeholder="Tus apellidos"
                      />
                    </div>
                  </div>
                )}

                {/* EMAIL con validación */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider"
                  >
                    Correo electrónico
                  </label>
                  <Input
                    ref={isLogin ? firstInputRef : null}
                    icon={Mail}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                    required
                    placeholder="tu@email.com"
                    hasError={emailTieneError}
                    aria-describedby={
                      emailTieneError ? 'email-error' :
                      emailSugerencia ? 'email-sugerencia' : undefined
                    }
                  />

                  {/* Error de formato */}
                  {emailTieneError && (
                    <p
                      id="email-error"
                      role="alert"
                      className="flex items-start gap-1.5 text-[12px] text-red-400 mt-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span>{emailError}</span>
                    </p>
                  )}

                  {/* Sugerencia de typo de dominio */}
                  {!emailTieneError && emailSugerencia && (
                    <div
                      id="email-sugerencia"
                      className="flex items-start gap-2 text-[12px] text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 mt-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span className="flex-1">
                        ¿Querías decir{' '}
                        <button
                          type="button"
                          onClick={aceptarSugerencia}
                          className="font-medium text-amber-200 hover:text-white underline underline-offset-2 transition-colors"
                        >
                          {emailSugerencia}
                        </button>
                        ?
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider"
                    >
                      Contraseña
                    </label>
                    {!isLogin && (
                      <span className="text-[11px] text-neutral-500">
                        Mínimo {PASSWORD_MIN} caracteres
                      </span>
                    )}
                  </div>
                  <Input
                    icon={Lock}
                    id="password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={isLogin ? undefined : PASSWORD_MIN}
                    placeholder="••••••••"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setPasswordVisible((v) => !v)}
                        aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {passwordVisible ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                    }
                  />
                </div>

                {/* Mensajes generales */}
                <div aria-live="polite" aria-atomic="true" className="space-y-2 empty:hidden">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  {mensaje && (
                    <div
                      role="status"
                      className="flex items-start gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3"
                    >
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span>{mensaje}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="
                    w-full flex items-center justify-center gap-2 py-3 rounded-xl
                    bg-gradient-to-r from-sky-500 to-indigo-600
                    hover:from-sky-400 hover:to-indigo-500
                    active:from-sky-600 active:to-indigo-700
                    text-white font-medium text-sm
                    transition-all shadow-lg shadow-sky-500/10
                    focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 focus:ring-offset-neutral-900
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>{isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}</span>
                    </>
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                      <span>Iniciar sesión</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                      <span>Crear cuenta</span>
                    </>
                  )}
                </button>
              </form>

              {/* Toggle login/registro */}
              <div className="mt-6 pt-6 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={toggleModo}
                  className="
                    w-full text-center text-sm text-neutral-400 hover:text-white
                    py-2 rounded-lg transition-colors
                    focus:outline-none focus:ring-2 focus:ring-sky-500/30
                  "
                >
                  {isLogin ? (
                    <>
                      ¿No tienes cuenta?{' '}
                      <span className="font-medium text-sky-400">Regístrate</span>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{' '}
                      <span className="font-medium text-sky-400">Inicia sesión</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-neutral-600 mt-6 leading-relaxed">
              Al continuar aceptas los términos de uso y la política de privacidad de Progresia.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}