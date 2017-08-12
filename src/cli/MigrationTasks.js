import fs from 'fs';
import moment from 'moment';

export default class MigrationTasks {
  static create(filename, attributes) {
    const ts = moment().format('YYYYMMDDHHmmss');
    console.log('migration:create', ts, filename, attributes);
  }
}
