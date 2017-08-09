import _ from 'lodash';
import ColumnMethods from './ColumnMethods';
import ColumnDefinition from './ColumnDefinition';

export default class TableDefinition {
  constructor(name, temporary = false, options = null, as = null, extra = {}) {
    const comment = extra.comment || null;

    this.columnsHash = {};
    this.indexes = [];
    this.foreignKeys = [];
    this._primaryKeys = null;
    this.temporary = temporary;
    this.options = options;
    this.as = as;
    this.name = name;
    this.comment = comment;

    // alias
    this.belongsTo = this.references;

    ColumnMethods(this);
  }

  primaryKeys(name = null) {
    if (name) {
      this._primaryKeys = new PrimaryKeyDefinition(name);
    }
    return this._primaryKeys;
  }

  get columns() {
    return _.values(this.columnsHash);
  }

  column(name, type, options = {}) {
    if (this.columnsHash[name] && this.columnsHash[name].primaryKey()) {
      throw new Error(
        `you can't redefine the primary key column '${name}'. To define a custom primary key, pass { id: false } to create_table.`
      );
    }

    this.columnsHash[name] = this.newColumnDefinition(name, type, options);
    return this;
  }

  removeColumn(name) {}

  index(columnName, options = {}) {}

  foreignKey(tableName, options = {}) {}

  timestamps(options = {}) {
    if (_.isUndefined(options.null)) {
      options.null = false;
    }

    this.column('createdAt', 'datetime', options);
    this.column('updatedAt', 'datetime', options);
    return this;
  }

  references(...args) {}

  newColumnDefinition(name, type, options) {
    type = this.aliasedTypes(type, type);
    options.primaryKey = options.primaryKey || type === 'primaryKey';
    if (options.primaryKey) options.null = false;
    return this.createColumnDefinition(name, type, options);
  }

  // private

  createColumnDefinition(name, type, options) {
    return new ColumnDefinition(name, type, options);
  }

  aliasedTypes(name, fallback) {
    return name === 'timestamp' ? 'datetime' : fallback;
  }
}
