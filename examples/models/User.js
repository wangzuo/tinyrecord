import TinyRecord from '../../lib/TinyRecord';

export default class User extends TinyRecord.Base {
  static tableName = 'users';
}
