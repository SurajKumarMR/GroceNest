import { initSocket, getIO } from '../../services/socket.service';
import { Server as SocketServer } from 'socket.io';
import * as http from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import { analyticsService } from '../../services/analytics.service';

jest.mock('socket.io');
jest.mock('../../utils/prisma', () => ({
    __esModule: true,
    default: {
        order: {
            findUnique: jest.fn()
        }
    }
}));
jest.mock('../../services/analytics.service', () => ({
    analyticsService: {
        trackDriverLocationUpdate: jest.fn()
    }
}));
jest.mock('../../utils/logger');

describe('Socket Service Unit Tests', () => {
    let mockIoInstance: any;
    let middlewareFn: any;
    let connectionFn: any;
    let mockSocket: any;
    let mockServer: http.Server;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';

        // Mock socket events map
        const socketEvents: { [key: string]: Function } = {};
        mockSocket = {
            id: 'socket-123',
            handshake: {
                auth: {}
            },
            join: jest.fn(),
            emit: jest.fn(),
            on: jest.fn((event, callback) => {
                socketEvents[event] = callback;
            }),
            // Helper to trigger events on the mock socket
            trigger: (event: string, ...args: any[]) => {
                if (socketEvents[event]) {
                    socketEvents[event](...args);
                }
            }
        };

        // Mock Server instance
        mockIoInstance = {
            use: jest.fn((fn) => {
                middlewareFn = fn;
            }),
            on: jest.fn((event, fn) => {
                if (event === 'connection') {
                    connectionFn = fn;
                }
            }),
            to: jest.fn(() => ({
                emit: jest.fn()
            }))
        };

        (SocketServer as unknown as jest.Mock).mockImplementation(() => mockIoInstance);
        mockServer = {} as http.Server;
    });

    it('should throw error when getIO is called before initialization', () => {
        expect(() => getIO()).toThrow('Socket.io not initialized');
    });

    it('should initialize socket server and register middleware/connection', () => {
        const returnedIo = initSocket(mockServer);
        expect(SocketServer).toHaveBeenCalledWith(mockServer, expect.any(Object));
        expect(mockIoInstance.use).toHaveBeenCalled();
        expect(mockIoInstance.on).toHaveBeenCalledWith('connection', expect.any(Function));
        expect(getIO()).toBe(returnedIo);
    });

    describe('Socket Middleware Authentication', () => {
        beforeEach(() => {
            initSocket(mockServer);
        });

        it('should fail authentication if token is missing', () => {
            const next = jest.fn();
            middlewareFn(mockSocket, next);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Authentication error');
        });

        it('should authenticate user and set userId/role on socket if token is valid', () => {
            const token = jwt.sign({ userId: 'user-456', role: 'DRIVER' }, 'testsecret');
            mockSocket.handshake.auth.token = token;
            const next = jest.fn();

            middlewareFn(mockSocket, next);

            expect(mockSocket.userId).toBe('user-456');
            expect(mockSocket.role).toBe('DRIVER');
            expect(next).toHaveBeenCalledWith();
        });

        it('should fail authentication if token verification throws error', () => {
            mockSocket.handshake.auth.token = 'invalid-token-here';
            const next = jest.fn();

            middlewareFn(mockSocket, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Authentication error');
        });
    });

    describe('Socket Connection and Event Handlers', () => {
        let mockToEmitter: any;

        beforeEach(() => {
            initSocket(mockServer);
            mockSocket.userId = 'driver-789';
            mockSocket.role = 'DRIVER';

            mockToEmitter = { emit: jest.fn() };
            mockIoInstance.to.mockReturnValue(mockToEmitter);

            // Connect the socket
            connectionFn(mockSocket);
        });

        it('should handle joinOrder', () => {
            mockSocket.trigger('joinOrder', 'order-111');
            expect(mockSocket.join).toHaveBeenCalledWith('order_order-111');
        });

        it('should handle joinStore', () => {
            mockSocket.trigger('joinStore', 'store-222');
            expect(mockSocket.join).toHaveBeenCalledWith('store_store-222');
        });

        it('should handle joinSupport', () => {
            mockSocket.trigger('joinSupport', { userId: 'customer-333' });
            expect(mockSocket.join).toHaveBeenCalledWith('support_customer-333');
        });

        it('should handle joinSupport and default to socket.userId if userId option is empty', () => {
            mockSocket.trigger('joinSupport', {});
            expect(mockSocket.join).toHaveBeenCalledWith('support_driver-789');
        });

        it('should handle sendSupportMessage', () => {
            mockSocket.trigger('sendSupportMessage', {
                sessionId: 'session-444',
                content: 'Hello, help me',
                isAdmin: false
            });

            expect(mockIoInstance.to).toHaveBeenCalledWith('support_driver-789');
            expect(mockToEmitter.emit).toHaveBeenCalledWith('newSupportMessage', expect.objectContaining({
                sessionId: 'session-444',
                senderId: 'driver-789',
                content: 'Hello, help me',
                isAdmin: false,
                createdAt: expect.any(Date)
            }));

            expect(mockIoInstance.to).toHaveBeenCalledWith('support_admins');
            expect(mockToEmitter.emit).toHaveBeenCalledWith('adminNewMessage', {
                userId: 'driver-789',
                sessionId: 'session-444',
                content: 'Hello, help me'
            });
        });

        it('should handle adminJoinSupport if role is ADMIN', () => {
            mockSocket.role = 'ADMIN';
            mockSocket.trigger('adminJoinSupport', { userId: 'customer-333' });
            expect(mockSocket.join).toHaveBeenCalledWith('support_customer-333');
            expect(mockSocket.join).toHaveBeenCalledWith('support_admins');
        });

        it('should ignore adminJoinSupport if role is not ADMIN', () => {
            mockSocket.role = 'DRIVER';
            mockSocket.trigger('adminJoinSupport', { userId: 'customer-333' });
            expect(mockSocket.join).not.toHaveBeenCalled();
        });

        it('should handle disconnect', () => {
            mockSocket.trigger('disconnect');
            // Simply logs, checking it runs without errors
        });

        describe('updateLocation', () => {
            it('should emit error if order is not found', async () => {
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

                await mockSocket.trigger('updateLocation', {
                    orderId: 'order-invalid',
                    latitude: 51.5,
                    longitude: -0.1
                });

                expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Unauthorized');
            });

            it('should emit error if driverId does not match current socket user', async () => {
                (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                    driverId: 'different-driver'
                });

                await mockSocket.trigger('updateLocation', {
                    orderId: 'order-xyz',
                    latitude: 51.5,
                    longitude: -0.1
                });

                expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Unauthorized');
            });

            it('should broadcast location and track analytics if order driver matches user', async () => {
                (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                    driverId: 'driver-789'
                });

                await mockSocket.trigger('updateLocation', {
                    orderId: 'order-xyz',
                    latitude: 51.5,
                    longitude: -0.1,
                    heading: 90
                });

                expect(mockIoInstance.to).toHaveBeenCalledWith('order_order-xyz');
                expect(mockToEmitter.emit).toHaveBeenCalledWith('locationUpdated', expect.objectContaining({
                    latitude: 51.5,
                    longitude: -0.1,
                    heading: 90,
                    timestamp: expect.any(Date)
                }));

                expect(analyticsService.trackDriverLocationUpdate).toHaveBeenCalledWith(
                    'driver-789',
                    51.5,
                    -0.1
                );
            });

            it('should emit internal server error if findUnique rejects', async () => {
                (prisma.order.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

                await mockSocket.trigger('updateLocation', {
                    orderId: 'order-xyz',
                    latitude: 51.5,
                    longitude: -0.1
                });

                expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Internal server error');
            });
        });
    });
});
