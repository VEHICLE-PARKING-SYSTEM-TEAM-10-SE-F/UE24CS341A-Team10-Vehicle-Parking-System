import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { api } from './api.js';

function Home() {
  const [health, setHealth] = useState('checking…');

  useEffect(() => {
    api('/health')
      .then((h) => setHealth(`API ${h.status}, database ${h.database}`))
      .catch(() => setHealth('API not reachable'));
  }, []);

  return (
    <section className="card">
      <h2>Vehicle Parking System</h2>
      <p>Team 10 · SE Mini-Project (UE24CS341A)</p>
      <p className="muted">{health}</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <strong>🅿 Vehicle Parking System</strong>
      </header>
      <main>
        <Routes>
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}
