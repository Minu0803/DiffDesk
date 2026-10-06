// Electron resolves the app directory from this root entry point.
// All QA behavior lives in scripts and is excluded from the packaged app.
require('./scripts/qa-electron-bootstrap.cjs')
