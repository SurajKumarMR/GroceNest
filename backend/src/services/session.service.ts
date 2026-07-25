import prisma from '../utils/prisma';
import logger from '../utils/logger';

export interface CreateSessionInput {
    userId: string;
    refreshToken?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    expiresInDays?: number;
}

export interface SessionInfo {
    id: string;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceType: string | null;
    location: string | null;
    isActive: boolean;
    isSuspicious: boolean;
    suspiciousReason: string | null;
    lastActiveAt: Date;
    expiresAt: Date;
    createdAt: Date;
    isCurrent?: boolean;
}

export class SessionService {
    /**
     * Parse device type from User-Agent string
     */
    static parseDeviceType(userAgent?: string): string {
        if (!userAgent) return 'unknown';
        const ua = userAgent.toLowerCase();
        if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet';
        if (/mobile|iphone|android|touch/i.test(ua)) return 'mobile';
        if (/windows|macintosh|linux|cros/i.test(ua)) return 'desktop';
        return 'unknown';
    }

    /**
     * Detect suspicious activity for a new login/session
     */
    static async detectSuspiciousActivity(
        userId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ isSuspicious: boolean; suspiciousReason: string | null }> {
        try {
            const activeSessions = await prisma.userSession.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' },
            });

            // 1. High volume of active sessions check
            if (activeSessions.length >= 5) {
                return {
                    isSuspicious: true,
                    suspiciousReason: `Unusually high number of active sessions (${activeSessions.length + 1} concurrent sessions)`,
                };
            }

            if (activeSessions.length > 0) {
                const latestSession = activeSessions[0];

                // 2. IP Subnet / Different IP Address anomaly check
                if (ipAddress && latestSession.ipAddress && ipAddress !== latestSession.ipAddress) {
                    const ip1Parts = ipAddress.split('.');
                    const ip2Parts = latestSession.ipAddress.split('.');

                    if (ip1Parts.length === 4 && ip2Parts.length === 4) {
                        if (ip1Parts[0] !== ip2Parts[0] || ip1Parts[1] !== ip2Parts[1]) {
                            const timeDiffMs = Date.now() - new Date(latestSession.lastActiveAt).getTime();
                            if (timeDiffMs < 60 * 60 * 1000) {
                                return {
                                    isSuspicious: true,
                                    suspiciousReason: `Rapid IP location change detected (${latestSession.ipAddress} -> ${ipAddress})`,
                                };
                            }
                        }
                    }
                }

                // 3. Sudden User-Agent device type change anomaly check within 1 hour
                if (userAgent && latestSession.userAgent && userAgent !== latestSession.userAgent) {
                    const currentDevice = this.parseDeviceType(userAgent);
                    const previousDevice = this.parseDeviceType(latestSession.userAgent);
                    const timeDiffMs = Date.now() - new Date(latestSession.lastActiveAt).getTime();

                    if (currentDevice !== previousDevice && timeDiffMs < 60 * 60 * 1000) {
                        return {
                            isSuspicious: true,
                            suspiciousReason: `Device type changed rapidly from ${previousDevice} to ${currentDevice}`,
                        };
                    }
                }
            }

            return { isSuspicious: false, suspiciousReason: null };
        } catch (error) {
            logger.error('Error detecting suspicious activity:', error);
            return { isSuspicious: false, suspiciousReason: null };
        }
    }

    /**
     * Create a new session record in DB
     */
    static async createSession(input: CreateSessionInput): Promise<SessionInfo> {
        const { userId, refreshToken, ipAddress, userAgent, location, expiresInDays = 7 } = input;

        const deviceType = this.parseDeviceType(userAgent);
        const { isSuspicious, suspiciousReason } = await this.detectSuspiciousActivity(userId, ipAddress, userAgent);

        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

        const session = await prisma.userSession.create({
            data: {
                userId,
                refreshToken,
                ipAddress,
                userAgent,
                deviceType,
                location,
                isActive: true,
                isSuspicious,
                suspiciousReason,
                expiresAt,
            },
        });

        if (isSuspicious) {
            logger.warn(`[SECURITY ALERT] Suspicious session detected for user ${userId}: ${suspiciousReason}`);
        }

        return session;
    }

    /**
     * Get active sessions for a user
     */
    static async getUserActiveSessions(userId: string, currentRefreshToken?: string): Promise<SessionInfo[]> {
        const sessions = await prisma.userSession.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            orderBy: { lastActiveAt: 'desc' },
        });

        return sessions.map((session) => ({
            id: session.id,
            userId: session.userId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            deviceType: session.deviceType,
            location: session.location,
            isActive: session.isActive,
            isSuspicious: session.isSuspicious,
            suspiciousReason: session.suspiciousReason,
            lastActiveAt: session.lastActiveAt,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
            isCurrent: currentRefreshToken ? session.refreshToken === currentRefreshToken : false,
        }));
    }

    /**
     * Revoke a specific session by ID for a user
     */
    static async revokeSession(sessionId: string, userId: string): Promise<boolean> {
        const session = await prisma.userSession.findFirst({
            where: {
                id: sessionId,
                userId,
                isActive: true,
            },
        });

        if (!session) return false;

        await prisma.$transaction([
            prisma.userSession.update({
                where: { id: sessionId },
                data: { isActive: false },
            }),
            ...(session.refreshToken
                ? [
                      prisma.refreshToken.updateMany({
                          where: { token: session.refreshToken },
                          data: { revoked: true },
                      }),
                  ]
                : []),
        ]);

        logger.info(`Session ${sessionId} revoked for user ${userId}`);
        return true;
    }

    /**
     * Revoke all other sessions for a user except current one
     */
    static async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
        const otherSessions = await prisma.userSession.findMany({
            where: {
                userId,
                isActive: true,
                id: { not: currentSessionId },
            },
        });

        const refreshTokensToRevoke = otherSessions
            .map((s) => s.refreshToken)
            .filter((t): t is string => Boolean(t));

        await prisma.$transaction([
            prisma.userSession.updateMany({
                where: {
                    userId,
                    isActive: true,
                    id: { not: currentSessionId },
                },
                data: { isActive: false },
            }),
            ...(refreshTokensToRevoke.length > 0
                ? [
                      prisma.refreshToken.updateMany({
                          where: { token: { in: refreshTokensToRevoke } },
                          data: { revoked: true },
                      }),
                  ]
                : []),
        ]);

        return otherSessions.length;
    }

    /**
     * Update session last active timestamp
     */
    static async updateSessionActivity(sessionId: string): Promise<void> {
        await prisma.userSession.update({
            where: { id: sessionId },
            data: { lastActiveAt: new Date() },
        });
    }

    /**
     * Invalidate session by refresh token (e.g. during logout)
     */
    static async invalidateSessionByToken(refreshToken: string): Promise<void> {
        const session = await prisma.userSession.findUnique({
            where: { refreshToken },
        });

        if (session) {
            await prisma.userSession.update({
                where: { id: session.id },
                data: { isActive: false },
            });
        }
    }

    /**
     * Clean up expired sessions
     */
    static async cleanupExpiredSessions(): Promise<number> {
        const result = await prisma.userSession.updateMany({
            where: {
                isActive: true,
                expiresAt: { lte: new Date() },
            },
            data: { isActive: false },
        });
        return result.count;
    }
}
