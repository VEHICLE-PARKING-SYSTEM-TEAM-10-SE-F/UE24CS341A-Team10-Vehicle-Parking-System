import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, VEHICLE_TYPES, typeLabel } from '../components/Form.jsx';

const STATUS_LABEL = { AVAILABLE: 'Available', OCCUPIED: 'Occupied', UNAVAILABLE: 'Unavailable' };

// FR-08: the Administrator adds parking slots.
// FR-09: the Administrator sets a slot Unavailable and back to Available (not while Occupied).
export default function SlotAdmin() {
  const [form, setForm] = useState({ slotId: '', slotType: '' });
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const [slots, setSlots] = useState([]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = useCallback(async () => {
    try {
      setSlots((await api('/slots')).slots);
    } catch (err) {
      setResult({ ok: false, message: err.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    try {
      const s = await api('/slots', { method: 'POST', body: form });
      setResult({ ok: true, message: `Added slot ${s.slotId} (${typeLabel(s.slotType)}) – Available.` });
      setForm({ slotId: '', slotType: form.slotType });
      load();
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    }
  }

  async function toggle(slot) {
    const status = slot.status === 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE';
    setResult(null);
    try {
      const s = await api(`/slots/${encodeURIComponent(slot.slotId)}/status`, { method: 'PATCH', body: { status } });
      setResult({ ok: true, message: `Slot ${s.slotId} is now ${STATUS_LABEL[s.status]}.` });
      load();
    } catch (err) {
      setResult({ ok: false, message: err.message });
    }
  }

  return (
    <>
      <section className="card">
        <h2>Slot management</h2>
        <Banner result={result} />
        <form onSubmit={submit} noValidate>
          <Field id="slotId" label="Slot ID" required error={fieldError.slotId}>
            <input id="slotId" value={form.slotId} onChange={set('slotId')} placeholder="A-01" maxLength={12} />
          </Field>
          <Field id="slotType" label="Slot type" required error={fieldError.slotType}>
            <select id="slotType" value={form.slotType} onChange={set('slotType')}>
              <option value="">Select…</option>
              {VEHICLE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <button type="submit">Add slot</button>
        </form>
      </section>
      <section className="card">
        <h2>Slots</h2>
        {slots.length === 0 ? <p className="muted">No slots yet.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Slot ID</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.slotId}>
                    <td>{s.slotId}</td>
                    <td>{typeLabel(s.slotType)}</td>
                    <td className={`status ${s.status}`}>● {STATUS_LABEL[s.status]}</td>
                    <td>
                      {s.status === 'OCCUPIED'
                        ? <span className="muted">In use</span>
                        : (
                          <button className="secondary" onClick={() => toggle(s)}>
                            {s.status === 'UNAVAILABLE' ? 'Make Available' : 'Make Unavailable'}
                          </button>
                        )}
                    </td>
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
