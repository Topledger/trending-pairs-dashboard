module.exports = {
  apps: [{
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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};