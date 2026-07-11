const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function listDriverPackages() {
  return fetch(`${BASE}/drivers`).then(handle);
}

export function uploadDriverPackage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE}/drivers`, { method: 'POST', body: formData }).then(handle);
}

export function updateDriverPackage(id, updates) {
  return fetch(`${BASE}/drivers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).then(handle);
}

export function generatePackage(payload) {
  return fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function listGeneratedPackages() {
  return fetch(`${BASE}/generated`).then(handle);
}

export function downloadGeneratedUrl(id) {
  return `${BASE}/generated/${id}/download`;
}
