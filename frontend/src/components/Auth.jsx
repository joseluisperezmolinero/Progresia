import { useState } from 'react';
import { Dumbbell, Mail, Lock, User, UserPlus, LogIn, Loader2 } from 'lucide-react';

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
          w-full bg-neutral-900 border border-neutral-800 rounded-lg
          pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500
          focus:outline-none focus:border-sky-500/50 focus:bg-neutral-900
          focus:ring-2 focus:ring-sky-500/10
          transition-colors
        "
      />
    </div>
  );
}

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const ruta = isLogin ? '/api/usuarios/login' : '/api/usuarios/registro';

    try {
      const respuesta = await fetch(`http://127.0.0.1:5000${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        if (isLogin) {
          localStorage.setItem('token', datos.token);
          onLoginSuccess(datos.token);
        } else {
          setIsLogin(true);
          setFormData((prev) => ({
            ...prev,
            nombre: '',
            apellidos: '',
            password: ''
          }));
          setError('Cuenta creada. Ahora inicia sesión.');
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-8">
  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white flex items-center justify-center mb-4 shadow-sm">
    <img
      src="/logo_sin_nombre.png"
      alt="Progresia"
      className="block w-full h-full object-contain scale-[1.22]"
      draggable={false}
    />
  </div>
  <h1 className="text-2xl font-semibold tracking-tight text-white">Progresia</h1>
  <p className="text-sm text-neutral-500 mt-1">
    {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta para empezar'}
  </p>
</div>

        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8">
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
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="
                w-full flex items-center justify-center gap-2 py-3 rounded-lg
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
              }}
              className="text-sm text-neutral-400 hover:text-sky-400 transition-colors"
            >
              {isLogin ? (
                <>¿No tienes cuenta? <span className="font-medium text-sky-400">Regístrate</span></>
              ) : (
                <>¿Ya tienes cuenta? <span className="font-medium text-sky-400">Inicia sesión</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">
          Progresia · Tu plataforma de entrenamiento personalizado
        </p>
      </div>
    </div>
  );
}