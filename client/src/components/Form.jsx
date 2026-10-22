// Small shared form helpers: labelled fields with * for mandatory ones and the
// error message shown next to the field it belongs to (SRS 3.1).

export function Field({ id, label, required, error, children }) {
  return (
    <div className="row">
      <label htmlFor={id} className={required ? 'req' : undefined}>{label}</label>
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

export function Banner({ result }) {
  if (!result) return null;
  return <div className={`banner ${result.ok ? 'ok' : 'error'}`} role="status">{result.message}</div>;
}

export const VEHICLE_TYPES = [
  ['TWO_WHEELER', 'Two-wheeler'],
  ['CAR', 'Car'],
  ['OTHER', 'Other'],
];

export const typeLabel = (t) => (VEHICLE_TYPES.find(([v]) => v === t) || [t, t])[1];

export const formatTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN') : '—');
