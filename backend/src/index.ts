import 'dotenv/config';
import './utils/env';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.1,
    });
}

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import prisma from './utils/prisma';
import logger from './utils/logger';
import stripe from './services/stripe.service';

// Middleware
import http from 'http';
import { initSocket } from './services/socket.service';

// Middleware
export const app: Express = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

// Initialize Socket.io
initSocket(server);


import authRoutes from './routes/auth.routes';
import supportRoutes from './routes/support.routes';
import marketingRoutes from './routes/marketing.routes';
import { analyticsMiddleware } from './middleware/analytics.middleware';
import userRoutes from './routes/user.routes';
import storeRoutes from './routes/store.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import storeOwnerRoutes from './routes/store-owner.routes';
import driverRoutes from './routes/driver.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import { setupSwagger } from './utils/swagger';
import { rateLimit } from 'express-rate-limit';

// Security: Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: ['development', 'test'].includes(process.env.NODE_ENV || '') ? 10000 : 100, // Relaxed for dev/test
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: ['development', 'test'].includes(process.env.NODE_ENV || '') ? 10000 : 10, // Max 10 attempts per hour in prod
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again in an hour.' }
});

const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: ['development', 'test'].includes(process.env.NODE_ENV || '') ? 10000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many order attempts, please try again later.' }
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 1000, // 15 seconds
    max: ['development', 'test'].includes(process.env.NODE_ENV || '') ? 10000 : 2, // Relaxed for dev/test
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment attempts, please try again in a few moments.' }
});

// Middleware
const allowedOrigins = [
  'https://grocenest.co.uk',
  'https://merchant.grocenest.co.uk',
  'https://admin.grocenest.co.uk',
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === 'production') {
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        } else {
            // Dev/Test: allow all origins
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature']
}));

// Security: Helmet configuration for strict headers
app.use((req: Request, res: Response, next: NextFunction) => {
    const isProd = process.env.NODE_ENV === 'production';
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: isProd
                    ? ["'self'", "https://js.stripe.com", "https://maps.googleapis.com"]
                    : ["'self'", "https://js.stripe.com", "https://maps.googleapis.com", "'unsafe-inline'"],
                styleSrc: isProd
                    ? ["'self'", "https://fonts.googleapis.com"]
                    : ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://*.stripe.com", "https://*.cloudinary.com", "https://maps.gstatic.com"],
                connectSrc: ["'self'", "https://api.stripe.com", "https://maps.googleapis.com", "https://*.firebaseio.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'self'", "https://js.stripe.com"],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "same-site" },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    })(req, res, next);
});

// Disable X-Powered-By
app.disable('x-powered-by');

app.use(globalLimiter);

// Request/Response logging middleware with masking
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const isProduction = process.env.NODE_ENV === 'production';

    // Helper to mask sensitive data
    const maskSensitive = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = { ...obj };
        const sensitiveKeys = ['password', 'passwordHash', 'token', 'refreshToken', 'mfaToken', 'twoFactorSecret', 'otpToken', 'clientSecret', 'stripePaymentMethodId', 'cardLastFour'];
        for (const key of Object.keys(copy)) {
            if (sensitiveKeys.includes(key)) {
                copy[key] = '********';
            } else if (typeof copy[key] === 'object') {
                copy[key] = maskSensitive(copy[key]);
            }
        }
        return copy;
    };

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData: any = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            userId: (req as any).user?.userId || (req as any).userId,
            ip: req.ip,
            timestamp: new Date(),
        };

        if (!isProduction) {
            logData.headers = req.headers;
            if (req.body && Object.keys(req.body).length > 0) {
                logData.body = maskSensitive(req.body);
            }
        }

        logger.http(JSON.stringify(logData));
    });

    next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(cookieParser());
app.use(express.json({ 
    limit: '10mb',
    verify: (req: any, res, buf) => {
        if (req.originalUrl.startsWith('/api/payments/webhook')) {
            req.rawBody = buf;
        }
    }
}));
app.use(analyticsMiddleware);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/owner', storeOwnerRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/marketing', marketingRoutes);

// API Documentation UI
setupSwagger(app);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to GroceNest API');
});

// Health Check
app.get('/health', async (req: Request, res: Response) => {
    const health: {
        status: string;
        checks: {
            database: string;
            stripe: string;
        };
        timestamp: Date;
    } = {
        status: 'UP',
        checks: {
            database: 'UP',
            stripe: 'UP'
        },
        timestamp: new Date()
    };

    // Database check with 2s timeout
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 2000)
    );

    try {
        await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
        health.checks.database = 'DOWN';
        health.status = 'DEGRADED';
    }

    // Stripe check with 3s timeout
    if (process.env.STRIPE_SECRET_KEY) {
        const stripePromise = stripe.customers.list({ limit: 1 });
        const stripeTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Stripe timeout')), 3000)
        );

        try {
            await Promise.race([stripePromise, stripeTimeoutPromise]);
        } catch (err) {
            health.checks.stripe = 'DOWN';
            health.status = 'DEGRADED';
        }
    } else {
        health.checks.stripe = 'MOCK_MODE';
    }

    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }

    // Prevent sensitive info leakage in production
    const response = process.env.NODE_ENV === 'production'
        ? { error: 'Internal server error' }
        : { error: err.message, stack: err.stack };

    res.status(err.status || 500).json(response);
});

// Global process exception & rejection handlers
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error(`❌ Unhandled Rejection at: ${promise}, reason: ${reason?.stack || reason}`);
});

process.on('uncaughtException', (err: Error) => {
    logger.error(`❌ Uncaught Exception: ${err.message}`, { stack: err.stack });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            logger.error(`❌ Port ${port} is already in use. Please check if another process is running or terminate it.`);
            process.exit(1);
        } else {
            logger.error('❌ Server error:', err);
            process.exit(1);
        }
    });

    server.listen(port, () => {
        logger.info(`[server]: Server is running at http://localhost:${port}`);
    });
}

