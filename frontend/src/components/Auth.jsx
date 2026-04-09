import { useState } from 'react';

export default function Auth({ onLoginSuccess }) {
  // Estado para saber si mostramos Login o Registro
  const [isLogin, setIsLogin] = useState(true);

  // Estado para guardar lo que el usuario escribe
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Decidimos a qué ruta llamar dependiendo de si es login o registro
    const ruta = isLogin ? '/api/usuarios/login' : '/api/usuarios/registro';
    
    try {
      // Hacemos la llamada al Backend
      const respuesta = await fetch(`http://127.0.0.1:5000${ruta}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData) // Mandamos el email, password y/o nombre
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        // ¡Todo ha ido bien!
        if (isLogin) {
          // Guardamos el token en la caja fuerte del navegador (localStorage)
          localStorage.setItem('token', datos.token);
          alert('¡Login exitoso! Ya tienes tu llave de acceso.');
          onLoginSuccess(datos.token); // Enviamos el token hacia arriba para cambiar de pantalla
          console.log('Token guardado:', datos.token);
          // Más adelante, aquí le diremos que navegue al Dashboard
        } else {
          alert('¡Registro exitoso! Ahora inicia sesión con tus nuevos datos.');
          setIsLogin(true); // Lo pasamos a la pantalla de Login automáticamente
        }
      } else {
        // El servidor nos devuelve un error (ej: contraseña incorrecta)
        alert(`Error: ${datos.error || 'Algo falló'}`);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Error crítico: No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Inicia sesión en Progresia' : 'Crea tu cuenta'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Si NO es login (es decir, es registro), mostramos el campo Nombre */}
            {!isLogin && (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700">Nombre</label>
      <div className="mt-1">
        <input
          name="nombre"
          type="text"
          required={!isLogin}
          onChange={handleChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    {/* NUEVO: Campo Apellidos */}
    <div>
      <label className="block text-sm font-medium text-gray-700">Apellidos</label>
      <div className="mt-1">
        <input
          name="apellidos"
          type="text"
          required={!isLogin}
          onChange={handleChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
)}
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {isLogin ? 'Entrar' : 'Registrarse'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}