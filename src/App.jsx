import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, PlusCircle, BookOpen, Settings as SettingsIcon } from 'lucide-react';
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

function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/add', icon: PlusCircle, label: 'Add/Notes' },
    { path: '/library', icon: BookOpen, label: 'Library' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  // Hide Top and Bottom Navigation on Onboarding or Review mode
  const isFullScreen = location.pathname === '/onboarding' || location.pathname === '/review' || location.pathname === '/extra-review';

  return (
    <div className="app-container">
      {/* Top Header */}
      {!isFullScreen && (
        <header className="flex-between" style={{ padding: '1.5rem 1.5rem 0' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Eng<span className="text-gradient">Master</span></h1>
            <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Daily Practice & Fluency</p>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="content-area" style={{ paddingBottom: isFullScreen ? '1.5rem' : '6rem' }}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddCard />} />
          <Route path="/review" element={<Review />} />
          <Route path="/extra-review" element={<ExtraReview />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
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
