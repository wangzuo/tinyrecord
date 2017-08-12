import _ from 'lodash';

export default class Migrator {
  static async migrate(migrationPaths, targetVersion = null, block) {}
  static async rollback(migrationPaths, steps = 1) {}
  static async forward(migrationPaths, steps = 1) {}
  static async up(migrationPaths, targetVersion = null) {}
  static async down(migrationPaths, targetVersion = null) {}
}
