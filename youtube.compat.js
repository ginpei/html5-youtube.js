(function(window, document, Player) {
	var f_slice = Array.prototype.slice;

	// shortcut
	var prototype = Player.prototype;

	// ----------------------------------------------------------------
	// Statics

	/**
	 * Overwrite for compat.
	 */
	Player.bind = function(fn, context) {
		var args = f_slice.call(arguments, 2);
		return function() {
			var curArgs = args.concat(f_slice.call(arguments));
			return fn.apply(context, curArgs);
		};
	};

	/**
	 * Overwrite for compat.
	 */
	Player._execDefineProperty = function(obj, prop, descriptor) {
		obj[prop] = function(value) {
			if (arguments.length > 0) {
				descriptor.set.call(this, value);
				return value;
			}
			else {
				return descriptor.get.call(this);
			}
		};
	};

	/**
	 * Register a callback for initializing.
	 * @param {String} playerId
	 * @param {Player} player
	 */
	Player.registerYouTubePlayerReady = function(playerId, player) {
		if (!window.onYouTubePlayerReady) {
			window.onYouTubePlayerReady = this.bind(this.onYouTubePlayerReady, this);
			this._callbacksForYouTubePlayerReady = {};
		}
		this._callbacksForYouTubePlayerReady[playerId] = player;
	};

	/**
	 * The unified callback for YouTube API Player.
	 * It is called by YouTube API when it is completly loaded.
	 * @param {String} playerId
	 * @see registerYouTubePlayerReady
	 */
	Player.onYouTubePlayerReady = function(playerId) {
		var player = this._callbacksForYouTubePlayerReady[playerId];
		player.onYouTubePlayerReady(playerId);
	};

	// ----------------------------------------------------------------
	// Constructing

	/**
	 * Overwrite for compat.
	 */
	prototype._initializeEventer = function() {
		// nothing to do
	};

	/**
	 * Overwrite for compat.
	 */
	prototype._buildPlayer = function(options) {
		var videoOptions = this._getVideoOptions(options);

		if (!window.swfobject) {
			throw new Error('swfobject is required. Use this code:\n<script src="//cdnjs.cloudflare.com/ajax/libs/swfobject/2.2/swfobject.js"></script>');
		}

		// set up ID
		var playerId = videoOptions.el.id;
		if (!playerId) {
			playerId = vieoOptions.el.id = 'youtubejs' + Date.now();
		}

		// callback
		Player.registerYouTubePlayerReady(playerId, this);

		// load
		// `fs=0` is required because fullscreen button does not work (OMG)
		var url = 'http://www.youtube.com/v/' + videoOptions.videoId +
			'?wmode=opaque&fs=0&enablejsapi=1&version=3&playerapiid=' + playerId;
		var params = { allowScriptAccess:'always',  wmode:'transparent' };
		var attr = { id:playerId };
		swfobject.embedSWF(url, playerId, videoOptions.width, videoOptions.height, '8', null, null, params, attr);
	};

	/**
	 * A callback that is called when YouTube API is ready.
	 * @param {String} playerId
	 * @see Player.registerYouTubePlayerReady
	 */
	prototype.onYouTubePlayerReady = function(playerId) {
		var player = this.player = document.getElementById(playerId);

		var prefix = playerId.replace(/-/g, '_');
		this._registerVideoEvents(player, prefix);

		var event = { type:'onReady', data:null, target:player };
		this.onReady(event);
	};

	/**
	 * Register callbacks for YouTube APIs.
	 * @param {Player} player
	 * @param {String} prefix
	 * @see #_registerVideoEvent
	 */
	prototype._registerVideoEvents = function(player, prefix) {
		this._registerVideoEvent(player, prefix, 'onApiChang');
		this._registerVideoEvent(player, prefix, 'onError');
		this._registerVideoEvent(player, prefix, 'onPlaybackQualityChange');
		this._registerVideoEvent(player, prefix, 'onPlaybackRateChange');
		this._registerVideoEvent(player, prefix, 'onReady');
		this._registerVideoEvent(player, prefix, 'onStateChange');
	};

	/**
	 * Register a specified callback for YouTube APIs.
	 * @param {Player} player
	 * @param {String} prefix
	 * @param {String} type
	 */
	prototype._registerVideoEvent = function(player, prefix, type) {
		var callbackName = prefix + type;
		player.addEventListener(type, callbackName);
		window[callbackName] = Player.bind(function(type, data) {
			try {  // error will be wasted by swf
				var event = { type:type, data:data, target:this };
				this[type](event);
			}
			catch (error) {
				console.error(error);
			}
		}, this, type);
	};

	// ----------------------------------------------------------------
	// Events

	/**
	 * Overwrite for compat.
	 * @see https://github.com/ginpei/Osteoporosis.js/blob/ccf3380fef9f8fd850c44fa017ad863af2ddb9b7/osteoporosis.js#L36-L54
	 */
	prototype.addEventListener = function(type, listener) {
		var allListeners = this._listeners;
		if (!allListeners) {
			allListeners = this._listeners = {};
		}

		var listeners = allListeners[type];
		if (!listeners) {
			listeners = allListeners[type] = [];
		}

		listeners.push(listener);
	};

	/**
	 * Overwrite for compat.
	 * @see https://github.com/ginpei/Osteoporosis.js/blob/ccf3380fef9f8fd850c44fa017ad863af2ddb9b7/osteoporosis.js#L56-L68
	 */
	prototype.trigger = function(type, originalEvent) {
		var event;

		// wrap specified event object
		if (document.createEvent) {
			event = document.createEvent('CustomEvent');
			event.initEvent(type, false, true);
		}
		else {
			event = document.createEventObject();
			event.type = type;
		}
		event.player = this;

		if (originalEvent) {
			event.playerData = originalEvent.data;
			event.originalEvent = originalEvent;
		}

		// execute triggering
		var allListeners = this._listeners;
		if (allListeners && allListeners[type]) {
			var listeners = allListeners[type];
			for (var i=0, l=listeners.length; i<l; i++) {
				listeners[i].call(null, event);
			}
		}

		return this;
	};
})(window, document, window.youtube.Player);
