import Base from '../Base';
import Migration from '../Migration';

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

beforeAll(() => {
  Base.establishConnection({
    adapter: 'sqlite3',
    database: ':memory:'
  });
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
