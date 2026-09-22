import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  testTimeout: 60000,
  collectCoverageFrom: [
    "lib/services/**/*.ts",
    "lib/validation/**/*.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      functions: 80,
      lines: 80,
      branches: 65,
    },
    "lib/services/warningService.ts": {
      statements: 80,
      functions: 80,
      lines: 80,
      branches: 65,
    },
    "lib/services/notificationService.ts": {
      statements: 80,
      functions: 80,
      lines: 80,
      branches: 65,
    },
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
};

export default config;
