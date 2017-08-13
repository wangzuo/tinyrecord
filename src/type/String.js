import isString from 'lodash/isString';
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
    if (isString(value)) return value;
    else if (value === true) return 't';
    else if (value === false) return 'f';
    return value.toString();
  }
}
