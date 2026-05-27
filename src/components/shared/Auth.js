import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const Auth = ({ onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onClose?.();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Revisa tu email para confirmar el registro.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">
        {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      </h2>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="auth-password">Contraseña</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
        </button>
      </form>

      <p className="auth-toggle">
        {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button
          className="btn-link"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setMessage(null); }}
        >
          {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
        </button>
      </p>
    </div>
  );
};

export default Auth;
