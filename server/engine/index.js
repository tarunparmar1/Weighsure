const OimlRule = require('../models/OimlRule');
const { calculateMPE, calculateError, isWithinMPE, generateTestLoadPoints } = require('./mpeCalculator');
const {
  evaluateEccentricity,
  evaluateRepeatability,
  evaluateDiscrimination,
  evaluateIncreasingDecreasingLoad,
} = require('./tests');

/**
 * OIML R-76 Engine — Pluggable, Versioned Calculation Engine
 *
 * All calculations are driven by the rule version stored in MongoDB.
 * When OIML recommendations are revised, upload a new rule version — no code changes needed.
 */
class OimlEngine {
  constructor(rules) {
    this.rules = rules;
  }

  /**
   * Load engine with the latest active rule set.
   */
  static async loadLatest() {
    const rules = await OimlRule.findOne({ isLatest: true, isActive: true });
    if (!rules) {
      throw new Error('No active OIML rules found. Please seed default rules.');
    }
    return new OimlEngine(rules);
  }

  /**
   * Load engine with a specific rule version (for report traceability).
   */
  static async loadVersion(version) {
    const rules = await OimlRule.findOne({ version });
    if (!rules) {
      throw new Error(`OIML rule version "${version}" not found`);
    }
    return new OimlEngine(rules);
  }

  getVersion() {
    return this.rules.version;
  }

  getRules() {
    return this.rules;
  }

  /**
   * Calculate MPE for a given load.
   */
  getMPE(accuracyClass, load, e, inService = false) {
    return calculateMPE(this.rules, accuracyClass, load, e, inService);
  }

  /**
   * Calculate error.
   */
  getError(indication, referenceLoad) {
    return calculateError(indication, referenceLoad);
  }

  /**
   * Check if within MPE.
   */
  checkWithinMPE(error, mpe) {
    return isWithinMPE(error, mpe);
  }

  /**
   * Generate suggested test load points.
   */
  getTestLoadPoints(accuracyClass, maxCapacity, minCapacity, e) {
    return generateTestLoadPoints(this.rules, accuracyClass, maxCapacity, minCapacity, e);
  }

  /**
   * Evaluate eccentricity test.
   */
  evaluateEccentricity(instrument, readings) {
    return evaluateEccentricity(this.rules, instrument, readings);
  }

  /**
   * Evaluate repeatability test.
   */
  evaluateRepeatability(instrument, readingSets) {
    return evaluateRepeatability(this.rules, instrument, readingSets);
  }

  /**
   * Evaluate discrimination test.
   */
  evaluateDiscrimination(instrument, readings) {
    return evaluateDiscrimination(this.rules, instrument, readings);
  }

  /**
   * Evaluate increasing/decreasing load test.
   */
  evaluateIncreasingDecreasingLoad(instrument, data) {
    return evaluateIncreasingDecreasingLoad(this.rules, instrument, data);
  }

  /**
   * Run all tests and return combined results.
   */
  evaluateAll(instrument, testData) {
    const results = {};

    if (testData.eccentricity) {
      results.eccentricity = this.evaluateEccentricity(instrument, testData.eccentricity);
    }
    if (testData.repeatability) {
      results.repeatability = this.evaluateRepeatability(instrument, testData.repeatability);
    }
    if (testData.discrimination) {
      results.discrimination = this.evaluateDiscrimination(instrument, testData.discrimination);
    }
    if (testData.increasingDecreasingLoad) {
      results.increasingDecreasingLoad = this.evaluateIncreasingDecreasingLoad(
        instrument,
        testData.increasingDecreasingLoad
      );
    }

    // Overall pass/fail
    const testResults = Object.values(results);
    const overallPassed = testResults.length > 0 && testResults.every((t) => t.passed);

    return {
      engineVersion: this.rules.version,
      instrument: {
        accuracyClass: instrument.specifications.accuracyClass,
        maxCapacity: instrument.specifications.maxCapacity,
        e: instrument.specifications.verificationScaleInterval_e,
        d: instrument.specifications.actualScaleInterval_d,
      },
      tests: results,
      overallPassed,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

module.exports = OimlEngine;
