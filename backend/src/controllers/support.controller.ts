import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { type, category, content, metadata } = req.body;

        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }

        const feedback = await (prisma.feedback as any).create({
            data: {
                userId,
                type: type || 'suggestion',
                category: category || 'general',
                content,
                metadata: metadata || {}
            }
        });

        res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: feedback.id });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Restricted to Admin
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const feedbacks = await (prisma.feedback as any).findMany({
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(feedbacks);
    } catch (error) {
        console.error('Get feedbacks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const sessions = await (prisma.supportSession as any).findMany({
            where: { userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(sessions);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
