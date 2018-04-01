import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString
} from 'graphql';
import TinyRecord from '../dist/TinyRecord';
import User from './models/User';

afterAll(async () => {
  await TinyRecord.Base.connection.dropTable('users');
});

TinyRecord.Base.establishConnection({
  adapter: 'sqlite3',
  database: ':memory:'
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    email: { type: GraphQLString }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      allUsers: {
        type: new GraphQLList(UserType),
        async resolve() {
          const users = await User.order('id').records();
          return users;
        }
      },
      user: {
        type: UserType,
        args: { id: { type: GraphQLInt } },
        async resolve(_, { id }) {
          const user = await User.find(id);
          return user;
        }
      }
    }
  })
});

test('resolve', async () => {
  await TinyRecord.Base.connection.createTable('users', { force: true }, t => {
    t.string('name');
    t.string('email');
    t.timestamps();
  });

  await User.create({ name: 'test1', email: 'test1@example.com' });
  await User.create({ name: 'test2', email: 'test2@example.com' });

  const result = await graphql(
    schema,
    `
      query {
        allUsers {
          id
          name
          email
        }
        user(id: 1) {
          id
          name
          email
        }
      }
    `
  );

  const { user, allUsers: users } = result.data;

  expect(user.id).toBe(1);
  expect(user.name).toBe('test1');
  expect(user.email).toBe('test1@example.com');

  expect(users.length).toBe(2);
  expect(users.map(x => x.id)).toEqual([1, 2]);
  expect(users.map(x => x.name)).toEqual(['test1', 'test2']);
  expect(users.map(x => x.email)).toEqual([
    'test1@example.com',
    'test2@example.com'
  ]);
});
