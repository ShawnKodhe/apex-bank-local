const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'apex_bank_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, body });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function createEntityClient(name) {
  return {
    async filter(filters = {}, sort, limit) {
      return request(`/api/entities/${name}/filter`, {
        method: 'POST',
        body: { filters, sort, limit },
      });
    },
    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return request(`/api/entities/${name}/list${qs ? `?${qs}` : ''}`);
    },
    async create(data) {
      return request(`/api/entities/${name}`, { method: 'POST', body: data });
    },
    async update(id, data) {
      return request(`/api/entities/${name}/${id}`, { method: 'PATCH', body: data });
    },
    async delete(id) {
      return request(`/api/entities/${name}/${id}`, { method: 'DELETE' });
    },
    subscribe(callback) {
      const token = getToken();
      if (!token) return () => {};

      const url = `${API_BASE}/api/events/transactions`;
      const controller = new AbortController();

      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }).then(async (res) => {
        if (!res.ok) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                callback(event);
              } catch {
                /* ignore parse errors */
              }
            }
          }
        }
      }).catch(() => {});

      return () => controller.abort();
    },
  };
}

export const api = {
  auth: {
    async register(data) {
      const res = await request('/api/auth/register', { method: 'POST', body: data });
      setToken(res.token);
      return res.user;
    },
    async login(email, password) {
      const res = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      setToken(res.token);
      return res.user;
    },
    async me() {
      return request('/api/auth/me');
    },
    async updateMe(data) {
      return request('/api/auth/me', { method: 'PATCH', body: data });
    },
    logout(redirectUrl) {
      setToken(null);
      if (redirectUrl) {
        window.location.href = '/login';
      }
    },
    redirectToLogin() {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
    },
  },
  entities: {
    Wallet: createEntityClient('Wallet'),
    Transaction: createEntityClient('Transaction'),
    KYCRequest: createEntityClient('KYCRequest'),
    User: createEntityClient('User'),
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const form = new FormData();
        form.append('file', file);
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        const fileUrl = data.file_url.startsWith('http')
          ? data.file_url
          : `${API_BASE}${data.file_url}`;
        return { file_url: fileUrl };
      },
      async SendEmail(payload) {
        return request('/api/email', { method: 'POST', body: payload });
      },
    },
  },
  users: {
    async lookup(email) {
      return request(`/api/entities/users/lookup?email=${encodeURIComponent(email)}`);
    },
  },
};
