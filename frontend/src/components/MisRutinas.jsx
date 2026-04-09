import { useEffect, useState } from 'react';

export default function MisRutinas({ irAEntrenar }) {
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarRutinas = async () => {
      const token = localStorage.getItem('token');
      try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/entrenamientos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const datos = await respuesta.json();
        if (respuesta.ok) setRutinas(datos);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    cargarRutinas();
  }, []);

  const borrarRutina = async (id) => {
    const confirmar = window.confirm("🚨 ¿Seguro que quieres borrar esta rutina?");
    if (!confirmar) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/entrenamientos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setRutinas(rutinas.filter(r => r.id_entrenamiento !== id));
        alert("Rutina eliminada correctamente 🗑️");
      } else {
        alert(data?.error || data?.detalle || "No se pudo borrar la rutina.");
        console.error("Error al borrar rutina:", data);
      }
    } catch (error) {
      console.error("Error de conexión al borrar rutina:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  if (cargando) {
    return <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Cargando tus rutinas... ⏳</div>;
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[60vh]">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Mis Rutinas 📋</h2>

      {rutinas.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">Aún no tienes rutinas guardadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rutinas.map((rutina) => (
            <div
              key={rutina.id_entrenamiento}
              className="border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all bg-white flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl text-gray-800">{rutina.nombre}</h3>
                {rutina.es_predeterminado && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">
                    Sugerida
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-sm font-medium mb-6">
                Objetivo: <span className="text-gray-700">{rutina.objetivo}</span>
              </p>

              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => irAEntrenar(rutina.id_entrenamiento)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 rounded-lg transition-colors"
                >
                  Entrenar
                </button>

                {!rutina.es_predeterminado && (
                  <button
                    onClick={() => borrarRutina(rutina.id_entrenamiento)}
                    className="px-4 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-lg transition-colors"
                    title="Eliminar rutina"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}