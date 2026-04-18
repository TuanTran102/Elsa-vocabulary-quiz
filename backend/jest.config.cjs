/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    "^.+\\.(mt|t)s$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/\\._"
  ],
  watchPathIgnorePatterns: [
    "/\\._"
  ],
};