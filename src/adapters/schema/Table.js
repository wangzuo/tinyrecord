// @flow
export default class Table {
  name: string;

  constructor(tableName: string, base) {
    this.name = tableName;
    this.base = base;
  }

  column(columnName: string, type, options = {}) {
    this.base.addColumn(this.name, columnName, type, options);
  }

  columnExists(columnName: string, type = null, options = {}) {
    this.base.columnExists(this.name, columnName, type, options);
  }

  index(columnName: string, options = {}) {
    this.base.addIndex(this.name, columnName, options);
  }

  indexExists(columnName: string, options = {}) {
    this.base.indexExists(this.name, columnName, options);
  }
  renameIndex(indexName: string, newIndexName) {
    this.base.renameIndex(this.name, indexName, newIndexName);
  }

  timestamps(options = {}) {
    this.base.addTimestamps(this.name, options);
  }

  change(columnName: string, type, options = {}) {
    this.base.changeColumn(this.name, columnName, type, options);
  }

  changeDefault(columnName: string, defaultOrChanges) {
    this.base.changeColumnDefault(this.name, columnName, defaultOrChanges);
  }

  remove(...columnNames: Array<string>) {
    this.base.removeColumns(this.name, ...columnNames);
  }

  removeIndex(options = {}) {
    this.base.removeIndex(this.name, options);
  }

  removeTimestamps(options = {}) {
    this.base.removeTimestamps(this.name, options);
  }

  rename(columnName: string, newColumnName) {
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
