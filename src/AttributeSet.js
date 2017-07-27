import _ from 'lodash';
import Attribute from './Attribute';

export default class AttributeSet {
  constructor(attributes) {
    this.attributes = attributes;

    // alias
    this.toH = this.toHash;
  }

  // todo
  get(name) {
    return (
      this.attributes[name] || this.attributes.get(name) || Attribute.null(name)
    );
  }

  set(name, value) {
    if (_.isFunction(this.attributes.set)) {
      this.attributes.set(name, value);
    } else {
      this.attributes[name] = value;
    }
  }

  valuesBeforeTypeCast() {
    // return this.attributes.
  }

  toHash() {}

  key(name) {}

  keys() {}

  fetchValue(name) {}

  writeFromDatabase(name, value) {}

  writeFromUser(name, value) {}

  writeCastValue(name, value) {}

  reset(key) {}

  accessed() {}

  map() {}

  eql() {}

  initializedAttributes() {}
}

export class Builder {
  constructor(types, alwaysInitialized = null, _default) {
    this.types = types;
    this.alwaysInitialized = alwaysInitialized;
    this.default = _default;
  }

  buildFromDatabase(values = {}, additionalTypes = {}) {
    if (this.alwaysInitialized && !values[this.alwaysInitialized]) {
      values[this.alwaysInitialized] = null;
    }

    const attributes = new LazyAttributeHash(
      this.types,
      values,
      additionalTypes,
      this.default
    );
    return new AttributeSet(attributes);
  }
}

class LazyAttributeHash {
  constructor(types, values, additionalTypes, _default) {
    this.types = types;
    this.values = values;
    this.additionalTypes = additionalTypes;
    this.materialized = false;
    this.delegateHash = {};
    this.default = _default || (() => {});
  }

  key(key): boolean {}

  get(key) {
    return this.delegateHash[key] || this.assignDefaultValue(key);
  }

  set(key, value) {
    this.delegateHash[key] = value;
  }

  select() {}

  // private

  assignDefaultValue(name) {
    const type = this.additionalTypes[name] || this.types[name];

    if (this.values[name]) {
      const value = this.values[name];
      this.delegateHash[name] = Attribute.fromDatabase(name, value, type);
    } else if (this.types[name]) {
      this.delegateHash[name] =
        this.default(name) || Attribute.uninitialized(name, type);
    }

    return this.delegateHash[name];
  }
}
