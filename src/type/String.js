import _ from 'lodash';
import Value from './Value';

export default class String extends Value {
  changedInPlace(rawOldValue, newValue) {
    if (isString(newValue)) {
      return rawOldValue !== newValue;
    }

    return false;
  }

  // private

  castValue(value) {
    if (_.isString(value)) return value;
    else if (value === true) return 't';
    else if (value === false) return 'f';
    return _.toString(value); // todo: test null
  }
}
