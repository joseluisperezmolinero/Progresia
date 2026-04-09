import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Esta función se activará desde Auth.jsx cuando el login sea correcto
  const loginExitoso = (nuevoToken) => {
    localStorage.setItem('token', nuevoToken);
    setToken(nuevoToken); // Esto hará que React cambie la pantalla automáticamente
  };

  return (
    <>
      {token ? (
        <Dashboard />
      ) : (
        <Auth onLoginSuccess={loginExitoso} />
      )}
    </>
  );
}

export default App;