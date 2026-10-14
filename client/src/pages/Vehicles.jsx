import { useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, VEHICLE_TYPES, typeLabel } from '../components/Form.jsx';

// FR-06, FR-07: register a vehicle.
export default function Vehicles() {
  const [form, setForm] = useState({ regNo: '', vehicleType: '', ownerContact: '' });
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    try {
      const v = await api('/vehicles', { method: 'POST', body: form });
      setResult({ ok: true, message: `Registered ${v.regNo} (${typeLabel(v.vehicleType)}).` });
      setForm({ regNo: '', vehicleType: '', ownerContact: '' });
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    }
  }

  return (
    <section className="card">
      <h2>Register vehicle</h2>
      <Banner result={result} />
      <form onSubmit={submit} noValidate>
        <Field id="regNo" label="Registration number" required error={fieldError.regNo}>
          <input id="regNo" value={form.regNo} onChange={set('regNo')} placeholder="KA01AB1234" maxLength={15} />
        </Field>
        <Field id="vehicleType" label="Vehicle type" required error={fieldError.vehicleType}>
          <select id="vehicleType" value={form.vehicleType} onChange={set('vehicleType')}>
            <option value="">Select…</option>
            {VEHICLE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field id="ownerContact" label="Owner contact number" error={fieldError.ownerContact}>
          <input id="ownerContact" value={form.ownerContact} onChange={set('ownerContact')} placeholder="Optional" maxLength={15} />
        </Field>
        <button type="submit">Register</button>
      </form>
    </section>
  );
}
