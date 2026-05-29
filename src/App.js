import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import HomePage from './pages/HomePage';
import ArchetypePage from './pages/ArchetypePage';
import MyDecksPage from './pages/MyDecksPage';
import AddDeckPage from './pages/AddDeckPage';
import MyStatsPage from './pages/MyStatsPage';
import MyMatchupPage from './pages/MyMatchupPage';
import GameHistoryPage from './pages/GameHistoryPage';
import Modal from './components/shared/Modal';
import Auth from './components/shared/Auth';
import { supabase } from './lib/supabaseClient';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-state" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <div className="spinner" />
      <span>Cargando...</span>
    </div>
  );
  return user ? children : <Navigate to="/" replace />;
};

const NAV_ITEMS = [
  { to: '/',            icon: '🌐', label: 'Vista global', exact: true },
  { to: '/my-decks',   icon: '🃏', label: 'Mis mazos',    auth: true },
  { to: '/my-stats',   icon: '📊', label: 'Mis stats',    auth: true },
  { to: '/my-matchup', icon: '⚔',  label: 'Matchups',     auth: true },
  { to: '/my-games',   icon: '📋', label: 'Partidas',     auth: true },
];

const Sidebar = ({ user, onLogout, onShowAuth, collapsed, onToggle }) => {
  const location = useLocation();
  return (
    <>
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🧙</div>
        <span className="sidebar-logo-name">ManaMetrick</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          if (item.auth && !user) return null;
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink key={item.to} to={item.to} className={`nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ padding: '14px 10px 0' }}>
        {user ? (
          <>
            <div style={{ fontSize: 11, color: '#5a5a82', padding: '0 14px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <button
              onClick={onLogout}
              className="nav-item"
              style={{ width: '100%', background: 'none', border: '1px solid transparent', textAlign: 'left', cursor: 'pointer' }}
            >
              <span className="nav-icon">🚪</span>Salir
            </button>
          </>
        ) : (
          <button
            onClick={onShowAuth}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
              letterSpacing: '0.03em',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </aside>
      <button
        className={`sidebar-toggle${collapsed ? ' sidebar-toggle--collapsed' : ''}`}
        onClick={onToggle}
        title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <div className="app-shell">
      <div className="app-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <Sidebar
        user={user}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuth(true)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <main className={`main-content${sidebarCollapsed ? ' main-content--expanded' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/archetype/:name" element={<ArchetypePage />} />
          <Route path="/my-decks" element={<PrivateRoute><MyDecksPage /></PrivateRoute>} />
          <Route path="/my-decks/new" element={<PrivateRoute><AddDeckPage /></PrivateRoute>} />
          <Route path="/my-stats" element={<PrivateRoute><MyStatsPage /></PrivateRoute>} />
          <Route path="/my-matchup" element={<PrivateRoute><MyMatchupPage /></PrivateRoute>} />
          <Route path="/my-games" element={<PrivateRoute><GameHistoryPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showAuth && (
        <Modal onClose={() => setShowAuth(false)}>
          <Auth onClose={() => setShowAuth(false)} />
        </Modal>
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;