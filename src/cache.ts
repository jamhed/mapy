import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { md5 } from 'js-md5';
import path from 'path';
import logger from './logger';

export class Cache {
  key(obj: any) {
    return md5(JSON.stringify(obj));
  }
  is(_key: string): boolean {
    return false;
  }
  async get(_key: string): Promise<any> {}
  async set(_key: string, _value: any) {}
}

export class InMemoryCache extends Cache {
  store: Record<string, any>;
  constructor() {
    super();
    this.store = {};
  }
  is(key: string): boolean {
    return key in this.store;
  }
  async get(key: string) {
    return this.store[key];
  }
  async set(key: string, value: any) {
    this.store[key] = value;
  }
}

export class FileCache extends Cache {
  constructor(private cachePath: string = 'cache') {
    super();
    if (!fs.existsSync(cachePath)) throw Error(`cache path:${cachePath} doesn't exist`);
  }
  is(key: string): boolean {
    return fs.existsSync(this.path(key));
  }
  path(key: string): string {
    return path.join(this.cachePath, key);
  }
  async get(key: string) {
    logger.debug({ key }, 'cache read');
    const buffer = await fsp.readFile(this.path(key), 'utf8');
    return JSON.parse(buffer);
  }
  async set(key: string, value: any) {
    logger.debug({ key }, 'cache write');
    return fsp.writeFile(this.path(key), JSON.stringify(value));
  }
}
