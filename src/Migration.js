import Base from './Base';
import SchemaMigration from './SchemaMigration';

export default class Migration {
  constructor(name, version = null) {
    this.name = name || this.constructor.name;
    this.version = version;
    this.connection = Base.connection;
  }

  revert() {}

  up() {}

  down() {}

  async migrate(direction) {
    // if (direction === 'up') console.log('migrating');
    // else if (direction === 'down') console.log('reverting');

    await this.execMigration(this.connection, direction);
  }

  async execMigration(conn, direction) {
    if (this.change) {
      if (direction === 'up') {
        await this.change();
        // TODO: record
        await SchemaMigration.create({ version: this.version });
      } else if (direction === 'down') {
        await this.revert(this.change);
      }
    } else if (direction === 'up') {
      await this.up();
    } else if (direction === 'down') {
      await this.down();
    }
  }

  log(message) {}

  createTable(...args) {
    return this.connection.createTable(...args);
  }

  addColumn(...args) {
    return this.connection.addColumn(...args);
  }

  removeColumn(...args) {
    return this.connection.removeColumn(...args);
  }
}
