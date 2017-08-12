import fs from 'fs';
import moment from 'moment';

export const create = (filename, attributes) => {
  const ts = moment().format('YYYYMMDDHHmmss');
  console.log('migration:create', ts, filename, attributes);
};
