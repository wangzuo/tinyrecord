import AbstractAdapter from '../AbstractAdapter';

test('ADAPTER_NAME', () => {
  expect(AbstractAdapter.ADAPTER_NAME).toBe('Abstract');
});

export function testAdapter(Base) {
  class User extends Base {
    static tableName = 'users';
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
    expect(tables).toEqual(['users']);
  });

  test('columns', async () => {
    const columns = await Base.connection.columns('users');
    expect(columns).toMatchSnapshot();
  });

  test('new', async () => {
    const user = await User.new({ name: 'test', email: 'test@example.com' });
    expect(user.attributes.attributes).toMatchSnapshot();
    expect(user.attributes).toMatchSnapshot();
  });

  test('create', async () => {
    expect(User.recordTimestamps).toBe(true);

    const attrs = { name: 'create', email: 'create@example.com' };
    const user = await User.create(attrs);

    expect(user.id).not.toBeNull();
    expect(user.name).toBe(attrs.name);
    expect(user.email).toBe(attrs.email);

    expect(user.createdAt).not.toBeNull();
    expect(user.updatedAt).not.toBeNull();
  });

  test('find', async () => {
    const user = await User.create({ name: 'find', email: 'find@example.com' });
    const data = await User.find(user.id);

    expect(data.id).toBe(user.id);
    expect(data.name).toBe(user.name);
    expect(data.email).toBe(user.email);
    expect(data.createdAt).not.toBeNull();
    expect(data.updatedAt).not.toBeNull();
  });

  test('findBy', async () => {
    const attrs = {
      name: 'findBy',
      email: 'findBy@example.com'
    };

    // TODO
    const empty = await User.findBy(attrs);
    // expect(empty).toBeNull();

    const user = await User.create(attrs);
    const data = await User.findBy(attrs);

    expect(data.id).toBe(user.id);
    expect(data.name).toBe(attrs.name);
    expect(data.email).toBe(attrs.email);
    expect(data.createdAt).not.toBeNull();
    expect(data.updatedAt).not.toBeNull();
  });

  test('findOrCreateBy', async () => {
    const attrs = {
      name: 'findOrCreateBy',
      email: 'findOrCreateBy@example.com'
    };

    const user1 = await User.findOrCreateBy(attrs);
    const user2 = await User.findOrCreateBy(attrs);

    expect(user1.id).not.toBeNull();
    expect(user1.name).toBe(attrs.name);
    expect(user1.email).toBe(attrs.email);
    expect(user1.createdAt).not.toBeNull();
    expect(user1.updatedAt).not.toBeNull();
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
  });

  test('limit', async () => {
    expect(
      await User.where({ name: 'test' }).limit(1).toSql()
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
    expect(await User.offset(10).order('name ASC').toSql()).toMatchSnapshot();
  });
}
