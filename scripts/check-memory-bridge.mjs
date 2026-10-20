#!/usr/bin/env node
// Fail-closed preflight for the website side of the bridge.
import { accessSync, constants, existsSync } from "node:fs";
import { dirname } from "node:path";
import { bridgePath, readMap } from "./lib/cloud-json.mjs";

const file = bridgePath();
if (!file) {
  console.error("FAIL: CM_TOKENS_BRIDGE is not set; token creation/claims will return 503");
  process.exit(1);
}
try {
  accessSync(dirname(file), constants.W_OK);
} catch {
  console.error(`FAIL: bridge directory is not writable: ${dirname(file)}`);
  process.exit(1);
}
if (existsSync(file)) {
  try {
    const map = readMap(file);
    console.log(`OK: ${file} (${Object.keys(map).length} entries)`);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`OK: ${file} does not exist yet; first token creation will create it`);
}
