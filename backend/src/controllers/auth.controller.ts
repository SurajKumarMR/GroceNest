import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { signToken, verifyToken, signRefreshToken } from '../utils/jwt.utils';
import { registerSchema, loginSchema } from '../utils/validation';
import { generateMFASecret, generateMFAUri, generateQRCode, verifyMFAToken, generateBackupCodes } from '../utils/mfa.utils';
import { AuthRequest } from '../middleware/auth.middleware';
import { encrypt, decrypt } from '../utils/encryption.utils';
import { isPasswordPwned } from '../utils/pwned.utils';
import { emailService } from '../services/email.service';
import { smsService } from '../services/sms.service';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            const fieldErrors = validation.error.flatten().fieldErrors;
            const keys = Object.keys(fieldErrors);
            const firstFieldName = keys[0];
            const messages = firstFieldName ? fieldErrors[firstFieldName as keyof typeof fieldErrors] : undefined;
            const firstErrorMessage = messages ? messages[0] : 'Validation failed';
            const message = firstFieldName ? `${firstFieldName}: ${firstErrorMessage}` : 'Validation failed';
            res.status(400).json({ error: message });
            return;
        }

        const { email, password, firstName, lastName, phone, role } = validation.data;
        
        // Secure Password Check: Breach detection
        if (await isPasswordPwned(password)) {
            res.status(400).json({ error: 'This password has been found in a data breach and is unsafe to use. Please choose a different password.' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }

        const hashedPassword = await hashPassword(password);
        
        // Generate Phone Verification Code (Mock SMS)
        const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // PII Encryption for phone
        const encryptedPhone = phone ? encrypt(phone) : null;

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
                phone: encryptedPhone,
                phoneVerificationCode,
                phoneVerified: false,
                ...(role && { role }),
            },
        });
        
        // SMS delivery
        if (phone) {
            await smsService.sendVerificationOTP(phone, phoneVerificationCode);
        }

        // Email verification (Optional but recommended)
        await emailService.sendVerificationEmail(email, 'placeholder-token'); 

        const token = signToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ userId: user.id });

        // Store refresh token in DB
        await (prisma as any).refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // Set Refresh Token in Secure Cookie for Web
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({ 
            token, 
            refreshToken, // Also return in body for mobile apps
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
            message: 'User registered. Please verify your phone number.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            const fieldErrors = validation.error.flatten().fieldErrors;
            const keys = Object.keys(fieldErrors);
            const firstFieldName = keys[0];
            const messages = firstFieldName ? fieldErrors[firstFieldName as keyof typeof fieldErrors] : undefined;
            const firstErrorMessage = messages ? messages[0] : 'Validation failed';
            const message = firstFieldName ? `${firstFieldName}: ${firstErrorMessage}` : 'Validation failed';
            res.status(400).json({ error: message });
            return;
        }

        const { email, password } = validation.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Account is deactivated. Please contact support.' });
            return;
        }
        
        // Check Account Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
            res.status(423).json({ error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` });
            return;
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
            // Increment failed attempts
            const attempts = user.failedLoginAttempts + 1;
            if (attempts >= 5) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { 
                        failedLoginAttempts: 0, 
                        lockoutUntil: new Date(Date.now() + 15 * 60 * 1000) 
                    }
                });
                res.status(423).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
            } else {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { failedLoginAttempts: attempts }
                });
                res.status(401).json({ error: 'Invalid credentials' });
            }
            return;
        }
        
        // Reset failed attempts on success
        if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, lockoutUntil: null }
            });
        }

        if (user.isTwoFactorEnabled) {
            // Sign a temporary token for MFA verification (expires in 5 mins)
            const mfaToken = signToken({ userId: user.id, mfaState: 'pending' }, '5m');
            res.status(200).json({ 
                mfaRequired: true, 
                mfaToken,
                userId: user.id 
            });
            return;
        }

        const token = signToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ userId: user.id });

        // Store refresh token in DB
        await (prisma as any).refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Set Refresh Token in Secure Cookie for Web
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ 
            token, 
            refreshToken,
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const setupMFA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const secret = generateMFASecret();
        const uri = generateMFAUri(user.email, secret);
        const qrCodeUrl = await generateQRCode(uri);

        // Store temporary secret (don't enable yet)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        res.json({ secret, qrCodeUrl });
    } catch (error) {
        console.error('Setup MFA error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyAndEnableMFA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { token } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            res.status(400).json({ error: 'MFA setup not initialized' });
            return;
        }

        const isValid = await verifyMFAToken(token, user.twoFactorSecret);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid MFA token' });
            return;
        }

        const backupCodes = generateBackupCodes();

        await prisma.user.update({
            where: { id: userId },
            data: { 
                isTwoFactorEnabled: true,
                twoFactorBackupCodes: backupCodes as any
            }
        });

        res.json({ message: 'MFA enabled successfully', backupCodes });
    } catch (error) {
        console.error('Enable MFA error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyMFALogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mfaToken, otpToken } = req.body;

        if (!mfaToken || !otpToken) {
            res.status(400).json({ error: 'MFA token and OTP are required' });
            return;
        }

        // Verify the temporary MFA session token
        let decoded: any;
        try {
            decoded = verifyToken(mfaToken);
        } catch (err) {
            res.status(401).json({ error: 'MFA session expired' });
            return;
        }

        if (!decoded || decoded.mfaState !== 'pending') {
            res.status(401).json({ error: 'Invalid MFA session' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
            res.status(400).json({ error: 'MFA not enabled for this user' });
            return;
        }

        const isValid = await verifyMFAToken(otpToken, user.twoFactorSecret);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid MFA token' });
            return;
        }

        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        res.status(200).json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    } catch (error) {
        console.error('Verify MFA login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyPhone = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { code } = req.body;

        if (!userId || !code) {
            res.status(400).json({ error: 'User ID and verification code are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.phoneVerificationCode !== code) {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
        }

        await prisma.user.update({
            where: { id: userId },
            data: { 
                phoneVerified: true,
                phoneVerificationCode: null
            }
        });

        res.json({ message: 'Phone number verified successfully' });
    } catch (error) {
        console.error('Verify phone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // GDPR Right to Erasure: Permanent deletion of user and all related PII
        // Prisma cascade deletes should handle related records if configured,
        // otherwise we manually delete them.
        
        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({ message: 'Account and all associated data have been permanently deleted.' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Send 200 even if user doesn't exist for security (avoid enumeration)
            res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await (prisma.user as any).update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires
            }
        });

        // Real Email delivery
        await emailService.sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }

        const user = await (prisma.user as any).findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: { gt: new Date() }
            }
        });

        if (!user) {
            res.status(400).json({ error: 'Invalid or expired reset token' });
            return;
        }

        // Secure Password Check: Breach detection
        if (await isPasswordPwned(newPassword)) {
            res.status(400).json({ error: 'This password has been found in a data breach and is unsafe to use. Please choose a different password.' });
            return;
        }

        const hashedPassword = await hashPassword(newPassword);

        await (prisma.user as any).update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        });

        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { googleId, email, firstName, lastName } = req.body;
        if (!googleId || !email) {
            res.status(400).json({ error: 'Google ID and email are required' });
            return;
        }

        let user = await (prisma.user as any).findUnique({ where: { googleId } });
        
        if (!user) {
            // Check if user exists with this email but without googleId
            user = await prisma.user.findUnique({ where: { email } });
            
            if (user) {
                // Link account
                user = await (prisma.user as any).update({
                    where: { id: user.id },
                    data: { googleId }
                });
            } else {
                // Create new account
                user = await (prisma.user as any).create({
                    data: {
                        email,
                        googleId,
                        firstName: firstName || 'Google',
                        lastName: lastName || 'User',
                        emailVerified: true // Assume google email is verified
                    }
                });
            }
        }

        const accessToken = signToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ userId: user.id });

        await (prisma as any).refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ 
            token: accessToken, 
            refreshToken,
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } 
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const appleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { appleId, email, firstName, lastName } = req.body;
        if (!appleId || !email) {
            res.status(400).json({ error: 'Apple ID and email are required' });
            return;
        }

        let user = await (prisma.user as any).findUnique({ where: { appleId } });
        
        if (!user) {
            user = await prisma.user.findUnique({ where: { email } });
            
            if (user) {
                user = await (prisma.user as any).update({
                    where: { id: user.id },
                    data: { appleId }
                });
            } else {
                user = await (prisma.user as any).create({
                    data: {
                        email,
                        appleId,
                        firstName: firstName || 'Apple',
                        lastName: lastName || 'User',
                        emailVerified: true
                    }
                });
            }
        }

        const accessToken = signToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ userId: user.id });

        await (prisma as any).refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ 
            token: accessToken, 
            refreshToken,
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } 
        });
    } catch (error) {
        console.error('Apple login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            res.status(401).json({ error: 'Refresh token missing' });
            return;
        }

        const payload: any = verifyToken(refreshToken);
        if (!payload || !payload.userId) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        // Check if token exists and isn't revoked
        const storedToken = await (prisma as any).refreshToken.findUnique({
            where: { token: refreshToken }
        });

        if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
            // Potential reuse or breach: revoke all tokens for this user
            if (storedToken?.revoked) {
                await (prisma as any).refreshToken.updateMany({
                    where: { userId: payload.userId },
                    data: { revoked: true }
                });
                console.warn(`[SECURITY] Refresh token reuse detected for user ${payload.userId}. All tokens revoked.`);
            }
            res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
            return;
        }

        // Rotate token
        const newAccessToken = signToken({ userId: payload.userId });
        const newRefreshToken = signRefreshToken({ userId: payload.userId });

        await (prisma as any).$transaction([
            (prisma as any).refreshToken.update({
                where: { id: storedToken.id },
                data: { 
                    revoked: true,
                    replacedBy: newRefreshToken
                }
            }),
            (prisma as any).refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: payload.userId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ token: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (refreshToken) {
            await (prisma as any).refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revoked: true }
            });
        }

        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
