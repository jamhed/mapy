/* eslint-disable */
/* eslint-disable no-magic-numbers */
/*
FastRPC library written in TypeScript
Copyright (C) 2005-2019 Seznam.cz, a.s.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

Seznam.cz, a.s.
Radlická 3294/10, Praha 5, 15000, Czech Republic
http://www.seznam.cz, mailto:fastrpc@firma.seznam.cz
*/

const TYPE_CALL = 13;
const TYPE_RESPONSE = 14;
const TYPE_FAULT = 15;

const TYPE_INT = 1;
const TYPE_BOOL = 2;
const TYPE_DOUBLE = 3;
const TYPE_STRING = 4;
const TYPE_DATETIME = 5;
const TYPE_BINARY = 6;
const TYPE_INT8P = 7;
const TYPE_INT8N = 8;
const TYPE_STRUCT = 10;
const TYPE_ARRAY = 11;
const TYPE_NULL = 12;

export let surrogateFlag = false;

let _hints: null | any = null;
let _path: string[] = [];
let _data: Uint8Array;
let _pointer = 0;

interface Dict {
  [name: string]: any;
}

export interface Hints {
  [name: string]: string;
}

type BYTES = number[];

function _getByte() {
  if (_pointer + 1 > _data.length) {
    throw new Error('Cannot read byte from buffer');
  }

  return _data[_pointer++];
}

/**
 * In little endian
 */
function _getInt(bytes: number) {
  let result = 0;
  let factor = 1;

  for (let i = 0; i < bytes; i++) {
    result += factor * _getByte();
    factor *= 256;
  }

  return result;
}

function _decodeUTF8(length: number) {
  /* pouzite optimalizace:
   * - pracujeme nad stringem namisto pole; FF i IE to kupodivu (!) maji rychlejsi
   * - while namisto for
   * - cachovani fromCharcode, _data i _pointer
   * - vyhozeni _getByte
   */
  let remain = length;
  let result = '';

  if (!length) {
    return result;
  }

  let c = 0,
    c1 = 0,
    c2 = 0,
    c3 = 0;
  let SfCC = String.fromCharCode;
  let data = _data;
  let pointer = _pointer;

  while (1) {
    remain--;
    c = data[pointer];
    pointer += 1; /* FIXME safari bug */
    if (c < 128) {
      result += SfCC(c);
    } else if (c > 191 && c < 224) {
      c1 = data[pointer] & 63;
      pointer += 1; /* FIXME safari bug */
      result += SfCC(((c & 31) << 6) | c1);
      remain -= 1;
    } else if (c < 240) {
      c1 = data[pointer++] & 63;
      c2 = data[pointer++] & 63;
      let cp = ((c & 15) << 12) | (c1 << 6) | c2;
      result += SfCC(cp);
      remain -= 2;

      /* zapamatovat si, ze jsme narazili na (nekorektni) surrogate pair */
      if (cp >= 55296 && cp <= 56319) {
        surrogateFlag = true;
      }
    } else if (c < 248) {
      /* 4 byte stuff */
      c1 = data[pointer++] & 63;
      c2 = data[pointer++] & 63;
      c3 = data[pointer++] & 63;
      let cp = ((c & 0x07) << 0x12) | (c1 << 0x0c) | (c2 << 0x06) | c3;

      if (cp > 0xffff) {
        /* surrogates */
        cp -= 0x10000;
        result += SfCC(((cp >>> 10) & 0x3ff) | 0xd800);
        cp = (cp & 0x3ff) | 0xdc00;
      }
      result += SfCC(cp);
      remain -= 3;
    } else if (c < 252) {
      /* 5 byte stuff, throw away */
      pointer += 4;
      remain -= 4;
    } else {
      /* 6 byte stuff, throw away */
      pointer += 5;
      remain -= 5;
    }

    /* pokud bylo na vstupu nevalidni UTF-8, mohli jsme podlezt... */
    if (remain <= 0) {
      break;
    }
  }

  /* normalne je v tuto chvili remain = 0; pokud byla ale na vstupu chyba, mohlo klesnout pod nulu. vratime pointer na spravny konec stringu */
  _pointer = pointer + remain;

  return result;
}

