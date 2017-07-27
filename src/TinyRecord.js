import Base from './Base';

const TinyRecord = {
  Base,
  createClass(options) {
    const klass = class extends Base {
      static tableName = options.tableName;
    };

    return klass;
  }
};

export default TinyRecord;
