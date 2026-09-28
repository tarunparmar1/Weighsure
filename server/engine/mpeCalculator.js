/**
 * MPE Calculator for OIML R-76
 * Calculates Maximum Permissible Error based on accuracy class and load.
 */

/**
 * Get the MPE (in units of e) for a given load expressed in number of scale intervals.
 * @param {Array} mpeRanges - The MPE ranges from the OIML rule
 * @param {Number} loadInIntervals - Load expressed as number of verification scale intervals (m/e)
 * @returns {Number} MPE in units of e
 */
function getMpeInE(mpeRanges, loadInIntervals) {
  for (const range of mpeRanges) {
    if (loadInIntervals > range.fromIntervals && loadInIntervals <= range.toIntervals) {
      return range.mpeInE;
    }
  }
  // If load is exactly 0, return the first range's MPE
  if (loadInIntervals === 0) return mpeRanges[0].mpeInE;
  // If beyond all ranges, return the last range's MPE
  return mpeRanges[mpeRanges.length - 1].mpeInE;
}

/**
 * Calculate the MPE for a specific load in actual weight units.
 * @param {Object} rules - The OIML rule document
 * @param {String} accuracyClass - 'I', 'II', 'III', or 'IIII'
 * @param {Number} load - The applied load in kg
 * @param {Number} e - Verification scale interval in kg
 * @param {Boolean} inService - Whether this is for in-service (2x multiplier)
 * @returns {Object} { mpe: Number, mpeInE: Number, loadInIntervals: Number }
 */
function calculateMPE(rules, accuracyClass, load, e, inService = false) {
  const classRules = rules.accuracyClasses[accuracyClass];
  if (!classRules) {
    throw new Error(`Unknown accuracy class: ${accuracyClass}`);
  }

  const loadInIntervals = load / e;
  const mpeInE = getMpeInE(classRules.mpeRanges, loadInIntervals);
  let mpe = mpeInE * e;

  if (inService) {
    mpe *= rules.inServiceMpeMultiplier || 2;
  }

  return {
    mpe,
    mpeInE,
    loadInIntervals: Math.round(loadInIntervals * 1000) / 1000,
    inService,
  };
}

/**
 * Calculate error from a weighing observation.
 * Error E = Indication (I) - Reference load (L)
 * Corrected for any rounding: E = I - (1/2)d - L + ΔL
 * Simplified for digital instruments: E = I - L
 * @param {Number} indication - The displayed reading
 * @param {Number} referenceLoad - The actual standard weight value
 * @returns {Number} The error
 */
function calculateError(indication, referenceLoad) {
  return indication - referenceLoad;
}

/**
 * Check if an error is within MPE.
 * @param {Number} error - The calculated error
 * @param {Number} mpe - The MPE value (positive)
 * @returns {Boolean} True if within MPE
 */
function isWithinMPE(error, mpe) {
  return Math.abs(error) <= Math.abs(mpe);
}

/**
 * Generate test load points for increasing/decreasing load test.
 * Selects loads near MPE change boundaries and at key points.
 * @param {Object} rules - The OIML rule document
 * @param {String} accuracyClass - The accuracy class
 * @param {Number} maxCapacity - Max capacity in kg
 * @param {Number} minCapacity - Min capacity in kg
 * @param {Number} e - Verification scale interval in kg
 * @returns {Array} Array of suggested test loads
 */
function generateTestLoadPoints(rules, accuracyClass, maxCapacity, minCapacity, e) {
  const classRules = rules.accuracyClasses[accuracyClass];
  const loads = new Set();

  // Always include Min and Max
  loads.add(minCapacity);
  loads.add(maxCapacity);

  // Add loads near MPE range boundaries
  for (const range of classRules.mpeRanges) {
    const boundaryLoad = range.toIntervals * e;
    if (boundaryLoad >= minCapacity && boundaryLoad <= maxCapacity) {
      loads.add(boundaryLoad);
      // Just below and above boundary
      if (boundaryLoad - e >= minCapacity) loads.add(boundaryLoad - e);
      if (boundaryLoad + e <= maxCapacity) loads.add(boundaryLoad + e);
    }
  }

  // Add equally spaced loads
  const step = (maxCapacity - minCapacity) / 10;
  for (let i = 0; i <= 10; i++) {
    const load = minCapacity + step * i;
    // Round to nearest e
    const rounded = Math.round(load / e) * e;
    if (rounded >= minCapacity && rounded <= maxCapacity) {
      loads.add(rounded);
    }
  }

  return Array.from(loads).sort((a, b) => a - b);
}

module.exports = {
  calculateMPE,
  calculateError,
  isWithinMPE,
  generateTestLoadPoints,
  getMpeInE,
};
