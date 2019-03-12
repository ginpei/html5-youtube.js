import YtScriptLoader from './YtScriptLoader';

describe('YtScriptLoader', () => {
  let loader: YtScriptLoader;

  // beforeEach(() => {
  // });

  afterEach(() => {
    if (loader) {
      loader.destroy();
    }
  });

  describe('global callback', () => {
    it('sets the callback function', () => {
      loader = new YtScriptLoader();
      expect(window.onYouTubeIframeAPIReady).not.toBeUndefined();
    });

    it('throws if the second is constructed', () => {
      expect(() => {
        loader = new YtScriptLoader();
        const loader2 = new YtScriptLoader();
        expect(loader2).toBeInstanceOf(YtScriptLoader);
        expect(window.onYouTubeIframeAPIReady).not.toBeUndefined();
      }).toThrow(
        'YtScriptLoader (or any competitors) can be created only once in a document',
      );
    });
  });

  describe('callbacks', () => {
    let callback1: jest.Mock<{}>;
    let callback2: jest.Mock<{}>;

    beforeEach(() => {
      loader = new YtScriptLoader();

      callback1 = jest.fn();
      loader.addCallback(callback1);
      callback2 = jest.fn();
      loader.addCallback(callback2);
    });

    it('embeds the script only once', () => {
      const els = document.querySelectorAll(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      expect(els.length).toBe(1);
    });

    it('calls back all callback functions', () => {
      window.onYouTubeIframeAPIReady!();

      expect(callback1!).toBeCalled();
      expect(callback2!).toBeCalled();
    });

    it('calls back immediately if it has been loaded', () => {
      window.onYouTubeIframeAPIReady!();

      const callback3 = jest.fn();
      loader.addCallback(callback3);

      expect(callback3).toBeCalled();
    });
  });
});
