const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'clicktaka-api',
      cwd: path.join(ROOT, 'server'),
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: '3001' },
      max_memory_restart: '300M',
      node_args: '--no-deprecation',
      pmx: false,
      automation: false,
    },
    {
      name: 'clicktaka-web',
      cwd: ROOT,
      script: 'deploy/node-server.mjs',
      interpreter: 'node',
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3002' },
      max_memory_restart: '400M',
      pmx: false,
      automation: false,
    },
  ],
};
