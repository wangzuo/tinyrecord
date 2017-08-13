import _ from 'lodash';
import path from 'path';
import Base from '../Base';
import Migrator from '../Migrator';

export default class DatabaseTasks {
  static loadConfig() {
    this.config = require(path.join(process.cwd(), './db/config')).development;
  }

  static connect() {
    if (!this._connection) {
      this.loadConfig();
      this._connection = Base.establishConnection(this.config);
    }
    return this._connection;
  }

  static async create() {
    this.loadConfig();

    const connection = Base.establishConnection(
      _.omit(this.config, ['database'])
    );

    try {
      await connection.createDatabase(this.config.database);
    } catch (e) {
      console.log('Database exists');
    }

    await connection.disconnect();
  }

  static async drop() {
    this.loadConfig();

    const connection = Base.establishConnection(
      _.omit(this.config, ['database'])
    );
    await connection.dropDatabase(this.config.database);
    await connection.disconnect();
  }

  static async migrate() {
    this.connect();

    await Migrator.migrate([path.join(process.cwd(), './db/migrate')]);
    await Base.connection.disconnect();
  }

  static async migrateReset() {
    await this.drop();
    await this.create();
    await this.migrate();
  }
}