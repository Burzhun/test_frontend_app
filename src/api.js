import { enqueueFast, enqueueAddItem } from './requestQueue';
console.log(process.env.REACT_APP_SERVER_HOST);
const BASE = process.env.REACT_APP_SERVER_HOST + '/api';

// ─── Items (left panel) ───────────────────────────────────────────────────────

export function fetchItems({ offset = 0, limit = 20, filter = '', lastId = 0 } = {}) {
  const key = `items:${offset}:${limit}:${filter}`;
  return enqueueFast(key, () => fetch(`${BASE}/items?offset=${offset}&limit=${limit}&lastId=${lastId}&filter=${encodeURIComponent(filter)}`).then((r) => r.json()));
}

export function addItem(id, afterAdd) {
  return enqueueAddItem(id, afterAdd);
}

// ─── Selected (right panel) ───────────────────────────────────────────────────

export function fetchSelected({ offset = 0, limit = 20, filter = '' } = {}) {
  const key = `selected:${offset}:${limit}:${filter}`;
  return enqueueFast(key, () => fetch(`${BASE}/selected?offset=${offset}&limit=${limit}&filter=${encodeURIComponent(filter)}`).then((r) => r.json()));
}

export function selectItems(ids) {
  const key = `select:${ids.sort((a, b) => a - b).join(',')}`;
  return enqueueFast(key, () =>
    fetch(`${BASE}/selected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).then((r) => r.json()),
  );
}

export function deselectItem(id) {
  const key = `deselect:${id}`;
  return enqueueFast(key, () => fetch(`${BASE}/selected/${id}`, { method: 'DELETE' }).then((r) => r.json()));
}

export function reorderSelected(ids) {
  const key = `reorder:${Date.now()}`; // always unique — no dedup for reorder
  return enqueueFast(key, () =>
    fetch(`${BASE}/selected/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).then((r) => r.json()),
  );
}
