# youtube.js

YouTube HTML5 API wrapper.

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
