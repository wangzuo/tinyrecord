import _ from 'lodash';
import moment from 'moment';
import Value from './Value';

export default class DateTime extends Value {
  get type() {
    return 'datetime';
  }

  // private

  castValue(value) {
    if (_.isDate(value)) {
      return value;
    }

    return moment(value).toDate();
  }
}
