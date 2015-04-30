var Player = window.youtube.Player;

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

describe('Constructing', function() {
	describe('instance', function() {
		it('is a instance', function() {
			expect(player instanceof Player).toBeTruthy();
		});
	});
});
