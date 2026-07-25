import { socketService } from '../../src/services/socket.service';

const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockDisconnect = jest.fn();
const mockConnect = jest.fn();

let mockConnected = false;

jest.mock('socket.io-client', () => ({
    io: jest.fn(() => ({
        get connected() {
            return mockConnected;
        },
        id: 'mock_socket_id_123',
        connect: mockConnect,
        disconnect: mockDisconnect,
        emit: mockEmit,
        on: mockOn,
        off: mockOff,
    })),
}));

describe('Mobile socketService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnected = false;
        socketService.disconnect();
    });

    it('connect initializes Socket.io client with reconnection options', async () => {
        const socket = await socketService.connect();
        expect(socket).toBeDefined();
        expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockOn).toHaveBeenCalledWith('reconnect', expect.any(Function));
        expect(mockOn).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('buffers events into offlineQueue when socket is disconnected and flushes on connect', async () => {
        await socketService.connect();
        mockConnected = false;

        // Emit while disconnected -> queued
        socketService.emit('testEvent', { foo: 'bar' });
        expect(socketService.getQueuedEventsCount()).toBe(1);

        // Connect socket -> flush
        mockConnected = true;
        socketService.flushOfflineQueue();

        expect(mockEmit).toHaveBeenCalledWith('testEvent', { foo: 'bar' });
        expect(socketService.getQueuedEventsCount()).toBe(0);
    });

    it('tracks joined order rooms and re-joins rooms on reconnect', async () => {
        await socketService.connect();
        mockConnected = true;

        const orderId1 = 'order_abc_123';
        const orderId2 = 'order_def_456';

        socketService.joinOrder(orderId1);
        socketService.joinOrder(orderId2);

        expect(socketService.getJoinedRooms()).toEqual([orderId1, orderId2]);
        expect(mockEmit).toHaveBeenCalledWith('joinOrder', orderId1);
        expect(mockEmit).toHaveBeenCalledWith('joinOrder', orderId2);

        // Rejoin rooms on reconnect
        jest.clearAllMocks();
        socketService.rejoinRooms();

        expect(mockEmit).toHaveBeenCalledWith('joinOrder', orderId1);
        expect(mockEmit).toHaveBeenCalledWith('joinOrder', orderId2);

        // Leave room
        socketService.leaveOrder(orderId1);
        expect(socketService.getJoinedRooms()).toEqual([orderId2]);
    });

    it('clears queues and rooms on disconnect', async () => {
        await socketService.connect();
        socketService.joinOrder('order_1');
        socketService.emit('event_1', { data: 1 });

        socketService.disconnect();

        expect(socketService.getJoinedRooms().length).toBe(0);
        expect(socketService.getQueuedEventsCount()).toBe(0);
    });
});
