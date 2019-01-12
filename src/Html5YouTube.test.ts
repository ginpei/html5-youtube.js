import Html5YouTubeOriginal, { IOptions, PlayerState } from './Html5YouTube';

describe('Html5YouTube', () => {
  class Html5YouTube extends Html5YouTubeOriginal {
    public _buildPlayer (options: IOptions) {
      this._setupVideo(options);
    }

    public _createPlayer (el: HTMLElement, options: YT.PlayerOptions) {
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
    player = new Html5YouTube({
      el: elPlayer,
      id: videoId,
    });
  });

  afterEach(() => {
    player.destroy();
  });

  describe('Statics', () => {
    describe('interface', () => {
      it('builds new instance', () => {
        const instance = new Html5YouTube({ el:elPlayer, id:videoId });
        expect(instance instanceof Html5YouTube).toBeTruthy();
      });
    });
  });

  describe('Constructing', () => {
    it('loads the video by specified ID from the beginning', () => {
      player.destroy();

      let result;
      const _createPlayer = Html5YouTube.prototype._createPlayer;
      Html5YouTube.prototype._createPlayer = (el, options) => {
        result = options.videoId;
      };
      player = new Html5YouTube({ el:elPlayer, id:videoId });
      Html5YouTube.prototype._createPlayer = _createPlayer;

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
        const videoOptions = player._getVideoOptions({ el:elPlayer });
        expect(videoOptions.videoId).toBe(videoId);
      });

      describe('playerVars settings', () => {
        it('uses the value specified in options if specified on the element', () => {
          elPlayer.setAttribute('data-youtube-controls', '1');
          const videoOptions = player._getVideoOptions({ el:elPlayer, controls:0 });
          expect(videoOptions.playerVars.controls).toBe(0);
        });

        it('let youtube fallback to default settings if not specified', () => {
          elPlayer.removeAttribute('data-youtube-controls');
          const videoOptions = player._getVideoOptions({ el:elPlayer });
          expect(videoOptions.playerVars.controls).toBe(undefined);
        });

        it('turns setting on if "true" is specified', () => {
          elPlayer.setAttribute('data-youtube-controls', 'true');
          const videoOptions = player._getVideoOptions({ el:elPlayer });
          expect(videoOptions.playerVars.controls).toBe(1);
        });

        it('let youtube fallback to default settings if invalid number like "-1" is specified', () => {
          elPlayer.setAttribute('data-youtube-controls', '-1');
          const videoOptions = player._getVideoOptions({ el:elPlayer });
          expect(videoOptions.playerVars.controls).toBe(undefined);
        });

        it('turns setting off if "false" is specified', () => {
          elPlayer.setAttribute('data-youtube-controls', 'false');
          const videoOptions = player._getVideoOptions({ el:elPlayer });
          expect(videoOptions.playerVars.controls).toBe(0);
        });

        it('accepts strings like "playlist" as valid values', () => {
          elPlayer.setAttribute('data-youtube-listType', 'playlist');
          const videoOptions = player._getVideoOptions({ el:elPlayer });
          expect(videoOptions.playerVars.listType).toBe('playlist');
        });

        it('allows youtube playerVars settings as booleans', () => {
          elPlayer.removeAttribute('data-youtube-controls');
          const videoOptions = player._getVideoOptions({
            autohide: false,
            autoplay: true,
            cc_load_policy: true,
            color: 'white',
            controls: false,
            disablekb: false,
            el:elPlayer,
            enablejsapi: true,
            end: 23,
            fs: false,
            hl: 'en',
            iv_load_policy: 3,
            list: 'PLC77007E23FF423C6',
            listType: 'playlist',
            loop: false,
            modestbranding: true,
            origin: 'localhost',
            playerapiid: '1234abcd',
            playlist: '2EEsa_pqGAs,KFstP0C9sVk',
            playsinline: true,
            rel: false,
            showinfo: false,
          });

          expect(videoOptions.playerVars).toEqual({
            autohide: 0,
            autoplay: 1,
            cc_load_policy: 1,
            color: 'white',
            controls: 0,
            disablekb: 0,
            enablejsapi: 1,
            end: 23,
            fs: 0,
            hl: 'en',
            iv_load_policy: 3,
            list: 'PLC77007E23FF423C6',
            listType: 'playlist',
            loop: 0,
            modestbranding: 1,
            origin: 'localhost',
            playerapiid: '1234abcd',
            playlist: '2EEsa_pqGAs,KFstP0C9sVk',
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            start: undefined,
            theme: undefined,
          });
        });

        it('allows youtube playerVars settings as numbers', () => {
          const videoOptions = player._getVideoOptions({
            autohide: 0,
            autoplay: 1,
            cc_load_policy: 1,
            color: 'white',
            controls: 0,
            disablekb: 0,
            el:elPlayer,
            enablejsapi: 1,
            end: 23,
            fs: 0,
            hl: 'en',
            iv_load_policy: 3,
            list: 'PLC77007E23FF423C6',
            listType: 'playlist',
            loop: 0,
            modestbranding: 1,
            origin: 'localhost',
            playerapiid: '1234abcd',
            playlist: '2EEsa_pqGAs,KFstP0C9sVk',
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            start: 10,
            theme: 'light',
          });

          expect(videoOptions.playerVars).toEqual({
            autohide: 0,
            autoplay: 1,
            cc_load_policy: 1,
            color: 'white',
            controls: 0,
            disablekb: 0,
            enablejsapi: 1,
            end: 23,
            fs: 0,
            hl: 'en',
            iv_load_policy: 3,
            list: 'PLC77007E23FF423C6',
            listType: 'playlist',
            loop: 0,
            modestbranding: 1,
            origin: 'localhost',
            playerapiid: '1234abcd',
            playlist: '2EEsa_pqGAs,KFstP0C9sVk',
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            start: 10,
            theme: 'light',
          });
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
