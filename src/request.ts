import { md5 } from 'js-md5';
import { Hints, parse, serializeCall } from './fastrpc.js';

export interface FetchOptions {
  cache: boolean;
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

const cache: Record<string, any> = {}

export async function xfrpc(
  method: string,
  args: any[] = [],
  options: Partial<Options> = {},
  fetch_options: Partial<FetchOptions> = { cache: true }
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

  let key: string | undefined = undefined;
  if (fetch_options.cache) {
    key = md5(JSON.stringify({ ..._options, ...{ method, args } }));
    console.log(key, method, key in cache);
    if (key in cache) return cache[key];
  }

  const response = await fetch(_options.url, {
    body: new Uint8Array(serializeCall(method, args, _options.hints)),
    method: 'POST',
    headers
  });

  const result = parse(new Uint8Array(await response.arrayBuffer()));
  if (key) cache[key] = result;
  return result;
}
