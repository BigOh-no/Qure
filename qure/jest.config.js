module.exports = {
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".jsx"],
  moduleDirectories: ["node_modules", "src"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-router-dom|@remix-run)/)"
  ],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
};
