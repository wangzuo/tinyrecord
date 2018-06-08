import Type from '../Type';

export default class TypeMap {
  constructor() {
    this.mapping = new Map();
    this.cache = new Map();
  }

  lookup(lookupKey, ...args) {
    if (this.cache.get(lookupKey)) return this.cache.get(lookupKey);

    let result = null;

    this.mapping.forEach((v, k) => {
      if (k.test(lookupKey)) {
        result = v;
      }
    });

    let value = result ? result(lookupKey, ...args) : Type.defaultValue;

    this.cache.set(lookupKey, value);
    return value;
  }

  fetch(lookupKey, ...args) {}

  registerType(key, value = null, block) {
    if (!value && !block) throw new Error('Argument Error');
    this.cache.clear();

    if (block) {
      this.mapping.set(key, block);
    } else {
      this.mapping.set(key, () => value);
    }
  }

  aliasType(key, targetKey) {
    this.registerType(key, null, (sqlType, ...args) => {
      // const metadata = sqlType || '';
      // return this.lookup(`${targetKey}${metadata}`, ...args);
      return this.lookup(targetKey, ...args);
    });
  }

  clear() {
    this.mapping.clear();
  }

  performFetch(lookupKey, ...args) {}
}
