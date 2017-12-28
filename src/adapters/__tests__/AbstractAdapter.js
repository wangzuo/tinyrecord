import AbstractAdapter from '../AbstractAdapter';

test('ADAPTER_NAME', () => {
  expect(AbstractAdapter.ADAPTER_NAME).toBe('Abstract');
});

export async function createTables(connection) {
  await connection.createTable('users', { force: true }, t => {
    t.string('name', { default: 'untitled' });
    t.string('email');
    t.integer('age', { default: 0 });
    t.integer('age2');
    t.boolean('active', { default: true });
    t.date('birthday');
    t.datetime('last_active_at');
    t.timestamps();
  });

  await connection.createTable('posts', { force: true }, t => {
    t.string('title');
    t.text('content');
    t.integer('user_id');
    t.timestamps();
  });
}

export function testAdapter(Base) {
  class User extends Base {
    static tableName = 'users';
  }

  class Post extends Base {
    static tableName = 'posts';
  }

  test('table.type', async () => {
    const table = User.tableMetadata;
    const name = table.type('name');
    const email = table.type('email');

    expect(await name()).toMatchSnapshot();
    expect(await email()).toMatchSnapshot();
  });

  test('tables', async () => {
    const tables = await Base.connection.tables();
    expect(tables).toMatchSnapshot();
    // expect(tables).toEqual(['posts', 'users']); // TODO: order
  });

  test('columns', async () => {
    const columns = await Base.connection.columns('users');
    expect(columns).toMatchSnapshot();
  });

  test('typeToSql', () => {
    const adapter = User.connection;

    [
      'primaryKey',
      'string',
      'text',
      'integer',
      'bigint',
      'float',
      'decimal',
      'numeric',
      'datetime',
      'time',
      'date',
      'binary',
      'boolean'
    ].forEach(type => {
      expect(adapter.typeToSql(type)).toMatchSnapshot();
    });
  });

  test('new', async () => {
    const attrs = { name: 'new', email: 'new@example.com' };
    const user = await User.new(attrs);

    expect(user.name).toBe(attrs.name);
    expect(user.email).toBe(attrs.email);
    expect(user.age).toBe(0);

    expect(user.attributes.attributes).toMatchSnapshot();
    expect(user.attributes).toMatchSnapshot();

    expect(user.readAttribute('name')).toBe(attrs.name);
    expect(user.readAttribute('email')).toBe(attrs.email);
  });

  test('default columns', async () => {
    const attrs = { email: 'default@example.com' };

    const user = await User.new(attrs);
    expect(user.name).toBe('untitled');
    expect(user.age).toBe(0);
    expect(user.email).toBe(attrs.email);
    expect(user.active).toBe(true);

    await user.save();
    const data = await User.find(user.id);
    expect(data.name).toBe('untitled');
    expect(data.age).toBe(0);
    expect(data.email).toBe(attrs.email);
    expect(user.active).toBe(true);
  });

  test('boolean type', async () => {
    const user = await User.new({ active: false });
    expect(user.active).toBe(false);

    await user.save();
    expect(user.active).toBe(false);
    const record = await User.find(user.id);
    expect(record.active).toBe(false);
  });

  describe('integer type', () => {
    it('default value', async () => {
      const user = await User.new();
      expect(user.age).toBe(0);

      await user.save();
      expect(user.age).toBe(0);
      const record = await User.find(user.id);
      expect(record.age).toBe(0);
    });

    it('handles integer', async () => {
      const user = await User.new({ age: 10 });
      expect(user.age).toBe(10);
    });

    // todo
    // it('handles string', async () => {
    //   const user = await User.new({ age: '10test' });
    //   expect(user.age).toBe(10);
    // });

    // it('handles null', async () => {
    //   const user = await User.new({ age: null });
    //   expect(user.age).toBe(null);
    // });
  });

  test('create', async () => {
    expect(User.recordTimestamps).toBe(true);

    const attrs = {
      name: 'create',
      email: 'create@example.com',
      active: false
    };

    const user = await User.create(attrs);
    expect(user.id).not.toBeNull();
    expect(user.name).toBe(attrs.name);
    expect(user.email).toBe(attrs.email);
    expect(user.age).toBe(0);
    expect(user.active).toBe(false);
    expect(user.created_at).not.toBeNull();
    expect(user.updated_at).not.toBeNull();
  });

  test('create with empty attribute', async () => {
    const attrs = { name: 'create' };
    const user = await User.create(attrs);

    expect(user.id).not.toBeNull();
    expect(user.name).toBe(attrs.name);
    expect(user.email).toBe(attrs.email);
    expect(user.age).toBe(0);
    expect(user.created_at).not.toBeNull();
    expect(user.updated_at).not.toBeNull();
  });

  describe('find', () => {
    it('find', async () => {
      const user = await User.create({
        name: 'find',
        email: 'find@example.com'
      });
      const data = await User.find(user.id);

      expect(data.newRecord()).toBe(false);
      expect(data.id).toBe(user.id);
      expect(data.name).toBe(user.name);
      expect(data.email).toBe(user.email);
      expect(data.age).toBe(0);
      expect(data.created_at).not.toBeNull();
      expect(data.updated_at).not.toBeNull();
    });

    it('find with string', async () => {
      const user = await User.create({
        name: 'find',
        email: 'find@example.com'
      });
      const data = await User.find(user.id + 'xxx');
      expect(data.id).toBe(user.id);
    });
  });

  test('findBy', async () => {
    const attrs = {
      name: 'findBy',
      email: 'findBy@example.com'
    };

    // TODO
    const empty = await User.findBy({ name: attrs.name });
    // expect(empty).toBeNull();

    const user = await User.create(attrs);
    const data = await User.findBy(attrs);

    expect(data.id).toBe(user.id);
    expect(data.name).toBe(attrs.name);
    expect(data.email).toBe(attrs.email);
    expect(data.created_at).not.toBeNull();
    expect(data.updated_at).not.toBeNull();
  });

  test('findOrCreateBy', async () => {
    const attrs = {
      name: 'findOrCreateBy',
      email: 'findOrCreateBy@example.com'
    };

    const user1 = await User.findOrCreateBy(attrs);
    const user2 = await User.findOrCreateBy(attrs);

    // todo: isNewRecord()
    expect(user1.newRecord()).toBe(false);
    expect(user2.newRecord()).toBe(false);

    expect(user1.id).not.toBeNull();
    expect(user1.name).toBe(attrs.name);
    expect(user1.email).toBe(attrs.email);
    expect(user1.created_at).not.toBeNull();
    expect(user1.updated_at).not.toBeNull();
    expect(user2.id).toBe(user1.id);
  });

  test('update', async () => {
    const user = await User.create({
      name: 'update',
      email: 'update@example.com'
    });
    await user.update({ name: 'update1', email: 'update1@example.com' });
    expect(user.name).toBe('update1');
    expect(user.email).toBe('update1@example.com');

    const data = await User.find(user.id);
    expect(data.name).toBe('update1');
    expect(data.email).toBe('update1@example.com');
  });

  test('increment', async () => {
    const user1 = await User.new();
    user1.increment('age');
    expect(user1.age).toBe(1);

    const user2 = await User.new({ name: 'increment', age: 10 });
    user2.increment('age');
    expect(user2.age).toBe(11);
    await user2.save();
    const data = await User.find(user2.id);
    expect(data.age).toBe(11);
  });

  test('where', async () => {
    expect(await User.all.toSql()).toMatchSnapshot();

    expect(await User.where({ name: 'test' }).toSql()).toMatchSnapshot();

    expect(
      await User.where({ name: 'test' })
        .where({ email: 'test@example.com' })
        .toSql()
    ).toMatchSnapshot();

    expect(
      await User.where({ name: 'test', email: 'test@example.com' }).toSql()
    ).toMatchSnapshot();

    expect(
      await User.where('name = ?', 'test')
        .where('age = ?', 10)
        .toSql()
    ).toMatchSnapshot();

    expect(await User.where('id = 1').toSql()).toMatchSnapshot();
  });

  test('limit', async () => {
    expect(await User.limit(1).toSql()).toMatchSnapshot();

    expect(
      await User.where({ name: 'test' })
        .limit(1)
        .toSql()
    ).toMatchSnapshot();
  });

  test('order', async () => {
    expect(await User.order(['name']).toSql()).toMatchSnapshot();
    expect(await User.order({ email: 'desc' }).toSql()).toMatchSnapshot();
    expect(
      await User.order(['name'], { email: 'desc' }).toSql()
    ).toMatchSnapshot();
    expect(await User.order('name').toSql()).toMatchSnapshot();
    expect(await User.order('name DESC').toSql()).toMatchSnapshot();
    expect(await User.order('name DESC, email').toSql()).toMatchSnapshot();
  });

  test('select', async () => {
    expect(
      await User.select(['name'], ['email'], 'email as user_email').toSql()
    ).toMatchSnapshot();
  });

  test('group', async () => {
    expect(await User.group(['name']).toSql()).toMatchSnapshot();
  });

  test('offset', async () => {
    expect(
      await User.offset(10)
        .order('name ASC')
        .toSql()
    ).toMatchSnapshot();
  });

  test('joins string', async () => {
    expect(
      await User.joins(
        'LEFT JOIN bookmarks ON bookmarks.user_id = users.id'
      ).toSql()
    ).toMatchSnapshot();
  });

  test('joins', async () => {
    const user = await User.create({ name: 'joins_user' });
    const post = await Post.create({ title: 'joins_post', user_id: user.id });

    const posts = await Post.joins(
      'inner join users on users.id = posts.user_id'
    )
      .select('posts.*, users.name as user_name')
      .where({ id: post.id })
      .records();

    expect(posts.length).toBe(1);

    const data = posts[0];
    expect(data.title).toBe('joins_post');
    expect(data.user_id).toBe(user.id);
    expect(data.user_name).toBe('joins_user');
  });

  // TODO: http://api.rubyonrails.org/v5.0/classes/ActiveRecord/QueryMethods.html#method-i-from
  test('from', async () => {
    expect(
      await User.select('name')
        .from('posts')
        .toSql()
    ).toMatchSnapshot();
  });
}
