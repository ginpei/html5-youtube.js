var Player = window.youtube.Player;

var player;
var elParent;
var elPlayer;
var videoId;
var originalStatics = {};

var original_Player_prepareYTScript = Player.prepareYTScript;
Player.prepareYTScript = function(callback) {
	callback();
};

var original_createPlayer = Player._createPlayer;
Player.prototype._createPlayer = function(options) {
	var instance = this;
	return {
		playVideo: function() {
			instance.onStateChange({ data:Player.PlayerState.PLAYING });
		},
		destroy: function() {
		}
	};
};

for (var name in Player) {
	originalStatics[name] = Player[name];
}

beforeEach(function(options) {
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
	options = options || {};
	options.el = options.el || elPlayer;
	options.id = options.id || videoId;

	player = new Player(options);
});

afterEach(function() {
	player.destroy();
});

describe('Statics', function() {
	describe('interface', function() {
		it('builds new instance', function() {
			var player = window.youtube({ el:elPlayer, id:videoId });
			expect(player instanceof Player).toBeTruthy();
		});
	});

	describe('bind', function() {
		it('fixes its context', function() {
			var obj = {};
			var fn = function() { return this; };
			var binded = Player.bind(fn, obj);
			expect(binded()).toBe(obj);
		});
		it('fixes its arguments', function() {
			var obj = {};
			var fn = function(arg1) { return arg1; };
			var binded = Player.bind(fn, null, obj);
			expect(binded()).toBe(obj);
		});
	});
});

describe('Constructing', function() {
	describe('instance', function() {
		it('is an instance', function() {
			expect(player instanceof Player).toBeTruthy();
		});
	});

	describe('src', function() {
		var videoId;
		beforeEach(function() {
			videoId = 'videoId' + Date.now();
		});

		it('loads the video by specified ID from the beginning', function() {
			var result;
			player._createPlayer = function(el, options) {
				result = options.videoId;
			};
			player.player = null;
			player.initialize({ el:elPlayer, id:videoId });
			expect(result).toBe(videoId);
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
