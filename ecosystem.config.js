module.exports = {
    apps: [
        {
            name: 'slydle',
            script: './node_modules/.bin/next',
            args: 'start',
            cwd: '/var/www/slydle/current',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            // Логирование
            log_file: '/var/log/slydle/combined.log',
            out_file: '/var/log/slydle/out.log',
            error_file: '/var/log/slydle/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Мониторинг
            max_memory_restart: '1G',
            min_uptime: '10s',
            max_restarts: 5,

            // Автоматический перезапуск при изменении файлов (только для разработки)
            watch: false,
            ignore_watch: ['node_modules', 'logs'],

            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 5000,

            // Health check
            health_check_grace_period: 3000,
        },
    ],

    // Конфигурация для деплоя
    deploy: {
        production: {
            user: 'deploy',
            host: ['your-server-ip'],
            ref: 'origin/main',
            repo: 'https://github.com/your-username/slydle.git',
            path: '/var/www/slydle',
            'post-deploy':
                'npm ci --only=production && npx prisma generate && npx prisma db push && pm2 reload ecosystem.config.js --env production',
            'pre-deploy-local': '',
            'post-deploy-local': '',
            'pre-setup': '',
            ssh_options: 'StrictHostKeyChecking=no',
        },
    },
};
