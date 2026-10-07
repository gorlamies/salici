import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor!: ReturnType<typeof createAdapter>;

    constructor(app: INestApplicationContext) {
        super(app);
    }

    async connectToRedis(): Promise<void> {

        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            throw new Error("REDIS_URL environment variable is not defined");
        }
        const pubClient = createClient({
            url: redisUrl,
        });

        const subClient = pubClient.duplicate();

        await Promise.all([
            pubClient.connect(),
            subClient.connect(),
        ]);

        this.adapterConstructor = createAdapter(
            pubClient,
            subClient,
        );
    }

    createIOServer(
        port: number,
        options?: ServerOptions,
    ): any {
        const server = super.createIOServer(port, options);

        server.adapter(this.adapterConstructor);

        return server;
    }
}