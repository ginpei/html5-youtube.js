var Player = window.youtube.Player;

var original_Player_prepareYTScript = Player.prepareYTScript;
Player.prepareYTScript = function(callback) {
	callback();
};

var player;
var elParent;
var elPlayer;
var videoId;

beforeEach(function(options) {
	elParent = document.createElement('div');
	elPlayer = document.createElement('div');
	videoId = '123';

	elParent.appendChild(elPlayer);

	options = options || {};
	options.el = options.el || elPlayer;
	options.id = options.id || videoId;

	player = new Player(options);
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
		it('is a instance', function() {
			expect(player instanceof Player).toBeTruthy();
		});
	});
});
