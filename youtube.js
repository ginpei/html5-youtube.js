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

		this._initializeEventer();
		this._loadYTScript(this._setupVideo.bind(this));
	};

	$p._loadYTScript = function(callback) {
		Player.loadYTScript(callback);
	};

	/**
	 * YT.Player has add/removeEventListener methods but they doesn't work correctly
	 */
	$p._initializeEventer = function() {
		this._eventer = document.createElement('ytapiplayer');
	};

	$p._setupVideo = function() {
		this.player = new YT.Player(this.el, {
			height: 390,
			width: 640,
			videoId: this.videoId,
			events: {
				onError: this.onError.bind(this),
				onPlaybackQualityChange: this.onPlaybackQualityChange.bind(this),
				onReady: this.onReady.bind(this),
				onStateChange: this.onStateChange.bind(this),
			}
		});
	};

	// ----------------------------------------------------------------
	// Events

	$p.on = function(type, listener) {
		this._eventer.addEventListener(type, listener);
		return this;
	};

	$p._triggerYtEvent = function(type, originalEvent) {
		var event = document.createEvent('CustomEvent');
		event.initEvent(type, false, true);
		event.playerData = originalEvent.data;
		event.player = originalEvent.target;
		event.originalEvent = originalEvent;

		this._eventer.dispatchEvent(event);
	};

	$p.onError = function(event) {
		this._triggerYtEvent('onError', event);
	};

	$p.onPlaybackQualityChange = function(event) {
		this._triggerYtEvent('onPlaybackQualityChange', event);
	};

	$p.onReady = function(event) {
		this._triggerYtEvent('onReady', event);
		this._triggerYtEvent('ready', event);
	};

	$p.onStateChange = function(event) {
		this._triggerYtEvent('onStateChange', event);

		var state = event.data;
		if (state === YT.PlayerState.UNSTARTED) {
			this._triggerYtEvent('unstart', event);
		}
		else if (state === YT.PlayerState.PLAYING) {
			this._triggerYtEvent('play', event);
		}
		else if (state === YT.PlayerState.PAUSED) {
			this._triggerYtEvent('pause', event);
		}
		else if (state === YT.PlayerState.BUFFERING) {
			this._triggerYtEvent('buffer', event);
		}
		else if (state === YT.PlayerState.ENDED) {
			this._triggerYtEvent('end', event);
		}
	};

	// ----------------------------------------------------------------
	// Manip

	$p.play = function() {
		this.player.playVideo();
	};

	$p.pause = function() {
		this.player.pauseVideo();
	};
})();
