import Value from './Value';

class Data {
  constructor(value) {
    this.value = value.toString();
  }

  toString() {
    return this.value;
  }

  get hex() {}

  eql(other) {}
}

export class Binary extends Value {
  get type() {
    return 'binary';
  }

  binary() {
    return true;
  }

  cast(value) {
    if (value instanceof Data) {
      return value.toString();
    }

    return super.cast(value);
  }

  serialize(value) {
    if (!value) return;
    return new Data(super.serialize(value));
  }

  changedInPlace(rawOldValue, value): boolean {
    oldvalue = this.deserialize(rawOldValue);
    return oldvalue !== value; // todo: eql
  }
}
