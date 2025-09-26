module.exports = {
  apps: [
    {
      name: 'trending-pairs-dashboard',
      script: 'npm',
      args: 'start',
      cwd: '/root/trending-pairs-dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'kafka-ws-server',
      script: 'kafka-ws-server.js',
      cwd: '/root/trending-pairs-dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/kafka-ws-err.log',
      out_file: './logs/kafka-ws-out.log',
      log_file: './logs/kafka-ws-combined.log',
      time: true
    }
  ]
};

