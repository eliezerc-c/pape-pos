module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  modulePaths: [
    '<rootDir>/backend/src',
    '<rootDir>/backend/node_modules',
    '<rootDir>/node_modules',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
    '^(.*)$': '<rootDir>/backend/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'backend/tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/index.ts',
    '!backend/src/config/database.ts',
  ],
};
