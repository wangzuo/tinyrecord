import Sqlite3Adapter from '../../Sqlite3Adapter';
import Mysql2Adapter from '../../Mysql2Adapter';

function createTable(td) {
  td.primaryKey('id');
  td.string('name', { default: 'Untitled' });
  td.string('email');
  td.integer('age', { default: 0 });
  td.text('bio');
  td.boolean('active', { default: true });
  td.date('birthday');
  td.datetime('last_active_at');
  td.timestamps();
}

describe('Sqlite3Adapter', () => {
  const conn = new Sqlite3Adapter();

  it('createTable', () => {
    const td = conn.createTableDefinition('users');
    createTable(td);

    expect(conn.schemaCreation.accept(td)).toBe(
      `CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar DEFAULT 'Untitled', "email" varchar, "age" integer DEFAULT 0, "bio" text, "active" boolean DEFAULT 't', "birthday" date, "last_active_at" datetime, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL)`
    );
  });
});

describe('Mysql2Adapter', () => {
  const conn = new Mysql2Adapter();

  it('createTable', () => {
    const td = conn.createTableDefinition('users', false, 'ENGINE=InnoDB');
    createTable(td);

    td.json('payload');

    expect(conn.schemaCreation.accept(td)).toBe(
      "CREATE TABLE `users` (`id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY, `name` varchar(255) DEFAULT 'Untitled', `email` varchar(255), `age` int DEFAULT 0, `bio` text, `active` tinyint(1) DEFAULT 1, `birthday` date, `last_active_at` datetime, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `payload` json) ENGINE=InnoDB"
    );
  });
});
