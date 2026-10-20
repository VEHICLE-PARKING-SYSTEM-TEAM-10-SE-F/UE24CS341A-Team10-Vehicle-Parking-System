import { useState } from 'react';
import { api } from '../api.js';
import { formatTime, typeLabel } from '../components/Form.jsx';

const STATUS_LABEL = { AVAILABLE: 'Available', OCCUPIED: 'Occupied', UNAVAILABLE: 'Unavailable' };

// FR-23: Parking Occupancy Report (Administrator) - each slot with status, assigned vehicle
// and last updated time (SRS Appendix B.6).
export default function Report() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  async function generate() {
    setError('');
    try {
      setReport(await api('/reports/occupancy'));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h2>Parking occupancy report</h2>
      {error && <div className="banner error">{error}</div>}
      <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={generate}>Generate report</button>
        {report && <button className="secondary" onClick={() => window.print()}>Print</button>}
      </p>
      {report && (
        <>
          <p className="muted">
            Generated {formatTime(report.generatedAt)} · {report.totals.slots} slots ·{' '}
            <span className="status AVAILABLE">{report.totals.available} available</span> ·{' '}
            <span className="status OCCUPIED">{report.totals.occupied} occupied</span> ·{' '}
            <span className="status UNAVAILABLE">{report.totals.unavailable} unavailable</span>
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Slot ID</th><th>Type</th><th>Status</th><th>Assigned vehicle</th><th>Last updated</th></tr></thead>
              <tbody>
                {report.slots.map((s) => (
                  <tr key={s.slotId}>
                    <td>{s.slotId}</td>
                    <td>{typeLabel(s.slotType)}</td>
                    <td className={`status ${s.status}`}>{STATUS_LABEL[s.status]}</td>
                    <td>{s.assignedVehicle || '—'}</td>
                    <td>{formatTime(s.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
