import { useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, formatTime } from '../components/Form.jsx';

// FR-15: record the exit time of a parked vehicle.
export default function Exit() {
  const [regNo, setRegNo] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const [record, setRecord] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    setRecord(null);
    try {
      setRecord(await api('/parking/exit', { method: 'POST', body: { regNo } }));
    } catch (err) {
      if (err.field && err.code !== 'NO_ACTIVE_RECORD' && err.code !== 'VEHICLE_NOT_FOUND') setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    }
  }

  return (
    <section className="card">
      <h2>Vehicle exit</h2>
      <Banner result={result} />
      <form onSubmit={submit} noValidate>
        <Field id="regNo" label="Registration number" required error={fieldError.regNo}>
          <input id="regNo" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="KA01AB1234" maxLength={15} autoFocus />
        </Field>
        <button type="submit">Record exit</button>
      </form>
      {record && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <tbody>
              <tr><th>Ticket</th><td>{record.ticketNo}</td></tr>
              <tr><th>Vehicle</th><td>{record.regNo}</td></tr>
              <tr><th>Slot</th><td>{record.slotId}</td></tr>
              <tr><th>Entry time</th><td>{formatTime(record.entryTime)}</td></tr>
              <tr><th>Exit time</th><td>{formatTime(record.exitTime)}</td></tr>
              <tr><th>Duration</th><td>{record.durationMin} min</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
