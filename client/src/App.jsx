import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, RequireAuth, useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Vehicles from './pages/Vehicles.jsx';
import SlotAdmin from './pages/SlotAdmin.jsx';
import Entry from './pages/Entry.jsx';
import Exit from './pages/Exit.jsx';

// Navigation shows only the functions allowed for the logged-in role (SRS 3.1).
// Each entry: [path, label, roles allowed].
export const NAV = [
  ['/', 'Home', ['ATTENDANT', 'ADMIN']],
  ['/entry', 'Entry', ['ATTENDANT', 'ADMIN']],
  ['/exit', 'Exit', ['ATTENDANT', 'ADMIN']],
  ['/vehicles', 'Vehicles', ['ATTENDANT', 'ADMIN']],
  ['/admin/slots', 'Slot Management', ['ADMIN']],
];

const ROLE_LABEL = { ATTENDANT: 'Parking Attendant', ADMIN: 'Administrator' };

function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <strong>🅿 Vehicle Parking System</strong>
      {user && (
        <>
          <nav>
            {NAV.filter(([, , roles]) => roles.includes(user.role)).map(([path, label]) => (
              <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>
            ))}
          </nav>
          <div className="user">
            <span>{user.username} · {ROLE_LABEL[user.role]}</span>
            <button className="secondary" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
          </div>
        </>
      )}
    </header>
  );
}

function Home() {
  const { user } = useAuth();
  return (
    <section className="card">
      <h2>Welcome, {user.name}</h2>
      <p className="muted">Use the menu above to work with vehicles, slots and parking.</p>
    </section>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <TopBar />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/entry" element={<RequireAuth roles={['ATTENDANT', 'ADMIN']}><Entry /></RequireAuth>} />
            <Route path="/exit" element={<RequireAuth roles={['ATTENDANT', 'ADMIN']}><Exit /></RequireAuth>} />
            <Route path="/vehicles" element={<RequireAuth roles={['ATTENDANT', 'ADMIN']}><Vehicles /></RequireAuth>} />
            <Route path="/admin/slots" element={<RequireAuth roles={['ADMIN']}><SlotAdmin /></RequireAuth>} />
            <Route path="*" element={<RequireAuth><Home /></RequireAuth>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
