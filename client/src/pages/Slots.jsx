import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatTime, typeLabel } from '../components/Form.jsx';

const STATUS_LABEL = { AVAILABLE: 'Available', OCCUPIED: 'Occupied', UNAVAILABLE: 'Unavailable' };

// FR-10: every slot with its status (text + colour, SRS 3.1) and the Available /
// Occupied counts per slot type. Refreshes every 30 s (SAD ADR-05).
export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([api('/slots'), api('/slots/summary')]);
      setSlots(list.slots);
      setSummary(sum);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <section className="card">
        <h2>Slot availability</h2>
        {error && <div className="banner error">{error}</div>}
        {summary && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Slot type</th><th>Available</th><th>Occupied</th><th>Total</th></tr></thead>
              <tbody>
                {summary.byType.map((t) => (
                  <tr key={t.slotType}>
                    <td>{typeLabel(t.slotType)}</td>
                    <td className="status AVAILABLE">{t.available}</td>
                    <td className="status OCCUPIED">{t.occupied}</td>
                    <td>{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p><button className="secondary" onClick={load}>Refresh</button></p>
      </section>
      <section className="card">
        <h2>All slots</h2>
        {slots.length === 0 ? <p className="muted">No slots yet. The Administrator adds slots in Slot Management.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Slot ID</th><th>Type</th><th>Status</th><th>Last updated</th></tr></thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.slotId}>
                    <td>{s.slotId}</td>
                    <td>{typeLabel(s.slotType)}</td>
                    <td className={`status ${s.status}`}>● {STATUS_LABEL[s.status]}</td>
                    <td>{formatTime(s.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
