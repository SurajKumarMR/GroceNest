import 'dotenv/config';
import './utils/env';
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import prisma from './utils/prisma';
import logger from './utils/logger';

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
import { rateLimit } from 'express-rate-limit';

// Security: Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Relaxed for dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'development' ? 100 : 10, // Max 10 attempts per hour in prod
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again in an hour.' }
});

const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 100 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many order attempts, please try again later.' }
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 1000, // 15 seconds (very tight)
    max: process.env.NODE_ENV === 'development' ? 50 : 2, // Only 2 attempts per 15s in prod
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment attempts, please try again in a few moments.' }
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://grocenest.co.uk'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature']
}));

// Security: Helmet configuration for strict headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://js.stripe.com", "https://maps.googleapis.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
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
}));

// Disable X-Powered-By
app.disable('x-powered-by');

app.use(globalLimiter);

// Morgan with Winston integration
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message) => logger.http(message.trim()),
        },
    }
);
app.use(morganMiddleware);
app.use(morgan('dev'));
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
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/marketing', marketingRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to GroceNest API');
});

// Health Check
app.get('/health', async (req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ 
            status: 'UP', 
            database: 'CONNECTED',
            timestamp: new Date() 
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'DOWN', 
            database: 'DISCONNECTED',
            timestamp: new Date() 
        });
    }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Prevent sensitive info leakage in production
    const response = process.env.NODE_ENV === 'production'
        ? { error: 'Internal server error' }
        : { error: err.message, stack: err.stack };

    res.status(err.status || 500).json(response);
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        logger.info(`[server]: Server is running at http://localhost:${port}`);
    });
}
