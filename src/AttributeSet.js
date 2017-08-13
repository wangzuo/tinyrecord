import _ from 'lodash';
import Attribute from './Attribute';

export default class AttributeSet {
  constructor(attributes) {
    this.attributes = attributes;
  }

  // todo
  get(name) {
    return (
      this.attributes[name] ||
      (this.attributes.get && this.attributes.get(name)) ||
      Attribute.null(name)
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

  toJSON() {
    return _.mapValues(this.initializedAttributes, attr => {
      return attr.value;
    });
  }

  key(name) {}

  keys() {}

  fetchValue(name) {
    return this.get(name).value;
  }

  writeFromDatabase(name, value) {}

  writeFromUser(name, value) {
    this.set(name, this.get(name).withValueFromUser(value));
  }

  writeCastValue(name, value) {}

  reset(key) {}

  accessed() {}

  map() {}

  eql() {}

  get initializedAttributes() {
    return _.pickBy(this.attributes, attr => attr.initialized);
  }
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

  key(key) {}

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
