const { calculateMPE } = require('../mpeCalculator');

/**
 * Repeatability Test as per OIML R-76 Section T.6
 * Same load weighed multiple times (min 6). The range (max - min) of indications
 * should not exceed the absolute value of the MPE for that load.
 *
 * @param {Object} rules - OIML rule document
 * @param {Object} instrument - Instrument specifications
 * @param {Array} readingSets - Array of { testLoad: Number, indications: Number[] }
 * @returns {Object} Test results
 */
function evaluateRepeatability(rules, instrument, readingSets) {
  const { accuracyClass, verificationScaleInterval_e: e } = instrument.specifications;

  const results = readingSets.map((set) => {
    const { testLoad, indications } = set;
    const { mpe } = calculateMPE(rules, accuracyClass, testLoad, e);

    const maxIndication = Math.max(...indications);
    const minIndication = Math.min(...indications);
    const range = maxIndication - minIndication;
    const mean = indications.reduce((a, b) => a + b, 0) / indications.length;

    // Standard deviation
    const variance = indications.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (indications.length - 1);
    const stdDev = Math.sqrt(variance);

    // Range must not exceed |MPE|
    const withinMPE = range <= Math.abs(mpe);

    return {
      testLoad,
      indications,
      count: indications.length,
      maxIndication,
      minIndication,
      range: Math.round(range * 10000) / 10000,
      mean: Math.round(mean * 10000) / 10000,
      stdDev: Math.round(stdDev * 10000) / 10000,
      mpe,
      maxAllowableRange: Math.abs(mpe),
      withinMPE,
    };
  });

  const allPassed = results.every((r) => r.withinMPE);

  return {
    testType: 'repeatability',
    results,
    passed: allPassed,
    summary: allPassed
      ? 'Repeatability test PASSED — range within MPE at all loads'
      : 'Repeatability test FAILED — range exceeds MPE at one or more loads',
  };
}

module.exports = { evaluateRepeatability };
