import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Banner, Field } from '../components/Form.jsx';

const ROLES = [['ATTENDANT', 'Parking Attendant'], ['ADMIN', 'Administrator']];
const roleLabel = (r) => (ROLES.find(([v]) => v === r) || [r, r])[1];
const EMPTY = { username: '', name: '', password: '', role: 'ATTENDANT' };

// FR-04: the Administrator creates, updates and deactivates accounts and assigns roles.
export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [fieldError, setFieldError] = useState({});
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = useCallback(async () => {
    try {
      setUsers((await api('/users')).users);
    } catch (err) {
      setResult({ ok: false, message: err.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    setFieldError({});
    setResult(null);
    try {
      const u = await api('/users', { method: 'POST', body: form });
      setResult({ ok: true, message: `Created ${roleLabel(u.role)} account ${u.username}.` });
      setForm(EMPTY);
      load();
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      else setResult({ ok: false, message: err.message });
    }
  }

  async function change(u, body, done) {
    setResult(null);
    try {
      await api(body.active === undefined ? `/users/${u.id}` : `/users/${u.id}/status`, {
        method: body.active === undefined ? 'PUT' : 'PATCH', body,
      });
      setResult({ ok: true, message: done });
      load();
    } catch (err) {
      setResult({ ok: false, message: err.message });
    }
  }

  return (
    <>
      <section className="card">
        <h2>User management</h2>
        <Banner result={result} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === me.id;
                const other = u.role === 'ADMIN' ? 'ATTENDANT' : 'ADMIN';
                return (
                  <tr key={u.id}>
                    <td>{u.username}{self && ' (you)'}</td>
                    <td>{u.name}</td>
                    <td>{roleLabel(u.role)}</td>
                    <td className={`status ${u.active ? 'AVAILABLE' : 'UNAVAILABLE'}`}>{u.active ? 'Active' : 'Deactivated'}</td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!self && (
                        <>
                          <button className="secondary" onClick={() => change(u, { role: other }, `${u.username} is now ${roleLabel(other)}.`)}>
                            Make {roleLabel(other)}
                          </button>
                          <button className="secondary" onClick={() => change(u, { active: !u.active }, `${u.username} ${u.active ? 'deactivated' : 'reactivated'}.`)}>
                            {u.active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <h2>Create account</h2>
        <form onSubmit={create} noValidate>
          <Field id="username" label="Username" required error={fieldError.username}>
            <input id="username" value={form.username} onChange={set('username')} maxLength={30} autoComplete="off" />
          </Field>
          <Field id="name" label="Full name" required error={fieldError.name}>
            <input id="name" value={form.name} onChange={set('name')} maxLength={60} />
          </Field>
          <Field id="password" label="Password (at least 8 characters)" required error={fieldError.password}>
            <input id="password" type="password" value={form.password} onChange={set('password')} maxLength={128} autoComplete="new-password" />
          </Field>
          <Field id="role" label="Role" required error={fieldError.role}>
            <select id="role" value={form.role} onChange={set('role')}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <button type="submit">Create account</button>
        </form>
      </section>
    </>
  );
}
