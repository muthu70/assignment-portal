const BASE = '/api';

// Sends a JSON body, or a FormData object for file uploads. Throws with the server's message on failure.
export async function api(path, { method = 'GET', body, form } = {}) {
  const options = { method, credentials: 'include', headers: {} };

  if (form) {
    options.body = form;
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Something went wrong');
  return data;
}

// Builds FormData from plain fields and file lists.
export function toFormData(fields, files = {}) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value);
  });
  Object.entries(files).forEach(([key, list]) => {
    Array.from(list || []).forEach((file) => fd.append(key, file));
  });
  return fd;
}

export const fileHref = (filename) => `${BASE}/files/${filename}`;
