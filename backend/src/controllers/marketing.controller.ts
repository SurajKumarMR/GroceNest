import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const waitlistSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    source: z.string().optional(),
});

export const joinWaitlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = waitlistSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }

        const { email, name, source } = validation.data;

        const existing = await (prisma.waitlist as any).findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ error: 'You are already on the waitlist!' });
            return;
        }

        await (prisma.waitlist as any).create({
            data: { email, name, source: source || 'landing-page' }
        });

        res.status(201).json({ message: 'Welcome to the waitlist!' });
    } catch (error) {
        console.error('Waitlist join error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getWaitlist = async (req: any, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const list = await (prisma.waitlist as any).findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.json(list);
    } catch (error) {
        console.error('Get waitlist error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
