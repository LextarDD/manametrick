import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/shared/Navbar';
import HomePage from './pages/HomePage';
import ArchetypePage from './pages/ArchetypePage';
import MyDecksPage from './pages/MyDecksPage';
import MyStatsPage from './pages/MyStatsPage';
import MyMatchupPage from './pages/MyMatchupPage';
import GameHistoryPage from './pages/GameHistoryPage';
import { supabase } from './lib/supabaseClient';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando...</div>;
  return user ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/archetype/:name" element={<ArchetypePage />} />
          <Route path="/my-decks" element={
            <PrivateRoute><MyDecksPage /></PrivateRoute>
          } />
          <Route path="/my-stats" element={
            <PrivateRoute><MyStatsPage /></PrivateRoute>
          } />
          <Route path="/my-matchup" element={
            <PrivateRoute><MyMatchupPage /></PrivateRoute>
          } />
          <Route path="/my-games" element={
            <PrivateRoute><GameHistoryPage /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
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
