// Deterministic time zone for every test (the device's zone in production).
process.env.TZ = 'America/Sao_Paulo';

const base = require('./jest.config.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/tz/'],
};
