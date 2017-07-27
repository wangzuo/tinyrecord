import Value from './Value';

export default class Float extends Value {
  get type() {
    return 'float';
  }

  typeCastForSchema() {}

  // private

  castValue(value) {
    return parseFloat(value);
  }
}
