import YouTubeElementOriginal from './YouTubeElement';

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

class YouTubeElement extends YouTubeElementOriginal {
  public createPlayer (options: YT.PlayerOptions) {
    const ytPlayer: any = {
      cueVideoById: () => undefined,
      destroy: () => undefined,
      mute: () => undefined,
      // playVideo: () => this.onStateChange({
      //   data: YT.PlayerState.PLAYING,
      //   target: undefined,
      // }),
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

describe('YouTubeElement', () => {
  let youtube: YouTubeElement;
  let elPlayer: HTMLElement;

  beforeEach(() => {
    elPlayer = document.createElement('div');
  });

  afterEach(() => {
    if (youtube) {
      youtube.destroy();
    }
  });

  describe('Constructing', () => {
    beforeEach(() => {
      youtube = new YouTubeElement(elPlayer);
    });

    describe('options', () => {
      let createPlayer: jest.SpyInstance<(options: YT.PlayerOptions) => any>;

      beforeEach(() => {
        createPlayer = jest.spyOn(YouTubeElement.prototype, 'createPlayer');
        // createPlayer.mockReturnValue;
      });

      afterEach(() => {
        createPlayer.mockRestore();
      });

      describe('video ID', () => {
        beforeEach(() => {
          elPlayer.setAttribute('data-youtube-videoId', 'video123');
        });

        it('picks it up from HTML', () => {
          youtube = new YouTubeElement(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.videoId).toBe('video123');
        });

        it('uses given options over attribute in HTML', () => {
          youtube = new YouTubeElement(elPlayer, { videoId: 'video999' });
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.videoId).toBe('video999');
        });

        it('applies to the property', () => {
          youtube = new YouTubeElement(elPlayer);
          expect(youtube.videoId).toBe('video123');
        });
      });

      describe('size', () => {
        function setSize (el: HTMLElement, size: { height: number, width: number }) {
          Object.defineProperty(el, 'clientWidth', { value: size.width });
          Object.defineProperty(el, 'clientHeight', { value: size.height });
        }

        it('uses element size', () => {
          setSize(elPlayer, { height: 111, width: 222 });

          youtube = new YouTubeElement(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.height).toBe(111);
          expect(options.width).toBe(222);
        });

        it('respects given options', () => {
          setSize(elPlayer, { height: 111, width: 222 });

          youtube = new YouTubeElement(elPlayer, { height: 333, width: 444 });
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.height).toBe(333);
          expect(options.width).toBe(444);
        });

        it('if height is 0, considers no size is set', () => {
          setSize(elPlayer, { height: 0, width: 222 });

          youtube = new YouTubeElement(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect('height' in options).toBeFalsy();
          expect('width' in options).toBeFalsy();
        });
      });

      describe('playerVars', () => {
        it('sets empty if nothing given', () => {
          youtube = new YouTubeElement(elPlayer);
          const options: YT.PlayerOptions = createPlayer.mock.calls[0][0];
          expect(options.playerVars).toEqual({});
        });

        it('picks them up from HTML attribute', () => {
          elPlayer.setAttribute('data-youtube-playerVars', JSON.stringify({
            autohide: 1,
            cc_load_policy: 2,
          } as YT.PlayerVars));

          youtube = new YouTubeElement(elPlayer);
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

          youtube = new YouTubeElement(elPlayer, { playerVars: {
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
  });

  describe('src', () => {
    beforeEach(() => {
      youtube = new YouTubeElement(elPlayer, { videoId: 'video11' });
    });

    describe('getter', () => {
      it('returns src', () => {
        expect(youtube.src).toBe('https://www.youtube.com/watch?v=video11');
      });

      it('returns src even if it is not an URL', () => {
        youtube.src = 'hello world!';
        expect(youtube.src).toBe('hello world!');
      });
    });

    describe('setter', () => {
      it('updates src', () => {
        youtube.src = 'https://www.youtube.com/watch?v=video22';
        expect(youtube.src).toBe('https://www.youtube.com/watch?v=video22');
      });

      it('updates ID', () => {
        youtube.src = 'https://www.youtube.com/watch?v=video22';
        expect(youtube.videoId).toBe('video22');
      });

      describe('loads new video for formats', () => {
        let cueVideoById: jest.SpyInstance<(
          mediaContentUrl: string,
          startSeconds?: number,
          suggestedQuality?: YT.SuggestedVideoQuality,
        ) => void>;

        beforeEach(() => {
          cueVideoById = jest.spyOn(youtube.player!, 'cueVideoById');
        });

        it('general URL', () => {
          youtube.src = 'https://www.youtube.com/watch?v=video22';
          expect(cueVideoById).toBeCalledWith('video22');
        });

        it('complex URL', () => {
          youtube.src = 'https://www.youtube.com/watch?list=list00&v=video22&start_radio=1&';
          expect(cueVideoById).toBeCalledWith('video22');
        });

        it('API-friendly URL', () => {
          youtube.src = 'https://www.youtube.com/v/video22';
          expect(cueVideoById).toBeCalledWith('video22');
        });

        it('API-friendly URL with params', () => {
          youtube.src = 'https://www.youtube.com/v/video22?version=3';
          expect(cueVideoById).toBeCalledWith('video22');
        });
      });
    });
  });

  describe('videoId', () => {
    beforeEach(() => {
      youtube = new YouTubeElement(elPlayer, { videoId: 'video11' });
    });

    describe('getter', () => {
      it('returns ID for the given options', () => {
        expect(youtube.videoId).toBe('video11');
      });

      it('returns ID for the basic URL in HTTPS', () => {
        youtube.src = 'https://www.youtube.com/watch?v=video22';
        expect(youtube.videoId).toBe('video22');
      });

      it('returns ID for the basic URL in HTTP', () => {
        youtube.src = 'http://www.youtube.com/watch?v=video22';
        expect(youtube.videoId).toBe('video22');
      });

      it('returns ID for the URL with multiple parameters', () => {
        youtube.src = 'http://www.youtube.com/watch?start_radio=1&v=video22&list=list99';
        expect(youtube.videoId).toBe('video22');
      });

      it('returns ID for the invalid URL', () => {
        youtube.src = 'https://youtube.com/';
        expect(youtube.videoId).toBeUndefined();
      });
    });

    describe('setter', () => {
      it('updates ID', () => {
        youtube.videoId = 'video22';
        expect(youtube.videoId).toBe('video22');
      });

      it('updates src', () => {
        youtube.videoId = 'video22';
        expect(youtube.src).toBe('https://www.youtube.com/watch?v=video22');
      });

      it('loads new video', () => {
        const cueVideoById = jest.spyOn(youtube.player!, 'cueVideoById');
        youtube.videoId = 'video22';
        expect(cueVideoById).toBeCalledWith('video22');
      });
    });
  });
});