function _encodeUTF8(str: string) {
  let result: BYTES = [];

  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);

    if (c >= 55296 && c <= 56319) {
      /* surrogates */
      let c2 = str.charCodeAt(++i);
      c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
    }

    if (c < 128) {
      result.push(c);
    } else if (c < 2048) {
      result.push((c >> 6) | 192);
      result.push((c & 63) | 128);
    } else if (c < 65536) {
      result.push((c >> 12) | 224);
      result.push(((c >> 6) & 63) | 128);
      result.push((c & 63) | 128);
    } else {
      result.push((c >> 18) | 240);
      result.push(((c >> 12) & 63) | 128);
      result.push(((c >> 6) & 63) | 128);
      result.push((c & 63) | 128);
    }
  }

  return result;
}

function _getDouble() {
  let bytes: BYTES = [];
  let index = 8;

  while (index--) {
    bytes[index] = _getByte();
  }

  let sign = bytes[0] & 0x80 ? 1 : 0;

  let exponent = (bytes[0] & 127) << 4;
  exponent += bytes[1] >> 4;

  if (exponent === 0) {
    return Math.pow(-1, sign) * 0;
  }

  let mantissa = 0;
  let byteIndex = 1;
  let bitIndex = 3;
  index = 1;

  do {
    let bitValue = bytes[byteIndex] & (1 << bitIndex) ? 1 : 0;
    mantissa += bitValue * Math.pow(2, -index);

    index++;
    bitIndex--;
    if (bitIndex < 0) {
      bitIndex = 7;
      byteIndex++;
    }
  } while (byteIndex < bytes.length);

  if (exponent == 0x7ff) {
    if (mantissa) {
      return NaN;
    } else {
      return Math.pow(-1, sign) * Infinity;
    }
  }

  exponent -= (1 << 10) - 1;

  return Math.pow(-1, sign) * Math.pow(2, exponent) * (1 + mantissa);
}

/**
 * Zakoduje KLADNE cele cislo, little endian
 */
function _encodeInt(data: number) {
  if (!data) {
    return [0];
  }

  let result: number[] = [];
  let remain = data;

  while (remain) {
    let value = remain % 256;
    remain = (remain - value) / 256;
    result.push(value);
  }

  return result;
}

/**
 * Zakoduje IEEE-754 double
 */
function _encodeDouble(num: number) {
  let result: number[] = [];

  let expBits = 11;
  let fracBits = 52;
  let bias = (1 << (expBits - 1)) - 1;
  let sign = 0;
  let exponent = 0;
  let fraction = 0;

  if (isNaN(num)) {
    exponent = (1 << expBits) - 1;
    fraction = 1;
    sign = 0;
  } else if (num === Infinity || num === -Infinity) {
    exponent = (1 << expBits) - 1;
    fraction = 0;
    sign = num < 0 ? 1 : 0;
  } else if (num === 0) {
    exponent = 0;
    fraction = 0;
    sign = 1 / num === -Infinity ? 1 : 0;
  } else {
    /* normal number */
    sign = num < 0 ? 1 : 0;

    let abs = Math.abs(num);

    if (abs >= Math.pow(2, 1 - bias)) {
      let ln = Math.min(Math.floor(Math.log(abs) / Math.LN2), bias);

      exponent = ln + bias;
      fraction = abs * Math.pow(2, fracBits - ln) - Math.pow(2, fracBits);
    } else {
      exponent = 0;
      fraction = abs / Math.pow(2, 1 - bias - fracBits);
    }
  }

  let bits: number[] = [];

  for (let i = fracBits; i > 0; i--) {
    bits.push(fraction % 2 ? 1 : 0);
    fraction = Math.floor(fraction / 2);
  }

  for (let i = expBits; i > 0; i--) {
    bits.push(exponent % 2 ? 1 : 0);
    exponent = Math.floor(exponent / 2);
  }

  bits.push(sign ? 1 : 0);

  num = 0;
  let index = 0;

  while (bits.length) {
    // @ts-ignore
    num += (1 << index) * bits.shift();
    index++;

    if (index == 8) {
      result.push(num);
      num = 0;
      index = 0;
    }
  }

  return result;
}

