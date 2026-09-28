const { calculateMPE, calculateError, isWithinMPE } = require('../mpeCalculator');

/**
 * Eccentricity Test as per OIML R-76 Section T.5
 * Load = 1/3 of Max, placed at center and 4 eccentric positions.
 * Error at each position must not exceed MPE for the test load.
 *
 * @param {Object} rules - OIML rule document
 * @param {Object} instrument - Instrument specifications
 * @param {Array} readings - Array of { position: String, indication: Number }
 *   Positions: 'center', 'frontLeft', 'frontRight', 'rearLeft', 'rearRight'
 * @returns {Object} Test results
 */
function evaluateEccentricity(rules, instrument, readings) {
  const { accuracyClass, maxCapacity, verificationScaleInterval_e: e } = instrument.specifications;
  const testConfig = rules.testConfigurations?.eccentricity || {};
  const loadFraction = testConfig.loadFraction || (1 / 3);
  const testLoad = Math.round((maxCapacity * loadFraction) / e) * e;

  const { mpe } = calculateMPE(rules, accuracyClass, testLoad, e);

  const results = readings.map((r) => {
    const error = calculateError(r.indication, testLoad);
    const withinMPE = isWithinMPE(error, mpe);
    return {
      position: r.position,
      indication: r.indication,
      testLoad,
      error: Math.round(error * 10000) / 10000,
      mpe,
      withinMPE,
    };
  });

  const allPassed = results.every((r) => r.withinMPE);

  return {
    testType: 'eccentricity',
    testLoad,
    mpe,
    results,
    passed: allPassed,
    summary: allPassed
      ? 'Eccentricity test PASSED — all positions within MPE'
      : 'Eccentricity test FAILED — one or more positions exceed MPE',
  };
}

module.exports = { evaluateEccentricity };
