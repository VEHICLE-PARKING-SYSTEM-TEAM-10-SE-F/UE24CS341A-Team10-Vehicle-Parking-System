// API client. Attaches the session token and turns the standard error body
// { error: { code, message, field } } into an ApiError the pages can show (SAD §4.4).
let token = null;
let onUnauthorized = () => {};

export function setToken(value) {
  token = value;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const err = data?.error || {};
    if (res.status === 401 && token) onUnauthorized(err.code, err.message);
    throw new ApiError(res.status, err.code || 'ERROR', err.message || 'Request failed', err.field || null);
  }
  return data;
}
