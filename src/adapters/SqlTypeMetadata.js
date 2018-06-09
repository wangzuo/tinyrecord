// @flow
export default class SqlTypeMetadata {
  constructor(options = {}) {
    const sqlType = options.sqlType || null;
    const type = options.type || null;
    const limit = options.limit || null;
    const precision = options.precision || null;
    const scale = options.scale || null;

    this.sqlType = sqlType;
    this.type = type;
    this.limit = limit;
    this.precision = precision;
    this.scale = scale;
  }

  // private
}
