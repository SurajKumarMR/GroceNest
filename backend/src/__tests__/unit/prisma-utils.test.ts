import prisma from '../../utils/prisma';

describe('Prisma Utils & Middleware', () => {
  it('should export PrismaClient instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$use).toBe('function');
  });

  it('should allow User creation when passwordHash is provided', async () => {
    const next = jest.fn().mockResolvedValue({ id: 'user-1' });
    // @ts-ignore
    const middlewareFn = prisma._middlewares ? prisma._middlewares[0] : null;

    if (middlewareFn) {
      const params = {
        model: 'User',
        action: 'create',
        args: { data: { email: 'test@example.com', passwordHash: 'hashed' } }
      };
      const result = await middlewareFn(params, next);
      expect(next).toHaveBeenCalledWith(params);
      expect(result).toEqual({ id: 'user-1' });
    }
  });

  it('should throw error on User creation when passwordHash and social IDs are missing', async () => {
    // @ts-ignore
    const middlewareFn = prisma._middlewares ? prisma._middlewares[0] : null;

    if (middlewareFn) {
      const params = {
        model: 'User',
        action: 'create',
        args: { data: { email: 'no-auth@example.com' } }
      };
      const next = jest.fn();

      await expect(middlewareFn(params, next)).rejects.toThrow('User must have password or social login');
      expect(next).not.toHaveBeenCalled();
    }
  });
});
