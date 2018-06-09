// @flow
import Base from './Base';

export default class SchemaMigration extends Base {
  static primaryKey = 'version'; // TOOD
  static tableName = 'schema_migrations';

  static tableExists() {
    return this.connection.tableExists(this.tableName);
  }

  static async createTable() {
    const exists = await this.tableExists();
    if (!exists) {
      await this.connection.createTable(this.tableName, { id: false }, t => {
        // TOOD: versionOptions
        t.string('version');
      });
    }
  }

  static dropTable() {
    return this.connection.dropTable(this.tableName, { ifExists: true });
  }

  static async allVersions() {
    const records = await this.order('version').records();
    // todo: pluck?
    return records.map(record => record.version);
  }
}
