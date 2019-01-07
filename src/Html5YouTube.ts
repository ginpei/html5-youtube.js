/**
 * These values are used to detect states in onStateChange event.
 * They are same as YouTube API's `YT.PlayerState`.
 * @see https://developers.google.com/youtube/iframe_api_reference#onStateChange
 */
enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

const ytPlayerVars = [
  'autohide',
  'autoplay',
  'cc_load_policy',
  'color',
  'controls',
  'disablekb',
  'enablejsapi',
  'end',
  'fs',
  'hl',
  'iv_load_policy',
  'list',
  'listType',
  'loop',
  'modestbranding',
  'origin',
  'playerapiid',
  'playlist',
  'playsinline',
  'rel',
  'showinfo',
  'start',
  'theme',
];

export interface IOptions {
  [key: string]: any; // TODO maybe ytPlayerVars
  el: HTMLElement;
  id: string;
}

interface IYTEvent extends CustomEvent {
  originalEvent?: any;
  player?: Html5YouTube;
  playerData?: any;
}

export default class Html5YouTube {
  /**
   * The definition of available playbackRate values on YouTube API.
   * @see https://developers.google.com/youtube/js_api_reference#Playback_rate
   */
  // TODO maybe 1.25 and 1.75 available
  public static availablePlaybackRates = [0.25, 0.5, 1, 1.5, 2];

  private static ytStatus = 0;
  private static ytCallbacks: Array<() => void> = [];

  /**
   * Load YouTube API script.
   * @param {Function} callback
   */
  private static prepareYTScript (callback: () => void) {
    // Status is changed as: initial->loading->ready.
    // * The callback will run later if initial
    // * The callback is queued and will run if loading
    // * The callback run immediately if ready
    //

    const status = this.ytStatus;
    if (status === 0) {  // initial; not started
      // initialize the callback queue
      const callbacks = this.ytCallbacks;
      callbacks.push(callback);

      // load YouTube script
      const url = 'https://www.youtube.com/iframe_api';
      const elScript = document.createElement('script');
      elScript.src = url;
      document.body.appendChild(elScript);

      // set callbacks
      window.onYouTubeIframeAPIReady = () => {
        callbacks.forEach((f) => f());
        delete this.ytCallbacks;
        this.ytStatus = 2;
      };

      // update status
      this.ytStatus = 1;
    } else if (status === 1) {  // loading; started but not loaded yet
      this.ytCallbacks.push(callback);
    } else if (status === 2) {  // ready; script is completely loaded
      callback();
    }
  }

  public player: YT.Player | undefined;

  public duration = 0;
  public currentSrc = '';
  public played = false;
  public paused = false;
  public ended = false;

  private eventer = document.createElement('ytapiplayer');
  private events: { [key: string]: Array<{
    binded: (event: Event) => void, // TODO correct
    listener: (event: Event) => void,
  } | undefined> } = {};

  private unsetVideoId = '';
  private tmTimeUpdate = 0;
  private tmVolume = 0;
  private tmPlaybackRate = 0;
  private tmDuration = 0;

  /**
   * Returns the current playback position, in seconds,
   * as a position between zero time and the current duration.
   * Can be set, to seek to the given time.
   */
  get currentTime () {
    return this.vCurrentTime;
  }
  set currentTime (value) {
    if (this.player) {
      this.player.seekTo(value, true);
    }
  }
  private vCurrentTime = 0;

  /**
   * Returns the current playback volume multiplier,
   * as a number in the range 0.0 to 1.0,
   * where 0.0 is the quietest and 1.0 the loudest.
   * Can be set, to change the volume multiplier.
   */
  get volume () {
    return this.vVolume / 100;
  }
  set volume (value) {
    if (this.player) {
      this.player.setVolume(value * 100);
    }
  }
  private vVolume = 0;

  /**
   * Returns true if all audio is muted
   * (regardless of other attributes either on the controller
   * or on any media elements slaved to this controller),
   * and false otherwise.
   * Can be set, to change whether the audio is muted or not.
   */
  get muted () {
    return this.vMuted;
  }
  set muted (value) {
    if (this.player) {
      this.player[value ? 'mute' :'unMute']();
    }
  }
  private vMuted = false;

