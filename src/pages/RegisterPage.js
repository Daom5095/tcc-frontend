/*
 * Página de Registro (RegisterPage.js)
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <-- MEJORA
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación simple en el frontend
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsLoading(true); // <-- MEJORA
    try {
      // Llamo a la función de registro de mi AuthContext
      await register(name, email, password);
      // Si tiene éxito, navego al dashboard
      navigate('/'); 
    } catch (err) {
      // Si falla (ej. usuario ya existe), muestro el error
      setError(err.response?.data?.message || 'Error al registrarse');
    }
    setIsLoading(false); // <-- MEJORA
  };

  return (
    // Usamos los classNames definidos en index.css
    <div className="auth-container">
      <h2>Registrarse</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="name">Nombre:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
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
            autoComplete="new-password"
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        {/* Deshabilitamos el botón mientras carga */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Cuenta'}
        </button>
      </form>
      <p className="auth-link">
        ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
      </p>
    </div>
  );
}

export default RegisterPage;  