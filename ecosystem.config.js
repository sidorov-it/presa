module.exports = {
    apps: [
        {
            name: 'slydle',
            script: 'npm',
            args: 'start',
            cwd: '/var/www/slydle/current',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            // Логирование
            log_file: '/var/www/slydle/logs/combined.log',
            out_file: '/var/www/slydle/logs/out.log',
            error_file: '/var/www/slydle/logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Настройки памяти и производительности
            max_memory_restart: '1G',
            node_args: '--max-old-space-size=1024',

            // Перезапуск и мониторинг
            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: '10s',
            autorestart: true,

            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 3000,
            wait_ready: true,
            ready_timeout: 3000,

            // Мониторинг
            watch: false,
            ignore_watch: ['node_modules', 'logs', '.git'],
        },
    ],
};
