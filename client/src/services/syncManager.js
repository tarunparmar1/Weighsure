import API from './api';
import {
  getSyncQueue,
  removeQueueItem,
  getOfflineInstruments,
  getOfflineReports,
  saveOfflineInstrument,
  saveOfflineReport,
} from './offlineStore';

export async function syncOfflineData() {
  try {
    const queue = await getSyncQueue();
    if (queue.length === 0) {
      console.log('Sync queue is empty.');
      return { success: true, count: 0 };
    }

    const offlineInsts = await getOfflineInstruments();
    const offlineRpts = await getOfflineReports();

    const pendingInstruments = offlineInsts.filter((i) => !i._id);
    const pendingReports = offlineRpts.filter((r) => !r._id || r.needsSync);

    const payload = {
      instruments: pendingInstruments,
      reports: pendingReports,
      lastSyncTimestamp: localStorage.getItem('nawi_last_sync') || null,
    };

    const res = await API.post('/sync', payload);
    const { syncResults, pull, syncTimestamp } = res.data;

    // Update synced instruments locally
    if (pull?.instruments) {
      for (const inst of pull.instruments) {
        await saveOfflineInstrument({ ...inst, synced: true });
      }
    }

    // Update synced reports locally
    if (pull?.reports) {
      for (const rpt of pull.reports) {
        await saveOfflineReport({ ...rpt, synced: true });
      }
    }

    // Clear processed queue items
    for (const item of queue) {
      await removeQueueItem(item.id);
    }

    localStorage.setItem('nawi_last_sync', syncTimestamp);
    return { success: true, syncResults };
  } catch (error) {
    console.error('Offline sync failed:', error);
    return { success: false, error: error.message };
  }
}
