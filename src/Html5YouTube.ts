import * as ee from 'event-emitter';
import YtScriptLoader from './YtScriptLoader';

/**
 * These values are used to detect states in onStateChange event.
 * They are same as YouTube API's `YT.PlayerState`.
 * @see https://developers.google.com/youtube/iframe_api_reference#onStateChange
 */
export enum PlayerState {
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

export default class Html5YouTube {
  /**
   * The definition of available playbackRate values on YouTube API.
   * @see https://developers.google.com/youtube/js_api_reference#Playback_rate
   */
  // TODO maybe 1.25 and 1.75 available
  public static availablePlaybackRates = [0.25, 0.5, 1, 1.5, 2];

  protected static ytScriptLoader = new YtScriptLoader();

  public player: YT.Player | undefined;

  public duration = 0;
  public currentSrc = '';
  public played = false;
  public paused = false;
  public ended = false;

  protected eventEmitter = ee();

  protected unsetVideoId = '';
  protected tmTimeUpdate = 0;
  protected tmVolume = 0;
  protected tmPlaybackRate = 0;
  protected tmDuration = 0;

  /**
   * Returns the current playback position, in seconds,
   * as a position between zero time and the current duration.
   * Can be set, to seek to the given time.
   */
  public get currentTime () {
    return this.vCurrentTime;
  }
  public set currentTime (value) {
    if (this.player) {
      this.player.seekTo(value, true);
    }
  }
  protected vCurrentTime = 0;

  /**
   * Returns the current playback volume multiplier,
   * as a number in the range 0.0 to 1.0,
   * where 0.0 is the quietest and 1.0 the loudest.
   * Can be set, to change the volume multiplier.
   */
  public get volume () {
    return this.vVolume / 100;
  }
  public set volume (value) {
    if (this.player) {
      this.player.setVolume(value * 100);
    }
  }
  protected vVolume = 0;

  /**
   * Returns true if all audio is muted
   * (regardless of other attributes either on the controller
   * or on any media elements slaved to this controller),
   * and false otherwise.
   * Can be set, to change whether the audio is muted or not.
   */
  public get muted () {
    return this.vMuted;
  }
  public set muted (value) {
    if (this.player) {
      this.player[value ? 'mute' : 'unMute']();
    }
  }
  protected vMuted = false;

  /**
   * Returns the default rate of playback,
   * for when the user is not fast-forwarding
   * or reversing through the media resource.
   * Can be set, to change the default rate of playback.
   */
  public get playbackRate () {
    return this.vPlaybackRate;
  }
  public set playbackRate (value) {
    if (this.player) {
      this.player.setPlaybackRate(value);
    }
  }
  protected vPlaybackRate = 1;

  /**
   * Returns the address of the current media resource.
   * Can be set, to change the video URL.
   * @type number
   */
  public get src () {
    return this.vSrc;
  }
  public set src (value) {
    if (this.player) {
      this.player.cueVideoById(value);
    } else {
      // TODO check if this is OK
      this.unsetVideoId = value;
    }
  }
  protected vSrc = '';

  // ----------------------------------------------------------------
  // Constructing

  /**
   * Initialize the instance own self.
   */
  public constructor (protected el: HTMLElement, options: YT.PlayerOptions = {}) {
    if (!el || !el.getAttribute) {
      throw new Error('`el` is require.');
    }

    if (!this.player) {
      this.resetProperties();

      this.buildPlayer(options);
    }
  }

  /**
   * Good bye!
   */
  public destroy () {
    if (this.player) {
      this.stopAllObservers();
      this.resetProperties();
      this.destroyPlayer();
    }
  }

  // ----------------------------------------------------------------
  // Events

  /**
   * Attach an event handler function.
   * The `listener` function will be invoked without `this` bindings.
   * @param type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
   * @param listener A function to execute when the event is triggered.
   * @see #removeEventListener
   */
  public addEventListener (type: string, listener: (event: Event) => void) {
    this.eventEmitter.on(type, listener);
  }

