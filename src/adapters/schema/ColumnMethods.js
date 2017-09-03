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
    obj[columnType] = (name, options) => {
      obj.column(name, columnType, options);
    };
  });

  // alias
  obj.numeric = obj.decimal;

  obj.primaryKey = (name, type = 'primaryKey', options) => {
    obj.column(name, type, { ...options, primaryKey: true });
  };
};
