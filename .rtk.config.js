/**
 * RTK (Token optimization) configuration
 * Compresses logs and reduces token usage in development
 */

module.exports = {
  // Compress duplicate log paths (same file logged multiple times)
  deduplicatePaths: true,

  // Truncate stack traces to first 5 frames
  maxStackFrames: 5,

  // Strip full paths, use relative paths only
  relativePaths: true,

  // Exclude patterns from logging
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    '.git/**',
    '*.log',
  ],

  // Compress test output
  testCompression: {
    enabled: true,
    maxTestLines: 50,
    summaryOnly: false,
  },

  // Usage: npx rtk wrap npm run test
  // Or: npx rtk wrap npm run dev
};
