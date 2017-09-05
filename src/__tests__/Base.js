import Base from '../Base';

Base.establishConnection({
  adapter: 'sqlite3',
  database: ':memory:'
});

class User extends Base {
  static tableName = 'users';
}

// todo: more sanitize methods
test('sanitizeSqlArray', () => {
  expect(User.sanitizeSqlArray(['name=? and group_id=?', "foo'bar", 4])).toBe(
    "name='foo''bar' and group_id=4"
  );

  expect(
    User.sanitizeSqlArray([
      'name=:name and group_id=:group_id',
      {
        name: "foo'bar",
        group_id: 4
      }
    ])
  ).toBe("name='foo''bar' and group_id=4");

  expect(
    User.sanitizeSqlArray(["name='%s' and group_id='%s'", "foo'bar", 4])
  ).toBe("name='foo''bar' and group_id='4'");
});

test('sanitizeSqlForConditions', () => {
  expect(
    User.sanitizeSqlForConditions(['name=? and group_id=?', "foo'bar", 4])
  ).toBe("name='foo''bar' and group_id=4");

  expect(
    User.sanitizeSqlForConditions([
      'name=:name and group_id=:group_id',
      {
        name: "foo'bar",
        group_id: 4
      }
    ])
  ).toBe("name='foo''bar' and group_id=4");

  expect(
    User.sanitizeSqlForConditions(["name='%s' and group_id='%s'", "foo'bar", 4])
  ).toBe("name='foo''bar' and group_id='4'");

  expect(
    User.sanitizeSqlForConditions("name='foo''bar' and group_id='4'")
  ).toBe("name='foo''bar' and group_id='4'");
});
