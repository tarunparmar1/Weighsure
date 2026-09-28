const express = require('express');
const TestReport = require('../models/TestReport');
const Instrument = require('../models/Instrument');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      totalReports,
      completedReports,
      draftReports,
      inProgressReports,
      approvedReports,
      totalInstruments,
      totalUsers,
    ] = await Promise.all([
      TestReport.countDocuments(),
      TestReport.countDocuments({ status: 'completed' }),
      TestReport.countDocuments({ status: 'draft' }),
      TestReport.countDocuments({ status: 'in_progress' }),
      TestReport.countDocuments({ status: 'approved' }),
      Instrument.countDocuments(),
      User.countDocuments(),
    ]);

    // Pass/Fail stats
    const passedReports = await TestReport.countDocuments({ 'overallResult.passed': true });
    const failedReports = await TestReport.countDocuments({ 'overallResult.passed': false, status: 'completed' });

    // Recent reports
    const recentReports = await TestReport.find()
      .populate('instrument', 'manufacturer.name modelInfo.modelNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(5)
      .lean();

    // Monthly report counts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await TestReport.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          passed: {
            $sum: { $cond: [{ $eq: ['$overallResult.passed', true] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$overallResult.passed', false] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Accuracy class distribution
    const classDistribution = await Instrument.aggregate([
      {
        $group: {
          _id: '$specifications.accuracyClass',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      stats: {
        totalReports,
        completedReports,
        draftReports,
        inProgressReports,
        approvedReports,
        totalInstruments,
        totalUsers,
        passedReports,
        failedReports,
      },
      recentReports,
      monthlyData,
      classDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
