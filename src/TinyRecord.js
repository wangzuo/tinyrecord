import * as Arel from 'arel';
import Base from './Base';
import Migration from './Migration';

const TinyRecord = {
  Base,
  Migration
};

// todo
// Arel.Table.engine = TinyRecord;

module.exports = TinyRecord;
