import _ from 'lodash';
import path from 'path';
import TinyRecord from '../TinyRecord';

export default async () => {
  const config = require(path.join(process.cwd(), './db/config')).development;
  const connection = TinyRecord.Base.establishConnection(
    _.omit(config, ['database'])
  );

  await connection.dropDatabase(config.database);
  await connection.disconnect();
};
