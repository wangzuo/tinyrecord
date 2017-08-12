import assert from 'assert';
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString
} from 'graphql';
import TinyRecord from '../src/TinyRecord';

TinyRecord.Base.establishConnection({
  adapter: 'sqlite3',
  database: ':memory:'
});

class User extends TinyRecord.Base {
  static tableName = 'users';
}

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

(async function() {
  await TinyRecord.Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });

  await User.create({ name: 'test', email: 'test@example.com' });

  const result = await graphql(
    schema,
    `query {
      user(id: 1) {
        id name email
      }
    }`
  );

  console.log(result);

  const { user } = result.data;

  assert.equal(user.id, 1);
  assert.equal(user.name, 'test');
  assert.equal(user.email, 'test@example.com');
})();
