import _ from 'lodash';
import path from 'path';
import glob from 'glob-async';
import Base from './Base';
import SchemaMigration from './SchemaMigration';

class MigrationProxy {
  constructor(name, version, filepath, scope) {
    this.name = name;
    this.version = version;
    this.filepath = filepath;
    this.scope = scope;
  }

  get migration() {
    if (!this._migration) {
      const klass = require(this.filepath).default; // TODO
      this._migration = new klass(this.name, this.version);
    }

    return this._migration;
  }

  async migrate(...args) {
    return await this.migration.migrate(...args);
  }
}

export default class Migrator {
  static async migrate(migrationPaths, targetVersion = null, block) {
    const currentVersion = await this.currentVersion();

    if (_.isNull(targetVersion)) {
      return await this.up(migrationPaths, targetVersion, block);
    } else if (currentVersion === 0 && targetVersion === 0) {
      return [];
    } else if (currentVersion > targetVersion) {
      return await this.down(migrationPaths, targetVersion, block);
    } else {
      return await this.up(migrationPaths, targetVersion, block);
    }
  }

  static async rollback(migrationPaths, steps = 1) {}
  static async forward(migrationPaths, steps = 1) {}

  static async up(migrationPaths, targetVersion = null, block) {
    await SchemaMigration.createTable();

    const migrations = await this.loadMigrations(migrationPaths);
    const migrated = await this.getAllVersions();
    const runnable = _.reject(migrations, x =>
      _.includes(migrated, _.toNumber(x.version))
    );

    for (const migration of runnable) {
      if (Base.logger) {
        Base.logger.info(
          `Migrating to ${migration.name} (${migration.version})`
        );
      }
      await migration.migrate('up');
    }
  }

  static async down(migrationPaths, targetVersion = null, block) {
    const migrations = await this.loadMigrations(migrationPaths);
    const migrator = await this.new('down', migrations, targetVersion);
    return await migrator.migrate();
  }

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

      return new MigrationProxy(name, version, filepath);
    });

    return migrations;
  }
}