function _parseValue(): any {
  /* pouzite optimalizace:
   * - zkracena cesta ke konstantam v ramci redukce tecek
   * - posun nejpouzivanejsich typu nahoru
   */
  let first = _getInt(1);
  let type = first >> 3;
  let length, lengthBytes, result, members;

  switch (type) {
    case TYPE_STRING:
      lengthBytes = (first & 7) + 1;
      length = _getInt(lengthBytes);

      return _decodeUTF8(length);

    case TYPE_STRUCT:
      result = {};
      lengthBytes = (first & 7) + 1;
      members = _getInt(lengthBytes);

      while (members--) {
        _parseMember(result);
      }

      return result;

    case TYPE_ARRAY:
      result = [];
      lengthBytes = (first & 7) + 1;
      members = _getInt(lengthBytes);

      while (members--) {
        result.push(_parseValue());
      }

      return result;

    case TYPE_BOOL:
      return first & 1 ? true : false;

    case TYPE_INT:
      length = first & 7;
      let max = Math.pow(2, 8 * length);
      result = _getInt(length);

      if (result >= max / 2) {
        result -= max;
      }

      return result;

    case TYPE_DATETIME:
      _getByte();
      let ts = _getInt(4);

      for (let i = 0; i < 5; i++) {
        _getByte();
      }

      return new Date(1000 * ts);

    case TYPE_DOUBLE:
      return _getDouble();

    case TYPE_BINARY:
      lengthBytes = (first & 7) + 1;
      length = _getInt(lengthBytes);
      result = [];

      while (length--) {
        result.push(_getByte());
      }

      return result;

    case TYPE_INT8P:
      length = (first & 7) + 1;

      return _getInt(length);

    case TYPE_INT8N:
      length = (first & 7) + 1;

      return -_getInt(length);

    case TYPE_NULL:
      return null;

    default:
      throw new Error(`Unknown type ${type}`);
  }
}

function _append(arr1: BYTES, arr2: BYTES) {
  let len = arr2.length;

  for (let i = 0; i < len; i++) {
    arr1.push(arr2[i]);
  }
}

function _parseMember(result: Dict) {
  const nameLength = _getInt(1);
  const name = _decodeUTF8(nameLength);

  result[name] = _parseValue();
}

function _serializeValue(result: BYTES, value: any) {
  if (value === null) {
    result.push(TYPE_NULL << 3);

    return;
  }

  switch (typeof value) {
    case 'string':
      let strData = _encodeUTF8(value);
      let intData = _encodeInt(strData.length);

      let first = TYPE_STRING << 3;
      first += intData.length - 1;

      result.push(first);
      _append(result, intData);
      _append(result, strData);
      break;

    case 'number':
      if (_getHint() === 'float') {
        /* float */
        let first = TYPE_DOUBLE << 3;
        let floatData = _encodeDouble(value);

        result.push(first);
        _append(result, floatData);
      } else {
        /* int */
        let first = value >= 0 ? TYPE_INT8P : TYPE_INT8N;
        first = first << 3;

        let data = _encodeInt(Math.abs(value));
        first += data.length - 1;

        result.push(first);
        _append(result, data);
      }
      break;

    case 'boolean':
      let data = TYPE_BOOL << 3;

      if (value) {
        data += 1;
      }
      result.push(data);
      break;

    case 'object':
      if (value instanceof Date) {
        _serializeDate(result, value);
      } else if (value instanceof Array) {
        _serializeArray(result, value);
      } else {
        _serializeStruct(result, value);
      }
      break;

    default: /* undefined, function, ... */
      throw new Error(`FRPC does not allow value ${value}`);
  }
}

function _serializeArray(result: BYTES, data: any[]) {
  if (_getHint() === 'binary') {
    /* binarni data */
    let first = TYPE_BINARY << 3;
    let intData = _encodeInt(data.length);

    first += intData.length - 1;

    result.push(first);
    _append(result, intData);
    _append(result, data);

    return;
  }

  let first = TYPE_ARRAY << 3;
  let intData = _encodeInt(data.length);

  first += intData.length - 1;

  result.push(first);
  _append(result, intData);

  for (let i = 0; i < data.length; i++) {
    _path.push(i.toString());
    _serializeValue(result, data[i]);
    _path.pop();
  }
}

function _serializeStruct(result: BYTES, data: Dict) {
  let numMembers = 0;
  let p;

  for (p in data) {
    numMembers++;
  }

  let first = TYPE_STRUCT << 3;
  let intData = _encodeInt(numMembers);
  first += intData.length - 1;

  result.push(first);
  _append(result, intData);

  for (let p in data) {
    let strData = _encodeUTF8(p);
    result.push(strData.length);
    _append(result, strData);
    _path.push(p);
    _serializeValue(result, data[p]);
    _path.pop();
  }
}

