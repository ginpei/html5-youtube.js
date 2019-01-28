import Html5YouTubeOriginal from './Html5YouTube';

class Html5YouTube extends Html5YouTubeOriginal {
  public createPlayer (options: YT.PlayerOptions) {
    const ytPlayer: any = {
      cueVideoById: () => undefined,
      destroy: () => undefined,
      getVideoUrl: () => undefined,
      mute: () => undefined,
      playVideo: () => this.onStateChange({
        data: YT.PlayerState.PLAYING,
        target: {} as YT.Player,
        type: 'onStateChange',
      }),
      seekTo: () => undefined,
      setPlaybackRate: () => undefined,
      setVolume: () => undefined,
      unMute: () => undefined,
    };
    return ytPlayer;
  }

  public _setProtectedValue (name: keyof(this), value: any) {
    this[name] = value;
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
    elPlayer.setAttribute('data-youtube-videoId', 'video11');
  });

  afterEach(() => {
    if (player) {
      player.destroy();
    }
  });

  describe('Statics', () => {
    describe('interface', () => {
      it('builds new instance', () => {
        player = new Html5YouTube(elPlayer);
        expect(player instanceof Html5YouTube).toBeTruthy();
      });
    });
  });

  describe('constructor', () => {
    beforeEach(() => {
      player = new Html5YouTube(elPlayer);
    });

    it('YouTube object is created', () => {
      expect(player.player).not.toBe(undefined);
    });

    it('resets values', () => {
      expect(player.currentTime).toBe(0);
      expect(player.volume).toBe(0);
      expect(player.muted).toBe(false);
      expect(player.playbackRate).toBe(1);
      expect(player.src).toBe('');
      expect(player.duration).toBe(0);
      expect(player.currentSrc).toBe('');
      expect(player.played).toBe(false);
      expect(player.paused).toBe(false);
      expect(player.ended).toBe(false);
    });
  });

  describe('player values', () => {
    beforeEach(() => {
      player = new Html5YouTube(elPlayer);

      jest.useFakeTimers();
      player.player!.getCurrentTime = jest.fn();
      player.player!.isMuted = jest.fn();
      player.player!.getVolume = jest.fn();
      player.player!.getPlaybackRate = jest.fn();
      player.player!.getDuration = jest.fn();
      player.onReady({} as YT.PlayerEvent);
    });

    describe('currentTime', () => {
      it('setter', () => {
        const seekTo = spyOn(player.player!, 'seekTo');
        player.currentTime = 12.3;
        expect(seekTo).toBeCalledWith(12.3, true);
      });

      it('getter', () => {
        (player.player!.getCurrentTime as jest.Mock).mockReturnValue(12.3);
        jest.advanceTimersByTime(100);
        expect(player.currentTime).toBe(12.3);
      });

      it('if not ready', () => {
        player.player = undefined;
        player.currentTime = 12.3;
        expect(player.currentTime).toBe(0);
      });
    });

    describe('volume', () => {
      // HTML5 Media API accepts 0-1, while YouTube API accepts 0-100

      it('setter', () => {
        const setVolume = spyOn(player.player!, 'setVolume');
        player.volume = 0.12;
        expect(setVolume).toBeCalledWith(12);
      });

      it('getter', () => {
        (player.player!.getVolume as jest.Mock).mockReturnValue(12);
        jest.advanceTimersByTime(100);
        expect(player.volume).toBe(0.12);
      });

      it('if not ready', () => {
        player.player = undefined;
        player.volume = 0.12;
        expect(player.volume).toBe(0);
      });
    });

    describe('mute', () => {
      it('set mute', () => {
        const mute = spyOn(player.player!, 'mute');
        player.muted = true;
        expect(mute).toBeCalled();
      });

      it('set unMute', () => {
        const unMute = spyOn(player.player!, 'unMute');
        player.muted = false;
        expect(unMute).toBeCalled();
      });

      it('getter', () => {
        (player.player!.isMuted as jest.Mock).mockReturnValue(true);
        jest.advanceTimersByTime(100);
        expect(player.muted).toBe(true);
      });

      it('if not ready', () => {
        player.player = undefined;
        player.muted = true;
        expect(player.muted).toBe(false);
      });
    });

    describe('playbackRate', () => {
      it('setter', () => {
        const setPlaybackRate = spyOn(player.player!, 'setPlaybackRate');
        player.playbackRate = 1.5;
        expect(setPlaybackRate).toBeCalledWith(1.5);
      });

      it('getter', () => {
        (player.player!.getPlaybackRate as jest.Mock).mockReturnValue(1.5);
        jest.advanceTimersByTime(100);
        expect(player.playbackRate).toBe(1.5);
      });

      it('if not ready', () => {
        player.player = undefined;
        player.playbackRate = 1.5;
        expect(player.playbackRate).toBe(1);
      });
    });

    describe('duration', () => {
      it('getter', () => {
        (player.player!.getDuration as jest.Mock).mockReturnValue(123);
        jest.advanceTimersByTime(100);
        expect(player.duration).toBe(123);
      });
    });
  });
});
