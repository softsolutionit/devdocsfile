module.exports = {
  apps: [{
    name: 'devdocs-app',
    script: 'npm',
    args: 'start',
    cwd: '/root/devdocsfile',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
}
