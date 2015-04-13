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
		this.currentTime = null;
		this.paused = null;

		this._initializeEventer();
		this._loadYTScript(this._setupVideo.bind(this, options));
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

	$p._setupVideo = function(options) {
		var el = options.el;
		var videoId = options.id;

		var width;
		var height = el.clientHeight;
		if (height) {
			width  = el.clientWidth;
		}
		else {
			height = 390;
			width = 640;
		}

		this.player = new YT.Player(el, {
			height: height,
			width: width,
			videoId: videoId,
			events: {
				onApiChange: this.onApiChang.bind(this),
				onError: this.onError.bind(this),
				onPlaybackQualityChange: this.onPlaybackQualityChange.bind(this),
				onPlaybackRateChange: this.onPlaybackRateChange.bind(this),
				onReady: this.onReady.bind(this),
				onStateChange: this.onStateChange.bind(this)
			}
		});
		this.el = this.player.getIframe();
	};

	/**
	 * Called when be ready.
	 */
	$p._updateMeta = function() {
		this.duration = this.player.getDuration();
	};

	$p._observeProgress = function() {
		this._tmProgress = setInterval(function() {
			var time = this.player.getCurrentTime();
			if (time !== this.currentTime) {
				this.currentTime = time;
				this.trigger('progress');
			}
		}.bind(this), 100);
	};

	$p._observeVolume = function() {
		this._tmVolume = setInterval(function() {
			var volume = this.player.getVolume();
			if (volume !== this.volume) {
				this.volume = volume;
				this.trigger('volumechange');
			}
		}.bind(this), 100);
	};

	// ----------------------------------------------------------------
	// Events

	$p.on = function(type, listener) {
		this._eventer.addEventListener(type, listener);
		return this;
	};

	$p.trigger = function(type) {
		var event = document.createEvent('CustomEvent');
		event.initEvent(type, false, true);
		this._eventer.dispatchEvent(event);
	};

	$p._triggerYtEvent = function(type, originalEvent) {
		var event = document.createEvent('CustomEvent');
		event.initEvent(type, false, true);
		event.playerData = originalEvent.data;
		event.player = originalEvent.target;
		event.originalEvent = originalEvent;

		this._eventer.dispatchEvent(event);
	};

	$p.onApiChang = function(event) {
		this._triggerYtEvent('onApiChang', event);
	};

	$p.onError = function(event) {
		this._triggerYtEvent('onError', event);
	};

	$p.onPlaybackQualityChange = function(event) {
		this._triggerYtEvent('onPlaybackQualityChange', event);
	};

	$p.onPlaybackRateChange = function(event) {
		this._triggerYtEvent('onPlaybackRateChange', event);
	};

	$p.onReady = function(event) {
		this._triggerYtEvent('onReady', event);
		this._updateMeta();
		this._observeProgress();
		this._observeVolume();
		this._triggerYtEvent('ready', event);
	};

	$p.onStateChange = function(event) {
		this._triggerYtEvent('onStateChange', event);

		var state = event.data;

		this.paused = (state !== YT.PlayerState.PLAYING);

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
