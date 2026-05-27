import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Modal from './Modal';
import Auth from './Auth';

const Navbar = ({ user, onLogout }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link nav-link--active' : 'nav-link';

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">⬡</span>
          ManaMetrick
        </NavLink>

        <button
          className="navbar-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar-menu ${menuOpen ? 'navbar-menu--open' : ''}`}>
          <div className="navbar-links">
            <NavLink to="/" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Meta global
            </NavLink>

            {user && (
              <>
                <NavLink to="/my-decks" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Mis mazos
                </NavLink>
                <NavLink to="/my-stats" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Mis stats
                </NavLink>
                <NavLink to="/my-matchup" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Matchups
                </NavLink>
                <NavLink to="/my-games" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  Partidas
                </NavLink>
              </>
            )}
          </div>

          <div className="navbar-auth">
            {user ? (
              <button className="btn btn-ghost" onClick={onLogout}>
                Salir
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => { setShowAuth(true); setMenuOpen(false); }}>
                Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && (
        <Modal onClose={() => setShowAuth(false)}>
          <Auth onClose={() => setShowAuth(false)} />
        </Modal>
      )}
    </>
  );
};

export default Navbar;
