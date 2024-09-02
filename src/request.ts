import { Cache, FileCache } from './cache';
import { type Hints, parse, serializeCall } from './fastrpc';

export interface FetchOptions {
  cache: Cache;
}

export interface Header {
  name: string;
  value: string;
}

export interface Options {
  timeout: number;
  hints: Hints;
  url: string;
  hashId: string;
  headers: Array<Header>;
  type: 'frpc';
  withCredentials: boolean;
}

const OPTIONS: Options = {
  timeout: 0,
  hints: {},
  url: '/RPC2',
  hashId: '',
  headers: [],
  type: 'frpc',
  withCredentials: true
};

export async function xfrpc(
  method: string,
  args: any[] = [],
  options: Partial<Options> = {},
  cacher: Cache = new FileCache()
) {
  const _options = { ...OPTIONS, ...options };

  const headers: any = {
    Accept: 'application/x-frpc',
    'Content-Type': 'application/x-frpc'
  };
  for (let index = 0; index < _options.headers.length; index++) {
    const { name, value } = _options.headers[index];
    headers[name] = value;
  }

  const key = cacher.key({ ..._options, ...{ method, args } });
  if (cacher.is(key)) return cacher.get(key);

  const response = await fetch(_options.url, {
    body: new Uint8Array(serializeCall(method, args, _options.hints)),
    method: 'POST',
    headers
  });

  const result = parse(new Uint8Array(await response.arrayBuffer()));
  cacher.set(key, result);
  return result;
}
