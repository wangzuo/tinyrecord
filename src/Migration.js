export default class Migration {
  constructor(name, version = null) {
    this.name = name;
    this.version = version;
    this.connection = null;
  }

  revert() {}

  up() {}

  down() {}

  migrate(direction) {}

  execMigration(conn, direction) {}
}
