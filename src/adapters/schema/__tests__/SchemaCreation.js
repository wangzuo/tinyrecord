import SchemaCreation from '../SchemaCreation';
import TableDefinition from '../TableDefinition';
import Sqlite3Adapter from '../../Sqlite3Adapter';

test('createTable', () => {
  const td = new TableDefinition('users');
  const conn = new Sqlite3Adapter();

  td.primaryKey('id');
  td.string('name', 'email');
  td.timestamps();

  expect(conn.schemaCreation.accept(td)).toBe(
    `CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar, "email" varchar, "createdAt" datetime NOT NULL, "updatedAt" datetime NOT NULL)`
  );
});
