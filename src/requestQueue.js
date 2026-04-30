const FAST_INTERVAL_MS = 1000;
const BATCH_INTERVAL_MS = 10000;

const fastQueue = new Map();
const batchAddQueue = new Map();

let fastTimer = null;
let batchTimer = null;

function ensureFastTimer() {
  if (fastTimer) return;
  fastTimer = setInterval(flushFast, FAST_INTERVAL_MS);
}

function ensureBatchTimer() {
  if (batchTimer) return;
  batchTimer = setInterval(flushBatch, BATCH_INTERVAL_MS);
}

async function flushFast() {
  if (fastQueue.size === 0) return;
  const entries = [...fastQueue.values()];
  fastQueue.clear();
  for (const { execute, resolve, reject } of entries) {
    try {
      const result = await execute();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }
}

async function flushBatch() {
  if (batchAddQueue.size === 0) return;
  const entries = [...batchAddQueue.entries()]; // [[id, {resolve,reject}]]
  batchAddQueue.clear();
  if (!entries.length) return;

  try {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    entries[0][1]();
  } catch (err) {
    console.log(err);
  }
}

export function enqueueFast(dedupKey, execute) {
  ensureFastTimer();
  if (fastQueue.has(dedupKey)) {
    return;
  }
  return new Promise((resolve, reject) => {
    fastQueue.set(dedupKey, { execute, resolve, reject });
  });
}

export function enqueueAddItem(id, afterAdd) {
  ensureBatchTimer();
  if (batchAddQueue.has(id)) {
    return;
  }
  batchAddQueue.set(id, afterAdd);
}

export function flushAll() {
  flushFast();
  flushBatch();
}
