module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.test.json', useESM: true, diagnostics: { ignoreCodes: [151002] } }] },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  collectCoverageFrom: ['server/**/*.ts', '!server/main.ts', '!server/database/migrations/**'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};
