import _ from 'lodash';
import moment from 'moment';
import Value from './Value';

export default class Date extends Value {
  get type() {
    return 'date';
  }

  serialize(value) {
    return this.cast(value);
  }

  // private

  castValue(value) {
    if (!value) return null;

    if (_.isDate(value)) {
      return value;
    }

    return moment(value).toDate();
  }
}
