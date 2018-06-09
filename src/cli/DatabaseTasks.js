// @flow
import _ from 'lodash';
import path from 'path';
import Base from '../Base';
import Migrator from '../Migrator';

export default class DatabaseTasks {
  static loadConfig() {
    const env = process.env.NODE_ENV || 'development';
    this.config = require(path.join(process.cwd(), './db/config'))[env];
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
      await connection.createDatabase(this.config.database, this.config);
    } catch (e) {
      console.log(`Database ${this.config.database} already exists`);
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

    // todo: env VERSION
    await Migrator.migrate([path.join(process.cwd(), './db/migrate')]);
    await Base.connection.disconnect();
  }

  static async migrateReset() {
    await this.drop();
    await this.create();
    await this.migrate();
  }
}
