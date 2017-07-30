import Type from './Type';

export default class Attribute {
  static fromDatabase(name, value, type) {
    return new FromDatabase(name, value, type);
  }

  static fromUser(name, value, type, originalAttribute = null) {
    return new FromUser(name, value, type, originalAttribute);
  }

  static withCastValue(name, value, type) {
    return new WithCastValue(name, value, type);
  }

  static null(name) {
    return new Null(name);
  }

  static uninitialized(name, type) {
    return new Uninitialized(name, type);
  }

  constructor(name, valueBeforeTypeCast, type, options = {}) {
    const originalAttribute = options.originalAttribute || {};

    this.name = name;
    this.valueBeforeTypeCast = valueBeforeTypeCast;
    this.type = type;
    this.originalAttribute = originalAttribute;
  }

  get value() {
    if (!this._value) {
      this._value = this.typeCast(this.valueBeforeTypeCast);
    }
    return this._value;
  }

  get originalValue() {
    // if (this.assigned()) {
    //   return this.originalAttribute.originalValue;
    // }

    return this.typeCast(this.valueBeforeTypeCast);
  }

  get valueForDatabase() {
    return this.type.serialize(this.value);
  }

  changed() {}

  changedInPlace() {}

  forgettingAssignment() {}

  withValueFromUser(value) {}

  withValueFromDatabase(value) {}

  withCastValue(value) {}

  withType(type) {
    return new this.constructor(
      this.name,
      this.valueBeforeTypeCast,
      this.type,
      this.originalAttribute
    );
  }

  typeCast() {
    throw new Error('not implemented error');
  }

  initialized() {
    return true;
  }

  cameFromUser() {
    return false;
  }

  hasBeenRead() {
    return !!this._value;
  }

  // protected

  get originalValueFromDatabase() {}

  // private
}

class FromDatabase extends Attribute {
  typeCast(value) {
    return this.type.deserialize(value);
  }

  get _originalValueForDatabase() {
    return this.valueBeforeTypeCast;
  }
}

class FromUser extends Attribute {
  typeCast(value) {
    return this.type.cast(value);
  }

  get cameFromUser() {
    return true;
  }
}

class WithCastValue extends Attribute {
  typeCast(value) {
    return value;
  }

  get changedInPlace() {
    return false;
  }
}

class Null extends Attribute {
  constructor(name) {
    super(name, null, Type.defaultValue);

    // alias
    this.withValueFromUser = this.withValueFromDatabase;
  }

  typeCast() {
    return null;
  }

  withType(type) {
    return this.constructor.withCastValue(name, null, type);
  }

  withValueFromDatabase(value) {
    throw new Error(`can't write unknown attribe ${this.name}`);
  }
}

const UNINITIALIZED_ORIGINAL_VALUE = {};

class Uninitialized extends Attribute {
  constructor(name, type) {
    super(name, null, type);
  }

  value(block) {
    if (block) return block(name);
  }

  get originalValue() {
    return UNINITIALIZED_ORIGINAL_VALUE;
  }

  get initialized() {
    return false;
  }

  withType(type) {
    return new this(name, type);
  }
}
