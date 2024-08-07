import * as fs from 'fs';
import { md5 } from 'js-md5';
import path from 'path';

export class Cache {
  key(obj: any) {
    return md5(JSON.stringify(obj));
  }
  is(_key: string): boolean {
    return false;
  }
  get(_key: string): any {}
  set(_key: string, _value: any) {}
}

export class InMemoryCache extends Cache {
  store: Record<string, any>
  constructor() {
    super()
    this.store = {}
  }
  is(key: string): boolean {
    return (key in this.store)
  }
  get(key: string) {
    return this.store[key];
  }
  set(key: string, value: any) {
    this.store[key] = value;
  }
}

export class FileCache extends Cache {
  constructor(private cachePath: string = 'cache') {
    super()
    if (!fs.existsSync(cachePath)) throw Error(`cache path:${cachePath} doesn't exist`)
  }
  is(key: string): boolean {
    return fs.existsSync(this.path(key));
  }
  path(key: string): string {
    return path.join(this.cachePath, key);
  }
  get(key: string) {
    console.log(`reading cache from:${key}`)
    return JSON.parse(fs.readFileSync(this.path(key), "utf8"));
  }
  set(key: string, value: any) {
    console.log(`writing cache to:${key}`)
    fs.writeFileSync(this.path(key), JSON.stringify(value));
  }
}