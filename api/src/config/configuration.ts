export interface EnvironmentVariables {
  PORT: number;
  CORS_ORIGIN: string;
  PUBLIC_API_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  TELEGRAM_BOT_TOKEN: string;
}

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  publicApiUrl:
    process.env.PUBLIC_API_URL ||
    `http://localhost:${parseInt(process.env.PORT || '3000', 10)}`,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
});
