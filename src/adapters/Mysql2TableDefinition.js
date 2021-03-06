// @flow
import _ from 'lodash';
import TableDefinition from './schema/TableDefinition';

export default class Mysql2TableDefinition extends TableDefinition {
  primaryKey(name: string, type: string = 'primaryKey', options = {}) {
    if (_.includes(['integer', 'bigint'], type) && !options.default) {
      options.autoIncrement = true;
    }

    super.primaryKey(name, type, options);
  }

  // TODO
  blog() {}
  tinyblob() {}
  mediumblob() {}
  longblob() {}
  tinytext() {}
  mediumtext() {}
  longtext() {}

  json(name: string, options) {
    return this.column(name, 'json', options);
  }

  unsignedInteger() {}
  unsignedBigint() {}
  unsignedFloat() {}
  unsignedDecimal() {}

  newColumnDefinition(name: string, type, options = {}) {
    if (type === 'virtual') {
      type = options.type;
    } else if (type === 'primaryKey') {
      type = 'integer';
      options.limit = options.limit || 8;
      options.autoIncrement = true;
      options.primaryKey = true;
    } else {
      // TODO /\Aunsigned_(?<type>.+)\z/
    }

    return super.newColumnDefinition(name, type, options);
  }
}
