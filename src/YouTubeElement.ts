import EventEmittable from './EventEmittable';
import YtScriptLoader from './YtScriptLoader';

export default class YouTubeElement extends EventEmittable {
  /**
   * The definition of available playbackRate values on YouTube API.
   * @see https://developers.google.com/youtube/js_api_reference#Playback_rate
   */
  // TODO maybe 1.25 and 1.75 available
  public static availablePlaybackRates = [0.25, 0.5, 1, 1.5, 2];

  protected static ytScriptLoader = new YtScriptLoader();

  public player: YT.Player | undefined;

  protected unsetVideoId = '';

  /**
   * The video URL in YouTube.com.
   */
  public get src () {
    return this.vSrc;
  }
  public set src (value) {
    const videoId: string = this.parseVideoUrl(value).v;
    this.vSrc = value;
    if (this.player) {
      this.player.cueVideoById(videoId);
    } else {
      // TODO check if this is OK
      this.unsetVideoId = videoId;
    }
  }
  protected vSrc = '';

  /**
   * The ID of the video.
   */
  public get videoId () {
    const videoId: string = this.parseVideoUrl(this.vSrc).v;
    return videoId;
  }
  public set videoId (value) {
    this.src = `https://www.youtube.com/watch?v=${value}`;
  }

  public constructor (protected el: HTMLElement, options: YT.PlayerOptions = {}) {
    super();

    if (!el || !el.getAttribute) {
      throw new Error('`el` is require.');
    }

    if (!this.player) {
      this.loadYtScript(() => {
        const combinedOptions = this.assembleOptions(options);
        this.player = this.createPlayer(combinedOptions);

        this.videoId = combinedOptions.videoId;
      });
    }
  }

  /**
   * Good bye!
   */
  public destroy () {
    if (this.player) {
      this.destroyPlayer();
    }
  }

  // ----------------------------------------------------------------
  // Constructing

  /**
   * Load YouTube API.
   */
  protected loadYtScript (callback: () => void) {
    // Promise does not suit here
    // since wanted to call it back immediately from the second time
    // (and for tests)
    YouTubeElement.ytScriptLoader.addCallback(callback);
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

  protected assembleOptions (options: YT.PlayerOptions) {
    const videoId =
      options.videoId || this.el.getAttribute('data-youtube-videoid');

    const size = this.findVideoSize(options);

    const json = this.el.getAttribute('data-youtube-playerVars');
    const playerVars: YT.PlayerVars = {
      ...(json ? JSON.parse(json) : {}),
      ...options.playerVars,
    };

    const combined: YT.PlayerOptions = {
      videoId,
      ...size,
      ...options,
      playerVars,
    };
    return combined;
  }

  protected findVideoSize (options: YT.PlayerOptions) {
    if (options.width || options.height) {
      return undefined;
    }

    const { clientHeight } = this.el;
    const size = clientHeight > 0
      ? { height: clientHeight, width: this.el.clientWidth }
      : undefined;
    return size;
  }

  /**
   * Create YouTube player.
   */
  protected createPlayer (options: YT.PlayerOptions) {
    return new YT.Player(this.el, options);
  }

  // ----------------------------------------------------------------
  // Utilities

  protected parseVideoUrl (url: string): { [key: string]: any } {
    const m1 = url.match(/^https?:\/\/www.youtube.com\/v\/([^&\/\?]*)(?:\?.*)?$/);
    if (m1) {
      return { v: m1[1] };
    }

    const m2 = url.match(/^https?:\/\/www.youtube.com\/watch\?(.*)$/);
    if (m2) {
      const sAllParams = m2[1];
      const params = sAllParams
        .split('&')
        .reduce((acc, sPair) => {
          const [key, value] = sPair.split('=');
          acc[key] = value;
          return acc;
        }, {});
      return params;
    }

    return {};
  }
}
