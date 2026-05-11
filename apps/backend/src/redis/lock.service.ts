import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class LockService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async acquireLock(resource: string, ttl: number = 180000): Promise<string | null> {
    const lockValue = Date.now().toString();
    const result = await this.redis.set(
      `lock:${resource}`,
      lockValue,
      'PX',
      ttl,
      'NX',
    );

    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, `lock:${resource}`, lockValue);
    return result === 1;
  }
}
