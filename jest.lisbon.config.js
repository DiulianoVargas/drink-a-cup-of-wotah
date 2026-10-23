// Same setup as jest.config.js, but with a DST-observing time zone for tests/tz.
process.env.TZ = 'Europe/Lisbon';

const base = require('./jest.config.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/tz/**/*.test.ts'],
};
