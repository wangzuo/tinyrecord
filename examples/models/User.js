const TinyRecord = require('../../lib/TinyRecord');

class User extends TinyRecord.Base {}
User.tableName = 'users';

module.exports = User;
