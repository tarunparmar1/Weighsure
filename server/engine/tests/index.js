const { evaluateEccentricity } = require('./eccentricity');
const { evaluateRepeatability } = require('./repeatability');
const { evaluateDiscrimination } = require('./discrimination');
const { evaluateIncreasingDecreasingLoad } = require('./increasingDecreasingLoad');

module.exports = {
  evaluateEccentricity,
  evaluateRepeatability,
  evaluateDiscrimination,
  evaluateIncreasingDecreasingLoad,
};
