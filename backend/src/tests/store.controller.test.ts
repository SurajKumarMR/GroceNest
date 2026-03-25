
import { Response } from 'express';
import * as storeController from '../controllers/store.controller';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
    __esModule: true,
    default: {
        store: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('StoreController', () => {
    let mockRequest: Partial<AuthRequest>;
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

    describe('createStore', () => {
        it('should return 401 if unauthorized', async () => {
            mockRequest.user = undefined;
            await storeController.createStore(mockRequest as AuthRequest, mockResponse as Response);
            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('should return 400 if validation fails', async () => {
            mockRequest.user = { userId: '1', email: 'test@test.com', role: 'MERCHANT' };
            mockRequest.body = { name: 'S' }; // Name too short
            await storeController.createStore(mockRequest as AuthRequest, mockResponse as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 409 if slug already exists', async () => {
            mockRequest.user = { userId: '1', email: 'test@test.com', role: 'MERCHANT' };
            mockRequest.body = {
                name: 'My Store',
                slug: 'my-store',
                streetAddress: '123 St',
                city: 'City',
                postalCode: '12345',
                country: 'Country',
                latitude: 0,
                longitude: 0,
                cuisineTypes: ['Indian'],
            };
            (prisma.store.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

            await storeController.createStore(mockRequest as AuthRequest, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
        });

        it('should create a store successfully', async () => {
            mockRequest.user = { userId: '1', email: 'test@test.com', role: 'MERCHANT' };
            const storeData = {
                name: 'New Store',
                slug: 'new-store',
                streetAddress: '123 St',
                city: 'City',
                postalCode: '12345',
                country: 'Country',
                latitude: 0,
                longitude: 0,
                cuisineTypes: ['Indian'],
            };
            mockRequest.body = storeData;
            (prisma.store.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.store.create as jest.Mock).mockResolvedValue({ id: 'new-id', ...storeData });

            await storeController.createStore(mockRequest as AuthRequest, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-id' }));
        });
    });

    describe('getStores', () => {
        it('should return a list of stores', async () => {
            const mockStores = [{ id: '1', name: 'Store 1' }, { id: '2', name: 'Store 2' }];
            (prisma.store.findMany as jest.Mock).mockResolvedValue(mockStores);

            mockRequest.query = {};
            await storeController.getStores(mockRequest as AuthRequest, mockResponse as Response);

            expect(jsonMock).toHaveBeenCalledWith(mockStores);
        });
    });
});
