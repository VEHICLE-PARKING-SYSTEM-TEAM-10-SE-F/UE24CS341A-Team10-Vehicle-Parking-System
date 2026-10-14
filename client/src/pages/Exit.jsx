import { useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, formatTime } from '../components/Form.jsx';

// FR-15 – FR-18: record the exit, show the fee summary, then Confirm Exit (or Cancel).
export default function Exit() {
  const [regNo, setRegNo] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);

  async function recordExit(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    setSummary(null);
    try {
      setSummary(await api('/parking/exit', { method: 'POST', body: { regNo } }));
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && err.field) setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    }
  }

  async function finish(action) {
    setBusy(true);
    try {
      const r = await api(`/parking/${summary.ticketNo}/${action}`, { method: 'POST' });
      setResult(action === 'confirm-exit'
        ? { ok: true, message: `Exit complete: ${r.regNo} paid ₹${r.fee}. Slot ${r.slotId} is now Available.` }
        : { ok: true, message: `Exit cancelled. ${r.regNo} is still parked in slot ${r.slotId}.` });
      setSummary(null);
      setRegNo('');
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Vehicle exit</h2>
      <Banner result={result} />
      {!summary && (
        <form onSubmit={recordExit} noValidate>
          <Field id="regNo" label="Registration number" required error={fieldError.regNo}>
            <input id="regNo" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="KA01AB1234" maxLength={15} autoFocus />
          </Field>
          <button type="submit">Record exit</button>
        </form>
      )}
      {summary && (
        <>
          <h3>Fee summary – please confirm</h3>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr><th>Ticket</th><td>{summary.ticketNo}</td></tr>
                <tr><th>Vehicle</th><td>{summary.regNo}</td></tr>
                <tr><th>Slot</th><td>{summary.slotId}</td></tr>
                <tr><th>Entry time</th><td>{formatTime(summary.entryTime)}</td></tr>
                <tr><th>Exit time</th><td>{formatTime(summary.exitTime)}</td></tr>
                <tr><th>Duration</th><td>{summary.durationMin} min</td></tr>
                <tr><th>Billable hours</th><td>{summary.billableHours} (first {summary.graceMinutes} min free)</td></tr>
                <tr><th>Rate</th><td>₹{summary.hourlyRate} per hour</td></tr>
                <tr><th>Fee</th><td><strong>₹{summary.fee}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => finish('confirm-exit')} disabled={busy}>Confirm exit</button>
            <button className="secondary" onClick={() => finish('cancel-exit')} disabled={busy}>Cancel</button>
          </p>
        </>
      )}
    </section>
  );
}
