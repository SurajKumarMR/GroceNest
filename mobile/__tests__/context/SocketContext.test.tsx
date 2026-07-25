import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SocketProvider, useSocket } from '../../src/context/SocketContext';
import { socketService } from '../../src/services/socket.service';
import { Text } from 'react-native';

const mockUseAuth = jest.fn();

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../src/services/socket.service', () => ({
  socketService: {
    connect: jest.fn().mockResolvedValue({ id: 'socket-123', connected: true }),
    disconnect: jest.fn(),
  },
}));

const TestComponent = () => {
  const { isConnected } = useSocket();
  return <Text>{isConnected ? 'Connected' : 'Disconnected'}</Text>;
};

describe('SocketContext & Provider Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('connects socket when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });

    await render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    await waitFor(() => {
      expect(socketService.connect).toHaveBeenCalled();
    });
    expect(await screen.findByText('Connected')).toBeTruthy();
  });

  test('disconnects socket when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    await render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(socketService.disconnect).toHaveBeenCalled();
    expect(screen.getByText('Disconnected')).toBeTruthy();
  });
});
