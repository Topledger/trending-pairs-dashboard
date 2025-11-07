module.exports = {
  apps: [
    {
      name: 'kafka-ws-server',
      script: 'kafka-ws-server.js',
      cwd: '/root/trending-pairs-dashboard',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/kafka-ws-err.log',
      out_file: './logs/kafka-ws-out.log',
      log_file: './logs/kafka-ws-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10
    },
    {
      name: 'trending-pairs-dashboard',
      script: 'npm',
      args: 'start',
      cwd: '/root/trending-pairs-dashboard',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/dashboard-err.log',
      out_file: './logs/dashboard-out.log',
      log_file: './logs/dashboard-combined.log',
      time: true
    },
    {
      name: 'tp-dash',
      script: 'npm',
      args: 'start',
      cwd: '/root/tp-dash',
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/tp-dash-err.log',
      out_file: './logs/tp-dash-out.log',
      log_file: './logs/tp-dash-combined.log',
      time: true
    }
  ]
};