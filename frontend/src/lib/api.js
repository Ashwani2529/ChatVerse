import { loadToken } from './storage';

export const API_URL = (
  process.env.REACT_APP_BACKEND_URL || 'http://localhost:4501'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status, field, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = field;
    this.code = code;
  }
}

const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = loadToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      { code: 'NETWORK' }
    );
  }

  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    throw new ApiError(payload.error || `Request failed (${response.status})`, {
      status: response.status,
      field: payload.field,
      code: payload.code,
    });
  }

  return payload;
};

export const joinRoom = ({ roomId, password, name }) =>
  request('/api/auth/join', {
    method: 'POST',
    body: { roomId, password, name },
    auth: false,
  });

export const fetchSession = () => request('/api/auth/me');

export const fetchMessages = ({ roomId, before, limit = 50 }) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set('before', before);

  return request(`/api/rooms/${encodeURIComponent(roomId)}/messages?${params}`);
};
