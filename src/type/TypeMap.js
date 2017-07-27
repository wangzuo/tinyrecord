// @flow

import Type from '../Type';

export default class TypeMap {
  constructor() {
    this.mapping = new Map();
    this.cache = {}; // todo
  }

  lookup(lookupKey: string, ...args) {
    let result = null;

    this.mapping.forEach((v, k) => {
      if (k.test(lookupKey)) {
        result = v;
      }
    });

    if (!result) return () => Type.defaultValue;

    return result;
  }

  fetch(lookupKey, ...args) {}

  registerType(key, value = null, fn) {
    if (fn) {
      this.mapping.set(key, fn);
    } else {
      this.mapping.set(key, () => value);
    }
  }

  aliasType(key, targetKey) {
    this.registerType(key, null, (sqlType, ...args) => {
      const metadata = sqlType || '';
      return this.lookup(`${targetKey}${metadata}`, ...args)();
    });
  }

  clear() {
    this.mapping.clear();
  }

  performFetch(lookupKey, ...args) {}
}
