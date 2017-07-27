import includes from 'lodash/includes';
import Value from './Value';

const FALSE_VALUES = [false, 0, '0', 'f', 'F', 'false', 'FALSE', 'off', 'OFF'];

export default class Boolean extends Value {
  get type() {
    return 'boolean';
  }

  // private

  castValue(value) {
    if (value === '') {
      return null;
    }

    return !includes(FALSE_VALUES, value);
  }
}
