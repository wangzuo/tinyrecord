import _ from 'lodash';
import path from 'path';
import TinyRecord from '../../TinyRecord';

export default async () => {
  // TOOD: load config
  const config = require(path.join(process.cwd(), './db/config')).development;
  const connection = TinyRecord.Base.establishConnection(
    _.omit(config, ['database'])
  );

  try {
    await connection.createDatabase(config.database);
  } catch (e) {
    console.log('Database exists');
  }

  await connection.disconnect();
};
