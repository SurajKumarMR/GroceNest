import Redis from 'ioredis';

class RedisService {
    private client: Redis | null = null;
    private memoryFallbackStore: Map<string, { value: string; expiresAt: number | null }> = new Map();
    private isConnected: boolean = false;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        try {
            this.client = new Redis(redisUrl, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times > 2) {
                        return null; // Stop retrying and fallback
                    }
                    return 500;
                }
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('[RedisService] Connected to Redis server.');
            });

            this.client.on('error', (err) => {
                if (this.isConnected) {
                    console.warn('[RedisService] Redis connection error, using fallback:', err.message);
                }
                this.isConnected = false;
            });
        } catch (error) {
            console.warn('[RedisService] Failed to initialize Redis client, using fallback:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    public async connect(): Promise<void> {
        if (this.client && !this.isConnected) {
            try {
                await this.client.connect();
                this.isConnected = true;
            } catch (err) {
                this.isConnected = false;
            }
        }
    }

    public isAvailable(): boolean {
        return this.isConnected;
    }

    public async get<T>(key: string): Promise<T | null> {
        if (this.isConnected && this.client) {
            try {
                const data = await this.client.get(key);
                return data ? (JSON.parse(data) as T) : null;
            } catch (err) {
                // Fallback to memory
            }
        }

        // Memory fallback store check
        const entry = this.memoryFallbackStore.get(key);
        if (!entry) return null;

        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.memoryFallbackStore.delete(key);
            return null;
        }

        try {
            return JSON.parse(entry.value) as T;
        } catch {
            return null;
        }
    }

    public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const serialized = JSON.stringify(value);

        if (this.isConnected && this.client) {
            try {
                if (ttlSeconds && ttlSeconds > 0) {
                    await this.client.set(key, serialized, 'EX', ttlSeconds);
                } else {
                    await this.client.set(key, serialized);
                }
                return;
            } catch (err) {
                // Fallback to memory
            }
        }

        // Memory fallback store set
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.memoryFallbackStore.set(key, { value: serialized, expiresAt });
    }

    public async del(key: string | string[]): Promise<void> {
        const keys = Array.isArray(key) ? key : [key];
        if (keys.length === 0) return;

        if (this.isConnected && this.client) {
            try {
                await this.client.del(...keys);
            } catch (err) {
                // Ignore fallback
            }
        }

        keys.forEach(k => this.memoryFallbackStore.delete(k));
    }

    public async delByPattern(pattern: string): Promise<void> {
        if (this.isConnected && this.client) {
            try {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } catch (err) {
                // Ignore fallback
            }
        }

        // Pattern matching for memory fallback
        const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const k of this.memoryFallbackStore.keys()) {
            if (regexPattern.test(k)) {
                this.memoryFallbackStore.delete(k);
            }
        }
    }

    public async flushAll(): Promise<void> {
        if (this.isConnected && this.client) {
            try {
                await this.client.flushall();
            } catch (err) {
                // Ignore
            }
        }
        this.memoryFallbackStore.clear();
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.quit();
            } catch {
                // Ignore
            }
            this.isConnected = false;
        }
    }
}

export const redisService = new RedisService();
