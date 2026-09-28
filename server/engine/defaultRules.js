const OimlRule = require('../models/OimlRule');

/**
 * Default OIML R-76 rules to seed on first startup.
 * These define Maximum Permissible Errors (MPE) for each accuracy class.
 */
const DEFAULT_RULES = {
  version: 'R76-2006-v1',
  name: 'OIML R-76 (2006 Edition)',
  description: 'Non-Automatic Weighing Instruments — Metrological and technical requirements, as per OIML R 76-1 Edition 2006.',
  effectiveDate: new Date('2006-01-01'),
  isActive: true,
  isLatest: true,

  accuracyClasses: {
    I: {
      label: 'Special',
      minScaleIntervals: 50000,
      maxScaleIntervals: 500000,
      minCapacityMultiplier: 100,
      mpeRanges: [
        { fromIntervals: 0, toIntervals: 50000, mpeInE: 0.5 },
        { fromIntervals: 50000, toIntervals: 200000, mpeInE: 1.0 },
        { fromIntervals: 200000, toIntervals: 500000, mpeInE: 1.5 },
      ],
    },
    II: {
      label: 'High',
      minScaleIntervals: 5000,
      maxScaleIntervals: 100000,
      minCapacityMultiplier: 50,
      mpeRanges: [
        { fromIntervals: 0, toIntervals: 5000, mpeInE: 0.5 },
        { fromIntervals: 5000, toIntervals: 20000, mpeInE: 1.0 },
        { fromIntervals: 20000, toIntervals: 100000, mpeInE: 1.5 },
      ],
    },
    III: {
      label: 'Medium',
      minScaleIntervals: 500,
      maxScaleIntervals: 10000,
      minCapacityMultiplier: 20,
      mpeRanges: [
        { fromIntervals: 0, toIntervals: 500, mpeInE: 0.5 },
        { fromIntervals: 500, toIntervals: 2000, mpeInE: 1.0 },
        { fromIntervals: 2000, toIntervals: 10000, mpeInE: 1.5 },
      ],
    },
    IIII: {
      label: 'Ordinary',
      minScaleIntervals: 100,
      maxScaleIntervals: 1000,
      minCapacityMultiplier: 10,
      mpeRanges: [
        { fromIntervals: 0, toIntervals: 50, mpeInE: 0.5 },
        { fromIntervals: 50, toIntervals: 200, mpeInE: 1.0 },
        { fromIntervals: 200, toIntervals: 1000, mpeInE: 1.5 },
      ],
    },
  },

  testConfigurations: {
    eccentricity: {
      loadFraction: 1 / 3,
      mpeMultiplier: 1,
      positions: 5,
      description: 'Load at 1/3 Max placed at center and 4 off-center positions',
    },
    repeatability: {
      minRepetitions: 6,
      loads: ['0.5*Max', 'Max'],
      maxRangeMultiplier: 1,
      description: 'Minimum 6 repetitions at approximately 0.5*Max and Max',
    },
    discrimination: {
      extraLoadMultiplier: 1.4,
      description: 'Adding 1.4d extra load should cause indication change',
    },
    increasingDecreasing: {
      minTestPoints: 10,
      description: 'Errors at various loads during increasing and decreasing loading',
    },
    zeroTracking: {
      maxTrackingValue: 0.5,
      description: 'Zero tracking up to 0.5e',
    },
    tare: {
      description: 'Test accuracy with tare device applied',
    },
    temperature: {
      temperatureRange: [-10, 40],
      description: 'Performance across specified temperature range',
    },
    tilting: {
      maxTiltAngle: 5,
      description: 'Performance on tilted surfaces up to specified angle in mm/m',
    },
  },

  inServiceMpeMultiplier: 2,
};

/**
 * Seed default rules if no rules exist in the database.
 */
async function seedDefaultRules() {
  const count = await OimlRule.countDocuments();
  if (count === 0) {
    await OimlRule.create(DEFAULT_RULES);
    console.log('Default OIML R-76 rules seeded successfully');
  }
}

module.exports = { DEFAULT_RULES, seedDefaultRules };
