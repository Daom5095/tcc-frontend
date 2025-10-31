/*
 * Página de Login (LoginPage.js)
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <-- MEJORA
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // <-- MEJORA
    try {
      // Llamo a la función de login de mi AuthContext
      await login(email, password);
      // Si tiene éxito, navego al dashboard
      navigate('/'); 
    } catch (err) {
      // Si falla, muestro el error del backend
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
    setIsLoading(false); // <-- MEJORA
  };

  return (
    // Usamos los classNames definidos en index.css
    <div className="auth-container">
      <h2>Iniciar Sesión (TCC)</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        {/* Deshabilitamos el botón mientras carga */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="auth-link">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}

export default LoginPage;