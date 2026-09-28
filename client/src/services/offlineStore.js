import { openDB } from 'idb';

const DB_NAME = 'nawi_offline_db';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for offline instruments
      if (!db.objectStoreNames.contains('instruments')) {
        const instStore = db.createObjectStore('instruments', { keyPath: 'id' });
        instStore.createIndex('clientId', 'clientId', { unique: true });
        instStore.createIndex('synced', 'synced');
      }
      // Store for offline reports
      if (!db.objectStoreNames.contains('reports')) {
        const rptStore = db.createObjectStore('reports', { keyPath: 'id' });
        rptStore.createIndex('clientId', 'clientId', { unique: true });
        rptStore.createIndex('synced', 'synced');
      }
      // Sync queue store for pending mutations
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('type', 'type');
        queueStore.createIndex('timestamp', 'timestamp');
      }
      // Store cached OIML rules
      if (!db.objectStoreNames.contains('rules')) {
        db.createObjectStore('rules', { keyPath: 'version' });
      }
    },
  });
}

// Instruments
export async function saveOfflineInstrument(instrument) {
  const db = await initDB();
  const id = instrument._id || instrument.clientId || instrument.id || `local_inst_${Date.now()}`;
  const item = {
    ...instrument,
    id,
    _id: instrument._id,
    clientId: instrument.clientId || id,
    synced: !!instrument._id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('instruments', item);
  if (!instrument._id) {
    await queueForSync('INSTRUMENT', item);
  }
  return item;
}

export async function getOfflineInstruments() {
  const db = await initDB();
  return db.getAll('instruments');
}

export async function deleteOfflineInstrument(id) {
  const db = await initDB();
  // Try deleting by key
  await db.delete('instruments', id);
  // Also check if stored by _id or clientId
  const all = await db.getAll('instruments');
  for (const item of all) {
    if (item._id === id || item.clientId === id || item.id === id) {
      await db.delete('instruments', item.id);
    }
  }
}

// Reports
export async function saveOfflineReport(report) {
  const db = await initDB();
  const id = report._id || report.clientId || report.id || `local_rpt_${Date.now()}`;
  const item = {
    ...report,
    id,
    _id: report._id,
    clientId: report.clientId || id,
    synced: !!report._id,
    updatedAt: new Date().toISOString(),
  };
  await db.put('reports', item);
  if (!report._id || report.needsSync) {
    await queueForSync('REPORT', item);
  }
  return item;
}

export async function getOfflineReports() {
  const db = await initDB();
  return db.getAll('reports');
}

export async function deleteOfflineReport(id) {
  const db = await initDB();
  await db.delete('reports', id);
  const all = await db.getAll('reports');
  for (const item of all) {
    if (item._id === id || item.clientId === id || item.id === id) {
      await db.delete('reports', item.id);
    }
  }
}

// Sync Queue
export async function queueForSync(type, data) {
  const db = await initDB();
  await db.add('syncQueue', {
    type,
    data,
    timestamp: Date.now(),
  });
}

export async function getSyncQueue() {
  const db = await initDB();
  return db.getAll('syncQueue');
}

export async function clearSyncQueue() {
  const db = await initDB();
  await db.clear('syncQueue');
}

export async function removeQueueItem(id) {
  const db = await initDB();
  await db.delete('syncQueue', id);
}

// OIML Rules offline cache
export async function saveOfflineRule(rule) {
  const db = await initDB();
  await db.put('rules', rule);
}

export async function getOfflineRules() {
  const db = await initDB();
  return db.getAll('rules');
}
