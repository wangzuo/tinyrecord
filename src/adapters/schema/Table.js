export default class Table {
  constructor(tableName, base) {
    this.name = tableName;
    this.base = base;
  }

  column(columnName, type, options = {}) {
    this.base.addColumn(this.name, columnName, type, options);
  }

  columnExists(columnName, type = null, options = {}) {
    this.base.columnExists(this.name, columnName, type, options);
  }

  index(columnName, options = {}) {
    this.base.addIndex(this.name, columnName, options);
  }

  indexExists(columnName, options = {}) {
    this.base.indexExists(this.name, columnName, options);
  }
  renameIndex(indexName, newIndexName) {
    this.base.renameIndex(this.name, indexName, newIndexName);
  }

  timestamps(options = {}) {
    this.base.addTimestamps(this.name, options);
  }

  change(columnName, type, options = {}) {
    this.base.changeColumn(this.name, columnName, type, options);
  }

  changeDefault(columnName, defaultOrChanges) {
    this.base.changeColumnDefault(this.name, columnName, defaultOrChanges);
  }

  remove(...columnNames) {
    this.base.removeColumns(this.name, ...columnNames);
  }

  removeIndex(options = {}) {
    this.base.removeIndex(this.name, options);
  }

  removeTimestamps(options = {}) {
    this.base.removeTimestamps(this.name, options);
  }

  rename(columnName, newColumnName) {
    this.base.renameColumn(this.name, columnName, newColumnName);
  }

  references(args, options) {}
  belongsTo(...args) {
    return this.references(...args);
  }

  removeReferences() {}
  removeBelongsTo(...args) {
    return this.removeBelongsTo(...args);
  }

  foreignKeyExists(...args) {
    this.base.foreignKeyExists(this.name, ...args);
  }
}
