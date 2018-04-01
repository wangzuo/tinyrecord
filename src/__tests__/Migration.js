import Base from '../Base';
import Migration from '../Migration';
import SchemaMigration from '../SchemaMigration';

class CreatePosts extends Migration {
  async change() {
    await this.createTable('posts', {}, t => {
      t.string('title');
      t.timestamps();
    });
  }
}

class Post extends Base {
  static tableName = 'posts';
}

beforeAll(async () => {
  Base.establishConnection({
    adapter: 'sqlite3',
    database: ':memory:'
  });

  await SchemaMigration.createTable();
});

afterAll(async () => {
  await Base.connection.dropTable('posts');
  await Base.connection.dropTable('schema_migrations');
});

test('migrate', async () => {
  const migration = new CreatePosts();
  expect(migration.name).toBe('CreatePosts');
  expect(migration.version).toBeNull();

  await migration.migrate('up');

  const post = await Post.create({ title: 'test' });
  expect(post.id).toBe(1);
  expect(post.title).toBe('test');
});
