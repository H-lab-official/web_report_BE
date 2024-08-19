module.exports = {
  apps: [
    {
      name: 'az-report',
      script: 'index.js',
      interpreter: 'node',
      watch: '.',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/main',
      repo: 'https://github.com/H-lab-official/web_report_BE',
      path: 'web_report_BE',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
