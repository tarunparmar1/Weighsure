const mongoose = require('mongoose');

const instrumentSchema = new mongoose.Schema({
  // Manufacturer Details
  manufacturer: {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    country: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },

  // Model Information
  modelInfo: {
    modelNumber: { type: String, required: true, trim: true },
    serialNumber: { type: String, trim: true },
    typeDesignation: { type: String, trim: true },
    yearOfManufacture: { type: Number },
  },

  // Technical Specifications
  specifications: {
    accuracyClass: {
      type: String,
      enum: ['I', 'II', 'III', 'IIII'],
      required: true,
    },
    maxCapacity: { type: Number, required: true },       // Max (kg)
    minCapacity: { type: Number, required: true },        // Min (kg)
    verificationScaleInterval_e: { type: Number, required: true }, // e (kg)
    actualScaleInterval_d: { type: Number, required: true },       // d (kg)
    numberOfIntervals_n: { type: Number },                // n = Max/e
    tareRange: { type: Number, default: 0 },              // Tare range (kg)
    tareType: { type: String, enum: ['subtractive', 'additive', 'both', 'none'], default: 'subtractive' },
    operatingTemperatureMin: { type: Number, default: -10 },
    operatingTemperatureMax: { type: Number, default: 40 },
    powerSupply: { type: String, trim: true },
    displayType: { type: String, trim: true },
    platformSize: { type: String, trim: true },
    material: { type: String, trim: true },
  },

  // Multi-interval or multi-range
  isMultiInterval: { type: Boolean, default: false },
  isMultiRange: { type: Boolean, default: false },
  ranges: [{
    maxCapacity: Number,
    minCapacity: Number,
    verificationScaleInterval_e: Number,
    actualScaleInterval_d: Number,
  }],

  // Photos
  photos: [{
    url: String,
    publicId: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  clientId: { type: String }, // For offline sync
}, { timestamps: true });

instrumentSchema.pre('save', function (next) {
  if (this.specifications.verificationScaleInterval_e > 0) {
    this.specifications.numberOfIntervals_n = Math.floor(
      this.specifications.maxCapacity / this.specifications.verificationScaleInterval_e
    );
  }
  next();
});

instrumentSchema.index({ 'manufacturer.name': 'text', 'modelInfo.modelNumber': 'text' });

module.exports = mongoose.model('Instrument', instrumentSchema);
