import { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  UserPlus,
  LogIn,
  Loader2,
  Sparkles,
  ShieldCheck,
  Activity,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

function Input({ icon: Icon, onChange, ...props }) {
  return (
    <div className="relative">
      <Icon
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
        strokeWidth={2}
      />
      <input
        {...props}
        onChange={onChange}
        className="
          w-full bg-neutral-900 border border-neutral-800 rounded-xl
          pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500
          focus:outline-none focus:border-sky-500/50 focus:bg-neutral-900
          focus:ring-2 focus:ring-sky-500/10
          transition-colors
        "
      />
    </div>
  );
}

function BenefitItem({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-sky-300" strokeWidth={2} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-sm text-neutral-300/85 leading-relaxed mt-1">{text}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setMensaje('');
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-[-120px] w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-100px] w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative min-h-screen grid lg:grid-cols-[1.15fr_0.95fr]">
        {/* LADO IZQUIERDO */}
        <section className="hidden lg:flex relative min-h-screen overflow-hidden border-r border-white/5">
          <img
            src="/foto_auth.jpg"
            alt="Entrenamiento"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/92 via-neutral-950/78 to-sky-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.16),transparent_30%)]" />

          <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
            <div className="max-w-4xl">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 rounded-[1.75rem] bg-white/95 shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src="/logo_sin_nombre.png"
                    alt="Progresia"
                    draggable={false}
                    className="block max-w-none"
                    style={{
                      width: '155%',
                      height: '155%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                <div>
                  <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-semibold tracking-tight text-white leading-none">
                    Progresia
                  </h1>
                  <p className="mt-3 text-sm xl:text-base uppercase tracking-[0.38em] text-sky-300 font-semibold">
                    Plataforma de entrenamiento
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-200 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                Entrenamiento personalizado y seguimiento
              </div>

              <h2 className="max-w-4xl text-5xl xl:text-6xl 2xl:text-7xl font-semibold tracking-tight text-white leading-[1.02]">
                Gestiona tu evolución física de forma
                <span className="text-sky-300"> más clara, visual y eficiente</span>
              </h2>

              <p className="text-neutral-200/80 text-lg xl:text-xl leading-relaxed mt-8 max-w-2xl">
                Accede a tu plataforma, revisa tu progreso, organiza tus ejercicios y mantén
                un control más completo de tu entrenamiento en un solo lugar.
              </p>

              <div className="grid gap-4 mt-10 max-w-2xl">
                <BenefitItem
                  icon={Activity}
                  title="Planes con sentido"
                  text="Organiza tus sesiones con una estructura más clara según tu objetivo, nivel y disponibilidad."
                />
                <BenefitItem
                  icon={Sparkles}
                  title="Entrenamientos más óptimos"
                  text="Consulta rutinas pensadas para mejorar el rendimiento sin perder el equilibrio entre carga y recuperación."
                />
                <BenefitItem
                  icon={ShieldCheck}
                  title="Evolución mejor medida"
                  text="Revisa tu constancia, tu historial y tus avances para tomar decisiones más inteligentes en cada etapa."
                />
              </div>
            </div>

            <div className="max-w-5xl mt-12">
              <div className="rounded-[2rem] border border-white/10 bg-black/30 backdrop-blur-md p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
                      Vista rápida
                    </p>
                    <h3 className="text-2xl font-semibold text-white mt-1">
                      Todo tu entrenamiento, en un solo panel
                    </h3>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    <img
                      src="/logo_sin_nombre.png"
                      alt="Progresia"
                      draggable={false}
                      className="block max-w-none"
                      style={{
                        width: '145%',
                        height: '145%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MiniStat label="Rutinas" value="12" />
                  <MiniStat label="Sesiones" value="48" />
                  <MiniStat label="Progreso" value="+27%" valueClass="text-sky-300" />
                </div>

                <div className="rounded-2xl bg-black/30 border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-white">Resumen semanal</p>
                    <span className="text-xs text-sky-300">Activo</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Constancia</span>
                        <span>82%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[82%] bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Objetivos cumplidos</span>
                        <span>67%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[67%] bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Rendimiento</span>
                        <span>74%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[74%] bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-neutral-300">
                    <ChevronRight className="w-4 h-4 text-sky-300" />
                    Consulta tu panel y continúa tu evolución diaria
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LADO DERECHO */}
        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10 xl:p-14 relative">
          <div className="absolute inset-0 pointer-events-none hidden lg:block">
            <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="w-full max-w-xl relative z-10 space-y-5">
            {/* HERO MÓVIL */}
            <div className="lg:hidden rounded-[2rem] overflow-hidden border border-neutral-800 bg-neutral-900/60">
              <div className="relative h-64">
                <img
                  src="/foto_auth.jpg"
                  alt="Entrenamiento"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/20" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/95 shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src="/logo_sin_nombre.png"
                        alt="Progresia"
                        draggable={false}
                        className="block max-w-none"
                        style={{
                          width: '150%',
                          height: '150%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-white">Progresia</h1>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300 font-semibold mt-1">
                        Plataforma de entrenamiento
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Gestiona tu progreso y accede a tu entrenamiento desde un solo lugar.
                  </p>
                </div>
              </div>
            </div>

            {/* BLOQUE SUPERIOR DESKTOP */}
            <div className="hidden lg:block rounded-[2rem] border border-neutral-800 bg-neutral-900/65 backdrop-blur-xl p-6 shadow-2xl shadow-black/25">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/95 shadow-md overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src="/logo_sin_nombre.png"
                    alt="Progresia"
                    draggable={false}
                    className="block max-w-none"
                    style={{
                      width: '150%',
                      height: '150%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300 font-semibold mb-2">
                    Acceso a la plataforma
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    Tu panel de entrenamiento en un entorno más claro y profesional
                  </h2>
                  <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
                    Accede para revisar tu planificación, entender mejor tu carga de trabajo semanal y seguir una progresión más eficiente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-2xl border border-neutral-800 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Sesiones</p>
                  <p className="text-sm font-medium text-white mt-2">Mejor planificadas</p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Carga</p>
                  <p className="text-sm font-medium text-white mt-2">Más equilibrada</p>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Progreso</p>
                  <p className="text-sm font-medium text-white mt-2">Fácil de medir</p>
                </div>
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-black/30">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  {isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}
                </h2>
                <p className="text-sm text-neutral-400 mt-2">
                  {isLogin
                    ? 'Accede a tu panel para consultar tu entrenamiento y progreso.'
                    : 'Regístrate para empezar a gestionar tu evolución con Progresia.'}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                        Nombre
                      </label>
                      <Input
                        icon={User}
                        name="nombre"
                        type="text"
                        value={formData.nombre}
                        onChange={handleChange}
                        required={!isLogin}
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                        Apellidos
                      </label>
                      <Input
                        icon={User}
                        name="apellidos"
                        type="text"
                        value={formData.apellidos}
                        onChange={handleChange}
                        required={!isLogin}
                        placeholder="Tus apellidos"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Correo electrónico
                  </label>
                  <Input
                    icon={Mail}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <Input
                    icon={Lock}
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                {mensaje && (
                  <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{mensaje}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="
                    w-full flex items-center justify-center gap-2 py-3 rounded-xl
                    bg-gradient-to-r from-sky-500 to-indigo-600
                    hover:from-sky-400 hover:to-indigo-500
                    text-white font-medium text-sm
                    transition-all shadow-lg shadow-sky-500/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {cargando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-4 h-4" strokeWidth={2} />
                      <span>Iniciar sesión</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" strokeWidth={2} />
                      <span>Crear cuenta</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-neutral-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin((prev) => !prev);
                    setError('');
                    setMensaje('');
                  }}
                  className="text-sm text-neutral-400 hover:text-sky-400 transition-colors"
                >
                  {isLogin ? (
                    <>
                      ¿No tienes cuenta? <span className="font-medium text-sky-400">Regístrate</span>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta? <span className="font-medium text-sky-400">Inicia sesión</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* BLOQUE INFERIOR */}
            <div className="rounded-[2rem] border border-neutral-800 bg-neutral-900/55 backdrop-blur-xl p-6 shadow-xl shadow-black/20">
              <p className="text-xs uppercase tracking-[0.22em] text-neutral-500 mb-4">
                Qué podrás consultar dentro
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/10 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-sky-300" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Rutinas adaptadas a tu objetivo</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Consulta sesiones orientadas a fuerza, recomposición, pérdida de grasa o mejora general del rendimiento.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-sky-300" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Distribución más inteligente del esfuerzo</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Visualiza mejor la carga semanal para evitar sesiones mal compensadas y mantener una progresión más sólida.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-sky-300" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Historial y evolución real</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Revisa qué has hecho, cómo has progresado y qué ajustes te conviene aplicar en los siguientes entrenamientos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-neutral-600">
              Progresia · Tu plataforma de entrenamiento personalizado
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}