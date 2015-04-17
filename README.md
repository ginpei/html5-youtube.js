# youtube.js

YouTube Player API wrapper.

## Usage

### Basic

```html
<div id="my-youtube-player"></div>
```

```js
var elPlayer = document.getElementById('my-youtube-player');
var videoId = '2EEsa_pqGAs';

youtube({ el:elPlayer, id:videoId });
```

### Player

```html
<div class="js-player" data-youtube-videoid="2EEsa_pqGAs"></div>
<div>
    <button class="js-play" disabled>Play</button>
    <button class="js-pause" disabled>Pause</button>
</div>
```

```js
(function() {
    var elPlayer = document.querySelector('.js-player');
    var videoId = elPlayer.getAttribute('data-youtube-videoid');
    var elPlay = document.querySelector('.js-play');
    var elPause = document.querySelector('.js-pause');

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
        .on('end', function(event) {
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

### player

The original YouTube Player object.

* `YT.Player`

See: [YouTube Player API Reference for iframe Embeds](https://developers.google.com/youtube/iframe_api_reference).

### el

The element that owned by the original YouTube Player object.

* `HTMLIFrameElement`

It is equal to the result of `player.getIframe()`.

### paused

Playing or not.

* `boolean`

### duration

* `number`

### currentTime

* `number`

Updated with progress.

### volume

* `number`

### play()

Start playing a video.

* returns ... {undefined}

### pause()

Stop playing a video.

* returns ... {undefined}

### on(type, listener)

Set an event listener.

* `type` ... {string} event name.
* `listener` ... {Function} event listener.
* returns ... {undefined}

### trigger(type)

Fire the event.

* `type` ... {string} event name.
* returns ... {undefined}
