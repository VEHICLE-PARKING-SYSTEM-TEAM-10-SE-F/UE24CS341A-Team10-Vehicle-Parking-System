import { useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, formatTime } from '../components/Form.jsx';

// FR-11 – FR-14: record vehicle entry. The system picks the lowest matching slot;
// the attendant may type a different Available slot of the same type (FR-12).
export default function Entry() {
  const [regNo, setRegNo] = useState('');
  const [slotId, setSlotId] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    setTicket(null);
    setBusy(true);
    try {
      const t = await api('/parking/entry', { method: 'POST', body: { regNo, slotId } });
      setTicket(t);
      setRegNo('');
      setSlotId('');
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Vehicle entry</h2>
      <Banner result={result} />
      {ticket && (
        <div className="banner ok" role="status">
          <strong>Ticket {ticket.ticketNo}</strong> · {ticket.regNo} → slot <strong>{ticket.slotId}</strong> · entered {formatTime(ticket.entryTime)}
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <Field id="regNo" label="Registration number" required error={fieldError.regNo}>
          <input id="regNo" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="KA01AB1234" maxLength={15} autoFocus />
        </Field>
        <Field id="slotId" label="Slot (leave empty to auto-allocate)" error={fieldError.slotId}>
          <input id="slotId" value={slotId} onChange={(e) => setSlotId(e.target.value)} placeholder="Auto" maxLength={12} />
        </Field>
        <button type="submit" disabled={busy}>Record entry</button>
      </form>
    </section>
  );
}
