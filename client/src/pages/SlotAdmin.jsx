import { useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, VEHICLE_TYPES, typeLabel } from '../components/Form.jsx';

// FR-08: the Administrator adds parking slots.
export default function SlotAdmin() {
  const [form, setForm] = useState({ slotId: '', slotType: '' });
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    try {
      const s = await api('/slots', { method: 'POST', body: form });
      setResult({ ok: true, message: `Added slot ${s.slotId} (${typeLabel(s.slotType)}) – Available.` });
      setForm({ slotId: '', slotType: form.slotType });
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    }
  }

  return (
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
  );
}
