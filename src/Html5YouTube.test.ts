import Html5YouTubeOriginal from './Html5YouTube';

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
        player = new Html5YouTube(elPlayer, { videoId: 'video123' });
        expect(player instanceof Html5YouTube).toBeTruthy();
      });
    });
  });
});
