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
		// save the CSSStylesheet object
		if (!this._style) {
			this._style = document.styleSheets[document.styleSheets.length-1];
		}

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
	prototype._clearEventer = function() {
		// nothing to do
	};

	/**
	 * Overwrite for compat.
	 */
	prototype._buildPlayer = function(options) {
		var videoOptions = this._getVideoOptions(options);

		if (!videoOptions.videoId) {
			videoOptions.videoId = 'xxxxxxxxxxx';  // load dummy video
		}

		if (!window.swfobject) {
			throw new Error('swfobject is required. Use this code:\n<script src="//cdnjs.cloudflare.com/ajax/libs/swfobject/2.2/swfobject.js"></script>');
		}

		// set up ID
		this._originalElemId = videoOptions.el.id;
		var playerId = videoOptions.el.id = 'youtubejs' + Date.now();

		// save the target element to restore when destroyed
		this._elOriginal = videoOptions.el;

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

	prototype._destroyPlayer = function() {
		var elPlayer = this.player;

		// API's destroying
		this.player.destroy();
		this.player = null;

		// restore the elements
		var elOriginal = this._elOriginal;
		if (this._originalElemId) {
			elOriginal.id = this._originalElemId;
		}
		else {
			elOriginal.removeAttribute('id');
		}
		this._elOriginal = null;

		var elParent = elPlayer.parentNode;
		elParent.insertBefore(elOriginal, elPlayer);
		elParent.removeChild(elPlayer);

		// clear style
		this._clearYTStyle(elOriginal.id);

		this._elOriginal = null;
	};

	/**
	 * Clear style rules that were specified by YouTube API.
	 * @param {String} id
	 */
	prototype._clearYTStyle = function(id) {
		// API:
		// elStyle
		// └.sheet
		//   └.cssRules
		//     └[index]
		//       ├.selectorText
		//       └.style
		//         ├.length
		//         ├[index] as defined property's name
		//         └[type] as value
		//
		// example:
		//   var elStyle = document.querySelector('style');
		//   var stylesheet = elStyle.sheet;
		//   var rule = stylesheet.cssRules[0];
		//   var selector = rule.selectorText;
		//   var style = rule.style;
		//   var prop = style[0];
		//   var value = style['color'];

		var targetSelector = '#' + id;

		var stylesheet = Player._style;
		var rules = stylesheet.cssRules || stylesheet.rules;
		for (var i=0, l=rules.length; i<l; i++) {
			var rule = rules[i];
			var selector = rule.selectorText;
			if (selector === targetSelector) {
				if (stylesheet.deleteRule) {
					stylesheet.deleteRule(i);
				}
				else {
					stylesheet.removeRule(i);
				}
				break;
			}
		}
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
		this._pushListener(type, listener);
	};

	/**
	 * Overwrite for compat.
	 */
	prototype.removeEventListener = function(type, listener) {
		this._popListener(type, listener);
	};

	/**
	 * Overwrite for compat.
	 * @see https://github.com/ginpei/Osteoporosis.js/blob/ccf3380fef9f8fd850c44fa017ad863af2ddb9b7/osteoporosis.js#L56-L68
	 */
	prototype.trigger = function(type, originalEvent) {
		var event;

		// pick up listeners
		var events = this._events[type];
		if (!events) {
			return;
		}

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
		for (var i=0, l=events.length; i<l; i++) {
			var data = events[i];
			if (data) {
				data.binded(event);
			}
		}

		return this;
	};
})(window, document, window.youtube.Player);
