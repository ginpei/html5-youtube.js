(function(window, document) {
	window.youtube = function(options) {
		var player = new Player(options);
		// player.play();
		return player;
	};

	var Player = window.youtube.Player = function(options) {
		if (Player._undefinedProperties) {
			Player._execDefineProperties();
			delete Player._undefinedProperties;
		}

		return this.initialize(options);
	};

	Player.PlayerState = { UNSTARTED:-1, ENDED:0, PLAYING:1, PAUSED:2, BUFFERING:3, CUED:5 };

	/**
	 * Proxy for `Function#bind`.
	 * It can be placed for compat.
	 * @param {Function} fn
	 * @returns {Function}
	 */
	Player.bind = function(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return Function.prototype.bind.apply(fn, args);
	};

	/**
	 * Proxy for `Object.defineProperty`.
	 * @param {Array} definitions
	 * @param {String} definitions[].name Property's name.
	 * @param {Function} definitions[].get
	 * @param {Function} definitions[].set
	 */
	Player.defineProperties = function(definitions) {
		for (var i=0, l=definitions.length; i<l; i++) {
			Player._undefinedProperties.push(definitions[i]);
		}
	};

	Player._execDefineProperties = function() {
		// This method is called only once when the first instance is created.

		var obj = this.prototype;
		var properties = this._undefinedProperties;
		for (var i=0, l=properties.length; i<l; i++) {
			var definition = properties[i];
			this._execDefineProperty(obj, definition.name, definition);
		}
	};

	/**
	 * Proxy for `Object.defineProperty`.
	 * It can be placed for compat.
	 */
	Player._execDefineProperty = function(obj, prop, descriptor) {
		Object.defineProperty(obj, prop, descriptor);
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

	/**
	 * It can be placed for compat.
	 */
	$p._buildPlayer = function(options) {
		Player.loadYTScript(Player.bind(this._setupVideo, this, options));
	};

	/**
	 * YT.Player has add/removeEventListener methods but they doesn't work correctly
	 * It can be placed for compat.
	 */
	$p._initializeEventer = function() {
		this._eventer = document.createElement('ytapiplayer');
		document.body.appendChild(this._eventer);
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
				onApiChange: Player.bind(this.onApiChange, this),
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
		this.src = this.currentSrc = this.player.getVideoUrl();
		this.duration = this.player.getDuration();
	};

	$p._observeTimeUpdate = function() {
		this._tmTimeUpdate = setInterval(Player.bind(function() {
			var time = this.player.getCurrentTime();
			if (time !== this._currentTime) {
				this._currentTime = time;
				this.trigger('timeupdate');
			}
		}, this), 100);
	};

	$p._observeVolume = function() {
		this._tmVolume = setInterval(Player.bind(function() {
			var muted = this.player.isMuted();
			var volume = this.player.getVolume();
			if (muted !== this._muted || volume !== this._volume) {
				this._muted = muted;
				this._volume = volume;
				this.trigger('volumechange');
			}
		}, this), 100);
	};

	$p._observePlaybackRate = function() {
		this._tmPlaybackRate = setInterval(Player.bind(function() {
			var playbackRate = this.player.getPlaybackRate();
			if (playbackRate !== this._playbackRate) {
				this._playbackRate = playbackRate;
				this.trigger('ratechange');
			}
		}, this), 100);
	};

	// ----------------------------------------------------------------
	// Events

	/**
	 * Attach an event handler function.
	 * It can be placed for compat.
	 * @param {String} type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
	 * @param {Function} listener A function to execute when the event is triggered.
	 */
	$p.on = function(type, listener) {
		this._eventer.addEventListener(type, Player.bind(listener, this));
		return this;
	};

	/**
	 * Trigger an event.
	 * It can be placed for compat.
	 * @param {String} type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
	 */
	$p.trigger = function(type, originalEvent) {
		var event = document.createEvent('CustomEvent');
		event.initEvent(type, false, true);
		event.player = this;

		if (originalEvent) {
			event.playerData = originalEvent.data;
			event.originalEvent = originalEvent;
		}

		this._eventer.dispatchEvent(event);
	};

	$p.onApiChange = function(event) {
		this.trigger('onApiChange', event);
	};

	/**
	 * @param {Number} event.playerData The error ID.
	 * @see https://developers.google.com/youtube/iframe_api_reference#onError
	 */
	$p.onError = function(event) {
		this.trigger('onError', event);
		this.trigger('error', event);
	};

	$p.onPlaybackQualityChange = function(event) {
		this.trigger('onPlaybackQualityChange', event);
	};

	$p.onPlaybackRateChange = function(event) {
		this.trigger('onPlaybackRateChange', event);
	};

	$p.onReady = function(event) {
		this.trigger('onReady', event);
		this._updateMeta();
		this._observeTimeUpdate();
		this._observeVolume();
		this._observePlaybackRate();
		this.trigger('ready', event);
		this.trigger('canplay', event);
	};

	$p.onStateChange = function(event) {
		this.trigger('onStateChange', event);

		var state = event.data;

		this.played = this.paused = this.ended = false;

		if (state === Player.PlayerState.UNSTARTED) {
			this.trigger('unstart', event);
		}
		else if (state === Player.PlayerState.PLAYING) {
			this.played = true;
			this.trigger('play', event);
		}
		else if (state === Player.PlayerState.PAUSED) {
			this.paused = true;
			this.trigger('pause', event);
		}
		else if (state === Player.PlayerState.BUFFERING) {
			this.trigger('buffer', event);
		}
		else if (state === Player.PlayerState.ENDED) {
			this.ended = true;
			this.trigger('end', event);
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

	/**
	 * This function returns the set of playback rates in which the current video is available. The default value is 1, which indicates that the video is playing in normal speed.
	 *
	 * The function returns an array of numbers ordered from slowest to fastest playback speed. Even if the player does not support variable playback speeds, the array should always contain at least one value (1).
	 * @returns {Array}
	 * @see https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates
	 */
	$p.getAvailablePlaybackRates = function() {
		return this.player.getAvailablePlaybackRates();
	};

	// ----------------------------------------------------------------
	// Properties

	Player.defineProperties([
		/**
		 * Returns the current playback position, in seconds, as a position between zero time and the current duration.
		 * Can be set, to seek to the given time.
		 * @type number
		 */
		{
			name: 'currentTime',
			get: function() {
				return this._currentTime;
			},
			set: function(value) {
				this.player.seekTo(value, true);
			}
		},

		/**
		 * Returns the current playback volume multiplier, as a number in the range 0.0 to 1.0, where 0.0 is the quietest and 1.0 the loudest.
		 * Can be set, to change the volume multiplier.
		 * @type number
		 */
		{
			name: 'volume',
			get: function() {
				return this._volume / 100;
			},
			set: function(value) {
				this.player.setVolume(value * 100);
			}
		},

		/**
		 * Returns true if all audio is muted (regardless of other attributes either on the controller or on any media elements slaved to this controller), and false otherwise.
		 * Can be set, to change whether the audio is muted or not.
		 * @type number
		 */
		{
			name: 'muted',
			get: function() {
				return this._muted;
			},
			set: function(value) {
				this.player[value?'mute':'unMute']();
			}
		},

		/**
		 * Returns the default rate of playback, for when the user is not fast-forwarding or reversing through the media resource.
		 * Can be set, to change the default rate of playback.
		 * @type number
		 */
		{
			name: 'playbackRate',
			get: function() {
				return this._playbackRate;
			},
			set: function(value) {
				this.player.setPlaybackRate(value);
			}
		}
	]);
})(window, document);
