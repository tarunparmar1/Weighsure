const express = require('express');
const OimlRule = require('../models/OimlRule');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/oiml-rules — Get all rule versions
router.get('/', auth, async (req, res) => {
  try {
    const rules = await OimlRule.find()
      .populate('uploadedBy', 'name email')
      .sort('-createdAt');
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/oiml-rules/latest — Get latest active rule
router.get('/latest', auth, async (req, res) => {
  try {
    const rule = await OimlRule.findOne({ isLatest: true, isActive: true });
    if (!rule) return res.status(404).json({ message: 'No active rules found' });
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/oiml-rules/:version
router.get('/:version', auth, async (req, res) => {
  try {
    const rule = await OimlRule.findOne({ version: req.params.version });
    if (!rule) return res.status(404).json({ message: 'Rule version not found' });
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/oiml-rules — Upload a new rule version (admin only)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { version } = req.body;

    // Check if version already exists
    const existing = await OimlRule.findOne({ version });
    if (existing) {
      return res.status(400).json({ message: `Rule version "${version}" already exists` });
    }

    // Mark all existing rules as not latest
    await OimlRule.updateMany({}, { isLatest: false });

    const rule = new OimlRule({
      ...req.body,
      isLatest: true,
      isActive: true,
      uploadedBy: req.user._id,
    });
    await rule.save();

    res.status(201).json({ rule, message: 'New OIML rule version uploaded and set as latest' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/oiml-rules/:id/set-latest — Set a specific version as latest
router.put('/:id/set-latest', auth, roleCheck('admin'), async (req, res) => {
  try {
    await OimlRule.updateMany({}, { isLatest: false });
    const rule = await OimlRule.findByIdAndUpdate(req.params.id, { isLatest: true }, { new: true });
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json({ rule, message: 'Rule set as latest' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/oiml-rules/:id/toggle-active
router.put('/:id/toggle-active', auth, roleCheck('admin'), async (req, res) => {
  try {
    const rule = await OimlRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/oiml-rules/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const rule = await OimlRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    if (rule.isLatest) return res.status(400).json({ message: 'Cannot delete the latest active rule. Set another version as latest first.' });
    await OimlRule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rule version deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
