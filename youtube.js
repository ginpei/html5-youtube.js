(function() {
	window.youtube = function(options) {
		var player = new Player(options);
		// player.play();
		return player;
	};

	var Player = window.youtube.Player = function(options) {
		if (Player._undefinedProperties) {
			Player._execDefineProperty();
			delete Player._undefinedProperties;
		}

		return this.initialize(options);
	};

	Player.PlayerState = { UNSTARTED:-1, ENDED:0, PLAYING:1, PAUSED:2, BUFFERING:3, CUED:5 };

	/**
	 * Proxy for `Function#bind`.
	 * It will be placed for IE 7.
	 * @param {Function} fn
	 * @returns {Function}
	 */
	Player.bind = function(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return Function.prototype.bind.apply(fn, args);
	};

	/**
	 * Proxy for `Object.defineProperty`.
	 * This logic is used for IE 7.
	 * @param {String} prop Property's name.
	 * @param {Object} descriptor
	 */
	Player.defineProperty = function(prop, descriptor) {
		Player._undefinedProperties.push(arguments);
	};

	Player._execDefineProperty = function() {
		// This method is called only once when the first instance is created.

		var obj = this.prototype;
		this._undefinedProperties.forEach(function(args, index) {
			var prop = args[0];
			var descriptor = args[1];
			Object.defineProperty(obj, prop, descriptor);
		});
	};

	Player._undefinedProperties = [];

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
			window.onYouTubeIframeAPIReady = Player.bind(function() {
				callbacks.forEach(function(callback, index) {
					callback();
				});
				delete this._ytCallbacks;
				this._ytStatus = 2;
			}, this);

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

	Player.createEvent = function(type, originalEvent) {
		var event = document.createEvent('CustomEvent');
		event.initEvent(type, false, true);

		if (originalEvent) {
			event.playerData = originalEvent.data;
			event.player = originalEvent.target;
			event.originalEvent = originalEvent;
		}

		return event;
	};

	Player.dispatchEvent = function(target, event) {
		target.dispatchEvent(event);
	};

	var $p = Player.prototype;

	/**
	 * Initialize the instance ownself.
	 * @param {Object} options
	 */
	$p.initialize = function(options) {
		this._currentTime = null;
		this.paused = null;

		this._initializeEventer();
		this._buildPlayer(options);
	};

	$p._buildPlayer = function(options) {
		Player.loadYTScript(Player.bind(this._setupVideo, this, options));
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
				onApiChange: Player.bind(this.onApiChang, this),
				onError: Player.bind(this.onError, this),
				onPlaybackQualityChange: Player.bind(this.onPlaybackQualityChange, this),
				onPlaybackRateChange: Player.bind(this.onPlaybackRateChange, this),
				onReady: Player.bind(this.onReady, this),
				onStateChange: Player.bind(this.onStateChange, this)
			}
		});
		this.el = this.player.getIframe();
	};

	$p._updateMeta = function() {
		this.duration = this.player.getDuration();
	};

	$p._observeProgress = function() {
		this._tmProgress = setInterval(Player.bind(function() {
			var time = this.player.getCurrentTime();
			if (time !== this._currentTime) {
				this._currentTime = time;
				this.trigger('progress');
			}
		}, this), 100);
	};

	$p._observeVolume = function() {
		this._tmVolume = setInterval(Player.bind(function() {
			var muted = this.player.isMuted();
			var volume = this.player.getVolume();
			if (muted !== this.muted || volume !== this.volume) {
				this.muted = muted;
				this.volume = volume;
				this.trigger('volumechange');
			}
		}, this), 100);
	};

	// ----------------------------------------------------------------
	// Events

	/**
	 * Attach an event handler function.
	 * @param {String} type A event type like `"play"`, '"progress"` or `"onReady"`.
	 * @param {Function} listener A function to execute when the event is triggered.
	 */
	$p.on = function(type, listener) {
		this._eventer.addEventListener(type, listener);
		return this;
	};

	/**
	 * Trigger an event.
	 * @param {String} type A event type like `"play"`, '"progress"` or `"onReady"`.
	 */
	$p.trigger = function(type) {
		var event = Player.createEvent(type);
		Player.dispatchEvent(this._eventer, event);
	};

	$p._triggerYtEvent = function(type, originalEvent) {
		var event = Player.createEvent(type, originalEvent);
		Player.dispatchEvent(this._eventer, event);
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

		this.paused = (state !== Player.PlayerState.PLAYING);

		if (state === Player.PlayerState.UNSTARTED) {
			this._triggerYtEvent('unstart', event);
		}
		else if (state === Player.PlayerState.PLAYING) {
			this._triggerYtEvent('play', event);
		}
		else if (state === Player.PlayerState.PAUSED) {
			this._triggerYtEvent('pause', event);
		}
		else if (state === Player.PlayerState.BUFFERING) {
			this._triggerYtEvent('buffer', event);
		}
		else if (state === Player.PlayerState.ENDED) {
			this._triggerYtEvent('end', event);
		}
	};

	// ----------------------------------------------------------------
	// Manip

	/**
	 * Play the video.
	 */
	$p.play = function() {
		this.player.playVideo();
	};

	/**
	 * Stop the video.
	 */
	$p.pause = function() {
		this.player.pauseVideo();
	};

	// ----------------------------------------------------------------
	// Properties

	/**
	 * Returns the current playback position, in seconds, as a position between zero time and the current duration.
	 * Can be set, to seek to the given time.
	 * @type number
	 */
	Player.defineProperty('currentTime', {
		get: function() {
			return this._currentTime;
		},
		set: function(value) {
			this.player.seekTo(this._currentTime=value, true);
		}
	});
})();
