Note: "youtube.js" has been renamed "html5-youtube.js".

# html5-youtube.js

YouTube Player API wrapper like HTML5 video API.

* [YouTube Player API Reference for iframe Embeds - YouTube — Google Developers](https://developers.google.com/youtube/iframe_api_reference)

## Usage

### Basic

See `examples/basic.html`.

```html
<div id="my-youtube-player" data-youtube-videoid="2EEsa_pqGAs"></div>
```

```js
var elPlayer = document.getElementById('my-youtube-player');

youtube({ el:elPlayer });
```

### Player

See `examples/player.html`.

```html
<div class="js-player"></div>
<div>
    <button class="js-play" disabled>Play</button>
    <button class="js-pause" disabled>Pause</button>
</div>
```

```js
(function() {
    var elPlayer = document.querySelector('.js-player');
    var elPlay = document.querySelector('.js-play');
    var elPause = document.querySelector('.js-pause');
    var videoId = '2EEsa_pqGAs';

    var player = youtube({ el:elPlayer, id:videoId })
        .on('ready', function(event) {
            player.play();
        })
        .on('play', function(event) {
            elPlay.disabled = true;
            elPause.disabled = false;
        })
        .on('pause', function(event) {
            elPlay.disabled = false;
            elPause.disabled = true;
        })
        .on('ended', function(event) {
            player.play();
        });

    elPlay.addEventListener('click', function(event) {
        player.play();
    });
    elPause.addEventListener('click', function(event) {
        player.pause();
    });
})();
```

## References

### Interface

#### `youtube(options)`

* `options.el` ... {Element} element that will be replaced with YouTube Player.
* `options.id` ... {String} video ID like `"2EEsa_pqGAs"`.
* `options.autoplay` ... {Boolean} start playing automatically if true. Optional. Default is `false`.
* `options.controls` ... {Boolean} show controll UIs if true. Optional. Default is `true`.
* returns ... {Player}

```js
var el = document.querySelector('#the-player');
var videoId = '2EEsa_pqGAs';
var player = youtube({ el:el, id:videoId });
player.addEventListener('ready', function(event) {
    this.play();
});
```

### Methods

#### `play()`

Start playing a video.

#### `pause()`

Stop playing a video.

#### `addEventListener(type, listener)`

Set an event listener.

* `type` ... {string} event name.
* `listener` ... {Function} event listener.

#### `removeEventListener(type, listener)`

Remove an event listener.

* `type` ... {string} event name.
* `listener` ... {Function} event listener.

#### `on(type, listener)`

Shortcut for `addEventListener()`. This method is chainable.

* `type` ... {string} event name.
* `listener` ... {Function} event listener.
* returns ... {Player}

#### `off(type, listener)`

Shortcut for `removeEventListener()`. This method is chainable.

* `type` ... {string} event name.
* `listener` ... {Function} event listener.
* returns ... {Player}

#### `destroy()`

Remove player.

The target element is restored, event listeners are detached, player properties are cleared.

### Properties

#### `player`

Original YouTube Player object.

* type ... YT.Player

#### `duration`

How long time in seconds of the currently playing video.

* type ... Number

#### `currentSrc`

YouTube.com URL for the currently loaded/playing video.

* type ... String

#### `paused`

True if playback is paused; false otherwise.

* type ... Boolean

#### `ended`

True if playback has reached the end

* type ... Boolean

### Functional Properties

Properties are implemented as getter and setter functions.

```js
var currentTime = player.currentTime;  // getter
player.currentTime = 123;  // setter
```

If you use `youtube.compat.js`, these getter and setter are changed to just functions.

```js
var currentTime = player.currentTime();  // getter
player.currentTime(123);  // setter
```

#### `currentTime`

* type ... Number

Returns the current playback position, in seconds, as a position between zero time and the current duration.

Can be set, to seek to the given time.

Updated with progress.

#### `volume`

* type ... Number

Returns the current playback volume multiplier, as a number in the range 0.0 to 1.0, where 0.0 is the quietest and 1.0 the loudest.

Can be set, to change the volume multiplier.

#### `muted`

* type ... Boolean

Returns true if all audio is muted (regardless of other attributes either on the controller or on any media elements slaved to this controller), and false otherwise.

Can be set, to change whether the audio is muted or not.

#### `playbackRate`

* type ... Number

Returns the current rate of playback.

Can be set, to change the rate of playback.

This value is NOT available in compat mode. (Always `1`)

#### `src`

YouTube.com URL for the loaded/playing video.

Can be set, to change the video.

* type ... String

### Events

Type            |When
----------------|------------------------------------
`ready`         |The player is ready to use.
`error`         |Any error is occurred.
`emptied`       |The video is refreshed.
`canplay`       |The video is ready to play.
`canplaythrough`|The video is ready to play.
`playing`       |Started playing.
`ended`         |Finished playing.
`durationchange`|Duration is changed.
`timeupdate`    |Current playback time is changed.
`play`          |Started playing.
`pause`         |Stopped playing.
`ratechange`    |Playback rate is changed.
`volumechange`  |Volume is changed, muted or unmuted.

### Compatibility With HTML5 Video API

* ✔ = Compatible (or almost)
* △ = Similar (but not compatible)
* ✘ = Not supported
* ☆ = Original feature
* ? = Ah, let me see...

Function               |Status|Description
-----------------------|------|-----------
`addEventListener()`   |✔|
`destroy()`            |☆|
`off()`                |☆|Simple shortcut for `removeEventListener()`
`on()`                 |☆|Simple shortcut for `addEventListener()`
`pause()`              |✔|
`play()`               |✔|
`removeEventListener()`|✔|
`currentSrc`           |✔|
`currentTime`          |✔|
`duration`             |✔|
`ended`                |✔|
`muted`                |✔|
`paused`               |✔|
`playbackRate`         |△|Only `0.25`, `0.5`, `1`, `1.5`, or `2` ([Check YouTube API](https://developers.google.com/youtube/js_api_reference#Playback_rate))
`player`               |☆|
`src`                  |✔|
`volume`               |✔|
`canplay` event        |△|Same as YouTube `onReady` event
`canplaythrough` event |△|Same as YouTube `onReady` event
`durationchange` event |✔|
`emptied` event        |?|
`ended` event          |✔|
`error` event          |✔|Same as YouTube `onError` event
`muted` event          |✔|
`pause` event          |✔|
`play` event           |✔|
`playing` event        |?|
`progress` event       |✘|
`ratechange` event     |✔|
`ready` event          |☆|
`seeked` event         |✘|
`seeking` event        |✘|
`src` event            |✔|
`timeupdate` event     |✔|
`volumechange` event   |✔|

## Browsers

* IE 9+
* Modern PC Browsers

### Support IE 7, 8

Use with `youtube.compat.js`. See `examples/full-player.compat.html`.

```html
<script src="html5-youtube.js"></script>
<script src="html5-youtube.compat.js"></script>
<script>
var player = youtube({ ... });
</script>
```

Compatible mode forces some rules.

* `options.autoplay` is not available in [initializing](#youtubeoptions).
* `options.controls` is not available in [initializing](#youtubeoptions).
* Functional properties have another interfaces. See [its section](#functional-properties).

## History

* 2015-10-04: v1.0.1
    * Update minified files (OMG)
    * Rename from "youtube.js" to "html5-youtube.js"
* 2015-09-29: v1.0.0
    * First Release

## License

* MIT License

## Contact

* by Ginpei
* GitHub: [ginpei/html5-youtube.js](https://github.com/ginpei/html5-youtube.js)
* Twitter: [@ginpei\_en &#x1F1E8;&#x1F1E6;](https://twitter.com/ginpei_en) or [@ginpei\_jp &#x1F1EF;&#x1F1F5;](https://twitter.com/ginpei_jp)
