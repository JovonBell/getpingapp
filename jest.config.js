module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/setup.js',
    '<rootDir>/node_modules/',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
