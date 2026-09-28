const express = require('express');
const mongoose = require('mongoose');
const TestReport = require('../models/TestReport');
const Instrument = require('../models/Instrument');
const OimlEngine = require('../engine');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { generatePDF } = require('../utils/pdfGenerator');
const { generateDOCX } = require('../utils/docxGenerator');

const router = express.Router();

function generateReportNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `NAWI-${y}${m}-${seq}`;
}

const authFlexible = async (req, res, next) => {
  let token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token invalid or user inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Helper to get or create instrument reference
async function resolveInstrumentId(instRef) {
  if (instRef && typeof instRef === 'object' && instRef._id && mongoose.Types.ObjectId.isValid(instRef._id)) {
    return instRef._id;
  }
  if (instRef && typeof instRef === 'string' && mongoose.Types.ObjectId.isValid(instRef)) {
    return instRef;
  }
  const found = await Instrument.findOne({});
  return found ? found._id : null;
}

// @route GET /api/reports
router.get('/', authFlexible, async (req, res) => {
  try {
    const { status, instrument, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (instrument && mongoose.Types.ObjectId.isValid(instrument)) {
      query.instrument = instrument;
    }
    if (search) {
      query.$or = [
        { reportNumber: { $regex: search, $options: 'i' } },
        { 'laboratory.name': { $regex: search, $options: 'i' } },
      ];
    }

    const reports = await TestReport.find(query)
      .populate('instrument', 'manufacturer.name modelInfo.modelNumber specifications.accuracyClass')
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TestReport.countDocuments(query);

    res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route GET /api/reports/:id
router.get('/:id', authFlexible, async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await TestReport.findById(id)
        .populate('instrument')
        .populate('createdBy', 'name email');
    } else {
      report = await TestReport.findOne({
        $or: [{ clientId: id }, { reportNumber: id }],
      })
        .populate('instrument')
        .populate('createdBy', 'name email');
    }

    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route POST /api/reports
router.post('/', authFlexible, async (req, res) => {
  try {
    let engineVersion = 'R76-2006-v1';
    try {
      const engine = await OimlEngine.loadLatest();
      engineVersion = engine.getVersion();
    } catch (e) {}

    const instrumentId = await resolveInstrumentId(req.body.instrument);
    if (!instrumentId) {
      return res.status(400).json({ message: 'No valid instrument available' });
    }

    const reportData = {
      ...req.body,
      instrument: instrumentId,
      reportNumber: req.body.reportNumber || generateReportNumber(),
      oimlRuleVersion: req.body.oimlRuleVersion || engineVersion,
      createdBy: req.user._id,
    };

    let report = null;
    if (req.body.clientId) {
      report = await TestReport.findOne({ clientId: req.body.clientId });
    }

    if (report) {
      Object.assign(report, reportData);
      await report.save();
    } else {
      report = new TestReport(reportData);
      await report.save();
    }

    const populated = await TestReport.findById(report._id)
      .populate('instrument')
      .populate('createdBy', 'name email');

    res.status(201).json({ report: populated || report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route POST /api/reports/:id/evaluate
router.post('/:id/evaluate', authFlexible, async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await TestReport.findById(id).populate('instrument');
    } else {
      report = await TestReport.findOne({
        $or: [{ clientId: id }, { reportNumber: id }],
      }).populate('instrument');
    }

    if (!report) return res.status(404).json({ message: 'Report not found' });

    const engine = await OimlEngine.loadVersion(report.oimlRuleVersion || 'R76-2006-v1');
    const testData = req.body;
    const evaluation = engine.evaluateAll(report.instrument, testData);

    const updatedTests = [];
    for (const [testType, result] of Object.entries(evaluation.tests)) {
      updatedTests.push({
        testType,
        readings: testData[testType],
        results: {
          calculated: result,
          passed: result.passed,
          remarks: result.summary,
        },
        performedAt: new Date(),
        performedBy: req.user._id,
      });
    }

    report.tests = updatedTests;
    report.overallResult = {
      passed: evaluation.overallPassed,
      summary: evaluation.overallPassed
        ? 'Instrument satisfies all metrological criteria of OIML R-76.'
        : 'Instrument fails to meet one or more MPE tolerance requirements.',
      evaluatedBy: req.user.name,
    };
    report.status = 'completed';
    await report.save();

    res.json({ report, evaluation });
  } catch (error) {
    res.status(500).json({ message: 'Evaluation failed', error: error.message });
  }
});

// @route POST /api/reports/:id/approve
router.post('/:id/approve', authFlexible, async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await TestReport.findById(id);
    } else {
      report = await TestReport.findOne({
        $or: [{ clientId: id }, { reportNumber: id }],
      });
    }

    // If report is not in DB yet, create it from request body if available
    if (!report && req.body && (req.body.reportNumber || req.body.laboratory)) {
      const instrumentId = await resolveInstrumentId(req.body.instrument);
      report = new TestReport({
        ...req.body,
        instrument: instrumentId,
        createdBy: req.user._id,
      });
    }

    if (!report) return res.status(404).json({ message: 'Report not found on server' });

    report.status = 'approved';
    report.overallResult = {
      ...report.overallResult,
      approvedBy: req.user.name || 'Dr. Rajesh Sharma (Director)',
    };
    await report.save();

    const populated = await TestReport.findById(report._id)
      .populate('instrument')
      .populate('createdBy', 'name email');

    res.json({ report: populated || report });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed: ' + error.message });
  }
});

// @route POST /api/reports/:id/reject
router.post('/:id/reject', authFlexible, async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await TestReport.findById(id);
    } else {
      report = await TestReport.findOne({
        $or: [{ clientId: id }, { reportNumber: id }],
      });
    }

    if (!report && req.body && (req.body.reportNumber || req.body.laboratory)) {
      const instrumentId = await resolveInstrumentId(req.body.instrument);
      report = new TestReport({
        ...req.body,
        instrument: instrumentId,
        createdBy: req.user._id,
      });
    }

    if (!report) return res.status(404).json({ message: 'Report not found on server' });

    report.status = 'rejected';
    report.overallResult = {
      ...report.overallResult,
      passed: false,
      summary: reason || 'Report rejected during official review.',
      approvedBy: `Rejected by ${req.user.name || 'Testing Officer'}`,
    };
    await report.save();

    const populated = await TestReport.findById(report._id)
      .populate('instrument')
      .populate('createdBy', 'name email');

    res.json({ report: populated || report });
  } catch (error) {
    res.status(500).json({ message: 'Rejection failed: ' + error.message });
  }
});

// @route GET /api/reports/:id/pdf
router.get('/:id/pdf', authFlexible, async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await TestReport.findById(id)
        .populate('instrument')
        .populate('createdBy', 'name email');
    } else {
      report = await TestReport.findOne({
        $or: [{ clientId: id }, { reportNumber: id }],
      })
        .populate('instrument')
        .populate('createdBy', 'name email');
    }

    if (!report) return res.status(404).json({ message: 'Report not found' });

    const pdfBuffer = await generatePDF(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report.reportNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// @route GET /api/reports/:id/docx
router.get('/:id/docx', authFlexible, async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await TestReport.findById(id)
        .populate('instrument')
        .populate('createdBy', 'name email');
    } else {
      report = await TestReport.findOne({
        $or: [{ clientId: id }, { reportNumber: id }],
      })
        .populate('instrument')
        .populate('createdBy', 'name email');
    }

    if (!report) return res.status(404).json({ message: 'Report not found' });

    const docxBuffer = await generateDOCX(report);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${report.reportNumber}.docx`);
    res.send(docxBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error generating DOCX', error: error.message });
  }
});

// @route DELETE /api/reports/:id
router.delete('/:id', authFlexible, roleCheck('admin'), async (req, res) => {
  try {
    const report = await TestReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
