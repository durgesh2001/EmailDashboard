const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export async function getEmails() {
  const res = await fetch(`${BASE}/api/emails`);
  if (!res.ok) throw new Error('Failed to load emails');
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${BASE}/api/analytics`);
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function saveReply(id, text) {
  const res = await fetch(`${BASE}/api/emails/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: text
  });
  if (!res.ok) throw new Error('Failed to save reply');
}

export async function updateStatus(id, status) {
  const res = await fetch(`${BASE}/api/emails/${id}/status?status=${encodeURIComponent(status)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to update status');
}

export async function seedDemo() {
  const res = await fetch(`${BASE}/api/_demo/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo');
}
