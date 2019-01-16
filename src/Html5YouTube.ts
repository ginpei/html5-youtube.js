import YouTubeElement from './YouTubeElement';

export default class Html5YouTube extends YouTubeElement {
  public duration = 0;
  public currentSrc = '';
  public played = false;
  public paused = false;
  public ended = false;

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

  public constructor (protected el: HTMLElement, options: YT.PlayerOptions = {}) {
    super(el, options);
    this.resetProperties();
  }

  /**
   * Good bye!
   */
  public destroy () {
    super.destroy();

    if (this.player) {
      this.stopAllObservers();
      this.resetProperties();
    }
  }

  // ----------------------------------------------------------------
  // Events

  public onApiChange (event: YT.PlayerEvent) {
    this.emit('onApiChange', event);
  }

  /**
   * @param {Number} event.playerData The error ID.
   * @see https://developers.google.com/youtube/iframe_api_reference#onError
   */
  public onError (event: YT.OnErrorEvent) {
    this.emit('onError', event);
    this.emit('error', event);
  }

  public onPlaybackQualityChange (event: YT.OnPlaybackQualityChangeEvent) {
    this.emit('onPlaybackQualityChange', event);
  }

  public onPlaybackRateChange (event: YT.OnPlaybackRateChangeEvent) {
    this.emit('onPlaybackRateChange', event);
  }

  public onReady (event: YT.PlayerEvent) {
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

  public onStateChange (event: YT.OnStateChangeEvent) {
    this.emit('onStateChange', event);

    const state = event.data;

    this.played = this.paused = this.ended = false;

    if (state === YT.PlayerState.UNSTARTED) {
      this.emit('emptied', event);
    } else if (state === YT.PlayerState.ENDED) {
      this.ended = true;
      this.emit('ended', event);
    } else if (state === YT.PlayerState.PLAYING) {
      this.played = true;
      this.emit('play', event);
      this.emit('playing', event);
    } else if (state === YT.PlayerState.PAUSED) {
      this.paused = true;
      this.emit('pause', event);
    } else if (state === YT.PlayerState.BUFFERING) {
      this.emit('buffer', event);
    } else if (state === YT.PlayerState.CUED) {
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

  protected assembleOptions (options: YT.PlayerOptions) {
    const combined = super.assembleOptions(options);
    combined.events = this.getVideoEvents();
    return combined;
  }

  protected getVideoEvents () {
    const events: YT.Events = {
      onApiChange: (event) => this.onApiChange(event),
      onError: (event) => this.onError(event),
      onPlaybackQualityChange: (event) => this.onPlaybackQualityChange(event),
      onPlaybackRateChange: (event) => this.onPlaybackRateChange(event),
      onReady: (event) => this.onReady(event),
      onStateChange: (event) => this.onStateChange(event),
    };

    return events;
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
