module.exports = {
  apps: [
    {
      name: 'clicktaka-api',
      cwd: '/var/www/clicktaka-rewards/server',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
    },
    {
      name: 'clicktaka-web',
      cwd: '/var/www/clicktaka-rewards',
      script: 'node_modules/.bin/vite',
      args: 'preview --host 127.0.0.1 --port 3002',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
    },
  ],
};
