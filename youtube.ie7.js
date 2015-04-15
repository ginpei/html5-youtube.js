window.youtube.bind = function(fn, context) {
	var args = Array.prototype.slice.call(arguments, 2);
	return function() {
		var curArgs = args.concat(Array.prototype.slice.call(arguments));
		return fn.apply(context, curArgs);
	};
};

window.youtube._execDefineProperty = function() {
	var obj = this.prototype;
	var properties = this._undefinedProperties;
	for (var i=0, l=properties.length; i<l; i++) {
		var args = properties[i];
		var prop = args[0];
		var descriptor = args[1];
		obj[prop] = function(value) {
			if (arguments.length > 0) {
				descriptor.set.call(this, value);
				return value;
			}
			else {
				return descriptor.get.call(this);
			}
		};
	}
};

window.youtube.prototype._buildPlayer = function(options) {
	var that = this;

	if (!window.swfobject) {
		throw new Error('swfobject is required. Use this code:\n<script src="//cdnjs.cloudflare.com/ajax/libs/swfobject/2.2/swfobject.js"></script>');
	}

	// set up ID
	var playerId = options.el.id;
	if (!playerId) {
		playerId = options.el.id = 'youtubejs' + Date.now();
	}

	// callback
	window.onYouTubePlayerReady = function(playerId) {  // TODO: allow multiple callbacks
		// get player
		var player = that.player = document.getElementById(playerId);

		// binding
		var prefix = playerId.replace(/-/g, '_');
		var types = ['onApiChang', 'onError', 'onPlaybackQualityChange', 'onPlaybackRateChange', 'onReady', 'onStateChange'];
		for (var i=0, l=types.length; i<l; i++) {
			var type = types[i];
			var callbackName = prefix + type;
			window[callbackName] = window.youtube.bind(function(type, state) {
				try {  // error will be wasted by swf
					var event = { type:type, data:state, target:this };
					this[type](event);
				}
				catch (error) {
					console.error(error);
				}
			}, that, type);
			player.addEventListener(type, callbackName);
		}
	};

	// load
	// `fs=0` is required because fullscreen button does not work (OMG)
	var url = 'http://www.youtube.com/v/' + options.id +
		'?wmode=opaque&fs=0&enablejsapi=1&version=3&playerapiid=' + playerId;
	var params = { allowScriptAccess:'always',  wmode:'transparent' };
	var attr = { id:playerId };
	var height = 236;  // FIXME
	var width = 420;  // FIXME
	swfobject.embedSWF(url, playerId, width, height, '8', null, null, params, attr);
};

window.youtube.prototype._triggerYtEvent = function(type, originalEvent) {
	// TODO: support modern browsers
	var event = document.createEventObject('CustomEvent');
	// event.initEvent(type, false, true);
	event.playerData = originalEvent.data;
	event.player = originalEvent.target;
	event.originalEvent = originalEvent;

	this._eventer.detachEvent(event);
};
