// @flow
export default class IndexDefinition {
  constructor(table, name, unique = false, columns = [], options) {
    const lengths = options.lengths || {};
    const orders = options.orders || {};
    const where = options.where || null;
    const type = options.type || null;
    const using = options.using || null;
    const comment = options.comment || null;

    this.table = table;
    this.name = name;
    this.unique = unique;
    this.columns = columns;
    this.lengths = lengths;
    this.orders = orders;
    this.where = where;
    this.type = type;
    this.using = using;
    this.comment = comment;
  }
}
