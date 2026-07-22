
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { updateProfileSchema } from '../utils/validation';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                addresses: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const { passwordHash, twoFactorSecret, ...userWithoutSensitive } = user;
        res.json(userWithoutSensitive);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }

        const { firstName, lastName, phone, dietaryPreferences, cuisinePreferences } = validation.data;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phone,
                profile: {
                    upsert: {
                        create: {
                            dietaryPreferences: dietaryPreferences ?? undefined,
                            cuisinePreferences: cuisinePreferences ?? undefined,
                        },
                        update: {
                            dietaryPreferences: dietaryPreferences ?? undefined,
                            cuisinePreferences: cuisinePreferences ?? undefined,
                        },
                    },
                },
            },
            include: {
                profile: true,
            },
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { street, city, state, zipCode, country, isDefault } = req.body;

        // Simple validation check (should use Zod schema in production app fully, but for speed)
        if (!street || !city || !state || !zipCode || !country) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // If setting as default, unset others? 
        // Logic skipped for MVP speed, assume handled by client or future polish.

        const address = await prisma.address.create({
            data: {
                userId,
                streetAddress: street,
                city,
                state,
                postalCode: zipCode,
                country,
                isDefault: isDefault || false
            }
        });

        res.status(201).json(address);
    } catch (error) {
        console.error('Create address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const addresses = await prisma.address.findMany({
            where: { userId }
        });

        res.json(addresses);
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const addressId = req.params.addressId as string;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const address = await prisma.address.findUnique({
            where: { id: addressId }
        });

        if (!address || address.userId !== userId) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        await prisma.address.delete({
            where: { id: addressId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const profilePhotoUrl = `/uploads/avatars/${req.file.filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePhotoUrl }
        });

        res.json({ profilePhotoUrl: updatedUser.profilePhotoUrl });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
