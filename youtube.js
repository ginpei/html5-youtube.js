(function() {
	var Player = window.youtube = function(options) {
		if (this instanceof Player) {
			return this.initialize(options);
		}
		else {
			var player = new Player(options);
			// player.play();
			return player;
		}
	};

	/**
	 * Load YoutTube API script.
	 * Status is changed as: initial->loading->ready.
	 * * Callback will run later if initial
	 * * Callback is queued and will run if loading
	 * * Callback run immediately if ready
	 *
	 * @param {Function} callback
	 */
	Player.loadYTScript = function(callback) {
		var status = this._ytStatus;
		if (status === undefined) {  // initial; not started
			// initialize the callback queue
			var callbacks = this._ytCallbacks = [];
			callbacks.push(callback);

			// load YoutTube script
			var url = 'https://www.youtube.com/iframe_api';
			var elScript = document.createElement('script');
			elScript.src = url;
			document.body.appendChild(elScript);

			// set callbacks
			window.onYouTubeIframeAPIReady = function() {
				callbacks.forEach(function(callback, index) {
					callback();
				});
				delete this._ytCallbacks;
				this._ytStatus = 2;
			}.bind(this);

			// update status
			this._ytStatus = 1;
		}
		else if (status === 1) {  // loading; started but not loaded yet
			this._ytCallbacks.push(callback);
		}
		else if (status === 2) {  // ready; script is completely loaded
			callback();
		}
	};

	var $p = Player.prototype;

	$p.initialize = function(options) {
		this.el = options.el;
		this.videoId = options.id;

		this._loadYTScript(function() {
			console.log('ready', this.videoId);
		}.bind(this));
	};

	$p._loadYTScript = function(callback) {
		Player.loadYTScript(callback);
	};



	return;

	var elPlayer, videoId;
	var url = 'https://www.youtube.com/iframe_api';
	var elScript = document.createElement('script');
	elScript.src = url;
	document.body.appendChild(elScript);

	window.onYouTubeIframeAPIReady = function() {
		console.log('YouTubeIframeAPIReady');

		// YT.Player has add/removeEventListener methods but they doesn't work correctly
		var playerEventer = document.createElement('ytapiplayer');
		playerEventer.trigger = function(type, originalEvent) {
			var event = document.createEvent('CustomEvent');
			event.initEvent(type, false, true);
			event.playerData = originalEvent.data;
			event.player = originalEvent.target;
			event.originalEvent = originalEvent;
			this.dispatchEvent(event);
		};

		var player = new YT.Player(elPlayer, {
			height: 390,
			width: 640,
			events: {
				onReady: function(event) {
					playerEventer.trigger('ready', event);
				},
				onStateChange: function(event) {
					playerEventer.trigger('statechange', event);
				}
			}
		});

		playerEventer.addEventListener('ready', function(event) {
			console.log(':ready');
			player.loadVideoById(videoId);
		});
		playerEventer.addEventListener('statechange', function(event) {
			var STATES = YT.PlayerState;
			var state = event.playerData;
			var stateText;
			if (state === STATES.ENDED) {
				stateText = 'ended';
			}
			else if (state === STATES.PLAYING) {
				stateText = 'playing';
			}
			else if (state === STATES.PAUSED) {
				stateText = 'paused';
			}
			else if (state === STATES.BUFFERING) {
				stateText = 'buffering';
			}
			else if (state === STATES.CUED) {
				stateText = 'cued';
			}
			console.log(':statechange', event.playerData, stateText);
		});

		// run once
		playerEventer.addEventListener('statechange', function(event) {
			var state = event.playerData;
			if (state === YT.PlayerState.PLAYING) {
				console.log(':statechange', 'first playing');

				setTimeout(function() {
					event.player.pauseVideo();
				}, 3000);
			}
			else {
				console.log(':statechange', 'oh');
			}
			playerEventer.removeEventListener('statechange', arguments.callee);
		});
	};
})();
