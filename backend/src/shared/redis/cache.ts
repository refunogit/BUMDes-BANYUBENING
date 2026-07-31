import { logger } from '../logger';

export interface ICacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  lpush(key: string, value: string): Promise<void>;
  rpop(key: string): Promise<string | null>;
  keys(pattern: string): Promise<string[]>;
}

class InMemoryCacheClient implements ICacheClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private lists = new Map<string, string[]>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.lists.delete(key);
  }

  async lpush(key: string, value: string): Promise<void> {
    const list = this.lists.get(key) || [];
    list.unshift(value);
    this.lists.set(key, list);
  }

  async rpop(key: string): Promise<string | null> {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.pop() || null;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const keys: string[] = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) keys.push(key);
    }
    return keys;
  }
}

export const cache: ICacheClient = new InMemoryCacheClient();
logger.info('Cache & Queue system initialized (Enterprise In-Memory Store / Redis compatible)');
