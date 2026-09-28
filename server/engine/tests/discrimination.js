/**
 * Discrimination Test as per OIML R-76 Section T.7
 * Tests the ability of the instrument to detect small changes in load.
 * A small extra load equal to 1.4d (or as configured) is added/removed.
 * The indication should change by at least one scale interval.
 *
 * @param {Object} rules - OIML rule document
 * @param {Object} instrument - Instrument specifications
 * @param {Array} readings - Array of { testLoad: Number, initialIndication: Number,
 *   indicationAfterAdd: Number, extraLoad: Number }
 * @returns {Object} Test results
 */
function evaluateDiscrimination(rules, instrument, readings) {
  const { actualScaleInterval_d: d } = instrument.specifications;
  const testConfig = rules.testConfigurations?.discrimination || {};
  const extraLoadMultiplier = testConfig.extraLoadMultiplier || 1.4;

  const results = readings.map((r) => {
    const expectedExtraLoad = extraLoadMultiplier * d;
    const indicationChange = Math.abs(r.indicationAfterAdd - r.initialIndication);
    // The indication must change when 1.4d is added
    const passed = indicationChange >= d;

    return {
      testLoad: r.testLoad,
      initialIndication: r.initialIndication,
      extraLoadApplied: r.extraLoad || expectedExtraLoad,
      indicationAfterAdd: r.indicationAfterAdd,
      indicationChange: Math.round(indicationChange * 10000) / 10000,
      requiredChange: d,
      passed,
    };
  });

  const allPassed = results.every((r) => r.passed);

  return {
    testType: 'discrimination',
    extraLoadMultiplier,
    d,
    results,
    passed: allPassed,
    summary: allPassed
      ? 'Discrimination test PASSED — indication changes detected for all test loads'
      : 'Discrimination test FAILED — indication did not change at one or more loads',
  };
}

module.exports = { evaluateDiscrimination };
