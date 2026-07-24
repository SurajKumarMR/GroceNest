import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import * as Sentry from '@sentry/node';

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

        res.status(200).json({
            ...preferences,
            emailEnabled: preferences.email,
            smsEnabled: preferences.sms,
            pushEnabled: preferences.push
        });
    } catch (error) {
        console.error('Get notification preferences error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification-preference', method: 'getPreferences' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { email, sms, push, emailEnabled, smsEnabled, pushEnabled } = req.body;

        const targetEmail = email !== undefined ? email : emailEnabled;
        const targetSms = sms !== undefined ? sms : smsEnabled;
        const targetPush = push !== undefined ? push : pushEnabled;

        const preferences = await prisma.notificationPreference.upsert({
            where: { userId },
            update: {
                ...(targetEmail !== undefined && { email: Boolean(targetEmail) }),
                ...(targetSms !== undefined && { sms: Boolean(targetSms) }),
                ...(targetPush !== undefined && { push: Boolean(targetPush) })
            },
            create: {
                userId,
                email: targetEmail !== undefined ? Boolean(targetEmail) : true,
                sms: targetSms !== undefined ? Boolean(targetSms) : true,
                push: targetPush !== undefined ? Boolean(targetPush) : true
            }
        });

        res.status(200).json({
            ...preferences,
            emailEnabled: preferences.email,
            smsEnabled: preferences.sms,
            pushEnabled: preferences.push
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        Sentry.captureException(error, { tags: { controller: 'notification-preference', method: 'updatePreferences' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};