function _serializeDate(result: BYTES, date: Date) {
  result.push(TYPE_DATETIME << 3);

  /* 1 bajt, zona */
  let zone = date.getTimezoneOffset() / 15; /* pocet ctvrthodin */

  if (zone < 0) {
    zone += 256;
  } /* dvojkovy doplnek */
  result.push(zone);

  /* 4 bajty, timestamp */
  let ts = Math.round(date.getTime() / 1000);

  if (ts < 0 || ts >= Math.pow(2, 31)) {
    ts = -1;
  }
  if (ts < 0) {
    ts += Math.pow(2, 32);
  } /* dvojkovy doplnek */

  let tsData = _encodeInt(ts);

  while (tsData.length < 4) {
    tsData.push(0);
  } /* do 4 bajtu */

  _append(result, tsData);

  /* 5 bajtu, zbyle haluze */
  let year = date.getFullYear() - 1600;

  year = Math.max(year, 0);
  year = Math.min(year, 2047);

  let month = date.getMonth() + 1;
  let day = date.getDate();
  let dow = date.getDay();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  result.push(((seconds & 0x1f) << 3) | (dow & 0x07));
  result.push(((minutes & 0x3f) << 1) | ((seconds & 0x20) >> 5) | ((hours & 0x01) << 7));
  result.push(((hours & 0x1e) >> 1) | ((day & 0x0f) << 4));
  result.push(((day & 0x1f) >> 4) | ((month & 0x0f) << 1) | ((year & 0x07) << 5));
  result.push((year & 0x07f8) >> 3);
}

/**
 * Vrati aktualni hint, na zaklade "_path" a "_hints"
 */
function _getHint() {
  if (!_hints) {
    return null;
  }

  if (typeof _hints !== 'object') {
    return _hints;
  } /* skalarni varianta */

  return _hints && _hints[_path.join('.')];
}

export function serialize(data: any, hints?: Hints) {
  let result: number[] = [];

  _path = [];
  _hints = hints;

  _serializeValue(result, data);

  _hints = null;

  return result;
}

/**
 * pokud string, pak typ (skalarni) hodnoty "data". Pokud objekt,
 * pak mnozina dvojic "cesta":"datovy typ"; cesta je teckami dodelena posloupnost
 * klicu a/nebo indexu v datech. Typ je "float" nebo "binary".
 */
export function serializeCall(method: string, data: any, hints?: Hints) {
  let result = serialize(data, hints);

  /* utrhnout hlavicku pole (dva bajty) */
  result.shift();
  result.shift();

  let encodedMethod = _encodeUTF8(method);

  result.unshift.apply(result, encodedMethod);
  result.unshift(encodedMethod.length);

  result.unshift(TYPE_CALL << 3);
  result.unshift(0xca, 0x11, 0x02, 0x01);

  return result;
}

export function parse(data: Uint8Array) {
  surrogateFlag = false;
  _pointer = 0;
  _data = data;

  const magic1 = _getByte();
  const magic2 = _getByte();

  if (magic1 !== 0xca || magic2 !== 0x11) {
    _data = new Uint8Array();
    throw new Error(`Missing FRPC magic`);
  }

  /* zahodit zbytek hlavicky */
  _getByte();
  _getByte();

  let first = _getInt(1);
  let type = first >> 3;

  if (type === TYPE_FAULT) {
    const num = _parseValue();
    const msg = _parseValue();

    _data = new Uint8Array();
    throw new Error(`FRPC/${num}: ${msg}`);
  }

  let result;

  switch (type) {
    case TYPE_RESPONSE:
      result = _parseValue();
      if (_pointer < _data.length) {
        _data = new Uint8Array();
        throw new Error(`Garbage after FRPC data`);
      }
      break;

    case TYPE_CALL:
      const nameLength = _getInt(1);
      let name = _decodeUTF8(nameLength);
      let params: any[] = [];

      while (_pointer < _data.length) {
        params.push(_parseValue());
      }

      _data = new Uint8Array();

      return { method: name, params: params };

    default:
      _data = new Uint8Array();
      throw new Error(`Unsupported TYPE ${type}`);
  }

  _data = new Uint8Array();

  return result;
}
