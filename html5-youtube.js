/*! @license youtube.js by Ginpei https://github.com/ginpei/youtube.js MIT License */

/* global YT */
(function(window, document) {
	/**
	 * The interface.
	 */
	window.youtube = function(options) {
		return new Player(options);
	};

	/**
	 * The constructor.
	 */
	var Player = window.youtube.Player = function(options) {
		// define property's getters and setters if they have not yet
		if (Player._undefinedProperties) {
			Player._execDefineProperties();
			delete Player._undefinedProperties;
		}

		this.initialize(options);
	};

	/**
	 * The definition of available playbackRate values on YouTube API.
	 * @see https://developers.google.com/youtube/js_api_reference#Playback_rate
	 */
	window.youtube.availablePlaybackRates = [0.25, 0.5, 1, 1.5, 2];

	// shortcut
	var prototype = Player.prototype;

	// ----------------------------------------------------------------
	// Statics

	/**
	 * These values are used to detect states in onStateChange event.
	 * They are same as YouTube API's `YT.PlayerState`.
	 * @see https://developers.google.com/youtube/iframe_api_reference#onStateChange
	 */
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
	 * Execute property definig for stored values in `_undefinedProperties`.
	 * This method is called only once when the first instance is created.
	 */
	Player._execDefineProperties = function() {
		var obj = this.prototype;
		var properties = this._undefinedProperties;
		for (var name in properties) {
			this._execDefineProperty(obj, name, properties[name]);
		}
	};

	/**
	 * Proxy for `Object.defineProperty`.
	 * It can be placed for compat.
	 */
	Player._execDefineProperty = function(obj, prop, descriptor) {
		Object.defineProperty(obj, prop, descriptor);
	};

	/**
	 * Load YouTube API script.
	 * @param {Function} callback
	 */
	Player.prepareYTScript = function(callback) {
		// Status is changed as: initial->loading->ready.
		// * The callback will run later if initial
		// * The callback is queued and will run if loading
		// * The callback run immediately if ready
		//

		var status = this._ytStatus;
		if (status === undefined) {  // initial; not started
			// initialize the callback queue
			var callbacks = this._ytCallbacks = [];
			callbacks.push(callback);

			// load YouTube script
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

	// ----------------------------------------------------------------
	// Constructing

	/**
	 * Initialize the instance ownself.
	 * @param {Object} options
	 */
	prototype.initialize = function(options) {
		if (!this.player) {
			this._events = [];
			this._resetProperties();

			this._initializeEventer();
			this._buildPlayer(options);
		}
	};

	/**
	 * Good bye!
	 */
	prototype.destroy = function() {
		if (this.player) {
			this._removeAllEventListeners();
			this._clearEventer();
			this._stopAllObservings();
			this._resetProperties();
			this._destroyPlayer();
		}
	};

	/**
	 * Load YouTube API and setup video UI.
	 * It can be placed for compat.
	 * @param {Object} options
	 */
	prototype._buildPlayer = function(options) {
		Player.prepareYTScript(Player.bind(this._setupVideo, this, options));
	};

	/**
	 * @see #destroy
	 */
	prototype._destroyPlayer = function() {
		this.player.destroy();
		this.player = null;
	};

	/**
	 * YT.Player has add/removeEventListener methods but they doesn't work correctly
	 * It can be placed for compat.
	 */
	prototype._initializeEventer = function() {
		this._eventer = document.createElement('ytapiplayer');
		document.body.appendChild(this._eventer);
	};

	/**
	 * It can be placed for compat.
	 * @see #destroy
	 */
	prototype._clearEventer = function() {
		document.body.removeChild(this._eventer);
		this._eventer = null;
	};

	/**
	 * Setup viode UI.
	 * @param {Object} options
	 */
	prototype._setupVideo = function(options) {
		var videoOptions = this._getVideoOptions(options);
		this.player = this._createPlayer(videoOptions.el, {
			events: this._getVideoEvents(),
			height: videoOptions.height,
			playerVars: videoOptions.playerVars,
			videoId: videoOptions.videoId,
			width: videoOptions.width
		});
	};

	prototype._getVideoOptions = function(options) {
		var el = options && options.el;
		if (!el || !el.getAttribute) {
			throw new Error('`options.el` is require.');
		}
		var videoId = options.id || el.getAttribute('data-youtube-videoid');
		var autoplay = this._getBooleanOption(options, 'autoplay', 0);
		var controls = this._getBooleanOption(options, 'controls', 1);

		var width;
		var height = el.clientHeight;
		if (height) {
			width  = el.clientWidth;
		}
		else {
			height = 390;
			width = 640;
		}

		return {
			el: el,
			height: height,
			playerVars: {
				autoplay: autoplay,
				controls: controls
			},
			videoId: videoId,
			width: width
		};
	};

	prototype._getBooleanOption = function(options, name, defaultValue) {
		var value;

		if (options[name] == undefined) {  // or null
			value = options.el.getAttribute('data-youtube-' + name);
		}
		else {
			value = options[name];
		}

		if (typeof value == 'boolean') {
			// OK, nothing to do
		}
		else if (value == undefined) {  // or null
			value = defaultValue;
		}
		else {
			value = !!parseInt(value, 10);
		}

		value = (value ? 1 : 0);

		return value;
	};

	prototype._getVideoEvents = function() {
		var events = {};

		[
			'onApiChange',
			'onError',
			'onPlaybackQualityChange',
			'onPlaybackRateChange',
			'onReady',
			'onStateChange',
		].forEach(function(type, index) {
			events[type] = Player.bind(this[type], this);
		}.bind(this));

		return events;
	};

	prototype._createPlayer = function(el, options) {
		return new YT.Player(el, options);
	};

	// ----------------------------------------------------------------
	// Events

	/**
	 * Attach an event handler function.
	 * @param {String} type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
	 * @param {Function} listener A function to execute when the event is triggered.
	 * @see {#removeEventListener}
	 */
	prototype.addEventListener = function(type, listener) {
		var binded = this._pushListener(type, listener);
		this._eventer.addEventListener(type, binded);
	};

	/**
	 * Dettach an event handler function.
	 * @param {String} type
	 * @param {Function} listener
	 * @see {#addEventListener}
	 */
	prototype.removeEventListener = function(type, listener) {
		var data = this._popListener(type, listener);
		if (data) {
			this._eventer.removeEventListener(type, data.binded);
		}
	};

	/**
	 * A shortcut for `addEventListener` and returns `this`.
	 * You can use method chaining.
	 * @param {String} type
	 * @param {Function} listener
	 * @returns {Player}
	 */
	prototype.on = function(type, listener) {
		this.addEventListener(type, listener);
		return this;
	};

	/**
	 * A shortcut for `removeEventListener` and returns `this`.
	 * You can use method chaining.
	 * @param {String} type
	 * @param {Function} listener
	 * @returns {Player}
	 */
	prototype.off = function(type, listener) {
		this.removeEventListener(type, listener);
		return this;
	};

	/**
	 * Trigger an event.
	 * It can be placed for compat.
	 * @param {String} type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
	 */
	prototype.trigger = function(type, originalEvent) {
		var event = document.createEvent('CustomEvent');
		event.initEvent(type, false, true);
		event.player = this;

		if (originalEvent) {
			event.playerData = originalEvent.data;
			event.originalEvent = originalEvent;
		}

		this._eventer.dispatchEvent(event);
	};

	/**
	 * @see #destroy
	 */
	prototype._removeAllEventListeners = function() {
		var allEvents = this._events;
		for (var type in allEvents) {
			var events = allEvents[type];
			for (var i=0, l=events.length; i<l; i++) {
				var data = events[i];
				if (data) {
					this.removeEventListener(type, data.listener);
					delete data.listener;
					delete data.binded;
					events[i] = null;
				}
			}
			delete allEvents[type];
		}
	};

	prototype._pushListener = function(type, listener) {
		var binded = Player.bind(listener, this);

		var events = this._events[type];
		if (!events) {
			events = this._events[type] = [];
		}

		events.push({
			binded: binded,
			listener: listener
		});

		return binded;
	};

	prototype._popListener = function(type, listener) {
		var events = this._events[type];
		if (events) {
			for (var i=0, l=events.length; i<l; i++) {
				var data = events[i];
				if (data && data.listener === listener) {
					events[i] = null;
					return data;
				}
			}
		}
		return undefined;
	};

	prototype.onApiChange = function(event) {
		this.trigger('onApiChange', event);
	};

	/**
	 * @param {Number} event.playerData The error ID.
	 * @see https://developers.google.com/youtube/iframe_api_reference#onError
	 */
	prototype.onError = function(event) {
		this.trigger('onError', event);
		this.trigger('error', event);
	};

	prototype.onPlaybackQualityChange = function(event) {
		this.trigger('onPlaybackQualityChange', event);
	};

	prototype.onPlaybackRateChange = function(event) {
		this.trigger('onPlaybackRateChange', event);
	};

	prototype.onReady = function(event) {
		this.trigger('onReady', event);

		if (this._unsetVideoId) {
			this.player.cueVideoById(this._unsetVideoId);
			delete this._unsetVideoId;
		}

		this._updateMeta();
		this._observeTimeUpdate();
		this._observeVolume();
		this._observePlaybackRate();
		this._observeDuration();
		this.trigger('ready', event);
		this.trigger('canplay', event);
		this.trigger('canplaythrough');
	};

	prototype.onStateChange = function(event) {
		this.trigger('onStateChange', event);

		var state = event.data;

		this.played = this.paused = this.ended = false;

		if (state === Player.PlayerState.UNSTARTED) {
			this.trigger('emptied', event);
		}
		else if (state === Player.PlayerState.ENDED) {
			this.ended = true;
			this.trigger('ended', event);
		}
		else if (state === Player.PlayerState.PLAYING) {
			this.played = true;
			this.trigger('play', event);
			this.trigger('playing', event);
		}
		else if (state === Player.PlayerState.PAUSED) {
			this.paused = true;
			this.trigger('pause', event);
		}
		else if (state === Player.PlayerState.BUFFERING) {
			this.trigger('buffer', event);
		}
		else if (state === Player.PlayerState.CUED) {
			this._updateMeta();
			this.trigger('canplay');
			this.trigger('canplaythrough');
		}
	};

	// ----------------------------------------------------------------
	// Manip

	/**
	 * Play the video.
	 */
	prototype.play = function() {
		if (this.player) {
			this.player.playVideo();
		}
	};

	/**
	 * Stop the video.
	 */
	prototype.pause = function() {
		if (this.player) {
			this.player.pauseVideo();
		}
	};

	/**
	 * This function returns the set of playback rates in which the current video is available. The default value is 1, which indicates that the video is playing in normal speed.
	 *
	 * The function returns an array of numbers ordered from slowest to fastest playback speed. Even if the player does not support variable playback speeds, the array should always contain at least one value (1).
	 * @returns {Array}
	 * @see https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates
	 */
	prototype.getAvailablePlaybackRates = function() {
		if (this.player) {
			return this.player.getAvailablePlaybackRates();
		}
		else {
			return undefined;
		}
	};

	// ----------------------------------------------------------------
	// Properties

	prototype._updateMeta = function() {
		this._src = this.currentSrc = this.player.getVideoUrl();
	};

	/**
	 * Start observing timeupdate's change.
	 */
	prototype._observeTimeUpdate = function() {
		this._tmTimeUpdate = setInterval(Player.bind(function() {
			var time = this.player.getCurrentTime();
			if (time !== this._currentTime) {
				this._currentTime = time;
				this.trigger('timeupdate');
			}
		}, this), 100);
	};

	/**
	 * Start observing volume's change.
	 */
	prototype._observeVolume = function() {
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

	/**
	 * Start observing playbackRate's change.
	 */
	prototype._observePlaybackRate = function() {
		this._tmPlaybackRate = setInterval(Player.bind(function() {
			var playbackRate = this.player.getPlaybackRate();
			if (playbackRate !== this._playbackRate) {
				this._playbackRate = playbackRate;
				this.trigger('ratechange');
			}
		}, this), 100);
	};

	/**
	 * Start observing duration's change.
	 */
	prototype._observeDuration = function() {
		this._tmDuration = setInterval(Player.bind(function() {
			var duration = this.player.getDuration() || 0;
			if (duration !== this.duration) {
				this.duration = duration;
				this.trigger('durationchange');
			}
		}, this), 100);
	};

	/**
	 * @see #destroy
	 */
	prototype._stopAllObservings = function() {
		clearInterval(this._tmTimeUpdate);
		clearInterval(this._tmVolume);
		clearInterval(this._tmPlaybackRate);
		clearInterval(this._tmDuration);
	};

	prototype._resetProperties = function() {
		this._currentTime = null;
		this._volume = null;
		this._muted = null;
		this._playbackRate = null;
		this._src = null;
		this.duration = null;
		this.currentSrc = null;
		this.played = null;
		this.paused = null;
		this.ended = null;
	};

	/**
	 * Definitions are stored here.
	 * @type Array
	 */
	Player._undefinedProperties = {
		/**
		 * Returns the current playback position, in seconds, as a position between zero time and the current duration.
		 * Can be set, to seek to the given time.
		 * @type number
		 */
		currentTime: {
			get: function() {
				return this._currentTime;
			},
			set: function(value) {
				if (this.player) {
					this.player.seekTo(value, true);
				}
			}
		},

		/**
		 * Returns the current playback volume multiplier, as a number in the range 0.0 to 1.0, where 0.0 is the quietest and 1.0 the loudest.
		 * Can be set, to change the volume multiplier.
		 * @type number
		 */
		volume: {
			get: function() {
				return this._volume / 100;
			},
			set: function(value) {
				if (this.player) {
					this.player.setVolume(value * 100);
				}
			}
		},

		/**
		 * Returns true if all audio is muted (regardless of other attributes either on the controller or on any media elements slaved to this controller), and false otherwise.
		 * Can be set, to change whether the audio is muted or not.
		 * @type number
		 */
		muted: {
			get: function() {
				return this._muted;
			},
			set: function(value) {
				if (this.player) {
					this.player[value?'mute':'unMute']();
				}
			}
		},

		/**
		 * Returns the default rate of playback, for when the user is not fast-forwarding or reversing through the media resource.
		 * Can be set, to change the default rate of playback.
		 * @type number
		 */
		playbackRate: {
			get: function() {
				return this._playbackRate;
			},
			set: function(value) {
				if (this.player) {
					this.player.setPlaybackRate(value);
				}
			}
		},

		/**
		 * Returns the address of the current media resource.
		 * Can be set, to change the video URL.
		 * @type number
		 */
		src: {
			get: function() {
				return this._src;
			},
			set: function(value) {
				if (this.player) {
					this.player.cueVideoById(value);
				}
				else {
					this._unsetVideoId = value;
				}
			}
		}
	};
})(window, document);
