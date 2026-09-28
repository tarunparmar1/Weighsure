const express = require('express');
const mongoose = require('mongoose');
const Instrument = require('../models/Instrument');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/instruments
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'manufacturer.name': { $regex: search, $options: 'i' } },
        { 'modelInfo.modelNumber': { $regex: search, $options: 'i' } },
        { 'modelInfo.serialNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const instruments = await Instrument.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Instrument.countDocuments(query);

    res.json({ instruments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/instruments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    let instrument = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      instrument = await Instrument.findById(id).populate('createdBy', 'name email');
    } else {
      instrument = await Instrument.findOne({ clientId: id }).populate('createdBy', 'name email');
    }

    if (!instrument) return res.status(404).json({ message: 'Instrument not found' });
    res.json({ instrument });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/instruments
router.post('/', auth, roleCheck('admin', 'engineer'), async (req, res) => {
  try {
    const instrument = new Instrument({
      ...req.body,
      createdBy: req.user._id,
    });
    await instrument.save();
    res.status(201).json({ instrument });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/instruments/:id
router.put('/:id', auth, roleCheck('admin', 'engineer'), async (req, res) => {
  try {
    const id = req.params.id;
    let instrument = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      instrument = await Instrument.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    } else {
      instrument = await Instrument.findOneAndUpdate({ clientId: id }, req.body, { new: true, runValidators: true });
    }

    if (!instrument) return res.status(404).json({ message: 'Instrument not found' });
    res.json({ instrument });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/instruments/:id
router.delete('/:id', auth, roleCheck('admin', 'engineer'), async (req, res) => {
  try {
    const id = req.params.id;
    let instrument = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      instrument = await Instrument.findByIdAndDelete(id);
    } else {
      instrument = await Instrument.findOneAndDelete({
        $or: [{ clientId: id }, { 'modelInfo.modelNumber': id }],
      });
    }

    if (!instrument) {
      // Even if not found on server, return 200 so local client can proceed
      return res.json({ message: 'Instrument removed' });
    }
    res.json({ message: 'Instrument deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
