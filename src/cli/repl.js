import vm from 'vm';
import repl from 'repl';
import path from 'path';
import TinyRecord from '../TinyRecord';

function customEval(cmd, context, filename, cb) {
  const result = vm.runInContext(cmd, context);

  if (result instanceof Promise) {
    return result.then(x => cb(null, x)).catch(err => cb(err));
  }

  return cb(null, result);
}

export default function() {
  const r = repl.start({ prompt: '> ', eval: customEval });
  const models = require(path.join(process.cwd(), './models'));
  const config = require(path.join(process.cwd(), './db/config'));
  // TODO resolve config
  const env = process.env.NODE_ENV || 'development';

  TinyRecord.Base.establishConnection(config[env]);

  Object.assign(r.context, {
    TinyRecord,
    ...models
  });
}
