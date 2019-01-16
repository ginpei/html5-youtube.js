import EventEmittable from './EventEmittable';

describe('EventEmittable', () => {
  let ee: EventEmittable;
  let mock1: jest.Mock<{}>;
  let mock2: jest.Mock<{}>;

  beforeEach(() => {
    ee = new EventEmittable();
    mock1 = jest.fn();
    mock2 = jest.fn();
  });

  describe('addEventListener()', () => {
    it('adds listeners', () => {
      ee.addEventListener('foo', mock1);
      ee.addEventListener('foo', mock2);

      ee.emit('foo', 11);

      expect(mock1).toBeCalledWith(11);
      expect(mock2).toBeCalledWith(11);
    });
  });

  describe('removeEventListener()', () => {
    it('removes listeners', () => {
      ee.addEventListener('foo', mock1);
      ee.addEventListener('foo', mock2);
      ee.removeEventListener('foo', mock2);

      ee.emit('foo', 11);

      expect(mock1).toBeCalledWith(11);
      expect(mock2).not.toBeCalled();
    });
  });

  describe('on()', () => {
    it('adds listeners', () => {
      ee.on('foo', mock1);
      ee.on('foo', mock2);

      ee.emit('foo', 11);

      expect(mock1).toBeCalledWith(11);
      expect(mock2).toBeCalledWith(11);
    });
  });

  describe('off()', () => {
    it('removes listeners', () => {
      ee.on('foo', mock1);
      ee.on('foo', mock2);
      ee.off('foo', mock2);

      ee.emit('foo', 11);

      expect(mock1).toBeCalledWith(11);
      expect(mock2).not.toBeCalled();
    });
  });

  describe('emit()', () => {
    it('emits events with any numbers of arguments', () => {
      ee.on('foo', mock1);

      ee.emit('foo', 11, 22, 33);

      expect(mock1).toBeCalledWith(11, 22, 33);
    });
  });
});
