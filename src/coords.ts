const _alphabet = '0ABCD2EFGH4IJKLMN6OPQRST8UVWXYZ-1abcd3efgh5ijklmn7opqrst9uvwxyz.';

export class Coord {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
  static fromWGS84(lonD: any, latD: any) {
    if (arguments.length == 1) {
      var pair = this._splitWGS84(arguments[0]);
      lonD = pair[0];
      latD = pair[1];
    }
    if (typeof lonD == 'string') {
      lonD = this._fromWGS84str(lonD);
    }
    if (typeof latD == 'string') {
      latD = this._fromWGS84str(latD);
    }
    return new this(lonD, latD);
  }
  static _splitWGS84(str: string) {
    var parts = str.match(/[nsew]|[^nsew]+/gi);
    if (!parts || parts.length != 4) {
      throw new Error('Not a valid WGS84 string.');
    }
    var two = [parts.slice(0, 2).join(''), parts.slice(2).join('')];
    if (two[0].match(/[ns]/i)) {
      two.reverse();
    }
    return two;
  }
  static _fromWGS84str(str: string) {
    var result = 0;
    var wgs_re = /-?\d+([.,]\d*)?/g;
    var lo_re = /[ws] *$/gi;
    var parts = str.match(wgs_re);
    if (!parts) {
      return result;
    }
    var exp = 1;
    for (var i = 0; i < parts.length; i++) {
      var num = parts[i].replace(/,/g, '.');
      result += parseFloat(num) / exp;
      exp *= 60;
    }
    if (str.match(lo_re)) {
      result *= -1;
    }
    return result;
  }
  static stringToCoords(str: string) {
    var FIVE_CHARS = (1 + 2) << 4;
    var THREE_CHARS = 1 << 5;
    var results = [];
    var coords = [0, 0];
    var coordIndex = 0;
    var arr = str.trim().split('').reverse();
    while (arr.length) {
      var num = this._parseNumber(arr, 1);
      if ((num & FIVE_CHARS) == FIVE_CHARS) {
        num -= FIVE_CHARS;
        num = ((num & 15) << 24) + this._parseNumber(arr, 4);
        coords[coordIndex] = num;
      } else if ((num & THREE_CHARS) == THREE_CHARS) {
        num = ((num & 15) << 12) + this._parseNumber(arr, 2);
        num -= 1 << 15;
        coords[coordIndex] += num;
      } else {
        num = ((num & 31) << 6) + this._parseNumber(arr, 1);
        num -= 1 << 10;
        coords[coordIndex] += num;
      }
      if (coordIndex) {
        var x = (coords[0] * 360) / (1 << 28) - 180;
        var y = (coords[1] * 180) / (1 << 28) - 90;
        results.push(this.fromWGS84(x, y));
      }
      coordIndex = (coordIndex + 1) % 2;
    }
    return results;
  }
  static _parseNumber(arr: any[], count: number) {
    var result = 0;
    var i = count;
    while (i) {
      if (!arr.length) {
        throw new Error('No data!');
      }
      var ch = arr.pop();
      var index = _alphabet.indexOf(ch);
      if (index == -1) {
        continue;
      }
      result <<= 6;
      result += index;
      i--;
    }
    return result;
  }
  static coordsToString(arr: Coord[]) {
    var ox = 0;
    var oy = 0;
    var result = '';
    for (var i = 0; i < arr.length; i++) {
      var coords = arr[i].toWGS84();
      var x = Math.round(((coords[0] + 180) * (1 << 28)) / 360);
      var y = Math.round(((coords[1] + 90) * (1 << 28)) / 180);
      var dx = x - ox;
      var dy = y - oy;
      result += this._serializeNumber(dx, x);
      result += this._serializeNumber(dy, y);
      ox = x;
      oy = y;
    }
    return result;
  }
  static _serializeNumber(delta: number, orig: number) {
    var code = '';
    if (delta >= -1024 && delta < 1024) {
      code += _alphabet.charAt((delta + 1024) >> 6);
      code += _alphabet.charAt((delta + 1024) & 63);
    } else if (delta >= -32768 && delta < 32768) {
      var value = 131072 | (delta + 32768);
      code += _alphabet.charAt((value >> 12) & 63);
      code += _alphabet.charAt((value >> 6) & 63);
      code += _alphabet.charAt(value & 63);
    } else {
      var value = 805306368 | (orig & 268435455);
      code += _alphabet.charAt((value >> 24) & 63);
      code += _alphabet.charAt((value >> 18) & 63);
      code += _alphabet.charAt((value >> 12) & 63);
      code += _alphabet.charAt((value >> 6) & 63);
      code += _alphabet.charAt(value & 63);
    }
    return code;
  }
  equals(coords: Coord) {
    return this.x == coords.x && this.y == coords.y;
  }
  toString() {
    return '(' + this.x + ',' + this.y + ')';
  }
  toWGS84() {
    return [this.x, this.y];
  }
  formatWGS84(format: number) {
    var input = this.toWGS84();
    var output = [];
    var precision = 1e3;
    var chars = ['°', "'", '"'];
    var suffixes = [
      ['E', 'W'],
      ['N', 'S']
    ];
    var max = Math.min(format, 2);
    for (var i = 0; i < input.length; i++) {
      var divisor = 3600 * precision;
      var value = Math.round(divisor * Math.abs(input[i]));
      var str = '';
      for (var j = 0; j <= max; j++) {
        var part = value / divisor;
        if (j < max) {
          str += Math.floor(part);
          value = value % divisor;
        } else {
          str += part.toFixed(7 - 2 * max);
        }
        divisor /= 60;
        str += chars[j];
      }
      str += input[i] > 0 ? suffixes[i][0] : suffixes[i][1];
      output.push(str);
    }
    return output;
  }
  isValid() {
    var wgs = this.toWGS84();
    return Math.abs(wgs[1]) <= 85;
  }
}
