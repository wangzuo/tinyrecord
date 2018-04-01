import _ from 'lodash';

export default class Value {
  constructor(options = {}) {
    this.precision = options.precision || null;
    this.scale = options.scale || null;
    this.limit = options.limit || null;
  }

  get type() {}

  deserialize(value) {
    return this.cast(value);
  }

  cast(value) {
    if (!_.isNull(value)) return this.castValue(value);
  }

  serialize(value) {
    return value;
  }

  typeCastForSchema(value) {}

  binary() {
    return false;
  }

  changed(oldValue, newValue, _newValueBeforeTypeCast) {
    return oldValue !== newValue;
  }

  changedInPlace(rawOldValue, newValue) {
    return false;
  }

  eql(other) {
    return (
      this.constructor === other.constructor &&
      this.precision === other.precision &&
      this.scale === other.scale &&
      this.limit === other.limit
    );
  }

  get hash() {}

  assertValidValue() {}

  // private

  castValue(value) {
    return value;
  }
}