  /**
   * Returns the default rate of playback,
   * for when the user is not fast-forwarding
   * or reversing through the media resource.
   * Can be set, to change the default rate of playback.
   */
  get playbackRate () {
    return this.vPlaybackRate;
  }
  set playbackRate (value) {
    if (this.player) {
      this.player.setPlaybackRate(value);
    }
  }
  private vPlaybackRate = 1;

  /**
   * Returns the address of the current media resource.
   * Can be set, to change the video URL.
   * @type number
   */
  get src () {
    return this.vSrc;
  }
  set src (value) {
    if (this.player) {
      this.player.cueVideoById(value);
    } else {
      // TODO check if this is OK
      this.unsetVideoId = value;
    }
  }
  private vSrc = '';

  // ----------------------------------------------------------------
  // Constructing

  /**
   * Initialize the instance own self.
   */
  public constructor (options: IOptions) {
    if (!this.player) {
      this.events = {};
      this._resetProperties();

      this._initializeEventer();
      this._buildPlayer(options);
    }
  }

  /**
   * Good bye!
   */
  public destroy () {
    if (this.player) {
      this._removeAllEventListeners();
      this._clearEventer();
      this._stopAllObservings();
      this._resetProperties();
      this._destroyPlayer();
    }
  }

  /**
   * Load YouTube API and setup video UI.
   * It can be placed for compat.
   * @param {Object} options
   */
  public _buildPlayer (options: IOptions) {
    Html5YouTube.prepareYTScript(() => this._setupVideo(options));
  }

  /**
   * @see #destroy
   */
  public _destroyPlayer () {
    if (this.player) {
      this.player.destroy();
    }
    this.player = undefined;
  }

  /**
   * YT.Player has add/removeEventListener methods
   * but they doesn't work correctly
   * It can be placed for compat.
   */
  public _initializeEventer () {
    this.eventer = document.createElement('ytapiplayer');
    document.body.appendChild(this.eventer);
  }

  /**
   * It can be placed for compat.
   * @see #destroy
   */
  public _clearEventer () {
    document.body.removeChild(this.eventer);
  }

  /**
   * Setup viode UI.
   */
  public _setupVideo (options: IOptions) {
    const videoOptions = this._getVideoOptions(options);
    this.player = this._createPlayer(videoOptions.el, {
      events: this._getVideoEvents(),
      height: videoOptions.height,
      playerVars: videoOptions.playerVars,
      videoId: videoOptions.videoId,
      width: videoOptions.width,
    });
  }

  // TODO specify return type
  public _getVideoOptions (options: IOptions) {
    const el = options && options.el;
    if (!el || !el.getAttribute) {
      throw new Error('`options.el` is require.');
    }

    const videoId = options.id ||
      el.getAttribute('data-youtube-videoid') ||
      undefined;
    const playerVars: { [key: string]: any } = {}; // TODO
    ytPlayerVars.forEach((propName) => {
      playerVars[propName] = this._getPlayerVarsOption(options, propName);
    });

    let width;
    let height = el.clientHeight;
    if (height) {
      width  = el.clientWidth;
    } else {
      height = 390;
      width = 640;
    }

    return {
      el,
      height,
      playerVars,
      videoId,
      width,
    };
  }

  public _getPlayerVarsOption (options: IOptions, name: string) {
    let value: any;

    if (
      name in options &&
      (options[name] !== undefined || options[name] !== null)
    ) {
      value = options[name];
    } else {
      const attribute = options.el.getAttribute('data-youtube-' + name);
      value = this._parseDataAttribute(attribute);
    }
    if (options[name] === undefined) {  // or null
    } else {
      value = options[name];
    }

    if (
      (typeof value === 'number' && value >= 0) ||
      typeof value === 'string'
    ) {
      // OK, nothing to do
    } else if (typeof value === 'boolean') {
      // Convert booleans to number
      value = Number(value);
    } else {
      // Let's set the value to nothing
      // and let the youtube player fallback to defaults
      value = undefined;
    }

    return value;
  }

