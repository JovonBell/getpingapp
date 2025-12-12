/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Metro (in some Expo setups) attempts to read expo's deps from:
//   node_modules/expo/node_modules/<dep>/package.json
// but npm may hoist deps to:
//   node_modules/<dep>/package.json
// This script creates a symlink for the specific dep(s) we need.

function ensureSymlink({ from, to }) {
  try {
    if (fs.existsSync(from)) return;
    fs.mkdirSync(path.dirname(from), { recursive: true });
    // Prefer junction for Windows compatibility; works fine on macOS too.
    fs.symlinkSync(to, from, 'junction');
    console.log(`[postinstall] linked ${from} -> ${to}`);
  } catch (e) {
    console.warn(`[postinstall] failed linking ${from}: ${e.message}`);
  }
}

function main() {
  const root = process.cwd();
  const expoNodeModules = path.join(root, 'node_modules', 'expo', 'node_modules');

  // Ensure expo-constants is available where Metro expects it
  const target = path.join(root, 'node_modules', 'expo-constants');
  const link = path.join(expoNodeModules, 'expo-constants');
  if (fs.existsSync(target)) {
    ensureSymlink({ from: link, to: target });
  }
}

main();


