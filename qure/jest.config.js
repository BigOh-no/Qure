module.exports = {
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".js", ".jsx"],
  moduleDirectories: ["node_modules", "src"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-router-dom|@remix-run)/)"
  ],
};
