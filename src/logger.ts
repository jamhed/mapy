import pino from 'pino';

export const logger = pino({ level: process.env.MAPY_LOG_LEVEL || 'info' });
export default logger;
