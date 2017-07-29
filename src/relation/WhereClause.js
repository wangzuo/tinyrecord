import _ from 'lodash';
import * as Arel from 'arel';

export default class WhereClause {
  constructor(predicates, binds) {
    this.predicates = predicates;
    this.binds = binds;
  }

  empty() {
    return _.isEmpty(this.predicates);
  }

  any() {
    return !this.empty();
  }

  add(other) {
    return new WhereClause(
      [...this.predicates, ...other.predicates],
      [...this.binds, ...other.binds]
    );
  }

  merge(other) {
    return new WhereClause(
      [...this.predicatesUnreferencedBy(other), ...other.predicates],
      [...this.nonConflictingBinds(other), ...other.binds]
    );
  }

  except(...columns) {
    return new WhereClause(...this.exceptPredicatesAndBinds(columns));
  }

  or(other) {
    if (this.empty()) {
      return this;
    } else if (other.empty()) {
      return other;
    }

    return new WhereClause(
      [this.ast.or(other.ast)],
      [...this.binds, ...other.binds]
    );
  }

  toJSON(tableName = null) {
    let equalities = this.predicates.filter(
      x => x instanceof Arel.nodes.Equality
    );

    if (tableName) {
      equalities = equalities.filter(
        node => node.left.relation.name === tableName
      );
    }

    const binds = _.fromPairs(this.binds.map(attr => [attr.name, attr.value]));

    return _.fromPairs(
      equalities.map(node => {
        const { name } = node.left;

        return [
          name,
          binds[name]
            ? binds[name]
            : _.isArray(node.right)
              ? node.right.map(x => x.val)
              : node.right instanceof Arel.nodes.Casted ||
                node.right instanceof Arel.nodes.Quoted
                ? node.right.val
                : null
        ];
      })
    );
  }

  get ast() {
    return new Arel.nodes.And(this.predicatesWithWrappedSqlLiterals);
  }

  // todo
  eq(other) {
    return (
      other instanceof WhereClause &&
      _.isEqual(this.predicates, other.predicates) &&
      _.isEqual(this.binds, other.binds)
    );
  }

  get invert() {
    return new WhereClause(this.invertedPredicates, this.binds);
  }

  static get empty() {
    if (!this._empty) {
      this._empty = new this([], []);
    }
    return this._empty;
  }

  referencedColumns() {}

  // private

  predicatesUnreferencedBy(other) {}

  equalityNode(node) {}

  get predicatesWithWrappedSqlLiterals() {
    return this.nonEmptyPredicates.map(
      node =>
        node instanceof Arel.nodes.Equality ? node : this.wrapSqlLiteral(node)
    );
  }

  get nonEmptyPredicates() {
    return this.predicates; // todo
  }

  wrapSqlLiteral(node) {
    if (_.isString(node)) {
      node = Arel.sql(node);
    }

    return new Arel.nodes.Grouping(node);
  }
}
