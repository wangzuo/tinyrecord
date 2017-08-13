import SchemaCreation from '../SchemaCreation';
import Sqlite3Adapter from '../../Sqlite3Adapter';
import Mysql2Adapter from '../../Mysql2Adapter';

describe('Sqlite3Adapter', () => {
  const conn = new Sqlite3Adapter();

  it('createTable', () => {
    const td = conn.createTableDefinition('users');

    td.primaryKey('id');
    td.string('name', 'email');
    td.integer('age');
    td.text('bio');
    td.boolean('active');
    td.timestamps();

    expect(conn.schemaCreation.accept(td)).toBe(
      `CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar, "email" varchar, "age" integer, "bio" text, "active" boolean, "createdAt" datetime NOT NULL, "updatedAt" datetime NOT NULL)`
    );
  });
});

describe('Mysql2Adapter', () => {
  const conn = new Mysql2Adapter();

  it('createTable', () => {
    const td = conn.createTableDefinition('users', false, 'ENGINE=InnoDB');

    td.primaryKey('id');
    td.string('name', 'email');
    // td.integer('age');
    // td.text('bio')
    td.timestamps();

    expect(conn.schemaCreation.accept(td)).toBe(
      'CREATE TABLE `users` (`id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, `name` varchar(255), `email` varchar(255), `createdAt` datetime NOT NULL, `updatedAt` datetime NOT NULL) ENGINE=InnoDB'
    );
  });
});
