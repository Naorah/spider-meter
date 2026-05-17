const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
	DATABASE_URL,
	IOT_SERVER_TOKEN,
	CHART_READINGS_LIMIT,
	PORT,
	HOST,
	SESSION_SECRET
} = process.env;

if (!DATABASE_URL) {
	console.warn('[ecosystem] DATABASE_URL manquant — définissez-le dans .env');
}
if (!IOT_SERVER_TOKEN) {
	console.warn('[ecosystem] IOT_SERVER_TOKEN manquant — définissez-le dans .env');
}

const WEAK_SESSION_SECRETS = new Set([
	'dev-insecure-change-me',
	'change-me-long-random-string',
	'change-me'
]);
if (!SESSION_SECRET || WEAK_SESSION_SECRETS.has(SESSION_SECRET)) {
	console.error(
		'[ecosystem] SESSION_SECRET manquant ou faible dans .env — le serveur refusera de démarrer en production.'
	);
	process.exit(1);
}

/** @type {import('pm2').StartOptions} */
module.exports = {
	apps: [
		{
			name: 'spider-meter',
			script: './build/index.js',
			cwd: __dirname,
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			watch: false,
			max_memory_restart: '512M',
			env: {
				NODE_ENV: 'production',
				PORT: PORT || '1212',
				HOST: HOST || '0.0.0.0',
				DATABASE_URL,
				IOT_SERVER_TOKEN,
				CHART_READINGS_LIMIT: CHART_READINGS_LIMIT || '72',
				SESSION_SECRET
			},
			error_file: './logs/pm2-error.log',
			out_file: './logs/pm2-out.log',
			merge_logs: true,
			time: true
		}
	]
};
