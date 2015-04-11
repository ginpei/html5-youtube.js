(function() {
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

		var player = new YT.Player('ytapiplayer', {
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
			var videoId = '2EEsa_pqGAs';
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