  /**
   * Parse data attributes to number or string
   * @example
   * this._parseDataAttribute('true') // 1
   * this._parseDataAttribute('0') // 0
   * this._parseDataAttribute('2EEsa_pqGAs') // '2EEsa_pqGAs'
   */
  // TODO private
  public _parseDataAttribute (value: string | any) {
    // TODO replace with original isNaN
    // NaN is the only value to return false when compared to itself
    const isNaN = (v: any) => v !== v;

    if (typeof(value) === 'string') {
      const toNum = Number(value);
      if (!isNaN(toNum) && typeof toNum === 'number') {
        return Number(value);
      } else if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      } else {
        return value;
      }
    }

    // TODO return value always
  }

  public _getVideoEvents () {
    const events: { [key: string]: (event: Event) => void } = {
      onApiChange: (event) => this.onApiChange(event),
      onError: (event) => this.onError(event),
      onPlaybackQualityChange: (event) => this.onPlaybackQualityChange(event),
      onPlaybackRateChange: (event) => this.onPlaybackRateChange(event),
      onReady: (event) => this.onReady(event),
      onStateChange: (event) => this.onStateChange(event),
    };

    return events;
  }

  public _createPlayer (el: HTMLElement, options: YT.PlayerOptions) {
    return new YT.Player(el, options);
  }

  // ----------------------------------------------------------------
  // Events

  /**
   * Attach an event handler function.
   * @param type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
   * @param listener A function to execute when the event is triggered.
   * @see #removeEventListener
   */
  public addEventListener (type: string, listener: (event: Event) => void) {
    // TODO replace with arrow function
    const bound = this._pushListener(type, listener);
    this.eventer.addEventListener(type, bound);
  }

  /**
   * Detach an event handler function.
   * @see #addEventListener
   */
  public removeEventListener (type: string, listener: (event: Event) => void) {
    const data = this._popListener(type, listener);
    if (data) {
      this.eventer.removeEventListener(type, data.binded);
    }
  }

  /**
   * A shortcut for `addEventListener` and returns `this`.
   * You can use method chaining.
   */
  public on (type: string, listener: (event: Event) => void) {
    this.addEventListener(type, listener);
    return this;
  }

  /**
   * A shortcut for `removeEventListener` and returns `this`.
   * You can use method chaining.
   */
  public off (type: string, listener: (event: Event) => void) {
    this.removeEventListener(type, listener);
    return this;
  }

  /**
   * TODO remove
   * Trigger an event.
   * It can be placed for compat.
   * @param type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
   */
  public trigger (type: string, originalEvent?: any) {
    const event: IYTEvent = document.createEvent('CustomEvent');
    event.initEvent(type, false, true);
    event.player = this;

    if (originalEvent) {
      event.playerData = originalEvent.data;
      event.originalEvent = originalEvent;
    }

    this.eventer.dispatchEvent(event);
  }

  /**
   * @see #destroy
   */
  public _removeAllEventListeners () {
    // TODO replace for-in
    const allEvents = this.events;
    // tslint:disable-next-line:forin
    for (const type in allEvents) {
      const events = allEvents[type];
      for (let i = 0, l = events.length; i < l; i++) {
        const data = events[i];
        if (data) {
          this.removeEventListener(type, data.listener);
          delete data.listener;
          delete data.binded;
          events[i] = undefined;
        }
      }
      delete allEvents[type];
    }
  }

  public _pushListener (type: string, listener: (event: Event) => void) {
    const binded = listener.bind(this);

    let events = this.events[type];
    if (!events) {
      events = this.events[type] = [];
    }

    events.push({
      binded,
      listener,
    });

    return binded;
  }

  public _popListener (type: string, listener: (event: Event) => void) {
    const events = this.events[type];
    if (events) {
      for (let i = 0, l = events.length; i < l; i++) {
        const data = events[i];
        if (data && data.listener === listener) {
          events[i] = undefined;
          return data;
        }
      }
    }
    return undefined;
  }

  public onApiChange (event: Event) {
    this.trigger('onApiChange', event);
  }

  /**
   * @param {Number} event.playerData The error ID.
   * @see https://developers.google.com/youtube/iframe_api_reference#onError
   */
  public onError (event: Event) {
    this.trigger('onError', event);
    this.trigger('error', event);
  }

  public onPlaybackQualityChange (event: Event) {
    this.trigger('onPlaybackQualityChange', event);
  }

  public onPlaybackRateChange (event: Event) {
    this.trigger('onPlaybackRateChange', event);
  }

  public onReady (event: Event) {
    this.trigger('onReady', event);

    if (this.unsetVideoId) {
      this.player!.cueVideoById(this.unsetVideoId);
      delete this.unsetVideoId;
    }

    this._updateMeta();
    this._observeTimeUpdate();
    this._observeVolume();
    this._observePlaybackRate();
    this._observeDuration();
    this.trigger('ready', event);
    this.trigger('canplay', event);
    this.trigger('canplaythrough', event); // TODO check if no event here
  }

  public onStateChange (event: any) {
    this.trigger('onStateChange', event);

    const state = event.data;

    this.played = this.paused = this.ended = false;

    if (state === PlayerState.UNSTARTED) {
      this.trigger('emptied', event);
    } else if (state === PlayerState.ENDED) {
      this.ended = true;
      this.trigger('ended', event);
    } else if (state === PlayerState.PLAYING) {
      this.played = true;
      this.trigger('play', event);
      this.trigger('playing', event);
    } else if (state === PlayerState.PAUSED) {
      this.paused = true;
      this.trigger('pause', event);
    } else if (state === PlayerState.BUFFERING) {
      this.trigger('buffer', event);
    } else if (state === PlayerState.CUED) {
      this._updateMeta();
      this.trigger('canplay', event); // TODO check if no event here
      this.trigger('canplaythrough', event); // TODO check if no event here
    }
  }

  // ----------------------------------------------------------------
  // Manip

  /**
   * Play the video.
   */
  public play () {
    if (this.player) {
      this.player.playVideo();
    }
  }

  /**
   * Stop the video.
   */
  public pause () {
    if (this.player) {
      this.player.pauseVideo();
    }
  }

  /**
   * This function returns the set of playback rates in which
   * the current video is available. The default value is 1,
   * which indicates that the video is playing in normal speed.
   *
   * The function returns an array of numbers ordered from slowest
   * to fastest playback speed.
   * Even if the player does not support variable playback speeds,
   * the array should always contain at least one value (1).
   * @returns {Array}
   * @see https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates
   */
  public getAvailablePlaybackRates () {
    if (this.player) {
      return this.player.getAvailablePlaybackRates();
    } else {
      return undefined;
    }
  }

  // ----------------------------------------------------------------
  // Properties

  public _updateMeta () {
    this.vSrc = this.currentSrc = this.player!.getVideoUrl();
  }

  /**
   * Start observing timeupdate's change.
   */
  public _observeTimeUpdate () {
    this.tmTimeUpdate = setInterval(() => {
      const time = this.player!.getCurrentTime();
      if (time !== this.vCurrentTime) {
        this.vCurrentTime = time;
        this.trigger('timeupdate'); // TODO check if event is required
      }
    }, 100);
  }

  /**
   * Start observing volume's change.
   */
  public _observeVolume () {
    this.tmVolume = setInterval(() => {
      const muted = this.player!.isMuted();
      const volume = this.player!.getVolume();
      if (muted !== this.vMuted || volume !== this.vVolume) {
        this.vMuted = muted;
        this.vVolume = volume;
        this.trigger('volumechange');
      }
    }, 100);
  }

  /**
   * Start observing playbackRate's change.
   */
  public _observePlaybackRate () {
    this.tmPlaybackRate = setInterval(() => {
      const playbackRate = this.player!.getPlaybackRate();
      if (playbackRate !== this.vPlaybackRate) {
        this.vPlaybackRate = playbackRate;
        this.trigger('ratechange');
      }
    }, 100);
  }

  /**
   * Start observing duration's change.
   */
  public _observeDuration () {
    this.tmDuration = setInterval(() => {
      const duration = this.player!.getDuration() || 0;
      if (duration !== this.duration) {
        this.duration = duration;
        this.trigger('durationchange');
      }
    }, 100);
  }

  /**
   * @see #destroy
   */
  public _stopAllObservings () {
    clearInterval(this.tmTimeUpdate);
    clearInterval(this.tmVolume);
    clearInterval(this.tmPlaybackRate);
    clearInterval(this.tmDuration);
  }

  public _resetProperties () {
    this.currentTime = 0;
    this.volume = 0;
    this.muted = false;
    this.playbackRate = 1;
    this.src = '';
    this.duration = 0;
    this.currentSrc = '';
    this.played = false;
    this.paused = false;
    this.ended = false;
  }
}
