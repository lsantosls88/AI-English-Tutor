import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home as HomeIcon, PlusCircle, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './App.css';

// Import real components
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import AddCard from './components/AddCard';
import Review from './components/Review';
import ExtraReview from './components/ExtraReview';
import Notes from './components/Notes';
import Library from './components/Library';
import Settings from './components/Settings';
import Auth from './components/Auth';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/add', icon: PlusCircle, label: 'Add/Notes' },
    { path: '/library', icon: BookOpen, label: 'Library' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  // Hide Top and Bottom Navigation on full screen modes
  const isFullScreen = location.pathname === '/onboarding' || location.pathname === '/review' || location.pathname === '/extra-review' || location.pathname === '/auth';

  return (
    <div className="app-container">
      {/* Top Header */}
      {!isFullScreen && (
        <header className="flex-between" style={{ padding: '1.5rem 1.5rem 0' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>AI English<span className="text-gradient"> Tutor</span></h1>
            <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Daily Practice & Fluency</p>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="content-area" style={{ paddingBottom: isFullScreen ? '1.5rem' : '6rem' }}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/add" element={<RequireAuth><AddCard /></RequireAuth>} />
          <Route path="/review" element={<RequireAuth><Review /></RequireAuth>} />
          <Route path="/extra-review" element={<RequireAuth><ExtraReview /></RequireAuth>} />
          <Route path="/notes" element={<RequireAuth><Notes /></RequireAuth>} />
          <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      {!isFullScreen && (
        <nav className="glass-panel" style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
          borderTop: '1px solid var(--border-color)',
          zIndex: 10,
          backgroundColor: 'var(--bg-primary)'
        }}>
          {navItems.map((item) => {
            // Map /notes to highlight the Add icon too, since they share logical space,
            // or we could add a specific Notes icon, but we have 4 spots. Let's make Add/Notes share the Plus spot.
            const isActive = location.pathname === item.path || (item.path === '/add' && location.pathname === '/notes');
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-col flex-center"
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                <div style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  marginBottom: '0.25rem',
                  transition: 'background-color var(--transition-fast)'
                }}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: isActive ? '600' : '500' }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default App;
