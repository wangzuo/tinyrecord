import _ from 'lodash';
import path from 'path';
import glob from 'glob-async';
import SchemaMigration from './SchemaMigration';

class MigrationProxy {
  constructor(name, version, filename, scope) {
    this.name = name;
    this.version = version;
    this.filename = filename;
    this.scope = scope;
  }

  get migration() {
    if (!this._migration) {
      const klass = require(filepath);
      this._migration = new klass(this.name, this.version);
    }

    return this._migration;
  }
}

export default class Migrator {
  static async migrate(migrationPaths, targetVersion = null, block) {
    const migrations = await this.loadMigrations(migrationPaths);
    console.log(migrations);
  }

  static async rollback(migrationPaths, steps = 1) {}
  static async forward(migrationPaths, steps = 1) {}
  static async up(migrationPaths, targetVersion = null) {}
  static async down(migrationPaths, targetVersion = null) {}

  static async getAllVersions() {
    const exists = await SchemaMigration.tableExists();
    if (!exists) return [];

    const versions = await SchemaMigration.allVersions();
    return versions.map(x => parseInt(x, 10));
  }

  static async currentVersion() {
    const versions = await this.getAllVersions();
    return _.max(versions) || 0;
  }

  static async loadMigrations(paths) {
    let files = [];
    for (const path of paths) {
      // TODO
      // const files = await glob(`${path}/**/[0-9]*_*.js`);
      files = [...files, ...(await glob(`${path}/**/*.js`))];
    }

    const migrations = files.map(filepath => {
      const filename = path.basename(filepath);
      const m = filename.match(/^([0-9]+)-([a-zA-Z]+)/);
      const version = m[1];
      const name = m[2];
      // TODO: scope

      return new MigrationProxy(name, version, filename);
    });

    return migrations;
  }

  static async new(direction, migrations, targetVersion = null) {
    await SchemaMigration.createTable();

    return new this(direction, migrations, targetVersion);
  }

  constructor(direction, migrations, targetVersion) {
    this.direction = direction;
    this.migrations = migrations;
    this.targetVersion = targetVersion;
  }
}
