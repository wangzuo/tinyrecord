import Base from './Base';
import Relation from './Relation';

const TinyRecord = {
  Base,
  // todo: extends Base instead
  createClass(options) {
    const klass = class extends Base {
      static tableName = options.tableName;
    };

    klass.Relation = class extends Relation {};

    return klass;
  }
};

export default TinyRecord;
