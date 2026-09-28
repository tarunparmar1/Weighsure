const mongoose = require('mongoose');

const oimlRuleSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  name: { type: String, default: 'OIML R-76' },
  description: { type: String },
  effectiveDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isLatest: { type: Boolean, default: false },

  // Accuracy class definitions
  accuracyClasses: {
    I: {
      label: { type: String, default: 'Special' },
      minScaleIntervals: { type: Number, default: 50000 },
      maxScaleIntervals: { type: Number, default: 500000 },
      minCapacityMultiplier: { type: Number, default: 100 },
      mpeRanges: [{
        fromIntervals: Number,
        toIntervals: Number,
        mpeInE: Number,
      }],
    },
    II: {
      label: { type: String, default: 'High' },
      minScaleIntervals: { type: Number, default: 5000 },
      maxScaleIntervals: { type: Number, default: 100000 },
      minCapacityMultiplier: { type: Number, default: 50 },
      mpeRanges: [{
        fromIntervals: Number,
        toIntervals: Number,
        mpeInE: Number,
      }],
    },
    III: {
      label: { type: String, default: 'Medium' },
      minScaleIntervals: { type: Number, default: 500 },
      maxScaleIntervals: { type: Number, default: 10000 },
      minCapacityMultiplier: { type: Number, default: 20 },
      mpeRanges: [{
        fromIntervals: Number,
        toIntervals: Number,
        mpeInE: Number,
      }],
    },
    IIII: {
      label: { type: String, default: 'Ordinary' },
      minScaleIntervals: { type: Number, default: 100 },
      maxScaleIntervals: { type: Number, default: 1000 },
      minCapacityMultiplier: { type: Number, default: 10 },
      mpeRanges: [{
        fromIntervals: Number,
        toIntervals: Number,
        mpeInE: Number,
      }],
    },
  },

  // Test-specific configuration
  testConfigurations: {
    eccentricity: {
      loadFraction: { type: Number, default: 1 / 3 },
      mpeMultiplier: { type: Number, default: 1 },
      positions: { type: Number, default: 5 },
      description: { type: String, default: 'Load at 1/3 Max placed at center and 4 off-center positions' },
    },
    repeatability: {
      minRepetitions: { type: Number, default: 6 },
      loads: { type: [String], default: ['0.5*Max', 'Max'] },
      maxRangeMultiplier: { type: Number, default: 1 },
      description: { type: String, default: 'Minimum 6 repetitions at approximately 0.5*Max and Max' },
    },
    discrimination: {
      extraLoadMultiplier: { type: Number, default: 1.4 },
      description: { type: String, default: 'Adding 1.4d extra load should cause indication change' },
    },
    increasingDecreasing: {
      minTestPoints: { type: Number, default: 10 },
      description: { type: String, default: 'Errors at various loads during increasing and decreasing loading' },
    },
    zeroTracking: {
      maxTrackingValue: { type: Number, default: 0.5 },
      description: { type: String, default: 'Zero tracking up to 0.5e' },
    },
    tare: {
      description: { type: String, default: 'Test accuracy with tare device applied' },
    },
    temperature: {
      temperatureRange: { type: [Number], default: [-10, 40] },
      description: { type: String, default: 'Performance across specified temperature range' },
    },
    tilting: {
      maxTiltAngle: { type: Number, default: 5 },
      description: { type: String, default: 'Performance on tilted surfaces up to specified angle' },
    },
  },

  // In-service MPE multiplier (typically 2x initial verification)
  inServiceMpeMultiplier: { type: Number, default: 2 },

  // Metadata
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changelog: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('OimlRule', oimlRuleSchema);
