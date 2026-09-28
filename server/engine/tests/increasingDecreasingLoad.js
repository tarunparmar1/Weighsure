const { calculateMPE, calculateError, isWithinMPE } = require('../mpeCalculator');

/**
 * Increasing & Decreasing Load Test (Weighing Test) as per OIML R-76 Section T.4
 * Errors are determined at various test loads during increasing and then decreasing loading.
 * All errors must be within MPE for the respective load.
 *
 * @param {Object} rules - OIML rule document
 * @param {Object} instrument - Instrument specifications
 * @param {Object} data - { increasing: Array, decreasing: Array }
 *   Each array contains { testLoad: Number, indication: Number }
 * @returns {Object} Test results
 */
function evaluateIncreasingDecreasingLoad(rules, instrument, data) {
  const { accuracyClass, verificationScaleInterval_e: e } = instrument.specifications;

  function evaluateLoadSet(loadSet, direction) {
    return loadSet.map((point) => {
      const { mpe } = calculateMPE(rules, accuracyClass, point.testLoad, e);
      const error = calculateError(point.indication, point.testLoad);
      const withinMPE = isWithinMPE(error, mpe);

      return {
        direction,
        testLoad: point.testLoad,
        indication: point.indication,
        error: Math.round(error * 10000) / 10000,
        mpe,
        withinMPE,
      };
    });
  }

  const increasingResults = evaluateLoadSet(data.increasing || [], 'increasing');
  const decreasingResults = evaluateLoadSet(data.decreasing || [], 'decreasing');
  const allResults = [...increasingResults, ...decreasingResults];
  const allPassed = allResults.every((r) => r.withinMPE);

  return {
    testType: 'increasingDecreasingLoad',
    increasing: increasingResults,
    decreasing: decreasingResults,
    passed: allPassed,
    summary: allPassed
      ? 'Increasing/Decreasing load test PASSED — all errors within MPE'
      : 'Increasing/Decreasing load test FAILED — errors exceed MPE at one or more loads',
  };
}

module.exports = { evaluateIncreasingDecreasingLoad };
