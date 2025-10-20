module.exports = {
  apps: [
    {
      name: 'nazareno-zcrm-mcp',
      script: 'dist/server.js',
      cwd: '/var/www/nazareno-zcrm-mcp/current',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
        HOST: '0.0.0.0'
      },
      log_file: '/var/www/nazareno-zcrm-mcp/logs/combined.log',
      out_file: '/var/www/nazareno-zcrm-mcp/logs/out.log',
      error_file: '/var/www/nazareno-zcrm-mcp/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: '3.80.105.135',
      ref: 'origin/main',
      repo: 'https://github.com/alonso-interconnecta/nazareno-zcrm-mcp.git',
      path: '/var/www/nazareno-zcrm-mcp',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
