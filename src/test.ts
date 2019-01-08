// tslint:disable
import Html5YouTubeOriginal, { PlayerState, IOptions } from './Html5YouTube';

class Player extends Html5YouTubeOriginal {
  public _buildPlayer (options: IOptions) {
    this._setupVideo(options);
  }

  public _createPlayer (el: HTMLElement, options: YT.PlayerOptions) {
    var instance = this;
    const ytPlayer: any = {
      playVideo: function() {
        instance.onStateChange({ data: PlayerState.PLAYING });
      },
      seekTo: function() {},
      setVolume: function() {},
      mute: function() {},
      unMute: function() {},
      setPlaybackRate: function() {},
      cueVideoById: function() {},
      destroy: function() {
      }
    };
    return ytPlayer;
  }
}

let player: Player;
let elParent: HTMLElement;
let elPlayer: HTMLElement;
let videoId: string;
const originalStatics: { [key: string]: any } = {};

for (var key in Player) {
	originalStatics[key] = Player[key];
}

beforeEach(function() {
	// restore statics
	for (var name in Player) {
		delete Player[name];
	}
	for (var name in originalStatics) {
		Player[name] = originalStatics[name];
	}

	// create materials
	elParent = document.createElement('div');
	elPlayer = document.createElement('div');
	videoId = '123';

	elParent.appendChild(elPlayer);

  // build an instance
	player = new Player({
		el: elPlayer,
		id: videoId
  });
});

afterEach(function() {
	player.destroy();
});

describe('Statics', function() {
	describe('interface', function() {
		it('builds new instance', function() {
			var player = new Player({ el:elPlayer, id:videoId });
			expect(player instanceof Player).toBeTruthy();
		});
	});
});

describe('Constructing', function() {
  it('loads the video by specified ID from the beginning', function() {
    player.destroy();

    var result;
    const _createPlayer = Player.prototype._createPlayer;
  	Player.prototype._createPlayer = function(el, options) {
  		result = options.videoId;
  	};
    player = new Player({ el:elPlayer, id:videoId });
    Player.prototype._createPlayer = _createPlayer;

  	expect(result).toBe(videoId);
  });

	describe('instance', function() {
		it('is an instance', function() {
			expect(player instanceof Player).toBeTruthy();
		});
	});

	describe('video options', function() {
		it('has videoId if ID is specified as a data attribute on the element', function() {
			elPlayer.setAttribute('data-youtube-videoid', videoId);
			var videoOptions = player._getVideoOptions({ el:elPlayer });
			expect(videoOptions.videoId).toBe(videoId);
		});

		describe('playerVars settings', function() {
			it('uses the value specified in options if specified on the element', function() {
				elPlayer.setAttribute('data-youtube-controls', '1');
				var videoOptions = player._getVideoOptions({ el:elPlayer, controls:0 });
				expect(videoOptions.playerVars.controls).toBe(0);
			});

			it('let youtube fallback to default settings if not specified', function() {
				elPlayer.removeAttribute('data-youtube-controls');
				var videoOptions = player._getVideoOptions({ el:elPlayer });
				expect(videoOptions.playerVars.controls).toBe(undefined);
			});

			it('turns setting on if "true" is specified', function() {
				elPlayer.setAttribute('data-youtube-controls', 'true');
				var videoOptions = player._getVideoOptions({ el:elPlayer });
				expect(videoOptions.playerVars.controls).toBe(1);
			});

			it('let youtube fallback to default settings if invalid number like "-1" is specified', function() {
				elPlayer.setAttribute('data-youtube-controls', '-1');
				var videoOptions = player._getVideoOptions({ el:elPlayer });
				expect(videoOptions.playerVars.controls).toBe(undefined);
			});

			it('turns setting off if "false" is specified', function() {
				elPlayer.setAttribute('data-youtube-controls', 'false');
				var videoOptions = player._getVideoOptions({ el:elPlayer });
				expect(videoOptions.playerVars.controls).toBe(0);
			});

			it('accepts strings like "playlist" as valid values', function() {
				elPlayer.setAttribute('data-youtube-listType', 'playlist');
				var videoOptions = player._getVideoOptions({ el:elPlayer });
				expect(videoOptions.playerVars.listType).toBe('playlist');
			});

			it('allows youtube playerVars settings as booleans', function() {
				elPlayer.removeAttribute('data-youtube-controls');
				var videoOptions = player._getVideoOptions({
					el:elPlayer,
					autohide: false,
					autoplay: true,
					cc_load_policy: true,
					color: 'white',
					controls: false,
					disablekb: false,
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
					showinfo: false
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
					theme: undefined
				});
			});

			it('allows youtube playerVars settings as numbers', function() {
				var videoOptions = player._getVideoOptions({
					el:elPlayer,
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
					theme: 'light'
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
					theme: 'light'
				});
			});
		});
	});

	describe('src', function() {
		var videoId;
		beforeEach(function() {
			videoId = 'videoId' + Date.now();
		});

		it('loads the video by ID that is set as `src` after ready event', function() {
			var ytPlayer = player.player;
			ytPlayer.cueVideoById = function(value) {
				this._src = value;
			};
			ytPlayer.getVideoUrl = function() {
				return this._src;
			};

			player.player = null;
			player.src = videoId;

			player.player = ytPlayer;
			player.onReady(null);

			expect(player.src).toBe(videoId);
		});
	});
});

describe('Events', function() {
	describe('on()', function() {
		it('adds a listener', function() {
			var called = 0;
			player.on('play', function() {
				called++;
      });
			player.play();
			expect(called).toBe(1);
		});

		it('returns its own', function() {
			expect(player.on('', function(){})).toBe(player);
		});
	});

	describe('off()', function() {
		var called, listener;
		beforeEach(function() {
			called = 0;
			listener = function() {
				called++;
			};
			player.on('play', listener);
		});

		it('removes a listener', function() {
			player.off('play', listener);
			player.play();
			expect(called).toBe(0);
		});

		it('returns its own', function() {
			expect(player.off('play', listener)).toBe(player);
		});
	});
});
