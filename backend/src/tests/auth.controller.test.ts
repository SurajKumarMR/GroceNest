
import { Request, Response } from 'express';
import * as authController from '../controllers/auth.controller';
import prisma from '../utils/prisma';
import * as passwordUtils from '../utils/password.utils';
import * as jwtUtils from '../utils/jwt.utils';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock Utils
jest.mock('../utils/password.utils');
jest.mock('../utils/jwt.utils');

describe('AuthController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRequest = {};
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should return 400 if validation fails', async () => {
            mockRequest.body = { email: 'invalid-email' }; // Missing fields and invalid email

            await authController.register(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }));
        });

        it('should return 409 if user already exists', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

            await authController.register(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'User already exists' });
        });

        it('should register a new user and return token', async () => {
            const userData = {
                email: 'new@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };
            mockRequest.body = userData;

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'new-id',
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: 'CUSTOMER',
            });
            (jwtUtils.signToken as jest.Mock).mockReturnValue('fake-token');

            await authController.register(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                token: 'fake-token',
                user: expect.objectContaining({ email: userData.email }),
            });
        });
    });

    describe('login', () => {
        it('should return 400 if validation fails', async () => {
            mockRequest.body = { email: 'test@example.com' }; // Missing password

            await authController.login(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 401 if user not found', async () => {
            mockRequest.body = { email: 'notfound@example.com', password: 'password123' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await authController.login(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        });

        it('should login successfully and return token', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'password123' };
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                isActive: true,
                firstName: 'John',
                lastName: 'Doe',
                role: 'CUSTOMER',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
            (jwtUtils.signToken as jest.Mock).mockReturnValue('fake-token');

            await authController.login(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                token: 'fake-token',
                user: expect.objectContaining({ email: 'test@example.com' }),
            });
        });

        it('should return 401 if password incorrect', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', passwordHash: 'hashed', isActive: true });
            (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

            await authController.login(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
        });
    });
});
