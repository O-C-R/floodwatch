// @flow

export class BaseError {
  name: string;
  message: string;
  stack: ?string;

  constructor(message: string = 'Error') {
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export function calculatePercentDiff(a: number, b: number): number {
  const abs = a - b;
  const denom = Math.abs(b);
  const prc = abs / denom;
  const decimal = prc * 100;
  return decimal;
}

export function uppercaseFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function lowercaseFirstLetter(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function joinArrEnglish(arr: Array<string>, join: string): string {
  let joinedValues = '';

  if (arr.length === 1) {
    joinedValues = arr[0];
  } else if (arr.length === 2) {
    joinedValues = `${arr[0]} ${join} ${arr[1]}`;
  } else if (arr.length > 2) {
    const joinedFirst = arr.slice(0, arr.length - 1).join(', ');
    joinedValues = `${joinedFirst}, ${join} ${arr[arr.length - 1]}`;
  }

  return joinedValues;
}
