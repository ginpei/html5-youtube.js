import Html5YouTubeOriginal, { PlayerState } from './Html5YouTube';

describe('Html5YouTube', () => {
  class Html5YouTube extends Html5YouTubeOriginal {
    public buildPlayer (options: YT.PlayerOptions) {
      this.setupVideo(options);
    }

    public createPlayer (options: YT.PlayerOptions) {
      const ytPlayer: any = {
        cueVideoById: () => undefined,
        destroy: () => undefined,
        mute: () => undefined,
        playVideo: () => this.onStateChange({ data: PlayerState.PLAYING }),
        seekTo: () => undefined,
        setPlaybackRate: () => undefined,
        setVolume: () => undefined,
        unMute: () => undefined,
      };
      return ytPlayer;
    }

    public getVideoOptions (options: YT.PlayerOptions) {
      return super.getVideoOptions(options);
    }
  }

  let player: Html5YouTube;
  let elParent: HTMLElement;
  let elPlayer: HTMLElement;
  let videoId: string;

  beforeEach(() => {
    // create materials
    elParent = document.createElement('div');
    elPlayer = document.createElement('div');
    videoId = '123';

    elParent.appendChild(elPlayer);

    // build an instance
    player = new Html5YouTube(elPlayer, { videoId });
  });

  afterEach(() => {
    player.destroy();
  });

  describe('Statics', () => {
    describe('interface', () => {
      it('builds new instance', () => {
        const instance = new Html5YouTube(elPlayer, { videoId });
        expect(instance instanceof Html5YouTube).toBeTruthy();
      });
    });
  });

  describe('Constructing', () => {
    it('loads the video by specified ID from the beginning', () => {
      player.destroy();

      let result;
      const createPlayer = Html5YouTube.prototype.createPlayer;
      Html5YouTube.prototype.createPlayer = (options) => {
        result = options.videoId;
      };
      player = new Html5YouTube(elPlayer, { videoId });
      Html5YouTube.prototype.createPlayer = createPlayer;

      expect(result).toBe(videoId);
    });

    describe('instance', () => {
      it('is an instance', () => {
        expect(player instanceof Html5YouTube).toBeTruthy();
      });
    });

    describe('video options', () => {
      it('has videoId if ID is specified as a data attribute on the element', () => {
        elPlayer.setAttribute('data-youtube-videoid', videoId);
        const videoOptions = player.getVideoOptions({});
        expect(videoOptions.videoId).toBe(videoId);
      });

      describe('playerVars settings', () => {
        it('uses the value specified in options if specified on the element', () => {
          elPlayer.setAttribute('data-youtube-controls', '1');
          const videoOptions = player.getVideoOptions({
            playerVars: {
              controls: 0,
            },
          });
          expect(videoOptions.playerVars.controls).toBe(0);
        });

        it('let youtube fallback to default settings if not specified', () => {
          elPlayer.removeAttribute('data-youtube-controls');
          const videoOptions = player.getVideoOptions({});
          expect(videoOptions.playerVars.controls).toBe(undefined);
        });

        it('turns setting on if "true" is specified', () => {
          elPlayer.setAttribute('data-youtube-controls', 'true');
          const videoOptions = player.getVideoOptions({});
          expect(videoOptions.playerVars.controls).toBe(1);
        });

        it('let youtube fallback to default settings if invalid number like "-1" is specified', () => {
          elPlayer.setAttribute('data-youtube-controls', '-1');
          const videoOptions = player.getVideoOptions({});
          expect(videoOptions.playerVars.controls).toBe(undefined);
        });

        it('turns setting off if "false" is specified', () => {
          elPlayer.setAttribute('data-youtube-controls', 'false');
          const videoOptions = player.getVideoOptions({});
          expect(videoOptions.playerVars.controls).toBe(0);
        });

        it('accepts strings like "playlist" as valid values', () => {
          elPlayer.setAttribute('data-youtube-listType', 'playlist');
          const videoOptions = player.getVideoOptions({});
          expect(videoOptions.playerVars.listType).toBe('playlist');
        });
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
    describe('on()', () => {
      it('adds a listener', () => {
        let called = 0;
        player.on('play', () => {
          called++;
        });
        player.play();
        expect(called).toBe(1);
      });

      it('returns its own', () => {
        expect(player.on('', () => undefined)).toBe(player);
      });
    });

    describe('off()', () => {
      let called;
      let listener;
      beforeEach(() => {
        called = 0;
        listener = () => {
          called++;
        };
        player.on('play', listener);
      });

      it('removes a listener', () => {
        player.off('play', listener);
        player.play();
        expect(called).toBe(0);
      });

      it('returns its own', () => {
        expect(player.off('play', listener)).toBe(player);
      });
    });
  });
});
