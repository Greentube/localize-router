import { equals } from '../src/util';

describe('util', () => {
  it('should return true if same object', () => {
    let a, b;
    a = b = {
      something: true
    };
    let c = 'something else';

    expect(equals(a, b)).toBe(true);
    expect(equals(a, c)).toBe(false);
  });
  it('should return false if one of inputs is null', () => {
    let a, b;
    a = {
      something: true
    };
    b = null;

    expect(equals(a, b)).toBe(false);
    expect(equals(b, a)).toBe(false);
  });
  it('should return true if both are NaN', () => {
    let a, b;
    a = NaN;
    b = NaN;

    expect(equals(a,b)).toBe(true);
  });
  it('should return false if type is different', () => {
    expect(equals(null, 0)).toBe(false);
    expect(equals(null, '')).toBe(false);
    expect(equals(0, false)).toBe(false);
    expect(equals('1', 1)).toBe(false);
    expect(equals('1', '1')).toBe(true);
  });
  it('should return false if only one is Array', () => {
    expect(equals([], {})).toBe(false);
    expect(equals({}, [])).toBe(false);
  });
  it('should return false if array length is different', () => {
    expect(equals([], [1])).toBe(false);
  });
  it('should return false if array elements are different', () => {
    expect(equals([1, 3, 2], [1, 2, 3])).toBe(false);
  });
  it('should return true if array elements are same', () => {
    expect(equals([1, 2, 3], [1, 2, 3])).toBe(true);
  });
  it('should return false if keys dont match', () => {
    expect(equals({text: 123, same: 1}, {text: 321, same: 1})).toBe(false);
    expect(equals({text: 123}, {non_text: 123})).toBe(false);
    expect(equals({text: 123}, {text: 123, non_text: 123})).toBe(false);
    expect(equals({text: 123, same: 1}, {text: 123, same: 1})).toBe(true);
  });
  it('should ignore if inherited fields dont match', () => {
    class Klass1 {
      same: boolean;

      constructor() { }
    }
    Klass1.prototype['first'] = 'first';
    class Klass2 {
      same: boolean;

      constructor() { }
    }
    Klass2.prototype['second'] = 'second';

    let instance1: any = new Klass1();
    instance1.same = true;
    let instance2: any = new Klass2();
    instance2.same = true;

    expect(equals(instance1, instance2)).toBe(true);
  });
});
