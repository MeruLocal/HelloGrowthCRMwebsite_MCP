#!/usr/bin/env node
/**
 * Entry point. Loads .env, then starts the stdio MCP server.
 */

import "dotenv/config";

import { runServer } from "./server.js";
import { logger } from "./utils/logger.js";

runServer().catch((err) => {
  logger.error("Fatal: server failed to start", {
    err: (err as Error).message,
  });
  process.exitCode = 1;
});
