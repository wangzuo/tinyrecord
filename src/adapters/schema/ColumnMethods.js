export default obj => {
  [
    'bigint',
    'binary',
    'boolean',
    'date',
    'datetime',
    'decimal',
    'float',
    'integer',
    'string',
    'text',
    'time',
    'timestamp',
    'virtual'
  ].forEach(columnType => {
    obj[columnType] = (...args) => {
      // const options = args[args.length - 1]; todo: options
      args.forEach(name => obj.column(name, columnType));
    };
  });

  // alias
  obj.numeric = obj.decimal;

  obj.primaryKey = (name, type = 'primaryKey', options) => {
    obj.column(name, type, { ...options, primaryKey: true });
  };
};