  /**
   * Detach an event handler function.
   * @see #addEventListener
   */
  public removeEventListener (type: string, listener: (event: Event) => void) {
    this.eventEmitter.off(type, listener);
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
   * Trigger an event.
   * It can be placed for compat.
   * @param type A event type like `"play"`, '"timeupdate"` or `"onReady"`.
   */
  public emit (type: string, ...args: any[]) {
    this.eventEmitter.emit(type, ...args);
    return this;
  }

  public onApiChange (event: Event) {
    this.emit('onApiChange', event);
  }

  /**
   * @param {Number} event.playerData The error ID.
   * @see https://developers.google.com/youtube/iframe_api_reference#onError
   */
  public onError (event: Event) {
    this.emit('onError', event);
    this.emit('error', event);
  }

  public onPlaybackQualityChange (event: Event) {
    this.emit('onPlaybackQualityChange', event);
  }

  public onPlaybackRateChange (event: Event) {
    this.emit('onPlaybackRateChange', event);
  }

  public onReady (event: Event) {
    this.emit('onReady', event);

    if (this.unsetVideoId) {
      this.player!.cueVideoById(this.unsetVideoId);
      delete this.unsetVideoId;
    }

    this.updateMeta();
    this.observeTimeUpdate();
    this.observeVolume();
    this.observePlaybackRate();
    this.observeDuration();
    this.emit('ready', event);
    this.emit('canplay', event);
    this.emit('canplaythrough', event); // TODO check if no event here
  }

  public onStateChange (event: any) {
    this.emit('onStateChange', event);

    const state = event.data;

    this.played = this.paused = this.ended = false;

    if (state === PlayerState.UNSTARTED) {
      this.emit('emptied', event);
    } else if (state === PlayerState.ENDED) {
      this.ended = true;
      this.emit('ended', event);
    } else if (state === PlayerState.PLAYING) {
      this.played = true;
      this.emit('play', event);
      this.emit('playing', event);
    } else if (state === PlayerState.PAUSED) {
      this.paused = true;
      this.emit('pause', event);
    } else if (state === PlayerState.BUFFERING) {
      this.emit('buffer', event);
    } else if (state === PlayerState.CUED) {
      this.updateMeta();
      this.emit('canplay', event); // TODO check if no event here
      this.emit('canplaythrough', event); // TODO check if no event here
    }
  }

  // ----------------------------------------------------------------
  // Manipulations

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
  // private
  // ----------------------------------------------------------------

  // ----------------------------------------------------------------
  // Constructing

  /**
   * Load YouTube API and setup video UI.
   * It can be placed for compat.
   * @param {Object} options
   */
  protected buildPlayer (options: YT.PlayerOptions) {
    Html5YouTube.ytScriptLoader.addCallback(() => this.setupVideo(options));
  }

  /**
   * @see #destroy
   */
  protected destroyPlayer () {
    if (this.player) {
      this.player.destroy();
    }
    this.player = undefined;
  }

  /**
   * Setup video UI.
   */
  protected setupVideo (options: YT.PlayerOptions) {
    const videoOptions = this.getVideoOptions(options);
    this.player = this.createPlayer({
      events: this.getVideoEvents(),
      height: videoOptions.height,
      playerVars: videoOptions.playerVars,
      videoId: videoOptions.videoId,
      width: videoOptions.width,
    });
  }

  // TODO specify return type
  protected getVideoOptions (options: YT.PlayerOptions) {
    const videoId =
      options.videoId || this.el.getAttribute('data-youtube-videoid') || undefined;
    const playerVars: { [key: string]: any } = {}; // TODO
    ytPlayerVars.forEach((propName) => {
      playerVars[propName] = this.getPlayerVarsOption(options.playerVars, propName);
    });

    let width;
    let height = this.el.clientHeight;
    if (height) {
      width = this.el.clientWidth;
    } else {
      height = 390;
      width = 640;
    }

    return {
      height,
      playerVars,
      videoId,
      width,
    };
  }

  protected getPlayerVarsOption (options: YT.PlayerVars = {}, name: string) {
    let value: any;

    if (
      name in options &&
      (options[name] !== undefined || options[name] !== null)
    ) {
      value = options[name];
    } else {
      const attribute = this.el.getAttribute('data-youtube-' + name);
      value = this.parseDataAttribute(attribute);
    }
    if (options[name] === undefined || options[name] === null) {
      // do nothing
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
   * this.parseDataAttribute('true') // 1
   * this.parseDataAttribute('0') // 0
   * this.parseDataAttribute('2EEsa_pqGAs') // '2EEsa_pqGAs'
   */
  protected parseDataAttribute (value: string | any) {
    // TODO replace with original isNaN
    // NaN is the only value to return false when compared to itself
    const isNaN = (v: any) => v !== v;

    if (typeof value === 'string') {
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

  protected getVideoEvents () {
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

  protected createPlayer (options: YT.PlayerOptions) {
    return new YT.Player(this.el, options);
  }

  // ----------------------------------------------------------------
  // Properties

  protected updateMeta () {
    this.vSrc = this.currentSrc = this.player!.getVideoUrl();
  }

  /**
   * Start observing currentTime's change.
   */
  protected observeTimeUpdate () {
    this.tmTimeUpdate = window.setInterval(() => {
      const time = this.player!.getCurrentTime();
      if (time !== this.vCurrentTime) {
        this.vCurrentTime = time;
        this.emit('timeupdate'); // TODO check if event is required
      }
    }, 100);
  }

  /**
   * Start observing volume's change.
   */
  protected observeVolume () {
    this.tmVolume = window.setInterval(() => {
      const muted = this.player!.isMuted();
      const volume = this.player!.getVolume();
      if (muted !== this.vMuted || volume !== this.vVolume) {
        this.vMuted = muted;
        this.vVolume = volume;
        this.emit('volumechange');
      }
    }, 100);
  }

  /**
   * Start observing playbackRate's change.
   */
  protected observePlaybackRate () {
    this.tmPlaybackRate = window.setInterval(() => {
      const playbackRate = this.player!.getPlaybackRate();
      if (playbackRate !== this.vPlaybackRate) {
        this.vPlaybackRate = playbackRate;
        this.emit('ratechange');
      }
    }, 100);
  }

  /**
   * Start observing duration's change.
   */
  protected observeDuration () {
    this.tmDuration = window.setInterval(() => {
      const duration = this.player!.getDuration() || 0;
      if (duration !== this.duration) {
        this.duration = duration;
        this.emit('durationchange');
      }
    }, 100);
  }

  /**
   * @see #destroy
   */
  protected stopAllObservers () {
    clearInterval(this.tmTimeUpdate);
    clearInterval(this.tmVolume);
    clearInterval(this.tmPlaybackRate);
    clearInterval(this.tmDuration);
  }

  protected resetProperties () {
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
