#!/usr/bin/env node
import { loadEnvFile } from "./utils/env.ts";

// Load .env file before anything else
loadEnvFile();

import { APP_NAME } from "./config.ts";
import { main } from "./main.ts";

process.title = APP_NAME;
process.emitWarning = (() => {}) as typeof process.emitWarning;

main(process.argv.slice(2));
