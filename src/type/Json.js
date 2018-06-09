// @flow
import _ from 'lodash';
import Value from './Value';

export default class Json extends Value {
  get type() {
    return 'json';
  }

  deserialize(value) {
    if (!_.isString(value)) {
      return value;
    }

    // todo: error
    return JSON.parse(value);
  }

  serialize(value) {
    if (value) {
      return JSON.stringify(value);
    }
  }

  changedInPlace(rawOldValue, newValue) {
    return this.deserialize(rawOldValue) !== newValue;
  }
}
