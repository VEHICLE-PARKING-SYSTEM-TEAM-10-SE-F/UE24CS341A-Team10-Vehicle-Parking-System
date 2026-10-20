import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Banner, Field, typeLabel } from '../components/Form.jsx';

// FR-19: the Administrator sets the hourly rate for each vehicle type. A change applies only
// to exits recorded after it; the 15-minute grace period is fixed (FR-16).
export default function FeeRates() {
  const [rates, setRates] = useState([]);
  const [draft, setDraft] = useState({});
  const [grace, setGrace] = useState(15);
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api('/fee-rates');
      setRates(r.rates);
      setGrace(r.graceMinutes);
      setDraft(Object.fromEntries(r.rates.map((x) => [x.vehicleType, x.hourlyRate ?? ''])));
    } catch (err) {
      setResult({ ok: false, message: err.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    const bad = {};
    const body = rates.map(({ vehicleType }) => {
      const text = String(draft[vehicleType]).trim();
      const value = Number(text);
      if (text === '' || !/^\d+(\.\d{1,2})?$/.test(text)) bad[vehicleType] = 'Enter a number of rupees, 0 or more (up to 2 decimals)';
      return { vehicleType, hourlyRate: value };
    });
    if (Object.keys(bad).length) {
      setFieldError(bad);
      return;
    }
    try {
      await api('/fee-rates', { method: 'PUT', body: { rates: body } });
      setResult({ ok: true, message: 'Hourly rates saved. They apply to exits recorded from now on.' });
      load();
    } catch (err) {
      setResult({ ok: false, message: err.message });
    }
  }

  return (
    <section className="card">
      <h2>Fee rates</h2>
      <p className="muted">Fee = billable hours × hourly rate. The first {grace} minutes are free; after that every started hour is charged.</p>
      <Banner result={result} />
      <form onSubmit={save} noValidate>
        {rates.map((r) => (
          <Field key={r.vehicleType} id={`rate-${r.vehicleType}`} label={`${typeLabel(r.vehicleType)} – ₹ per hour`} required error={fieldError[r.vehicleType]}>
            <input
              id={`rate-${r.vehicleType}`}
              inputMode="decimal"
              value={draft[r.vehicleType] ?? ''}
              onChange={(e) => setDraft({ ...draft, [r.vehicleType]: e.target.value })}
              maxLength={9}
            />
          </Field>
        ))}
        <button type="submit">Save rates</button>
      </form>
    </section>
  );
}
