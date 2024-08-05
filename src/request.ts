import { Hints, parse, serializeCall } from './fastrpc';

interface Header {
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

export async function xfrpc(method: string, args: any[] = [], options: Partial<Options> = {}) {
  const _options = { ...OPTIONS, ...options };
  console.log("xfrpc", method, args);

  const headers: any = {
    Accept: 'application/x-frpc',
    'Content-Type': 'application/x-frpc'
  };
  for (let index = 0; index < _options.headers.length; index++) {
    const { name, value } = _options.headers[index];
    headers[name] = value;
  }

  const response = await fetch(_options.url, {
    body: new Uint8Array(serializeCall(method, args, options.hints)),
    method: 'POST',
    headers
  });
  return parse(new Uint8Array(await response.arrayBuffer()));
}
