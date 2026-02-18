/**
 * Configuración de Jest para Backend con ES Modules
 */
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/setup-tests.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**'
  ],
  coverageDirectory: './coverage',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 15000,
  maxWorkers: 1
};
