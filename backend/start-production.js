import { spawn } from 'child_process';

console.log('🚀 Starting production server with background worker...');

// Start the main API server
const server = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

// Start the background worker
const worker = spawn('node', ['dist/worker/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Handle worker errors
worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
  process.exit(1);
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`⚠️  Server exited with code ${code}`);
  worker.kill('SIGTERM');
  process.exit(code);
});

// Handle worker exit
worker.on('exit', (code) => {
  console.log(`⚠️  Worker exited with code ${code}`);
  // Don't kill server if worker crashes, just log it
  console.log('Worker will restart on next deployment');
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
  worker.kill('SIGTERM');
  setTimeout(() => process.exit(0), 5000);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
  worker.kill('SIGINT');
  setTimeout(() => process.exit(0), 5000);
});

console.log('✅ Production server started');
console.log('   - API Server: Running on port', process.env.PORT || 3001);
console.log('   - Background Worker: Running');
