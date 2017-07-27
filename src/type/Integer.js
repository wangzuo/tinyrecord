import _ from 'lodash';
import Value from './Value';

export default class Integer extends Value {
  constructor(...args) {
    super(...args);
  }

  get type() {
    return 'integer';
  }

  deserialize(value) {
    if (_.isNull(value)) return;
    return parseInt(value, 10);
  }

  serialize(value) {}

  // private

  castValue(value) {
    if (value === true) return 1;
    else if (value === false) return 0;
    return value;
  }

  ensureInRange(value) {}

  get maxValue() {}

  get minValue() {}

  get _limit() {}
}
