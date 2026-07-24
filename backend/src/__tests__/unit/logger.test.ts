import logger from '../../utils/logger';
import DailyRotateFile from 'winston-daily-rotate-file';

describe('Winston Daily Logging Rotation (logger.ts)', () => {
    it('should configure winston logger with console and DailyRotateFile transports', () => {
        expect(logger).toBeDefined();
        const transports = logger.transports;
        expect(transports.length).toBeGreaterThanOrEqual(2);

        const rotateTransports = transports.filter((t: any) => t instanceof DailyRotateFile || t.name === 'dailyRotateFile');
        expect(rotateTransports.length).toBeGreaterThanOrEqual(1);

        rotateTransports.forEach((transport: any) => {
            expect(transport.options.datePattern).toBe('YYYY-MM-DD');
            expect(transport.options.maxSize).toBe('20m');
            expect(transport.options.maxFiles).toBe('14d');
            expect(transport.options.zippedArchive).toBe(true);
        });
    });

    it('should log info and error messages without crashing', () => {
        expect(() => {
            logger.info('Test info logging verification');
            logger.error('Test error logging verification');
        }).not.toThrow();
    });
});
