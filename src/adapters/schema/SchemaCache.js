import _ from 'lodash';

export default class SchemaCache {
  constructor(conn) {
    this.connection = conn;
    this._columns = {};
    this._columnsHash = {};
    this.primaryKeys = {};
    this._dataSources = {};
  }

  encodeWith(coder) {}

  initWith(coder) {}

  primaryKeys(tableName) {
    this.primaryKeys[tableName] = null;
  }

  async dataSourceExists(name) {
    if (_.isEmpty(this._dataSources)) {
      await this.prepareDataSources();
    }

    if (this._dataSources[name]) {
      return this._dataSources[name];
    }

    return false;

    // todo
    // this._dataSources[name] = await this.connection.dataSourceExists(name);
    // return this._dataSources[name];
  }

  async add(tableName) {
    if (await this.dataSourceExists(tableName)) {
      this.primaryKeys(tableName);
      this.columns(tableName);
      this.columnsHash(tableName);
    }
  }

  dataSources(name) {
    return this._dataSources[name];
  }

  async columns(tableName) {
    return this.connection.columns(tableName);
  }

  async columnsHash(tableName) {
    if (this._columnsHash[tableName]) return this._columnsHash[tableName];

    const columns = await this.columns(tableName);

    this._columnsHash[tableName] = _.zipObject(
      columns.map(col => col.name),
      columns
    );

    return this._columnsHash[tableName];
  }

  clear() {}

  // private

  async prepareDataSources() {
    const dataSources = await this.connection.dataSources();

    dataSources.forEach(source => {
      this._dataSources[source] = true;
    });
  }
}
