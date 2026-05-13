module.exports = {
  apps: [
    {
      name: 'clicktaka-api',
      cwd: '/var/www/clicktaka/server',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
    },
    {
      name: 'clicktaka-web',
      cwd: '/var/www/clicktaka',
      script: 'deploy/node-server.mjs',
      interpreter: 'node',
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3002' },
      max_memory_restart: '400M',
    },
  ],
};
