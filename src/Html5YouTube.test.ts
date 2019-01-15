import Html5YouTubeOriginal from './Html5YouTube';

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    YT: any;
  }
}

window.YT = {
  PlayerState: {
    BUFFERING: 3,
    CUED: 5,
    ENDED: 0,
    PAUSED: 2,
    PLAYING: 1,
    UNSTARTED: -1,
  },
};

class Html5YouTube extends Html5YouTubeOriginal {
  public createPlayer (options: YT.PlayerOptions) {
    const ytPlayer: any = {
      cueVideoById: () => undefined,
      destroy: () => undefined,
      mute: () => undefined,
      playVideo: () => this.onStateChange({
        data: YT.PlayerState.PLAYING,
        target: undefined,
      }),
      seekTo: () => undefined,
      setPlaybackRate: () => undefined,
      setVolume: () => undefined,
      unMute: () => undefined,
    };
    return ytPlayer;
  }

  protected loadYtScript (callback: () => void) {
    callback();
  }
}

describe('Html5YouTube', () => {
  let player: Html5YouTube;
  let elPlayer: HTMLElement;

  beforeEach(() => {
    elPlayer = document.createElement('div');
  });

  afterEach(() => {
    if (player) {
      player.destroy();
    }
  });

  describe('Statics', () => {
    describe('interface', () => {
      it('builds new instance', () => {
        const instance = new Html5YouTube(elPlayer, { videoId: 'video123' });
        expect(instance instanceof Html5YouTube).toBeTruthy();
      });
    });
  });

  describe('Constructing', () => {
    beforeEach(() => {
      player = new Html5YouTube(elPlayer);
    });

    describe('options', () => {
      let createPlayer: jest.SpyInstance<(options: YT.PlayerOptions) => any>;

      beforeEach(() => {
        createPlayer = jest.spyOn(Html5YouTube.prototype, 'createPlayer');
      });

      afterEach(() => {
        createPlayer.mockRestore();
      });

      describe('video ID', () => {
        beforeEach(() => {
          elPlayer.setAttribute('data-youtube-videoId', 'video123');
        });

        it('picks it up from HTML', () => {
          player = new Html5YouTube(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.videoId).toBe('video123');
        });

        it('uses given options over attribute in HTML', () => {
          player = new Html5YouTube(elPlayer, { videoId: 'video999' });
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.videoId).toBe('video999');
        });
      });

      describe('size', () => {
        function setSize (el: HTMLElement, size: { height: number, width: number }) {
          Object.defineProperty(el, 'clientWidth', { value: size.width });
          Object.defineProperty(el, 'clientHeight', { value: size.height });
        }

        it('uses element size', () => {
          setSize(elPlayer, { height: 111, width: 222 });

          player = new Html5YouTube(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.height).toBe(111);
          expect(options.width).toBe(222);
        });

        it('respects given options', () => {
          setSize(elPlayer, { height: 111, width: 222 });

          player = new Html5YouTube(elPlayer, { height: 333, width: 444 });
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.height).toBe(333);
          expect(options.width).toBe(444);
        });

        it('if height is 0, considers no size is set', () => {
          setSize(elPlayer, { height: 0, width: 222 });

          player = new Html5YouTube(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect('height' in options).toBeFalsy();
          expect('width' in options).toBeFalsy();
        });
      });

      describe('playerVars', () => {
        it('sets empty if nothing given', () => {
          player = new Html5YouTube(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.playerVars).toEqual({});
        });

        it('picks them up from HTML attribute', () => {
          elPlayer.setAttribute('data-youtube-playerVars', JSON.stringify({
            autohide: 1,
            cc_load_policy: 2,
          } as YT.PlayerVars));

          player = new Html5YouTube(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.playerVars).toEqual({
            autohide: 1,
            cc_load_policy: 2,
          });
        });

        it('merges given options with HTML attribute', () => {
          elPlayer.setAttribute('data-youtube-playerVars', JSON.stringify({
            autohide: 1,
            cc_load_policy: 2,
          } as YT.PlayerVars));

          player = new Html5YouTube(elPlayer, { playerVars: {
            cc_load_policy: 3,
            color: 'red',
          } });
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.playerVars).toEqual({
            autohide: 1, // from attr
            cc_load_policy: 3, // overwritten
            color: 'red', // from options
          });
        });
      });
    });

    it('loads the video by specified ID from the beginning', () => {
      player.destroy();

      let result;
      const createPlayer = Html5YouTube.prototype.createPlayer;
      Html5YouTube.prototype.createPlayer = (options) => {
        result = options.videoId;
      };
      player = new Html5YouTube(elPlayer, { videoId: 'video123' });
      Html5YouTube.prototype.createPlayer = createPlayer;

      expect(result).toBe('video123');
    });

    describe('instance', () => {
      it('is an instance', () => {
        expect(player instanceof Html5YouTube).toBeTruthy();
      });
    });

    describe('src', () => {
      let videoId2; // find out better name
      beforeEach(() => {
        videoId2 = 'videoId' + Date.now();
      });

      it('loads the video by ID that is set as `src` after ready event', () => {
        const ytPlayer = player.player;
        ytPlayer.cueVideoById = function (value) {
          this._src = value;
        };
        ytPlayer.getVideoUrl = function () {
          return this._src;
        };

        player.player = null;
        player.src = videoId2;

        player.player = ytPlayer;
        player.onReady(null);

        expect(player.src).toBe(videoId2);
      });
    });
  });

  describe('Events', () => {
    let callback1: () => void;
    let callback2: () => void;

    beforeEach(() => {
        callback1 = jest.fn();
        callback2 = jest.fn();
        player = new Html5YouTube(elPlayer);
    });

    describe('addEventListener()', () => {
      it('adds listeners', () => {
        player.addEventListener('play', callback1);
        player.play();
        expect(callback1).toBeCalled();
      });
    });

    describe('removeEventListener()', () => {
      it('removes listeners', () => {
        player.addEventListener('play', callback1);
        player.removeEventListener('play', callback1);
        player.play();
        expect(callback1).not.toBeCalled();
      });
    });

    describe('on()', () => {
      it('adds listeners', () => {
        player.on('play', callback1);
        player.on('play', callback2);
        player.play();
        expect(callback1).toBeCalled();
        expect(callback2).toBeCalled();
      });
    });

    describe('off()', () => {
      it('removes listeners', () => {
        player.on('play', callback1);
        player.on('play', callback2);
        player.off('play', callback2);
        player.play();
        expect(callback1).toBeCalled();
        expect(callback2).not.toBeCalled();
      });
    });
  });
});
