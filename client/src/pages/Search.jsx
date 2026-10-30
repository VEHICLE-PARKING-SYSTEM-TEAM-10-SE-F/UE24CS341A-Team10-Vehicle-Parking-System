import { useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, formatTime, typeLabel } from '../components/Form.jsx';

// FR-20, FR-21: search a vehicle by registration number and show where it is now.
export default function Search() {
  const [regNo, setRegNo] = useState('');
  const [found, setFound] = useState(null);
  const [result, setResult] = useState(null);
  const [fieldError, setFieldError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setFound(null);
    setResult(null);
    setFieldError('');
    try {
      setFound(await api(`/vehicles/search?regNo=${encodeURIComponent(regNo.trim())}`));
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setFieldError(err.message);
      else setResult({ ok: false, message: err.message });
    }
  }

  const cur = found?.current;
  return (
    <section className="card">
      <h2>Search vehicle</h2>
      <Banner result={result} />
      <form onSubmit={submit} noValidate>
        <Field id="regNo" label="Registration number" required error={fieldError}>
          <input id="regNo" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="KA01AB1234" maxLength={15} autoFocus />
        </Field>
        <button type="submit">Search</button>
      </form>
      {found && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <tbody>
              <tr><th>Vehicle</th><td>{found.vehicle.regNo} ({typeLabel(found.vehicle.vehicleType)})</td></tr>
              {found.vehicle.ownerContact && <tr><th>Owner contact</th><td>{found.vehicle.ownerContact}</td></tr>}
              <tr>
                <th>Status</th>
                <td className={`status ${cur.status === 'PARKED' ? 'OCCUPIED' : 'AVAILABLE'}`}>
                  {cur.status === 'PARKED' ? 'Parked' : 'Not Parked'}
                </td>
              </tr>
              {cur.status === 'PARKED' && (
                <>
                  <tr><th>Slot</th><td>{cur.slotId}</td></tr>
                  <tr><th>Entry time</th><td>{formatTime(cur.entryTime)}</td></tr>
                  <tr><th>Parked for</th><td>{Math.floor(cur.elapsedMin / 60)} h {cur.elapsedMin % 60} min</td></tr>
                  <tr><th>Ticket</th><td>{cur.ticketNo}</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      {found && (
        <>
          <h3>Parking history</h3>
          {found.history.length === 0 ? <p className="muted">No completed visits yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Entry time</th><th>Exit time</th><th>Slot</th><th>Duration</th><th>Fee</th></tr></thead>
                <tbody>
                  {found.history.map((h) => (
                    <tr key={h.ticketNo}>
                      <td>{formatTime(h.entryTime)}</td>
                      <td>{formatTime(h.exitTime)}</td>
                      <td>{h.slotId}</td>
                      <td>{h.durationMin} min</td>
                      <td>₹{h.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
