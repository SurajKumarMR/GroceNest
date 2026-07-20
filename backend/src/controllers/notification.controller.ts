
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import * as Sentry from '@sentry/node';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'getMyNotifications' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const notificationId = req.params.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await prisma.notification.update({
            where: { id: notificationId as string, userId },
            data: { isRead: true, readAt: new Date() }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'markAsRead' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all as read error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'markAllAsRead' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const registerDeviceToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { token, platform } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        // Upsert device token
        await prisma.deviceToken.upsert({
            where: { token },
            update: { userId, platform },
            create: { token, userId, platform }
        });

        res.status(200).json({ success: true, message: 'Device token registered successfully' });
    } catch (error) {
        console.error('Register device token error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'registerDeviceToken' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const unregisterDeviceToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { token } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        await prisma.deviceToken.deleteMany({
            where: { token: token as string, userId }
        });

        res.status(200).json({ success: true, message: 'Device token unregistered successfully' });
    } catch (error) {
        console.error('Unregister device token error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'unregisterDeviceToken' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let preferences = await prisma.notificationPreference.findUnique({
            where: { userId }
        });

        // Create default preferences if none exist
        if (!preferences) {
            preferences = await prisma.notificationPreference.create({
                data: { userId }
            });
        }

        res.status(200).json(preferences);
    } catch (error) {
        console.error('Get preferences error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'getPreferences' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { email, sms, push } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const preferences = await prisma.notificationPreference.upsert({
            where: { userId },
            update: {
                ...(email !== undefined && { email }),
                ...(sms !== undefined && { sms }),
                ...(push !== undefined && { push })
            },
            create: {
                userId,
                email: email ?? true,
                sms: sms ?? true,
                push: push ?? true
            }
        });

        res.status(200).json(preferences);
    } catch (error) {
        console.error('Update preferences error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification', method: 'updatePreferences' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};
