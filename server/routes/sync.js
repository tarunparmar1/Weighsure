const express = require('express');
const TestReport = require('../models/TestReport');
const Instrument = require('../models/Instrument');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Sync endpoint — handles batch sync from offline clients.
 * Accepts arrays of instruments and reports that were created/updated offline.
 * Uses clientId to match and merge with existing records.
 */

// @route   POST /api/sync
router.post('/', auth, async (req, res) => {
  try {
    const { instruments = [], reports = [], lastSyncTimestamp } = req.body;
    const syncResults = {
      instruments: { created: 0, updated: 0, errors: [] },
      reports: { created: 0, updated: 0, errors: [] },
    };

    // Sync instruments
    for (const inst of instruments) {
      try {
        if (inst.clientId) {
          const existing = await Instrument.findOne({ clientId: inst.clientId });
          if (existing) {
            // Update if client version is newer
            if (!existing.updatedAt || new Date(inst.updatedAt) > existing.updatedAt) {
              await Instrument.findByIdAndUpdate(existing._id, {
                ...inst,
                _id: existing._id,
                createdBy: existing.createdBy,
              });
              syncResults.instruments.updated++;
            }
          } else {
            const newInst = new Instrument({
              ...inst,
              _id: undefined,
              createdBy: req.user._id,
            });
            await newInst.save();
            syncResults.instruments.created++;
          }
        }
      } catch (err) {
        syncResults.instruments.errors.push({ clientId: inst.clientId, error: err.message });
      }
    }

    // Sync reports
    for (const rpt of reports) {
      try {
        if (rpt.clientId) {
          const existing = await TestReport.findOne({ clientId: rpt.clientId });
          if (existing) {
            if (!existing.updatedAt || new Date(rpt.updatedAt) > existing.updatedAt) {
              await TestReport.findByIdAndUpdate(existing._id, {
                ...rpt,
                _id: existing._id,
                createdBy: existing.createdBy,
                syncedAt: new Date(),
              });
              syncResults.reports.updated++;
            }
          } else {
            // Map instrument clientId to server _id
            let instrumentId = rpt.instrument;
            if (rpt.instrumentClientId) {
              const serverInst = await Instrument.findOne({ clientId: rpt.instrumentClientId });
              if (serverInst) instrumentId = serverInst._id;
            }

            const newReport = new TestReport({
              ...rpt,
              _id: undefined,
              instrument: instrumentId,
              createdBy: req.user._id,
              syncedAt: new Date(),
            });
            await newReport.save();
            syncResults.reports.created++;
          }
        }
      } catch (err) {
        syncResults.reports.errors.push({ clientId: rpt.clientId, error: err.message });
      }
    }

    // Fetch server-side changes since last sync for pull
    const pullQuery = lastSyncTimestamp
      ? { updatedAt: { $gt: new Date(lastSyncTimestamp) } }
      : {};

    const serverInstruments = await Instrument.find(pullQuery).lean();
    const serverReports = await TestReport.find(pullQuery)
      .populate('instrument', 'manufacturer.name modelInfo.modelNumber')
      .lean();

    res.json({
      syncResults,
      pull: {
        instruments: serverInstruments,
        reports: serverReports,
      },
      syncTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Sync failed', error: error.message });
  }
});

// @route   GET /api/sync/status
router.get('/status', auth, async (req, res) => {
  try {
    const instrumentCount = await Instrument.countDocuments();
    const reportCount = await TestReport.countDocuments();
    res.json({
      instrumentCount,
      reportCount,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
