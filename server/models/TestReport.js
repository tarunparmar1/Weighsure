const mongoose = require('mongoose');

const testObservationSchema = new mongoose.Schema({
  testType: {
    type: String,
    required: true,
    enum: [
      'eccentricity',
      'repeatability',
      'increasingLoad',
      'decreasingLoad',
      'discrimination',
      'tare',
      'zeroTracking',
      'temperature',
      'tilting',
    ],
  },
  readings: [mongoose.Schema.Types.Mixed],
  parameters: mongoose.Schema.Types.Mixed,
  results: {
    calculated: mongoose.Schema.Types.Mixed,
    mpeValues: [Number],
    errors: [Number],
    passed: { type: Boolean, default: null },
    remarks: String,
  },
  performedAt: { type: Date, default: Date.now },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const testReportSchema = new mongoose.Schema({
  // Report Identification
  reportNumber: { type: String, required: true, unique: true },
  reportDate: { type: Date, default: Date.now },

  // Associated Instrument
  instrument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instrument',
    required: true,
  },

  // OIML Rule Version Used (for traceability)
  oimlRuleVersion: { type: String, required: true },

  // Laboratory Details
  laboratory: {
    name: { type: String, default: 'Legal Metrology Laboratory' },
    address: { type: String },
    accreditationNumber: { type: String },
    labTemperature: { type: Number },
    labHumidity: { type: Number },
    labPressure: { type: Number },
    testDate: { type: Date, default: Date.now },
    testEndDate: { type: Date },
  },

  // Environmental Conditions
  environment: {
    temperatureStart: { type: Number },
    temperatureEnd: { type: Number },
    humidityStart: { type: Number },
    humidityEnd: { type: Number },
    barometricPressure: { type: Number },
  },

  // Standard Weights Used
  standardWeights: [{
    nominal: Number,
    actual: Number,
    uncertainty: Number,
    certificateNumber: String,
  }],

  // Test Observations
  tests: [testObservationSchema],

  // Overall Result
  overallResult: {
    passed: { type: Boolean, default: null },
    summary: { type: String },
    evaluatedBy: { type: String },
    approvedBy: { type: String },
  },

  // Attachments
  attachments: [{
    url: String,
    publicId: String,
    fileName: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Report Status
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'draft',
  },

  // Digital Signature
  signatures: [{
    role: String,
    name: String,
    signedAt: Date,
    signatureData: String,
  }],

  // Sync metadata
  clientId: { type: String },
  syncedAt: { type: Date },
  lastModifiedLocally: { type: Date },

  // Created by
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

testReportSchema.index({ status: 1 });
testReportSchema.index({ 'instrument': 1 });
testReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TestReport', testReportSchema);
