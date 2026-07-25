import { socketService } from '../../src/services/socket.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

describe('socketService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socketService.disconnect();
  });

  test('connect establishes Socket.io connection with auth token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('mock-jwt-token');

    const socket = await socketService.connect();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('token');
    expect(io).toHaveBeenCalledWith(expect.any(String), {
      auth: { token: 'mock-jwt-token' },
      transports: ['websocket'],
    });
    expect(socket).toBeDefined();
  });

  test('joinOrder emits joinOrder event with orderId', async () => {
    const socket = await socketService.connect();
    socketService.joinOrder('order-123');

    expect(socket.emit).toHaveBeenCalledWith('joinOrder', 'order-123');
  });

  test('updateLocation emits updateLocation event with payload', async () => {
    const socket = await socketService.connect();
    socketService.updateLocation('order-123', 37.7749, -122.4194, 90);

    expect(socket.emit).toHaveBeenCalledWith('updateLocation', {
      orderId: 'order-123',
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 90,
    });
  });

  test('onLocationUpdated registers listener for locationUpdated event', async () => {
    const socket = await socketService.connect();
    const mockCallback = jest.fn();

    socketService.onLocationUpdated(mockCallback);
    expect(socket.on).toHaveBeenCalledWith('locationUpdated', mockCallback);

    socketService.offLocationUpdated();
    expect(socket.off).toHaveBeenCalledWith('locationUpdated');
  });

  test('disconnect terminates socket connection', async () => {
    const socket = await socketService.connect();
    socketService.disconnect();

    expect(socket.disconnect).toHaveBeenCalled();
  });
});
